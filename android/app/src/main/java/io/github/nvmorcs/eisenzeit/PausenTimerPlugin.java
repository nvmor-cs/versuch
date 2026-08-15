package io.github.nvmorcs.eisenzeit;

import android.app.AlarmManager;
import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.net.Uri;
import android.provider.Settings;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
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
 * Die Satzpause – Anzeige in der Leiste und das Signal am Ende.
 *
 * <h3>Warum das hier komplett nativ liegt</h3>
 *
 * Eine Meldung, deren Zeit sich sekündlich ändert, kann JavaScript nicht
 * nachschreiben: Die App liegt zwischendurch im Hintergrund und darf gar nicht
 * laufen. Android kann es selbst – setUsesChronometer zählt ab einem Zeitpunkt,
 * mit setChronometerCountDown herunter.
 *
 * Wichtiger noch ist der zweite Grund. Zwei frühere Anläufe sind daran
 * gescheitert, dass sich zwei Seiten den Zustand geteilt haben: JavaScript
 * plante, sagte ab und plante neu, während die native Seite dasselbe tat. Weil
 * jeder Aufruf über die Brücke seine eigene Laufzeit hat, konnten sich zwei
 * Nachrichten überholen – ein „keine Pause mehr" traf nach dem „neue Pause"
 * ein und löschte sie. Ergebnis: mal kein Ton, mal einer mitten im nächsten
 * Satz. Je länger das Workout, desto mehr Nachrichten, desto wahrscheinlicher.
 *
 * <h3>Die Regeln, auf denen der Neubau steht</h3>
 *
 * <ol>
 *   <li><b>Ein Besitzer.</b> Der Zustand der Pause liegt hier und nur hier.
 *       JavaScript hält den Bildschirmbalken, sonst nichts.</li>
 *   <li><b>Eine Nachricht.</b> Es gibt nicht mehr „zeig Workout" und „zeig
 *       Pause" und „mach aus", sondern nur {@link #stand}: den vollständigen
 *       Zustand. Wer den ganzen Zustand schickt, kann ihn nicht halb
 *       überholen.</li>
 *   <li><b>Reihenfolge erzwungen.</b> Jede Nachricht trägt eine laufende
 *       Nummer. Eine kleinere als die zuletzt angewandte wird verworfen –
 *       damit ist die Brücke egal.</li>
 *   <li><b>Die Pause hat eine Kennung.</b> Nur eine neue Kennung plant neu.
 *       Dieselbe Kennung schreibt bloß die Anzeige – der Zielzeitpunkt steht
 *       fest und verrutscht nicht mehr, egal wie oft die App etwas meldet.</li>
 *   <li><b>Das Signal wird verbraucht.</b> Auslösen heißt: Kennung wegnehmen.
 *       Handler, Alarm und die Meldung aus der App zielen alle auf dieselbe
 *       Kennung – wer zuerst kommt, gewinnt, alle anderen laufen ins Leere.
 *       Ein Signal einer alten Pause ist damit strukturell unmöglich.</li>
 *   <li><b>Zwei Wege, ein Ziel.</b> Ein Handler im Prozess ist genau, steht
 *       aber im Tiefschlaf still. Ein Alarm weckt das Gerät, ist dafür ohne
 *       Sondererlaubnis ungenau. Beide zeigen auf dieselbe Kennung – deshalb
 *       darf man sie bedenkenlos gemeinsam laufen lassen.</li>
 * </ol>
 *
 * Wer den Ton macht, entscheidet ebenfalls diese Klasse, weil sie als einzige
 * weiß, ob die App die ganze Pause über offen war: durchgehend offen → die App
 * klingelt selbst (Ereignis an JavaScript), sonst → die laute Meldung. Nie
 * beides, nie keins.
 */
@CapacitorPlugin(name = "PausenTimer")
public class PausenTimerPlugin extends Plugin {

    /** Laufende Anzeige: stumm, bleibt stehen */
    public static final String KANAL_LAUFEND = "workout-laufend";
    /** Pausenende: laut, mit Ton und Vibration */
    public static final String KANAL_ENDE = "pause-ende";
    /** Pausenende ohne Ton – für die Einstellung „Nur Vibration" */
    public static final String KANAL_ENDE_STUMM = "pause-ende-still";

    private static final int ID = 4712;         // laufende Anzeige
    private static final int SIGNAL_ID = 4711;  // „Pause vorbei"

    private static final String PREFS = "lumora-pause";
    private static final String K_PAUSE = "pause-id";       // "" = keine Pause
    private static final String K_ZIEL = "pause-ziel";      // Zeitpunkt in ms seit 1970
    private static final String K_MELDEN = "pause-melden";
    private static final String K_LEISE = "pause-leise";
    private static final String K_WEG = "pause-weggewesen"; // App war zwischendurch nicht da
    private static final String K_WO_TITEL = "wo-titel";
    private static final String K_WO_TEXT = "wo-text";
    private static final String K_WO_START = "wo-start";    // 0 = kein Workout

    /** Der Alarm kommt bewusst etwas später als der Handler: Im Normalfall
     *  gewinnt damit der genaue Weg, und der Alarm bleibt, was er sein soll –
     *  ein Netz für den Fall, dass der Prozess weggeräumt wird. */
    private static final long ALARM_VERZUG = 1500;

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
     * abzusagen hieße: Wer währenddessen in der Satzpause steht, bekommt kein
     * Signal mehr. Deshalb wird eine Pause, deren Ziel noch in der Zukunft
     * liegt, wieder scharf gestellt; nur was abgelaufen oder verwaist ist,
     * fliegt raus.
     */
    private void aufraeumenUndUebernehmen() {
        SharedPreferences p = prefs(getContext());
        String pause = p.getString(K_PAUSE, "");
        long ziel = p.getLong(K_ZIEL, 0);
        if (!pause.isEmpty() && ziel > System.currentTimeMillis()) {
            armieren(pause, ziel);
            return;
        }
        signalAbsagen();
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

        NotificationChannel ende = new NotificationChannel(
                KANAL_ENDE, "Pause vorbei", NotificationManager.IMPORTANCE_HIGH);
        ende.setDescription("Meldet das Ende der Satzpause");
        ende.enableVibration(true);
        ende.setVibrationPattern(new long[]{0, 260, 120, 260, 120, 420});
        ende.setSound(
                RingtoneManager.getDefaultUri(RingtoneManager.TYPE_NOTIFICATION),
                new AudioAttributes.Builder()
                        .setUsage(AudioAttributes.USAGE_NOTIFICATION_EVENT)
                        .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                        .build());
        nm.createNotificationChannel(ende);

        NotificationChannel still = new NotificationChannel(
                KANAL_ENDE_STUMM, "Pause vorbei (nur Vibration)", NotificationManager.IMPORTANCE_HIGH);
        still.setDescription("Meldet das Ende der Satzpause ohne Ton");
        still.enableVibration(true);
        still.setVibrationPattern(new long[]{0, 260, 120, 260, 120, 420});
        still.setSound(null, null);
        nm.createNotificationChannel(still);
    }

    @Override
    public void handleOnResume() {
        imVordergrund = true;
    }

    @Override
    public void handleOnPause() {
        imVordergrund = false;
        // Ab jetzt gehört das Signal der Meldung – auch wenn man vor dem Ende
        // zurückwechselt. Sonst klingelt es zweimal.
        SharedPreferences p = prefs(getContext());
        if (!p.getString(K_PAUSE, "").isEmpty()) p.edit().putBoolean(K_WEG, true).apply();
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
     * @param melden     darf am Ende eine Meldung erscheinen?
     * @param leise      Meldung ohne Ton (Einstellung „Nur Vibration")
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
            signalAbsagen();
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
            signalAbsagen();
            anzeigen(ctx, 0, titel, text);
            call.resolve();
            return;
        }

        if (!pauseId.equals(p.getString(K_PAUSE, ""))) {
            Integer ms = call.getInt("pauseMs", 0);
            if (ms == null || ms <= 0) {   // nichts mehr zu planen
                signalAbsagen();
                anzeigen(ctx, 0, titel, text);
                call.resolve();
                return;
            }
            p.edit()
                    .putString(K_PAUSE, pauseId)
                    .putLong(K_ZIEL, System.currentTimeMillis() + ms)
                    .putBoolean(K_MELDEN, !Boolean.FALSE.equals(call.getBoolean("melden", true)))
                    .putBoolean(K_LEISE, Boolean.TRUE.equals(call.getBoolean("leise", false)))
                    .putBoolean(K_WEG, !imVordergrund)
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
     * offen – also sofort auslösen, statt auf Handler oder Alarm zu warten.
     * Die Kennung entscheidet, ob die Meldung überhaupt zur laufenden Pause
     * gehört; ein eingefrorener Zähler von vorhin läuft ins Leere.
     */
    @PluginMethod
    public void pauseVorbei(PluginCall call) {
        String id = call.getString("pauseId", "");
        if (id != null && !id.isEmpty()) signalGeben(getContext(), id);
        call.resolve();
    }

    /* ═══════════════ Signal planen, auslösen, absagen ═══════════════ */

    /* Immer über den Anwendungskontext: Der Empfänger, die Activity und ein
       verzögerter Aufruf sollen dieselbe Datei sehen – und nichts davon soll
       eine Activity am Leben halten. */
    static SharedPreferences prefs(Context ctx) {
        return ctx.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    /** Handler und Alarm auf eine bereits eingetragene Pause ansetzen. */
    private void armieren(String pauseId, long ziel) {
        // Anwendungskontext: Der wartende Aufruf und der Alarm überdauern die
        // Pause; an einer Activity festzuhalten hieße, sie so lange am Leben
        // zu halten, auch wenn Android sie längst abbauen will.
        Context ctx = getContext().getApplicationContext();
        long inMs = Math.max(0, ziel - System.currentTimeMillis());

        if (geplant != null) handler.removeCallbacks(geplant);
        geplant = () -> signalGeben(ctx, pauseId);
        handler.postDelayed(geplant, inMs);

        AlarmManager am = ctx.getSystemService(AlarmManager.class);
        if (am == null) return;
        PendingIntent pi = alarmZiel(ctx, pauseId);
        long alarmZeit = ziel + ALARM_VERZUG;
        boolean genau = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) genau = am.canScheduleExactAlarms();
        try {
            if (genau) {
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, alarmZeit, pi);
            } else {
                // Ohne die Erlaubnis „Alarme und Erinnerungen" darf es nicht
                // auf die Sekunde sein. Dann kommt das Netz eventuell später –
                // aber niemals zur falschen Pause, dafür sorgt die Kennung.
                am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, alarmZeit, pi);
            }
        } catch (SecurityException e) {
            am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, alarmZeit, pi);
        }
    }

    private void signalAbsagen() {
        Context ctx = getContext().getApplicationContext();
        prefs(ctx).edit().remove(K_PAUSE).remove(K_ZIEL).remove(K_WEG).apply();
        if (geplant != null) {
            handler.removeCallbacks(geplant);
            geplant = null;
        }
        alarmWeg(ctx);
    }

    private static void alarmWeg(Context ctx) {
        AlarmManager am = ctx.getSystemService(AlarmManager.class);
        if (am != null) am.cancel(alarmZiel(ctx, ""));
    }

    /**
     * Das Ende einer Pause – der einzige Ort, an dem das passiert.
     *
     * Aufgerufen aus drei Richtungen (Handler, Alarm, Meldung aus der App).
     * Die erste, die es schafft, nimmt die Kennung weg; die anderen finden
     * ein leeres Feld vor und tun nichts.
     */
    static synchronized void signalGeben(Context ctx, String pauseId) {
        SharedPreferences p = prefs(ctx);
        if (!pauseId.equals(p.getString(K_PAUSE, ""))) return;   // fremd oder schon verbraucht
        long ziel = p.getLong(K_ZIEL, 0);
        if (System.currentTimeMillis() < ziel - TOLERANZ) return; // zu früh

        boolean melden = p.getBoolean(K_MELDEN, true);
        boolean leise = p.getBoolean(K_LEISE, false);
        boolean weggewesen = p.getBoolean(K_WEG, false);
        p.edit().remove(K_PAUSE).remove(K_ZIEL).remove(K_WEG).apply();
        alarmWeg(ctx);

        PausenTimerPlugin plugin = instanz;
        boolean vorn = plugin != null && plugin.imVordergrund;
        // Durchgehend offen geblieben? Dann macht die App den Ton selbst.
        boolean tonInApp = vorn && !weggewesen;

        if (vorn) {
            JSObject o = new JSObject();
            o.put("ton", tonInApp);
            plugin.notifyListeners("pauseVorbei", o);
        }
        if (!tonInApp && melden) signalMelden(ctx, leise);

        workoutAnzeigeWiederherstellen(ctx);
    }

    /* ═══════════════ Meldungen ═══════════════ */

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

    /** Die laute Meldung „Pause vorbei". */
    static void signalMelden(Context ctx, boolean leise) {
        NotificationCompat.Builder b = new NotificationCompat.Builder(ctx,
                leise ? KANAL_ENDE_STUMM : KANAL_ENDE)
                .setSmallIcon(R.drawable.ic_stat_pause)
                .setContentTitle("Pause vorbei")
                .setContentText("Weiter mit dem nächsten Satz.")
                .setContentIntent(appOeffnen(ctx))
                .setAutoCancel(true)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC);
        if (!leise) b.setDefaults(NotificationCompat.DEFAULT_ALL);
        try {
            NotificationManagerCompat.from(ctx).notify(SIGNAL_ID, b.build());
        } catch (SecurityException e) {
            // ohne Berechtigung eben nicht
        }
    }

    /**
     * Nach dem Signal soll in der Leiste wieder das laufende Workout stehen –
     * sonst zählt dort eine Satzpause weiter, die längst vorbei ist.
     */
    static void workoutAnzeigeWiederherstellen(Context ctx) {
        SharedPreferences p = prefs(ctx);
        if (p.getLong(K_WO_START, 0) <= 0) return;
        anzeigen(ctx, 0, p.getString(K_WO_TITEL, "Workout"), p.getString(K_WO_TEXT, ""));
    }

    private static PendingIntent alarmZiel(Context ctx, String pauseId) {
        Intent i = new Intent(ctx, PausenAlarm.class).putExtra("pauseId", pauseId);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getBroadcast(ctx, SIGNAL_ID, i, flags);
    }

    private static PendingIntent appOeffnen(Context ctx) {
        Intent oeffnen = new Intent(ctx, MainActivity.class);
        oeffnen.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getActivity(ctx, 0, oeffnen, flags);
    }

    /* ═══════════════ Erlaubnis für genaue Alarme ═══════════════ */

    /**
     * Darf die App Alarme auf die Sekunde genau legen?
     *
     * Daran hängt nur das Netz: Ist die Erlaubnis nicht erteilt und wird die
     * App währenddessen aus dem Speicher geräumt, kommt das Signal später.
     * Zur falschen Pause kommt es nicht.
     */
    @PluginMethod
    public void alarmStatus(PluginCall call) {
        boolean exakt = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            AlarmManager am = getContext().getSystemService(AlarmManager.class);
            exakt = am != null && am.canScheduleExactAlarms();
        }
        JSObject o = new JSObject();
        o.put("exakt", exakt);
        // Unter Android 12 gibt es die Einstellung nicht – dann ist auch
        // nichts zu erlauben.
        o.put("einstellbar", Build.VERSION.SDK_INT >= Build.VERSION_CODES.S);
        call.resolve(o);
    }

    /** Öffnet die Systemeinstellung „Alarme und Erinnerungen". */
    @PluginMethod
    public void alarmEinstellungen(PluginCall call) {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            Intent i = new Intent(Settings.ACTION_REQUEST_SCHEDULE_EXACT_ALARM,
                    Uri.parse("package:" + getContext().getPackageName()));
            i.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            getContext().startActivity(i);
        }
        call.resolve();
    }
}
