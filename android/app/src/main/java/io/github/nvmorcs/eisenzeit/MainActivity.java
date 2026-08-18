package io.github.nvmorcs.eisenzeit;

import android.os.Bundle;
import android.view.View;
import android.view.WindowManager;
import android.webkit.WebView;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.getcapacitor.BridgeActivity;

/**
 * Zwei Dinge, die nur nativ gehen: Der Bildschirm bleibt an, solange die App
 * im Vordergrund ist, und die System-Insets (Statusleiste, Navigationsleiste,
 * Display-Notch) wandern als CSS-Custom-Properties in die WebView.
 *
 * Hintergrund: Seit Android 15 zeichnen Apps randlos, der Inhalt liegt also
 * unter Status- und Navigationsleiste. Das CSS-Pendant env(safe-area-inset-top)
 * deckt in der Android-WebView aber nur Display-Cutouts ab, nicht die
 * Statusleiste – ohne diese Brücke klebt der Inhalt oben an der Uhrzeit.
 */
public class MainActivity extends BridgeActivity {

    private String pendingCss = null;

    @Override
    public void onCreate(Bundle savedInstanceState) {
        // Eigene Plugins müssen vor super.onCreate() angemeldet sein, sonst
        // findet die Brücke sie beim Aufbau der WebView nicht.
        registerPlugin(PausenTimerPlugin.class);
        registerPlugin(SchrittZaehlerPlugin.class);
        super.onCreate(savedInstanceState);

        // Bildschirm bleibt an, solange die App im Vordergrund liegt – mitten
        // im Satz will niemand erst entsperren. Das Flag hängt am Fenster:
        // Sobald die App in den Hintergrund geht, wirkt es nicht mehr, der
        // normale Sperr-Timeout des Handys greift also wieder von allein.
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        ViewCompat.setOnApplyWindowInsetsListener(getWindow().getDecorView(), (view, windowInsets) -> {
            Insets insets = windowInsets.getInsets(
                    WindowInsetsCompat.Type.systemBars() | WindowInsetsCompat.Type.displayCutout());
            float density = getResources().getDisplayMetrics().density;
            pendingCss = buildCss(
                    Math.round(insets.top / density),
                    Math.round(insets.right / density),
                    Math.round(insets.bottom / density),
                    Math.round(insets.left / density));
            pushInsets();
            return windowInsets;
        });
    }

    @Override
    public void onResume() {
        super.onResume();
        // Nach einem Reload der Seite sind die Properties weg – erneut setzen.
        pushInsets();
    }

    private String buildCss(int top, int right, int bottom, int left) {
        return "(function(s){"
                + "s.setProperty('--android-inset-top','" + top + "px');"
                + "s.setProperty('--android-inset-right','" + right + "px');"
                + "s.setProperty('--android-inset-bottom','" + bottom + "px');"
                + "s.setProperty('--android-inset-left','" + left + "px');"
                + "})(document.documentElement.style);";
    }

    private void pushInsets() {
        if (pendingCss == null || getBridge() == null) return;
        final WebView webView = getBridge().getWebView();
        if (webView == null) return;
        final String js = pendingCss;
        // Mehrfach anwenden: Der Insets-Listener feuert unter Umständen, bevor
        // das Dokument geladen ist.
        webView.post(() -> webView.evaluateJavascript(js, null));
        webView.postDelayed(() -> webView.evaluateJavascript(js, null), 400);
        webView.postDelayed(() -> webView.evaluateJavascript(js, null), 1200);
    }
}
