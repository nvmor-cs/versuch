package io.github.nvmorcs.eisenzeit;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;

/**
 * Der tägliche Blick auf den Schrittzähler, kurz vor Mitternacht.
 *
 * Ohne ihn bekäme ein Tag, an dem die App nicht geöffnet wurde, keine eigene
 * Summe – seine Schritte landeten beim nächsten Öffnen irgendwo dazwischen.
 * Mit ihm hat jeder Tag seinen Abschluss, auch wenn das Telefon eine Woche
 * lang nur in der Tasche steckt.
 *
 * Entschieden wird hier nichts: Der Empfänger holt einen Messwert, reicht ihn
 * an dieselbe Buchführung weiter wie die App und stellt den Wecker für morgen.
 */
public class SchrittAlarm extends BroadcastReceiver {

    @Override
    public void onReceive(Context ctx, Intent intent) {
        final Context app = ctx.getApplicationContext();
        if (!SchrittZaehlerPlugin.moeglich(app) || !SchrittZaehlerPlugin.erlaubt(app)) {
            SchrittZaehlerPlugin.alarmStellen(app);
            return;
        }
        // Der Sensor antwortet nicht sofort – ohne goAsync wäre der Empfänger
        // vorher fertig und der Prozess dürfte wieder sterben.
        final PendingResult offen = goAsync();
        SchrittZaehlerPlugin.rohLesen(app, (roh) -> {
            try {
                if (roh >= 0) SchrittZaehlerPlugin.messen(app, roh, System.currentTimeMillis());
                SchrittZaehlerPlugin.alarmStellen(app);
            } finally {
                offen.finish();
            }
        });
    }
}
