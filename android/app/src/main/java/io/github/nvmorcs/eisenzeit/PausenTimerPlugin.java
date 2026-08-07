package io.github.nvmorcs.eisenzeit;

import android.app.Notification;
import android.app.NotificationChannel;
import android.app.NotificationManager;
import android.app.PendingIntent;
import android.content.Intent;
import android.os.Build;

import androidx.core.app.NotificationCompat;
import androidx.core.app.NotificationManagerCompat;

import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

/**
 * Zeigt die laufende Satzpause in der Benachrichtigungsleiste – mit
 * mitlaufender Restzeit.
 *
 * Warum nativ: Eine Benachrichtigung, deren Zeit sich sekündlich ändert,
 * lässt sich nicht sinnvoll aus JavaScript nachschreiben – die App liegt
 * während der Pause im Hintergrund und dürfte gar nicht laufen. Android kann
 * das aber selbst: setUsesChronometer(true) zusammen mit
 * setChronometerCountDown(true) und einem Zielzeitpunkt lässt das System die
 * Restzeit herunterzählen, ohne dass die App etwas tut.
 *
 * Der Kanal ist bewusst leise (IMPORTANCE_LOW): Die Meldung ist eine Anzeige,
 * kein Signal. Den Ton am Ende der Pause macht weiterhin die App.
 */
@CapacitorPlugin(name = "PausenTimer")
public class PausenTimerPlugin extends Plugin {

    private static final String KANAL = "pausen-timer";
    private static final int ID = 4712;   // 4711 gehört der Schluss-Meldung

    @Override
    public void load() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            NotificationChannel kanal = new NotificationChannel(
                    KANAL, "Satzpause", NotificationManager.IMPORTANCE_LOW);
            kanal.setDescription("Zeigt die restliche Pause zwischen zwei Sätzen");
            kanal.setShowBadge(false);
            kanal.setSound(null, null);
            kanal.enableVibration(false);
            getContext().getSystemService(NotificationManager.class)
                    .createNotificationChannel(kanal);
        }
        // Beim Start aufräumen: Nach einem Absturz mitten in der Pause könnte
        // noch eine alte Anzeige stehen, die zu nichts mehr gehört.
        NotificationManagerCompat.from(getContext()).cancel(ID);
    }

    /**
     * @param restMs Verbleibende Pause in Millisekunden. Bewusst die Dauer und
     *               nicht der Zielzeitpunkt: Ein Zeitstempel seit 1970 ist eine
     *               krumme große Zahl, die über die JS-Brücke schnell an
     *               Genauigkeit verliert. Die Dauer bleibt klein und eindeutig.
     * @param titel  Überschrift, üblicherweise der Übungsname
     * @param text   Zeile darunter, z. B. „Satz 2/3 · 80 kg × 8 Wdh."
     */
    @PluginMethod
    public void start(PluginCall call) {
        Integer restMs = call.getInt("restMs", 0);
        if (restMs == null || restMs <= 0) {
            call.reject("restMs fehlt");
            return;
        }
        long endsAt = System.currentTimeMillis() + restMs;
        String titel = call.getString("titel", "Satzpause");
        String text = call.getString("text", "");

        Intent oeffnen = new Intent(getContext(), MainActivity.class);
        oeffnen.setFlags(Intent.FLAG_ACTIVITY_SINGLE_TOP | Intent.FLAG_ACTIVITY_CLEAR_TOP);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) {
            flags |= PendingIntent.FLAG_IMMUTABLE;
        }
        PendingIntent tippen = PendingIntent.getActivity(getContext(), 0, oeffnen, flags);

        NotificationCompat.Builder b = new NotificationCompat.Builder(getContext(), KANAL)
                .setSmallIcon(R.drawable.ic_stat_pause)
                .setContentTitle(titel)
                .setContentText(text)
                .setSubText("Pause")
                .setContentIntent(tippen)
                // Bleibt stehen, bis die App sie zurücknimmt, und lässt sich
                // nicht versehentlich wegwischen
                .setOngoing(true)
                .setAutoCancel(false)
                // Nur beim ersten Mal melden – jede Verlängerung schreibt die
                // Meldung neu, das darf nicht jedes Mal blinken
                .setOnlyAlertOnce(true)
                .setPriority(NotificationCompat.PRIORITY_LOW)
                .setCategory(NotificationCompat.CATEGORY_STOPWATCH)
                .setVisibility(NotificationCompat.VISIBILITY_PUBLIC)
                .setShowWhen(true)
                .setWhen(endsAt)
                .setUsesChronometer(true);

        // Rückwärts zählen kann Android erst ab Nougat. Darunter zeigt die
        // Meldung die Uhrzeit, zu der die Pause endet – auch brauchbar.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.N) {
            b.setChronometerCountDown(true);
        }

        // Selbstzerstörung zum Pausenende. Nimmt die App die Meldung nicht
        // selbst zurück – weil sie im Hintergrund schläft oder inzwischen
        // beendet wurde –, räumt Android auf. Ohne das zählte die Anzeige
        // fröhlich ins Minus weiter.
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            b.setTimeoutAfter(restMs);
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
    public void stop(PluginCall call) {
        NotificationManagerCompat.from(getContext()).cancel(ID);
        call.resolve();
    }
}
