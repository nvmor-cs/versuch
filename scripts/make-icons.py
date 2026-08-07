#!/usr/bin/env python3
"""Erzeugt alle Lumora-Grafiken aus einer einzigen Formdefinition.

Die Marke ist eine dreiblättrige Blüte (leichtes Windrad): abstrakt für
Wachstum, Vitalität und Licht – bewusst ohne Hantel- oder Gym-Bezug.
Dieselbe Geometrie steckt als SVG-Pfad in js/app.js (Wortmarke im Kopf),
deshalb hier oben die Kontrollpunkte einmal zentral.

    python3 scripts/make-icons.py
"""
import math
from pathlib import Path
from PIL import Image, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parent.parent
SS = 8            # Supersampling
VB = 100.0        # viewBox-Einheiten

# ── Farben (identisch zu css/style.css) ──────────────────────
BG = (0x11, 0x18, 0x27)        # gray-900
CARD = (0x1F, 0x29, 0x37)      # gray-800
INK = (0xFF, 0xFF, 0xFF)
INK2 = (0x9C, 0xA3, 0xAF)      # gray-400
G_TOP = (0x93, 0xC5, 0xFD)     # blue-300
G_MID = (0x60, 0xA5, 0xFA)     # blue-400
G_BOT = (0x3B, 0x82, 0xF6)     # blue-500

# ── Form: ein Blatt als zwei kubische Beziers ────────────────
# Spitze oben (50,10), Basis (50,44); die Kontrollpunkte sind leicht
# verdreht, dadurch bekommt die Blüte Drehung statt Symmetrie.
PETAL = [
    ((50, 10), (78, 23.6), (70.56, 38.4), (50, 44)),
    ((50, 44), (37.44, 38.4), (42, 23.6), (50, 10)),
]
PETAL_SVG = "M50 10C78 23.6 70.56 38.4 50 44C37.44 38.4 42 23.6 50 10Z"


def _bez(p0, p1, p2, p3, n=64):
    pts = []
    for i in range(n + 1):
        t = i / n
        u = 1 - t
        pts.append((u**3*p0[0] + 3*u*u*t*p1[0] + 3*u*t*t*p2[0] + t**3*p3[0],
                    u**3*p0[1] + 3*u*u*t*p1[1] + 3*u*t*t*p2[1] + t**3*p3[1]))
    return pts


def _rot(pts, deg, cx=50, cy=50):
    a = math.radians(deg)
    c, s = math.cos(a), math.sin(a)
    return [(cx + (x-cx)*c - (y-cy)*s, cy + (x-cx)*s + (y-cy)*c) for x, y in pts]


def mark_mask(size, scale=1.0):
    """Alphamaske der Blüte, size×size, Marke auf `scale` der Fläche."""
    big = int(size * SS)
    m = Image.new("L", (big, big), 0)
    d = ImageDraw.Draw(m)
    k = big / VB
    outline = _bez(*PETAL[0]) + _bez(*PETAL[1])
    for a in (0, 120, 240):
        d.polygon([(x*k, y*k) for x, y in _rot(outline, a)], fill=255)
    if scale != 1.0:
        w = max(1, int(big * scale))
        inner = m.resize((w, w), Image.LANCZOS)
        m = Image.new("L", (big, big), 0)
        m.paste(inner, ((big - w) // 2, (big - w) // 2))
    return m.resize((size, size), Image.LANCZOS)


def gradient(size):
    """Senkrechter Verlauf blue-300 → blue-400 → blue-500."""
    g = Image.new("RGB", (1, size))
    px = g.load()
    for y in range(size):
        t = y / max(1, size - 1)
        if t < 0.5:
            u, a, b = t * 2, G_TOP, G_MID
        else:
            u, a, b = (t - 0.5) * 2, G_MID, G_BOT
        px[0, y] = tuple(int(a[i] + (b[i] - a[i]) * u) for i in range(3))
    return g.resize((size, size), Image.NEAREST)


def glow(size, strength=0.30, radius=0.48):
    """Weicher blauer Schein hinter der Marke.

    radius bleibt unter 0,5, damit der äußerste (durchsichtige) Ring noch
    ganz auf die Leinwand passt – sonst schneidet der Rand den Verlauf ab
    und man sieht ein Rechteck um den Schein."""
    big = size * 2
    m = Image.new("L", (big, big), 0)
    d = ImageDraw.Draw(m)
    steps = 40
    for i in range(steps, 0, -1):
        r = big * radius * i / steps
        v = int(255 * strength * (1 - i / steps) ** 1.8)
        d.ellipse([big/2 - r, big/2 - r, big/2 + r, big/2 + r], fill=v)
    m = m.filter(ImageFilter.GaussianBlur(big * 0.06)).resize((size, size), Image.LANCZOS)
    return m


def rounded_mask(size, radius_pct=0.225):
    big = size * SS
    m = Image.new("L", (big, big), 0)
    ImageDraw.Draw(m).rounded_rectangle([0, 0, big - 1, big - 1],
                                        radius=int(big * radius_pct), fill=255)
    return m.resize((size, size), Image.LANCZOS)


def icon(size, scale=0.60, rounded=True, bg=BG, with_glow=True):
    """Vollständiges App-Icon: Hintergrund, Schein, Marke."""
    img = Image.new("RGBA", (size, size), bg + (255,))
    if with_glow:
        img.paste(Image.new("RGB", (size, size), G_BOT), (0, 0), glow(size))
    img.paste(gradient(size), (0, 0), mark_mask(size, scale))
    if rounded:
        out = Image.new("RGBA", (size, size), (0, 0, 0, 0))
        out.paste(img, (0, 0), rounded_mask(size))
        return out
    return img


def bare_mark(size, scale=1.0):
    """Nur die Marke, transparenter Hintergrund."""
    img = Image.new("RGBA", (size, size), (0, 0, 0, 0))
    img.paste(gradient(size), (0, 0), mark_mask(size, scale))
    return img


def save(img, *parts):
    p = ROOT.joinpath(*parts)
    p.parent.mkdir(parents=True, exist_ok=True)
    img.save(p)
    print("→", p.relative_to(ROOT))


def main():
    # ── PWA ──────────────────────────────────────────────────
    save(icon(192), "icons", "icon-192.png")
    save(icon(512), "icons", "icon-512.png")
    # maskable: randlos, Marke innerhalb des sicheren Kreises (66 %)
    save(icon(512, scale=0.46, rounded=False), "icons", "icon-512-maskable.png")
    save(icon(180, rounded=False), "icons", "apple-touch-icon.png")

    # ── Play Store ───────────────────────────────────────────
    save(icon(512, rounded=False), "store", "play-icon-512.png")
    save(feature_graphic(), "store", "play-feature-1024x500.png")

    # ── Android: Launcher-Icons je Dichte ────────────────────
    res = "android/app/src/main/res"
    for dpi, px in [("mdpi", 48), ("hdpi", 72), ("xhdpi", 96),
                    ("xxhdpi", 144), ("xxxhdpi", 192)]:
        save(icon(px, rounded=False), res, f"mipmap-{dpi}", "ic_launcher.png")
        round_img = Image.new("RGBA", (px, px), (0, 0, 0, 0))
        circle = Image.new("L", (px * SS, px * SS), 0)
        ImageDraw.Draw(circle).ellipse([0, 0, px*SS - 1, px*SS - 1], fill=255)
        round_img.paste(icon(px, rounded=False).convert("RGB"), (0, 0),
                        circle.resize((px, px), Image.LANCZOS))
        save(round_img, res, f"mipmap-{dpi}", "ic_launcher_round.png")
    # Adaptive-Icon-Vordergrund: 108 dp Kachel, Motiv im inneren 66-dp-Kreis
    for dpi, px in [("mdpi", 108), ("hdpi", 162), ("xhdpi", 216),
                    ("xxhdpi", 324), ("xxxhdpi", 432)]:
        save(bare_mark(px, scale=0.42), res, f"mipmap-{dpi}", "ic_launcher_foreground.png")

    # ── Splash ───────────────────────────────────────────────
    save(splash(1920, 1920), res, "drawable", "splash.png")
    for d, (w, h) in {"land-mdpi": (480, 320), "land-hdpi": (800, 480),
                      "land-xhdpi": (1280, 720), "land-xxhdpi": (1600, 960),
                      "land-xxxhdpi": (1920, 1280), "port-mdpi": (320, 480),
                      "port-hdpi": (480, 800), "port-xhdpi": (720, 1280),
                      "port-xxhdpi": (960, 1600), "port-xxxhdpi": (1280, 1920)}.items():
        save(splash(w, h), res, f"drawable-{d}", "splash.png")


def splash(w, h):
    img = Image.new("RGB", (w, h), BG)
    s = int(min(w, h) * 0.34)
    g = glow(s * 3)
    img.paste(Image.new("RGB", (s*3, s*3), G_BOT), ((w - s*3)//2, (h - s*3)//2), g)
    img.paste(bare_mark(s), ((w - s) // 2, (h - s) // 2), bare_mark(s))
    return img


def feature_graphic():
    """1024×500 für den Play-Store-Eintrag."""
    W, H = 1024, 500
    img = Image.new("RGB", (W, H), BG)
    # Schein mittig hinter der Marke
    mx, my = 228, H // 2
    g = glow(720, strength=0.26)
    img.paste(Image.new("RGB", (720, 720), G_BOT), (mx - 360, my - 360), g)
    m = bare_mark(240)
    img.paste(m, (mx - 120, my - 120), m)

    d = ImageDraw.Draw(img)
    from PIL import ImageFont
    def font(px, bold=False):
        for p in ["/usr/share/fonts/truetype/dejavu/DejaVuSans%s.ttf" % ("-Bold" if bold else ""),
                  "/usr/share/fonts/truetype/liberation/LiberationSans%s.ttf" % ("-Bold" if bold else "")]:
            if Path(p).exists():
                return ImageFont.truetype(p, px)
        return ImageFont.load_default()

    d.text((400, 190), "lumora", font=font(86, True), fill=INK)
    d.text((404, 292), "Training. Fortschritt. Gesundheit.", font=font(30), fill=G_MID)
    d.text((404, 338), "Offline · ohne Konto · deine Daten bleiben bei dir",
           font=font(24), fill=INK2)
    return img


if __name__ == "__main__":
    main()
