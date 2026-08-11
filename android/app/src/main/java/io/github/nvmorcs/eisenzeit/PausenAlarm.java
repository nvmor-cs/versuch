package io.github.nvmorcs.eisenzeit;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * Rückfallebene für das Pausenende.
 *
 * Der genaue Weg ist ein Handler im Prozess der App (siehe
 * PausenTimerPlugin). Der steht aber still, wenn das Gerät tief schläft, und
 * ist ganz weg, wenn Android die App aus dem Speicher räumt. Dieser Empfänger
 * springt dann ein.
 *
 * Er entscheidet nichts: Er löst das Token ein – und nur wenn es das der
 * aktuellen Pause ist, gibt es die Meldung. Ein Alarm einer abgebrochenen oder
 * längst vergangenen Pause läuft hier ins Leere, statt mitten im nächsten Satz
 * zu klingeln.
 */
public class PausenAlarm extends BroadcastReceiver {

    @Override
    public void onReceive(Context ctx, Intent intent) {
        long token = intent.getLongExtra("token", 0);
        if (!PausenTimerPlugin.tokenEinloesen(ctx, token)) return;
        PausenTimerPlugin.kanaeleAnlegen(ctx);
        PausenTimerPlugin.signalMelden(ctx);
        PausenTimerPlugin.workoutAnzeigeWiederherstellen(ctx);
    }
}
