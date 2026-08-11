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
 * Die Meldung zum laufenden Workout – und das Signal am Ende der Satzpause.
 *
 * Die Anzeige steht, solange das Workout läuft, und dient zugleich als Rückweg
 * in die App. Während einer Satzpause wechselt dieselbe Meldung den Inhalt und
 * zählt die Restzeit herunter; danach schaltet sie zurück auf die Dauer.
 *
 * Warum nativ: Eine Meldung, deren Zeit sich sekündlich ändert, lässt sich
 * nicht aus JavaScript nachschreiben – die App liegt zwischendurch im
 * Hintergrund und dürfte gar nicht laufen. Android kann das selbst:
 * setUsesChronometer zählt ab einem Zeitpunkt hoch, mit
 * setChronometerCountDown herunter. Die App setzt den Zeitpunkt einmal, den
 * Rest macht das System.
 *
 * <h3>Das Signal am Pausenende</h3>
 *
 * Früher plante die App dafür eine eigene Meldung über LocalNotifications. Das
 * ging schief, sobald sich Pausen überlagerten: Eine vom System aufgeschobene
 * Meldung einer *früheren* Pause schlug mitten in der nächsten auf, während die
 * Anzeige noch korrekt herunterzählte. Deshalb gibt es hier nur noch **einen**
 * Auslöser, abgesichert über ein Merkmal (Token):
 *
 * <ul>
 *   <li>Jede Pause bekommt ein neues Token, das in den Einstellungen liegt und
 *       damit auch einen Neustart des Prozesses übersteht.</li>
 *   <li>Ausgelöst wird über zwei Wege – einen Handler im Prozess (genau, aber
 *       nur solange die App lebt) und einen Alarm 1,5 s später als
 *       Rückfallebene. Wer zuerst kommt, verbraucht das Token; der andere
 *       findet ein leeres Feld vor und tut nichts.</li>
 *   <li>Ein Token einer abgebrochenen oder älteren Pause ist damit
 *       automatisch ungültig. Genau das kann vorher nicht passieren.</li>
 * </ul>
 *
 * Wer den Ton macht, entscheidet ebenfalls diese Klasse – sie weiß als einzige
 * Stelle, ob die App die ganze Pause über offen war:
 * durchgehend offen → die App klingelt selbst (Ereignis an JavaScript),
 * sonst → die laute Meldung. Nie beides.
 */
@CapacitorPlugin(name = "PausenTimer")
public class PausenTimerPlugin extends Plugin {

    /** Laufende Anzeige: stumm, bleibt stehen */
    public static final String KANAL_LAUFEND = "workout-laufend";
    /** Pausenende: laut, mit Ton und Vibration */
    public static final String KANAL_ENDE = "pause-ende";
    /** Pausenende ohne Ton – für die Einstellung „Nur Vibration" */
    public static final String KANAL_ENDE_STUMM = "pause-ende-still";

    private static final int ID = 4712;      // laufende Anzeige
    private static final int SIGNAL_ID = 4711; // „Pause vorbei"

    private static final String PREFS = "lumora-pause";
    private static final String KEY_TOKEN = "signal-token";
    private static final String KEY_MELDEN = "signal-melden";
    private static final String KEY_LEISE = "signal-leise";
    private static final String KEY_WO_TITEL = "wo-titel";
    private static final String KEY_WO_TEXT = "wo-text";
    private static final String KEY_WO_START = "wo-start";

    /** Der Alarm kommt bewusst etwas später als der Handler – so gewinnt im
     *  Normalfall der genaue Weg im Prozess, und der Alarm bleibt das, was er
     *  sein soll: eine Rückfallebene. */
    private static final long ALARM_VERZUG = 1500;

    private final Handler handler = new Handler(Looper.getMainLooper());
    private Runnable geplant = null;

    /** Liegt die App gerade im Vordergrund? */
    private boolean imVordergrund = true;
    /** War sie während der laufenden Pause zwischendurch weg? */
    private boolean warImHintergrund = false;

    @Override
    public void load() {
        kanaeleAnlegen(getContext());
        // Beim Start aufräumen: Nach einem Absturz mitten im Workout könnte
        // noch eine alte Anzeige stehen, die zu nichts mehr gehört.
        NotificationManagerCompat.from(getContext()).cancel(ID);
        signalAbsagen();
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
        // Ab jetzt gehört das Signal der Meldung, auch wenn man vor dem Ende
        // zurückwechselt – sonst klingelt es zweimal.
        if (prefs(getContext()).getLong(KEY_TOKEN, 0) != 0) warImHintergrund = true;
    }

    /**
     * @param modus "workout" zählt hoch, "pause" zählt herunter
     * @param ms    im Modus "workout" die bereits vergangene Zeit, im Modus
     *              "pause" die verbleibende – jeweils in Millisekunden.
     *              Bewusst eine Dauer und kein Zeitstempel: Millisekunden seit
     *              1970 sind eine krumme große Zahl, bei der die JS-Brücke
     *              schnell Genauigkeit verliert.
     * @param titel Überschrift
     * @param text  Zeile darunter
     */
    @PluginMethod
    public void zeigen(PluginCall call) {
        String modus = call.getString("modus", "workout");
        Integer ms = call.getInt("ms", 0);
        if (ms == null) ms = 0;
        boolean pause = "pause".equals(modus);
        if (pause && ms <= 0) {
            call.reject("ms fehlt");
            return;
        }
        String titel = call.getString("titel", "Workout");
        String text = call.getString("text", "");

        anzeigen(getContext(), pause, ms, titel, text);

        if (pause) {
            prefs(getContext()).edit()
                    .putBoolean(KEY_MELDEN, Boolean.TRUE.equals(call.getBoolean("melden", true)))
                    .putBoolean(KEY_LEISE, Boolean.TRUE.equals(call.getBoolean("leise", false)))
                    .apply();
            signalPlanen(ms);
        } else {
            // Stand merken, damit nach der Pause auch ohne die App wieder die
            // Workout-Anzeige dasteht
            prefs(getContext()).edit()
                    .putString(KEY_WO_TITEL, titel)
                    .putString(KEY_WO_TEXT, text)
                    .putLong(KEY_WO_START, System.currentTimeMillis() - ms)
                    .apply();
            // Keine Pause mehr – ein noch wartendes Signal wäre von gestern
            signalAbsagen();
        }
        call.resolve();
    }

    /** Baut und stellt die laufende Anzeige. */
    static void anzeigen(Context ctx, boolean pause, long ms, String titel, String text) {
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
                // Nur beim ersten Mal melden – die Meldung wird bei jedem Satz
                // neu geschrieben, das darf nicht jedes Mal blinken
                .setOnlyAlertOnce(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setCategory(NotificationCompat.CATEGORY_STOPWATCH)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setShowWhen(true)
                // Im Pausenmodus liegt der Zielzeitpunkt in der Zukunft, sonst
                // der Startzeitpunkt in der Vergangenheit – daraus zählt
                // Android selbst.
                .setWhen(pause ? System.currentTimeMillis() + ms : System.currentTimeMillis() - ms)
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

    @PluginMethod
    public void aus(PluginCall call) {
        NotificationManagerCompat.from(getContext()).cancel(ID);
        signalAbsagen();
        prefs(getContext()).edit().remove(KEY_WO_START).apply();
        call.resolve();
    }

    /**
     * Die App ist selbst am Ende der Pause angekommen (ihr Zähler ist bei
     * null). Sie ist damit sichtbar offen – also lösen wir sofort aus, statt
     * auf Handler oder Alarm zu warten. Das Token sorgt dafür, dass die beiden
     * anschließend nichts mehr tun.
     */
    @PluginMethod
    public void pauseVorbei(PluginCall call) {
        long token = prefs(getContext()).getLong(KEY_TOKEN, 0);
        if (token != 0) signalAusloesen(token);
        call.resolve();
    }

    /* ── Signal am Pausenende ─────────────────────────────── */

    static SharedPreferences prefs(Context ctx) {
        return ctx.getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    private void signalPlanen(long ms) {
        Context ctx = getContext();
        long token = System.currentTimeMillis();
        prefs(ctx).edit().putLong(KEY_TOKEN, token).apply();
        warImHintergrund = !imVordergrund;

        if (geplant != null) handler.removeCallbacks(geplant);
        geplant = () -> signalAusloesen(token);
        handler.postDelayed(geplant, ms);

        // Rückfallebene: Der Handler zählt in Uptime und steht still, wenn das
        // Gerät tief schläft. Der Alarm weckt es.
        AlarmManager am = ctx.getSystemService(AlarmManager.class);
        if (am == null) return;
        long ziel = System.currentTimeMillis() + ms + ALARM_VERZUG;
        PendingIntent pi = alarmZiel(ctx, token);
        boolean genau = true;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.S) {
            genau = am.canScheduleExactAlarms();
        }
        try {
            if (genau) {
                am.setExactAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, ziel, pi);
            } else {
                // Ohne die Erlaubnis „Alarme und Erinnerungen" darf es nicht
                // auf die Sekunde sein. Er kommt dann eventuell später – aber
                // niemals zur falschen Pause, dafür sorgt das Token.
                am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, ziel, pi);
            }
        } catch (SecurityException e) {
            am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, ziel, pi);
        }
    }

    private void signalAbsagen() {
        Context ctx = getContext();
        prefs(ctx).edit().putLong(KEY_TOKEN, 0).apply();
        if (geplant != null) {
            handler.removeCallbacks(geplant);
            geplant = null;
        }
        AlarmManager am = ctx.getSystemService(AlarmManager.class);
        if (am != null) am.cancel(alarmZiel(ctx, 0));
        warImHintergrund = false;
    }

    private void signalAusloesen(long token) {
        Context ctx = getContext();
        if (!tokenEinloesen(ctx, token)) return;

        // Durchgehend offen geblieben? Dann macht die App den Ton selbst.
        boolean tonInApp = imVordergrund && !warImHintergrund;
        if (imVordergrund) {
            JSObject o = new JSObject();
            o.put("ton", tonInApp);
            notifyListeners("pauseVorbei", o);
        }
        if (!tonInApp) signalMelden(ctx);
        workoutAnzeigeWiederherstellen(ctx);
        warImHintergrund = false;
    }

    /**
     * Gibt genau einmal true zurück – für das Token, das gerade gilt. Alles
     * andere (ältere Pause, bereits ausgelöst, abgebrochen) läuft ins Leere.
     */
    static synchronized boolean tokenEinloesen(Context ctx, long token) {
        SharedPreferences p = prefs(ctx);
        if (token == 0 || p.getLong(KEY_TOKEN, 0) != token) return false;
        p.edit().putLong(KEY_TOKEN, 0).apply();
        return true;
    }

    /** Die laute Meldung „Pause vorbei" – sofern die Einstellung sie will. */
    static void signalMelden(Context ctx) {
        SharedPreferences p = prefs(ctx);
        if (!p.getBoolean(KEY_MELDEN, true)) return;
        NotificationCompat.Builder b = new NotificationCompat.Builder(ctx,
                p.getBoolean(KEY_LEISE, false) ? KANAL_ENDE_STUMM : KANAL_ENDE)
                .setSmallIcon(R.drawable.ic_stat_pause)
                .setContentTitle("Pause vorbei")
                .setContentText("Weiter mit dem nächsten Satz.")
                .setContentIntent(appOeffnen(ctx))
                .setAutoCancel(true)
                .setPriority(NotificationCompat.PRIORITY_HIGH)
                .setCategory(NotificationCompat.CATEGORY_ALARM)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setDefaults(NotificationCompat.DEFAULT_ALL);
        try {
            NotificationManagerCompat.from(ctx).notify(SIGNAL_ID, b.build());
        } catch (SecurityException e) {
            // ohne Berechtigung eben nicht
        }
    }

    /**
     * Nach dem Signal soll in der Leiste wieder das laufende Workout stehen –
     * sonst zählt dort eine Satzpause weiter, die längst vorbei ist. Genau das
     * war im Screenshot zu sehen.
     */
    static void workoutAnzeigeWiederherstellen(Context ctx) {
        SharedPreferences p = prefs(ctx);
        long start = p.getLong(KEY_WO_START, 0);
        if (start <= 0) return;
        anzeigen(ctx, false, System.currentTimeMillis() - start,
                p.getString(KEY_WO_TITEL, "Workout"), p.getString(KEY_WO_TEXT, ""));
    }

    private static PendingIntent alarmZiel(Context ctx, long token) {
        Intent i = new Intent(ctx, PausenAlarm.class).putExtra("token", token);
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

    /* ── Erlaubnis für genaue Alarme ──────────────────────── */

    /**
     * Darf die App Alarme auf die Sekunde genau legen?
     *
     * Daran hängt nur noch die Rückfallebene: Ist die Erlaubnis nicht erteilt
     * und wird die App währenddessen aus dem Speicher geräumt, kommt das
     * Signal später. Zur falschen Pause kommt es nicht mehr.
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
