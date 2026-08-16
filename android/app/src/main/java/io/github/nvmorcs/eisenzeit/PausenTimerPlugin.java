package io.github.nvmorcs.eisenzeit;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Die Satzpause in der Benachrichtigungsleiste – als Anzeige, sonst nichts.
 *
 * <h3>Kein Signal am Ende mehr</h3>
 *
 * Ton und Vibration zum Pausenende gab es hier einmal, in drei Anläufen, und
 * zuverlässig wurde es keinen davon: mal kam die Meldung zu früh, mal blieb
 * sie aus. Zu viele Stellen mussten dafür zusammenspielen, die Android
 * jederzeit einzeln stillegen darf – ein Alarm, ein wartender Aufruf, eine
 * schlafende App, dazu Erlaubnisse, die je nach Gerät anders gehandhabt
 * werden. Was nicht verlässlich ist, ist als Signal nichts wert: Wer sich
 * nicht darauf verlassen kann, schaut ohnehin nach.
 *
 * Geblieben ist der Teil, der immer stimmt: eine stille Anzeige, in der
 * Android selbst mitzählt. {@code setUsesChronometer} zählt ab einem
 * Zeitpunkt, mit {@code setChronometerCountDown} herunter – ohne dass die App
 * dafür laufen muss. Ein Blick auf den Sperrbildschirm genügt.
 *
 * <h3>Die Regeln, auf denen das steht</h3>
 *
 * <ol>
 *   <li><b>Ein Besitzer.</b> Der Zustand der Pause liegt hier und nur hier.
 *       JavaScript hält den Bildschirmbalken, sonst nichts.</li>
 *   <li><b>Eine Nachricht.</b> Es gibt nicht „zeig Workout" und „zeig Pause"
 *       und „mach aus", sondern nur {@link #stand}: den vollständigen
 *       Zustand. Wer den ganzen Zustand schickt, kann ihn nicht halb
 *       überholen.</li>
 *   <li><b>Reihenfolge erzwungen.</b> Jede Nachricht trägt eine laufende
 *       Nummer. Eine kleinere als die zuletzt angewandte wird verworfen –
 *       damit ist die Brücke egal.</li>
 *   <li><b>Die Pause hat eine Kennung.</b> Nur eine neue Kennung setzt den
 *       Zielzeitpunkt. Dieselbe Kennung schreibt bloß die Anzeige – der
 *       Countdown verrutscht nicht mehr, egal wie oft die App etwas
 *       meldet.</li>
 * </ol>
 */
@CapacitorPlugin(name = "PausenTimer")
public class PausenTimerPlugin extends Plugin {

    /** Laufende Anzeige: stumm, bleibt stehen */
    public static final String KANAL_LAUFEND = "workout-laufend";

    /** Aufgegebene Kanäle des früheren Pausensignals. Sie werden beim Start
     *  entfernt, sonst stünden sie noch jahrelang in den Systemeinstellungen
     *  der App – Schalter für etwas, das es nicht mehr gibt. */
    private static final String[] KANAELE_ALT = { "pause-ende", "pause-ende-still" };

    private static final int ID = 4712;         // laufende Anzeige
    private static final int ID_ALT = 4711;     // früheres „Pause vorbei"

    private static final String PREFS = "lumora-pause";
    private static final String K_PAUSE = "pause-id";       // "" = keine Pause
    private static final String K_ZIEL = "pause-ziel";      // Zeitpunkt in ms seit 1970
    private static final String K_WO_TITEL = "wo-titel";
    private static final String K_WO_TEXT = "wo-text";
    private static final String K_WO_START = "wo-start";    // 0 = kein Workout

    /** Wie weit vor dem Ziel ein Auslöser noch abgewiesen wird. Ohne das
     *  könnte ein eingefrorener Zähler aus JavaScript eine frische Pause
     *  vorzeitig beenden. */
    private static final long TOLERANZ = 400;

    private static PausenTimerPlugin instanz;
    /** Zuletzt angewandte laufende Nummer. Bewusst nur im Speicher: Überholen
     *  kann sich nur, was in einem Prozessleben unterwegs ist. */
    private static int letzteFolge = 0;
    /** Kennung des Weboberflächen-Durchlaufs. Die Oberfläche kann neu laden,
     *  ohne dass die Activity stirbt – dann fängt ihre Zählung wieder bei eins
     *  an, und ohne diese Kennung hielte die native Seite jede neue Nachricht
     *  für überholt und würde nie wieder etwas tun. */
    private static String letzterLauf = "";

    private final Handler handler = new Handler(Looper.getMainLooper());
    private Runnable geplant = null;
    private boolean imVordergrund = true;

    /* ═══════════════ Aufbau ═══════════════ */

    @Override
    public void load() {
        instanz = this;
        letzteFolge = 0;
        letzterLauf = "";
        imVordergrund = true;
        kanaeleAnlegen(getContext());
        aufraeumenUndUebernehmen();
    }

    @Override
    protected void handleOnDestroy() {
        if (instanz == this) instanz = null;
        if (geplant != null) handler.removeCallbacks(geplant);
    }

    /**
     * Nach einem Neustart der App aufräumen – aber nicht mit dem Holzhammer.
     *
     * Android baut die Activity auch mitten im Betrieb neu auf. Alles pauschal
     * abzusagen hieße: Wer währenddessen in der Satzpause steht, dem bliebe
     * der Countdown in der Leiste stehen. Deshalb wird eine Pause, deren Ziel
     * noch in der Zukunft liegt, wieder aufgenommen; nur was abgelaufen oder
     * verwaist ist, fliegt raus.
     */
    private void aufraeumenUndUebernehmen() {
        SharedPreferences p = prefs(getContext());
        String pause = p.getString(K_PAUSE, "");
        long ziel = p.getLong(K_ZIEL, 0);
        if (!pause.isEmpty() && ziel > System.currentTimeMillis()) {
            armieren(pause, ziel);
            return;
        }
        pauseVergessen();
        if (p.getLong(K_WO_START, 0) <= 0) {
            NotificationManagerCompat.from(getContext()).cancel(ID);
        }
    }

    static void kanaeleAnlegen(Context ctx) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.O) return;
        NotificationManager nm = ctx.getSystemService(NotificationManager.class);
        if (nm == null) return;

        NotificationChannel laufend = new NotificationChannel(
                KANAL_LAUFEND, "Laufendes Workout", NotificationManager.IMPORTANCE_LOW);
        laufend.setDescription("Dauer des Workouts und die restliche Satzpause");
        laufend.setShowBadge(false);
        laufend.setSound(null, null);
        laufend.enableVibration(false);
        nm.createNotificationChannel(laufend);

        // Reste des früheren Pausensignals wegräumen
        for (String alt : KANAELE_ALT) nm.deleteNotificationChannel(alt);
        NotificationManagerCompat.from(ctx).cancel(ID_ALT);
    }

    @Override
    public void handleOnResume() {
        imVordergrund = true;
    }

    @Override
    public void handleOnPause() {
        imVordergrund = false;
    }

    /* ═══════════════ Die eine Nachricht ═══════════════ */

    /**
     * Der vollständige Zustand aus Sicht der App.
     *
     * @param lauf       Kennung des Oberflächen-Durchlaufs; wechselt sie,
     *                   beginnt die Zählung von vorn
     * @param folge      laufende Nummer; kleinere werden verworfen
     * @param aktiv      läuft überhaupt ein Workout?
     * @param workoutMs  wie lange es schon läuft
     * @param titel      Überschrift der laufenden Anzeige
     * @param text       Zeile darunter
     * @param pauseId    Kennung der Satzpause, "" = gerade keine
     * @param pauseMs    Restzeit dieser Pause – nur beim ersten Mal je Kennung
     *                   ausgewertet, danach gilt der einmal gesetzte Zeitpunkt
     * @param pauseTitel Überschrift während der Pause
     * @param pauseText  Zeile darunter
     */
    @PluginMethod
    public void stand(PluginCall call) {
        String lauf = call.getString("lauf", "");
        if (lauf == null) lauf = "";
        if (!lauf.equals(letzterLauf)) {   // die Oberfläche hat neu geladen
            letzterLauf = lauf;
            letzteFolge = 0;
        }
        Integer folgeW = call.getInt("folge", 0);
        int folge = folgeW == null ? 0 : folgeW;
        if (folge <= letzteFolge) {   // überholte Nachricht
            call.resolve();
            return;
        }
        letzteFolge = folge;

        Context ctx = getContext();
        SharedPreferences p = prefs(ctx);

        if (!Boolean.TRUE.equals(call.getBoolean("aktiv", false))) {
            pauseVergessen();
            p.edit().remove(K_WO_START).remove(K_WO_TITEL).remove(K_WO_TEXT).apply();
            NotificationManagerCompat.from(ctx).cancel(ID);
            call.resolve();
            return;
        }

        String titel = call.getString("titel", "Workout");
        String text = call.getString("text", "");
        Integer woMs = call.getInt("workoutMs", 0);
        // Stand des Workouts merken: Danach kann die Anzeige auch ohne die App
        // wieder auf „Workout läuft" zurückfallen.
        p.edit()
                .putString(K_WO_TITEL, titel)
                .putString(K_WO_TEXT, text)
                .putLong(K_WO_START, System.currentTimeMillis() - (woMs == null ? 0 : woMs))
                .apply();

        String pauseId = call.getString("pauseId", "");
        if (pauseId == null) pauseId = "";

        if (pauseId.isEmpty()) {
            pauseVergessen();
            anzeigen(ctx, 0, titel, text);
            call.resolve();
            return;
        }

        if (!pauseId.equals(p.getString(K_PAUSE, ""))) {
            Integer ms = call.getInt("pauseMs", 0);
            if (ms == null || ms <= 0) {   // nichts mehr zu zählen
                pauseVergessen();
                anzeigen(ctx, 0, titel, text);
                call.resolve();
                return;
            }
            p.edit()
                    .putString(K_PAUSE, pauseId)
                    .putLong(K_ZIEL, System.currentTimeMillis() + ms)
                    .apply();
            armieren(pauseId, p.getLong(K_ZIEL, 0));
        }

        // Der Zielzeitpunkt gilt, nicht die gerade gemeldete Restzeit – so
        // verrutscht der Countdown nie, egal wie oft die App etwas schickt.
        long rest = p.getLong(K_ZIEL, 0) - System.currentTimeMillis();
        if (rest <= 0) {
            anzeigen(ctx, 0, titel, text);
        } else {
            anzeigen(ctx, rest,
                    call.getString("pauseTitel", titel), call.getString("pauseText", ""));
        }
        call.resolve();
    }

    /**
     * Der Zähler in der App ist bei null angekommen. Sie ist damit sichtbar
     * offen – also die Anzeige sofort zurückstellen, statt auf den wartenden
     * Aufruf zu warten. Die Kennung entscheidet, ob die Meldung überhaupt zur
     * laufenden Pause gehört; ein eingefrorener Zähler von vorhin läuft ins
     * Leere.
     */
    @PluginMethod
    public void pauseVorbei(PluginCall call) {
        String id = call.getString("pauseId", "");
        if (id != null && !id.isEmpty()) pauseBeenden(getContext(), id);
        call.resolve();
    }

    /* ═══════════════ Pause aufnehmen und beenden ═══════════════ */

    /* Immer über den Anwendungskontext: Die Activity und ein verzögerter
       Aufruf sollen dieselbe Datei sehen – und nichts davon soll eine
       Activity am Leben halten. */
    static SharedPreferences prefs(Context ctx) {
        return ctx.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    /**
     * Den wartenden Aufruf auf eine bereits eingetragene Pause ansetzen.
     *
     * Er tut am Ende nur eines: die Anzeige von „Satzpause" zurück auf
     * „Workout läuft" stellen. Verschläft Android den Prozess, bleibt der
     * Countdown eben auf 0:00 stehen, bis die App das nächste Mal etwas
     * meldet – unschön, aber harmlos. Genau dafür einen Alarm zu stellen und
     * eine Sondererlaubnis zu verlangen, wäre nicht verhältnismäßig.
     */
    private void armieren(String pauseId, long ziel) {
        // Anwendungskontext: Der wartende Aufruf überdauert die Pause; an
        // einer Activity festzuhalten hieße, sie so lange am Leben zu halten,
        // auch wenn Android sie längst abbauen will.
        Context ctx = getContext().getApplicationContext();
        long inMs = Math.max(0, ziel - System.currentTimeMillis());

        if (geplant != null) handler.removeCallbacks(geplant);
        geplant = () -> pauseBeenden(ctx, pauseId);
        handler.postDelayed(geplant, inMs);
    }

    private void pauseVergessen() {
        prefs(getContext()).edit().remove(K_PAUSE).remove(K_ZIEL).apply();
        if (geplant != null) {
            handler.removeCallbacks(geplant);
            geplant = null;
        }
    }

    /**
     * Das Ende einer Pause – der einzige Ort, an dem das passiert.
     *
     * Aufgerufen aus zwei Richtungen (wartender Aufruf und Meldung aus der
     * App). Die erste, die es schafft, nimmt die Kennung weg; die andere
     * findet ein leeres Feld vor und tut nichts.
     */
    static synchronized void pauseBeenden(Context ctx, String pauseId) {
        SharedPreferences p = prefs(ctx);
        if (!pauseId.equals(p.getString(K_PAUSE, ""))) return;   // fremd oder schon verbraucht
        long ziel = p.getLong(K_ZIEL, 0);
        if (System.currentTimeMillis() < ziel - TOLERANZ) return; // zu früh
        p.edit().remove(K_PAUSE).remove(K_ZIEL).apply();

        PausenTimerPlugin plugin = instanz;
        if (plugin != null && plugin.imVordergrund) {
            // Damit der Balken auf dem Bildschirm verschwindet, auch wenn die
            // Pause ablief, während die App im Hintergrund eingefroren war.
            plugin.notifyListeners("pauseVorbei", new JSObject());
        }

        workoutAnzeigeWiederherstellen(ctx);
    }

    /* ═══════════════ Anzeige ═══════════════ */

    /** Die laufende Anzeige. restMs > 0 zählt rückwärts, sonst läuft die Dauer. */
    static void anzeigen(Context ctx, long restMs, String titel, String text) {
        boolean pause = restMs > 0;
        long start = pause ? 0 : prefs(ctx).getLong(K_WO_START, System.currentTimeMillis());

        NotificationCompat.Builder b = new NotificationCompat.Builder(ctx, KANAL_LAUFEND)
                .setSmallIcon(R.drawable.ic_stat_pause)
                .setContentTitle(titel)
                .setContentText(text)
                .setSubText(pause ? "Satzpause" : "Workout läuft")
                .setContentIntent(appOeffnen(ctx))
                // Bleibt stehen, bis die App sie zurücknimmt, und lässt sich
                // nicht versehentlich wegwischen
                .setOngoing(true)
                .setAutoCancel(false)
                // Nur beim ersten Mal melden – die Anzeige wird bei jedem Satz
                // neu geschrieben, das darf nicht jedes Mal blinken
                .setOnlyAlertOnce(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setCategory(NotificationCompat.CATEGORY_STOPWATCH)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setShowWhen(true)
                .setWhen(pause ? System.currentTimeMillis() + restMs : start)
                .setUsesChronometer(true);

        // Rückwärts zählen kann Android erst ab Nougat. Darunter zeigt die
        // Meldung die Uhrzeit des Pausenendes – auch brauchbar.
        if (pause && Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            b.setChronometerCountDown(true);
        }

        Notification meldung = b.build();
        meldung.flags |= Notification.FLAG_NO_CLEAR;
        try {
            NotificationManagerCompat.from(ctx).notify(ID, meldung);
        } catch (SecurityException e) {
            // Ohne erteilte Berechtigung passiert nichts – kein Grund,
            // den Aufruf scheitern zu lassen
        }
    }

    /**
     * Nach der Pause soll in der Leiste wieder das laufende Workout stehen –
     * sonst zählt dort eine Satzpause weiter, die längst vorbei ist.
     */
    static void workoutAnzeigeWiederherstellen(Context ctx) {
        SharedPreferences p = prefs(ctx);
        if (p.getLong(K_WO_START, 0) <= 0) return;
        anzeigen(ctx, 0, p.getString(K_WO_TITEL, "Workout"), p.getString(K_WO_TEXT, ""));
    }

    private static PendingIntent appOeffnen(Context ctx) {
        Intent oeffnen = new Intent(ctx, MainActivity.class);
        oeffnen.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getActivity(ctx, 0, oeffnen, flags);
    }
}
