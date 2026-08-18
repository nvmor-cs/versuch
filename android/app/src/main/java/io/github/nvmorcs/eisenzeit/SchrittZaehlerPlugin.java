package io.github.nvmorcs.eisenzeit;

import android.Manifest;
import android.app.AlarmManager;
import android.app.PendingIntent;
import android.content.Context;
import android.content.Intent;
import android.content.SharedPreferences;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.Build;
import android.os.Handler;
import android.os.Looper;

import com.getcapacitor.JSObject;
import com.getcapacitor.PermissionState;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;

import org.json.JSONObject;

import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;
import java.util.Locale;
import java.util.concurrent.atomic.AtomicBoolean;

/**
 * Der Schrittzähler.
 *
 * <h3>Warum das ohne Dienst im Hintergrund geht</h3>
 *
 * Fast jedes Android-Telefon hat einen eigenen, sparsamen Bewegungssensor:
 * {@code TYPE_STEP_COUNTER}. Der zählt in Hardware weiter, auch wenn die App
 * längst geschlossen ist, und liefert beim Nachfragen den Stand seit dem
 * letzten Neustart des Geräts. Die App muss also nicht mitlaufen – sie muss
 * nur ab und zu nachsehen und die Differenz verbuchen.
 *
 * Das spart die dauerhafte Meldung in der Leiste, die ein Vordergrunddienst
 * verlangt, und es kostet keinen Akku: Gezählt wird ohnehin, ob wir hinsehen
 * oder nicht.
 *
 * <h3>Zwei Fallen, die dabei zu umgehen sind</h3>
 *
 * <b>Der Neustart.</b> Nach einem Neustart fängt der Zähler wieder bei null
 * an. Ist der neue Stand kleiner als der zuletzt gesehene, sind die Schritte
 * seit dem Neustart genau der neue Stand – nicht die (negative) Differenz.
 *
 * <b>Der Tageswechsel.</b> Zwischen zwei Messungen kann Mitternacht liegen.
 * Wem gehören die Schritte dazwischen? Aufteilen können wir sie nicht, der
 * Sensor kennt keine Uhrzeiten. Deshalb eine Regel, die sich in einem Satz
 * sagen lässt: <b>Der Zeitraum zählt für den Tag, in dem seine Mitte liegt.</b>
 *
 * Für sich genommen wäre die Regel grob – zwischen dem letzten Blick um acht
 * Uhr abends und dem nächsten um neun Uhr morgens läge die Mitte um halb drei
 * nachts, und der ganze Abend fiele dem neuen Tag zu. Deshalb kommt ein Wecker
 * dazu, der jeden Abend um 23:57 einmal nachsieht. Damit zerfällt die lange
 * Lücke in zwei kurze: acht bis 23:57 (Mitte kurz vor zehn – gestern) und
 * 23:57 bis neun (Mitte halb fünf – heute). Beide Hälften landen dort, wo sie
 * hingehören, und jeder Tag bekommt seinen Abschluss, auch wenn die App
 * tagelang nicht geöffnet wird.
 */
@CapacitorPlugin(
        name = "SchrittZaehler",
        permissions = {
            @Permission(alias = SchrittZaehlerPlugin.BEWEGUNG,
                        strings = { Manifest.permission.ACTIVITY_RECOGNITION })
        })
public class SchrittZaehlerPlugin extends Plugin {

    static final String BEWEGUNG = "bewegung";

    private static final String PREFS = "lumora-schritte";
    private static final String K_ROH = "letzter-roh";
    private static final String K_ZEIT = "letzte-zeit";
    private static final String K_TAGE = "tage";

    /** So viele Tage werden vorgehalten – mehr braucht die Anzeige nie. */
    private static final int TAGE_MAX = 45;

    /** Kommt binnen drei Sekunden kein Messwert, gibt es keinen. */
    private static final long FRIST = 3000;

    private static final int ALARM_ID = 4713;

    interface Messwert { void da(long roh); }

    /* ═══════════════ Aufruf aus der App ═══════════════ */

    @Override
    public void load() {
        // Der Wecker überlebt einen Neustart des Geräts nicht. Ihn bei jedem
        // Start der App neu zu stellen ist billiger, als dafür eine eigene
        // Berechtigung zu verlangen.
        if (erlaubt(getContext())) alarmStellen(getContext());
    }

    /**
     * Misst und liefert den Stand: was das Gerät kann, ob es darf, und die
     * Schritte je Tag, seit die Zählung eingeschaltet wurde.
     */
    @PluginMethod
    public void stand(final PluginCall call) {
        final Context ctx = getContext().getApplicationContext();
        if (!moeglich(ctx) || !erlaubt(ctx)) {
            call.resolve(antwort(ctx));
            return;
        }
        rohLesen(ctx, (roh) -> {
            if (roh >= 0) messen(ctx, roh, System.currentTimeMillis());
            call.resolve(antwort(ctx));
        });
    }

    /** Fragt die Berechtigung ab. Ohne sie liefert der Sensor nichts. */
    @PluginMethod
    public void erlauben(PluginCall call) {
        if (!moeglich(getContext()) || Build.VERSION.SDK_INT < Build.VERSION_CODES.Q
                || getPermissionState(BEWEGUNG) == PermissionState.GRANTED) {
            geantwortet(call);
            return;
        }
        requestPermissionForAlias(BEWEGUNG, call, "geantwortet");
    }

    @PermissionCallback
    private void geantwortet(PluginCall call) {
        final Context ctx = getContext().getApplicationContext();
        if (erlaubt(ctx)) {
            alarmStellen(ctx);
            // Gleich einmal messen: Sonst steht bis zum nächsten Öffnen eine
            // Null da, und das sieht aus, als ginge es nicht.
            rohLesen(ctx, (roh) -> {
                if (roh >= 0) messen(ctx, roh, System.currentTimeMillis());
                call.resolve(antwort(ctx));
            });
            return;
        }
        call.resolve(antwort(ctx));
    }

    private JSObject antwort(Context ctx) {
        JSObject o = new JSObject();
        o.put("moeglich", moeglich(ctx));
        o.put("erlaubt", erlaubt(ctx));
        try {
            o.put("tage", new JSObject(tageLesen(ctx).toString()));
        } catch (Exception e) {
            o.put("tage", new JSObject());
        }
        return o;
    }

    /* ═══════════════ Sensor ═══════════════ */

    static boolean moeglich(Context ctx) {
        SensorManager sm = (SensorManager) ctx.getSystemService(Context.SENSOR_SERVICE);
        return sm != null && sm.getDefaultSensor(Sensor.TYPE_STEP_COUNTER) != null;
    }

    static boolean erlaubt(Context ctx) {
        if (Build.VERSION.SDK_INT < Build.VERSION_CODES.Q) return true;
        return ctx.checkSelfPermission(Manifest.permission.ACTIVITY_RECOGNITION)
                == android.content.pm.PackageManager.PERMISSION_GRANTED;
    }

    /**
     * Einen Messwert holen und den Sensor gleich wieder loslassen.
     *
     * Der Zähler ist ein „on change"-Sensor: Er meldet beim Anmelden von sich
     * aus seinen aktuellen Stand. Wir warten also auf genau ein Ereignis und
     * melden uns wieder ab – dauerhaft zuzuhören wäre unnötig.
     */
    static void rohLesen(final Context ctx, final Messwert cb) {
        final SensorManager sm = (SensorManager) ctx.getSystemService(Context.SENSOR_SERVICE);
        final Sensor sensor = sm == null ? null : sm.getDefaultSensor(Sensor.TYPE_STEP_COUNTER);
        if (sensor == null) { cb.da(-1); return; }

        final Handler handler = new Handler(Looper.getMainLooper());
        // Genau eine Antwort, egal ob Sensor oder Frist zuerst kommt
        final AtomicBoolean fertig = new AtomicBoolean(false);
        final SensorEventListener[] halter = new SensorEventListener[1];

        final Runnable frist = () -> {
            if (fertig.getAndSet(true)) return;
            if (halter[0] != null) sm.unregisterListener(halter[0]);
            cb.da(-1);
        };

        halter[0] = new SensorEventListener() {
            @Override public void onSensorChanged(SensorEvent e) {
                if (fertig.getAndSet(true)) return;
                handler.removeCallbacks(frist);
                sm.unregisterListener(this);
                cb.da(e.values.length > 0 ? (long) e.values[0] : -1);
            }
            @Override public void onAccuracyChanged(Sensor s, int genauigkeit) { }
        };

        try {
            if (!sm.registerListener(halter[0], sensor, SensorManager.SENSOR_DELAY_UI)) {
                fertig.set(true);
                cb.da(-1);
                return;
            }
        } catch (Exception e) {
            fertig.set(true);
            cb.da(-1);
            return;
        }
        handler.postDelayed(frist, FRIST);
    }

    /* ═══════════════ Buchführung ═══════════════ */

    static SharedPreferences prefs(Context ctx) {
        return ctx.getApplicationContext().getSharedPreferences(PREFS, Context.MODE_PRIVATE);
    }

    /**
     * Einen Messwert verbuchen. Der einzige Ort, an dem Schritte entstehen –
     * gleich, ob der Anstoß aus der App oder vom Wecker kam.
     */
    static synchronized void messen(Context ctx, long roh, long zeit) {
        SharedPreferences p = prefs(ctx);
        long letzterRoh = p.getLong(K_ROH, -1);
        long letzteZeit = p.getLong(K_ZEIT, 0);

        // Die allererste Messung setzt nur den Anfangspunkt. Was vorher
        // gelaufen wurde, weiß niemand – behaupten wollen wir es nicht.
        if (letzterRoh < 0 || letzteZeit <= 0) {
            p.edit().putLong(K_ROH, roh).putLong(K_ZEIT, zeit).apply();
            return;
        }
        // Nach einem Neustart des Geräts fängt der Zähler bei null an
        long delta = roh >= letzterRoh ? roh - letzterRoh : roh;
        if (delta > 0) {
            // Der Zeitraum zählt für den Tag, in dem seine Mitte liegt
            String tag = tagKey(letzteZeit + (zeit - letzteZeit) / 2);
            JSONObject tage = tageLesen(ctx);
            try {
                tage.put(tag, tage.optInt(tag, 0) + (int) Math.min(delta, 200000));
            } catch (Exception e) { /* dann eben nicht */ }
            tageSchreiben(ctx, tage);
        }
        p.edit().putLong(K_ROH, roh).putLong(K_ZEIT, zeit).apply();
    }

    static JSONObject tageLesen(Context ctx) {
        try {
            return new JSONObject(prefs(ctx).getString(K_TAGE, "{}"));
        } catch (Exception e) {
            return new JSONObject();
        }
    }

    /** Beim Schreiben gleich ausmisten – alte Tage interessieren niemanden. */
    private static void tageSchreiben(Context ctx, JSONObject tage) {
        try {
            List<String> schluessel = new ArrayList<>();
            for (Iterator<String> it = tage.keys(); it.hasNext(); ) schluessel.add(it.next());
            if (schluessel.size() > TAGE_MAX) {
                Collections.sort(schluessel);
                for (int i = 0; i < schluessel.size() - TAGE_MAX; i++) tage.remove(schluessel.get(i));
            }
        } catch (Exception e) { /* Aufräumen ist Kür */ }
        prefs(ctx).edit().putString(K_TAGE, tage.toString()).apply();
    }

    static String tagKey(long zeit) {
        Calendar c = Calendar.getInstance();
        c.setTimeInMillis(zeit);
        return String.format(Locale.US, "%04d-%02d-%02d",
                c.get(Calendar.YEAR), c.get(Calendar.MONTH) + 1, c.get(Calendar.DAY_OF_MONTH));
    }

    /* ═══════════════ Der Wecker kurz vor Mitternacht ═══════════════ */

    /**
     * Bewusst kurz <em>vor</em> Mitternacht und bewusst ungenau: Um 23:57 ist
     * die Mitte des Zeitraums seit der letzten Messung sicher noch der heutige
     * Tag, und ob der Wecker ein paar Minuten später kommt, spielt für eine
     * Tagessumme keine Rolle. Eine Sonderberechtigung braucht es dafür nicht.
     */
    static void alarmStellen(Context ctx) {
        AlarmManager am = (AlarmManager) ctx.getSystemService(Context.ALARM_SERVICE);
        if (am == null) return;
        Calendar c = Calendar.getInstance();
        c.set(Calendar.HOUR_OF_DAY, 23);
        c.set(Calendar.MINUTE, 57);
        c.set(Calendar.SECOND, 0);
        c.set(Calendar.MILLISECOND, 0);
        if (c.getTimeInMillis() <= System.currentTimeMillis()) c.add(Calendar.DAY_OF_MONTH, 1);
        try {
            am.setAndAllowWhileIdle(AlarmManager.RTC_WAKEUP, c.getTimeInMillis(), alarmZiel(ctx));
        } catch (Exception e) { /* ohne Wecker zählt die App beim Öffnen nach */ }
    }

    private static PendingIntent alarmZiel(Context ctx) {
        Intent i = new Intent(ctx, SchrittAlarm.class);
        int flags = PendingIntent.FLAG_UPDATE_CURRENT;
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.M) flags |= PendingIntent.FLAG_IMMUTABLE;
        return PendingIntent.getBroadcast(ctx, ALARM_ID, i, flags);
    }
}
