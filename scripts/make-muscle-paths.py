#!/usr/bin/env python3
"""Erzeugt die Muskel-Highlights aus den Körperzeichnungen.

Die Zeichnungen (img/koerper-*.png) sind Strichgrafiken. Statt Formen
darüberzulegen, holt dieses Skript die Flächen aus der Vorlage selbst und
schreibt sie als SVG-Pfade nach js/muscle-paths.js.

Zwei Wege, je nachdem, wie viel die Zeichnung hergibt:

* **flut** – Saatpunkt in eine Zelle setzen und bis zur nächsten Linie
  fluten. Das ist der genaue Weg; die Vorderansicht ist fast durchweg in
  geschlossene Muskelzellen unterteilt.
* **feld** – ein grob umrissenes Vieleck, geschnitten mit dem Körperinneren.
  Nötig für die Rückansicht: Dort gibt es kaum geschlossene Zellen, eine
  Flutfüllung liefe sofort über den ganzen Rücken.

Beide Wege werden mit dem Körperinneren verschnitten, damit nie Farbe neben
der Figur steht.

    python3 scripts/make-muscle-paths.py
"""

from collections import deque
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw

WURZEL = Path(__file__).resolve().parent.parent

# Ab wie viel Alpha gilt ein Pixel als Linie. Niedrig angesetzt: Die Zeichnung
# ist weich gerendert, und schon ein halbdurchsichtiges Loch in einer Linie
# ließe die Füllung in den ganzen Körper laufen.
TUSCHE = 18

MITTE_V = 246   # Mittelachse der Vorderansicht
MITTE_H = 244   # Mittelachse der Rückansicht


def flut(saat, box):
    return {"saat": saat, "box": box}


def feld(poly):
    return {"poly": poly}


def paar(poly, achse=MITTE_H):
    """Ein Feld und sein Spiegelbild auf der anderen Körperhälfte."""
    return [feld(poly), feld([(2 * achse - x, y) for x, y in poly])]


SAAT = {
    # Vorderansicht: sauber in Muskelzellen unterteilt, fast alles per Flut
    "vorn": {
        "nacken":    [flut([(275, 172)], (150, 138, 346, 202)),
                      flut([(217, 172)], (146, 138, 342, 202))],
        "brust":     [flut([(285, 215), (300, 240)], (150, 170, 346, 266)),
                      flut([(207, 215), (192, 240)], (146, 170, 342, 266))],
        "schultern": [flut([(340, 262), (348, 285)], (300, 210, 400, 322)),
                      flut([(152, 262), (144, 285)], (92, 210, 192, 322))],
        # Arme und Bauch sind in der Zeichnung nicht durchgehend in Zellen
        # unterteilt – hier arbeiten Felder, verschnitten mit dem Körper.
        "bizeps":    paar([(346, 322), (412, 334), (434, 392), (440, 434),
                           (398, 444), (366, 402), (346, 356)], MITTE_V),
        "unterarme": paar([(380, 416), (440, 430), (464, 468), (452, 488),
                           (404, 482), (384, 450)], MITTE_V),
        "bauch":     [feld([(208, 270), (284, 270), (289, 330), (285, 400),
                            (270, 452), (246, 472), (222, 452), (207, 400),
                            (203, 330)])],
        # Hüftaußenseite: hier hat die Zeichnung keine eigene Zelle
        "abd":       paar([(270, 450), (288, 452), (304, 462), (315, 480),
                           (320, 500), (317, 520), (306, 536), (292, 545),
                           (278, 542), (270, 528), (267, 500), (267, 472)], MITTE_V),
        "quad":      [flut([(296, 600), (300, 640)], (248, 466, 342, 672)),
                      flut([(196, 600), (192, 640)], (150, 466, 244, 672))],
        "add":       [flut([(266, 580), (262, 620)], (246, 486, 300, 660)),
                      flut([(226, 580), (230, 620)], (192, 486, 246, 660))],
        "schien":    [flut([(290, 760), (286, 810)], (250, 676, 336, 886)),
                      flut([(202, 760), (206, 810)], (156, 676, 242, 886))],
    },
    # Rückansicht: nur grob gezeichnet, deshalb überwiegend Felder
    "hinten": {
        "nacken":    [feld([(244, 152), (286, 172), (318, 200), (330, 218),
                            (296, 224), (266, 242), (244, 330), (222, 242),
                            (192, 224), (158, 218), (170, 200), (202, 172)])],
        "schultern": [flut([(338, 258), (346, 282)], (298, 208, 396, 320)),
                      flut([(150, 258), (142, 282)], (92, 208, 190, 320))],
        "ruecken":   paar([(250, 258), (292, 274), (320, 306), (324, 352),
                           (302, 396), (276, 372), (252, 352)]),
        "lende":     [feld([(212, 374), (276, 374), (284, 408), (276, 444),
                            (244, 456), (212, 444), (204, 408)])],
        "trizeps":   paar([(330, 288), (402, 300), (412, 352), (400, 406),
                           (352, 412), (330, 360)]),
        "unterarme": paar([(370, 402), (440, 420), (456, 478), (432, 506),
                           (392, 496), (364, 440)]),
        "po":        paar([(244, 430), (298, 436), (324, 470), (316, 508),
                           (284, 528), (246, 530)]),
        "ham":       paar([(250, 532), (302, 542), (318, 590), (308, 648),
                           (284, 666), (262, 648), (248, 590)]),
        # Die Waden sind sauber umrandet – dafür reicht die Flutfüllung
        "wade":      [flut([(288, 730), (292, 780)], (248, 676, 334, 840)),
                      flut([(198, 730), (194, 780)], (154, 676, 240, 840))],
    },
}


def lade_tusche(pfad):
    alpha = np.asarray(Image.open(pfad))[:, :, 3]
    t = alpha > TUSCHE
    # Einen Pixel verdicken: schließt haarfeine Lücken in den Linien, ohne
    # dass die Zellen nennenswert schrumpfen.
    p = np.pad(t, 1)
    return p[:-2, 1:-1] | p[2:, 1:-1] | p[1:-1, :-2] | p[1:-1, 2:] | t


def _wachsen(m, runden):
    for _ in range(runden):
        p = np.pad(m, 1)
        m = p[:-2, 1:-1] | p[2:, 1:-1] | p[1:-1, :-2] | p[1:-1, 2:] | m
    return m


def _schrumpfen(m, runden):
    for _ in range(runden):
        p = np.pad(m, 1, constant_values=False)
        m = p[:-2, 1:-1] & p[2:, 1:-1] & p[1:-1, :-2] & p[1:-1, 2:] & m
    return m


def koerper_innen(tusche):
    """Alles innerhalb der Silhouette.

    Der Umriss der Vorlage hat haarfeine Lücken. Würde man einfach vom
    Bildrand fluten, liefe die Füllung durch diese Löcher in den Körper und
    übrig bliebe nur ein Flickenteppich. Deshalb wird die Tusche erst kräftig
    verdickt (dichtet die Lücken), dann geflutet und die Verdickung am Ende
    wieder abgezogen.
    """
    dicht = _wachsen(tusche, 4)
    h, w = dicht.shape
    aussen = np.zeros((h, w), bool)
    rand = deque()
    for x in range(w):
        for y in (0, h - 1):
            if not dicht[y, x] and not aussen[y, x]:
                aussen[y, x] = True
                rand.append((x, y))
    for y in range(h):
        for x in (0, w - 1):
            if not dicht[y, x] and not aussen[y, x]:
                aussen[y, x] = True
                rand.append((x, y))
    while rand:
        x, y = rand.popleft()
        for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
            if 0 <= nx < w and 0 <= ny < h and not aussen[ny, nx] and not dicht[ny, nx]:
                aussen[ny, nx] = True
                rand.append((nx, ny))
    # Verdickung zurücknehmen, damit die Farbe nicht über den Umriss steht
    return _schrumpfen(~aussen, 4)


def flut_maske(tusche, saaten, box):
    h, w = tusche.shape
    x0, y0, x1, y1 = box
    voll = np.zeros((h, w), bool)
    for sx, sy in saaten:
        if tusche[sy, sx]:
            frei = [(sx + dx, sy + dy)
                    for r in range(1, 9) for dx in (-r, 0, r) for dy in (-r, 0, r)
                    if 0 <= sx + dx < w and 0 <= sy + dy < h and not tusche[sy + dy, sx + dx]]
            if not frei:
                raise SystemExit(f"Saat ({sx},{sy}) liegt mitten in der Tusche")
            print(f"    · Saat ({sx},{sy}) lag auf einer Linie → {frei[0]}")
            sx, sy = frei[0]
        if voll[sy, sx]:
            continue
        stapel = deque([(sx, sy)])
        voll[sy, sx] = True
        while stapel:
            x, y = stapel.popleft()
            for nx, ny in ((x + 1, y), (x - 1, y), (x, y + 1), (x, y - 1)):
                if x0 <= nx < x1 and y0 <= ny < y1 and not voll[ny, nx] and not tusche[ny, nx]:
                    voll[ny, nx] = True
                    stapel.append((nx, ny))
    return voll


def feld_maske(form, poly):
    bild = Image.new("1", (form[1], form[0]), 0)
    ImageDraw.Draw(bild).polygon(poly, fill=1)
    return np.asarray(bild, bool)


def konturen(maske):
    """Randlinien der Maske (Moore-Nachbarschaft, ein Umlauf je Fläche)."""
    h, w = maske.shape
    gefunden, besucht = [], np.zeros((h, w), bool)
    pad = np.pad(maske, 1)
    rand = maske & ~(pad[:-2, 1:-1] & pad[2:, 1:-1] & pad[1:-1, :-2] & pad[1:-1, 2:])
    richtungen = [(1, 0), (1, 1), (0, 1), (-1, 1), (-1, 0), (-1, -1), (0, -1), (1, -1)]
    for y0 in range(h):
        for x0 in range(w):
            if not rand[y0, x0] or besucht[y0, x0] or (x0 > 0 and maske[y0, x0 - 1]):
                continue
            weg = [(x0, y0)]
            besucht[y0, x0] = True
            x, y, rein = x0, y0, 6
            for _ in range(300000):
                weiter = False
                for k in range(8):
                    d = (rein + 1 + k) % 8
                    dx, dy = richtungen[d]
                    nx, ny = x + dx, y + dy
                    if 0 <= nx < w and 0 <= ny < h and rand[ny, nx]:
                        rein, x, y, weiter = (d + 4) % 8, nx, ny, True
                        break
                if not weiter or (x, y) == (x0, y0):
                    break
                besucht[y, x] = True
                weg.append((x, y))
            if len(weg) > 40:
                gefunden.append(weg)
    return gefunden


def vereinfache(punkte, eps):
    """Douglas-Peucker: Stützpunkte ausdünnen, Form behalten."""
    if len(punkte) < 3:
        return punkte
    (ax, ay), (bx, by) = punkte[0], punkte[-1]
    dx, dy = bx - ax, by - ay
    laenge = (dx * dx + dy * dy) ** 0.5
    weit, idx = -1.0, 0
    for i in range(1, len(punkte) - 1):
        px, py = punkte[i]
        d = (((px - ax) ** 2 + (py - ay) ** 2) ** 0.5 if laenge == 0
             else abs(dy * px - dx * py + bx * ay - by * ax) / laenge)
        if d > weit:
            weit, idx = d, i
    if weit <= eps:
        return [punkte[0], punkte[-1]]
    return vereinfache(punkte[:idx + 1], eps)[:-1] + vereinfache(punkte[idx:], eps)


def zu_pfad(maske, eps=1.8):
    teile = []
    for weg in konturen(maske):
        pts = vereinfache(weg, eps)
        if len(pts) >= 4:
            teile.append("M" + " ".join(f"{x} {y}" for x, y in pts) + "Z")
    return "".join(teile)


def maske_fuer(regionen, tusche, innen):
    gesamt = np.zeros(tusche.shape, bool)
    for r in regionen:
        if "saat" in r:
            gesamt |= flut_maske(tusche, r["saat"], r["box"])
        else:
            gesamt |= feld_maske(tusche.shape, r["poly"])
    return gesamt & innen


def main():
    aus = ["// Erzeugt von scripts/make-muscle-paths.py – nicht von Hand ändern.",
           "// Die Flächen stammen aus den Zeichnungen in img/: Zellen ausfluten",
           "// bzw. Felder mit dem Körperinneren verschneiden, Kontur vereinfachen.",
           "",
           '"use strict";', "", "const MUSKEL_PFADE = {"]
    for figur, muskeln in SAAT.items():
        bild = WURZEL / "img" / f"koerper-{figur}.png"
        tusche = lade_tusche(bild)
        innen = koerper_innen(tusche)
        print(f"── {figur} ({tusche.shape[1]}×{tusche.shape[0]}, "
              f"Körper {innen.sum()} Px)")
        aus.append(f"  {figur}: {{")
        for muskel, regionen in muskeln.items():
            maske = maske_fuer(regionen, tusche, innen)
            if not maske.any():
                raise SystemExit(f"{figur}/{muskel}: nichts gefüllt")
            ys, xs = np.nonzero(maske)
            d = zu_pfad(maske)
            print(f"   {muskel:<10} {maske.sum():>7} Px  "
                  f"x {xs.min()}–{xs.max()}  y {ys.min()}–{ys.max()}  "
                  f"{len(d):>5} Zeichen")
            aus.append(f'    {muskel}: "{d}",')
        aus.append("  },")
    aus += ["};", ""]
    ziel = WURZEL / "js" / "muscle-paths.js"
    ziel.write_text("\n".join(aus), encoding="utf-8")
    print(f"\n→ {ziel.relative_to(WURZEL)} ({ziel.stat().st_size // 1024} KB)")


if __name__ == "__main__":
    main()
