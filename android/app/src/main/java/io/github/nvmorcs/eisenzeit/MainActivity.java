package io.github.nvmorcs.eisenzeit;

import android.os.Bundle;
import android.view.View;
import android.webkit.WebView;

import androidx.core.graphics.Insets;
import androidx.core.view.ViewCompat;
import androidx.core.view.WindowInsetsCompat;

import com.getcapacitor.BridgeActivity;

/**
 * Reicht die System-Insets (Statusleiste, Navigationsleiste, Display-Notch) als
 * CSS-Custom-Properties an die WebView weiter.
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
        super.onCreate(savedInstanceState);

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
