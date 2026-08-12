package io.github.nvmorcs.eisenzeit;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * Das Netz für das Pausenende.
 *
 * Der genaue Weg ist ein Handler im Prozess der App (siehe
 * PausenTimerPlugin). Der steht im Tiefschlaf still und ist ganz weg, wenn
 * Android die App aus dem Speicher räumt. Dann fällt das Signal hierher.
 *
 * Entschieden wird hier nichts: Der Empfänger reicht die Kennung der Pause
 * weiter, und dieselbe Prüfung wie überall entscheidet, ob sie noch gilt. Ein
 * Alarm einer abgebrochenen oder längst vergangenen Pause läuft ins Leere,
 * statt mitten im nächsten Satz zu klingeln.
 */
public class PausenAlarm extends BroadcastReceiver {

    @Override
    public void onReceive(Context ctx, Intent intent) {
        String pauseId = intent.getStringExtra("pauseId");
        if (pauseId == null || pauseId.isEmpty()) return;
        PausenTimerPlugin.kanaeleAnlegen(ctx);
        PausenTimerPlugin.signalGeben(ctx, pauseId);
    }
}
