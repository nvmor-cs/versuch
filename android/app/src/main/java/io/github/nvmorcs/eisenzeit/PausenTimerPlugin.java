package io.github.nvmorcs.eisenzeit;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.media.AudioAttributes;
import android.media.RingtoneManager;
import android.os.Build;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Die Meldung zum laufenden Workout – mit mitlaufender Zeit.
 *
 * Sie steht, solange das Workout läuft, und dient zugleich als Rückweg in die
 * App. Während einer Satzpause wechselt dieselbe Meldung den Inhalt und zählt
 * die Restzeit herunter; danach schaltet sie zurück auf die Workout-Dauer.
 *
 * Warum nativ: Eine Meldung, deren Zeit sich sekündlich ändert, lässt sich
 * nicht aus JavaScript nachschreiben – die App liegt zwischendurch im
 * Hintergrund und dürfte gar nicht laufen. Android kann das selbst:
 * setUsesChronometer zählt ab einem Zeitpunkt hoch, mit
 * setChronometerCountDown herunter. Die App setzt den Zeitpunkt einmal, den
 * Rest macht das System.
 *
 * Zwei Kanäle: Die laufende Anzeige ist stumm (IMPORTANCE_LOW), sie ist eine
 * Anzeige und kein Signal. Das Pausenende bekommt einen eigenen lauten Kanal,
 * damit der Ton auch ankommt, wenn das Handy in der Tasche steckt.
 */
@CapacitorPlugin(name = "PausenTimer")
public class PausenTimerPlugin extends Plugin {

    /** Laufende Anzeige: stumm, bleibt stehen */
    public static final String KANAL_LAUFEND = "workout-laufend";
    /** Pausenende: laut, mit Ton und Vibration */
    public static final String KANAL_ENDE = "pause-ende";

    private static final int ID = 4712;   // 4711 gehört der Schluss-Meldung

    @Override
    public void load() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationManager nm = getContext().getSystemService(NotificationManager.class);

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
        }
        // Beim Start aufräumen: Nach einem Absturz mitten im Workout könnte
        // noch eine alte Anzeige stehen, die zu nichts mehr gehört.
        NotificationManagerCompat.from(getContext()).cancel(ID);
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

        Intent oeffnen = new Intent(getContext(), MainActivity.class);
        oeffnen.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent tippen = PendingIntent.getActivity(getContext(), 0, oeffnen, flags);

        // Im Pausenmodus liegt der Zielzeitpunkt in der Zukunft, sonst der
        // Startzeitpunkt in der Vergangenheit – daraus zählt Android selbst.
        long zeitpunkt = pause
                ? System.currentTimeMillis() + ms
                : System.currentTimeMillis() - ms;

        NotificationCompat.Builder b = new NotificationCompat.Builder(getContext(), KANAL_LAUFEND)
                .setSmallIcon(R.drawable.ic_stat_pause)
                .setContentTitle(titel)
                .setContentText(text)
                .setSubText(pause ? "Satzpause" : "Workout läuft")
                .setContentIntent(tippen)
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
                .setWhen(zeitpunkt)
                .setUsesChronometer(true);

        // Rückwärts zählen kann Android erst ab Nougat. Darunter zeigt die
        // Meldung die Uhrzeit des Pausenendes – auch brauchbar.
        if (pause && Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            b.setChronometerCountDown(true);
        }

        Notification meldung = b.build();
        meldung.flags |= Notification.FLAG_NO_CLEAR;

        try {
            NotificationManagerCompat.from(getContext()).notify(ID, meldung);
        } catch (SecurityException e) {
            // Ohne erteilte Berechtigung passiert nichts – kein Grund,
            // den Aufruf scheitern zu lassen
        }
        call.resolve();
    }

    @PluginMethod
    public void aus(PluginCall call) {
        NotificationManagerCompat.from(getContext()).cancel(ID);
        call.resolve();
    }
}
