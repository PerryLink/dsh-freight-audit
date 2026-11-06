#!/usr/bin/env python3
"""Generate README visuals for dsh-freight-audit (docs/assets/).

Outputs (idempotent overwrite):
  dsh-freight-audit-hero-{zh,en}-{light,dark}.webp   1440x576 raster hero (Pillow)
  dsh-freight-audit-flow-v5-{light,dark}.svg         1100x660 hand-written SVG

Design notes
------------
* Truth source: the checked-in quickstart fixture
  (samples/quickstart/input/bills.csv, ratecard.json and
  expected/result.json). Every id, weight, amount, variance and total below is
  recomputed from that fixture at build time and asserted against the golden
  result (12 bills, variance -727 cents, overcharge 100, undercharge -827,
  10 dispute rows, 12 export rows). Nothing is invented.
* Hero: left column is prose (kicker / stacked title / two value lines / one
  subtitle / one meta line / footer). The right panel is this plugin's own
  figure: one shipment opened as an audit tape - 4900 billed, 4883 expected,
  +17 variance - over the 12-bill variance distribution (blue = overcharge,
  amber = undercharge, a dot = zero difference) and the recovery scoreboard.
  It is a drill-down (one row + all rows), not a pipeline of boxes.
* Flow: a "signed-variance ledger desk", not a row of five nodes. Two inputs
  (bills CSV, ratecard JSON) sit above a three-column ledger - billed |
  signed variance axis | expected - with the real 12 rows. The central zero
  axis splits undercharge (left) from overcharge (right); the recovery
  scoreboard adds them back to a net; two R1 write gates (dispute CSV,
  xlsx workpaper) and one read-only rail (zone_lookup, ratecard_validate,
  accessorial_check) close the desk. Text is tokens, field names and fixture
  numbers, so all five README languages share the same pair.

Run once:  python scripts/gen-readme-assets.py
Requires:  Python 3.10+ with Pillow; Windows fonts msyh.ttc / msyhbd.ttc /
           consola.ttf / segoeui.ttf / segoeuib.ttf.
"""
from __future__ import annotations

import json
import math
import os

from PIL import Image, ImageDraw, ImageFilter, ImageFont

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "docs", "assets")

FONT_CJK = r"C:\Windows\Fonts\msyh.ttc"
FONT_CJK_BOLD = r"C:\Windows\Fonts\msyhbd.ttc"
FONT_MONO = r"C:\Windows\Fonts\consola.ttf"
FONT_EN = r"C:\Windows\Fonts\segoeui.ttf"
FONT_EN_BOLD = r"C:\Windows\Fonts\segoeuib.ttf"

for _path in (FONT_CJK, FONT_CJK_BOLD, FONT_MONO, FONT_EN, FONT_EN_BOLD):
    if not os.path.exists(_path):
        raise SystemExit(f"FATAL: font missing: {_path}")

# ---------------------------------------------------------------- real data
RATE = dict(carrier="SYN-LTL", version="v2026", base_cents=1500,
            per_kg_cents=120, fuel_pct=8.5, effective_from="2026-01-01",
            effective_to="2026-12-31")

# samples/quickstart/input/bills.csv
RAW_BILLS = [
    ("SHP-0001", 10, 2930), ("SHP-0002", 12, 3100),
    ("SHP-0003", 8, 2680), ("SHP-0004", 25, 4900),
    ("SHP-0005", 5, 2200), ("SHP-0006", 30, 5300),
    ("SHP-0007", 15, 3560), ("SHP-0008", 20, 4000),
    ("SHP-0009", 40, 6900), ("SHP-0010", 10, 2930),
    ("SHP-0011", 18, 3800), ("SHP-0012", 22, 4500),
]


def js_round(value: float) -> int:
    """Math.round: half-up, exactly like src/core/freight.ts expectedCents."""
    return math.floor(value + 0.5)


def expected_cents(weight: float) -> int:
    """base + per_kg*weight, then + fuel share - same operation order as TS."""
    subtotal = RATE["base_cents"] + RATE["per_kg_cents"] * weight
    return js_round(subtotal + subtotal * RATE["fuel_pct"] / 100)


BILLS = []
for _sid, _kg, _billed in RAW_BILLS:
    _exp = expected_cents(_kg)
    BILLS.append(dict(id=_sid, kg=_kg, billed=_billed, expected=_exp,
                      variance=_billed - _exp))

OVER = sum(b["variance"] for b in BILLS if b["variance"] > 0)
UNDER = sum(b["variance"] for b in BILLS if b["variance"] < 0)
NET = OVER + UNDER
ZERO = sum(1 for b in BILLS if b["variance"] == 0)
OUTLIERS = [b["id"] for b in BILLS if b["variance"] != 0]
MAX_ABS = max(abs(b["variance"]) for b in BILLS)


def verify_against_golden() -> None:
    path = os.path.join(ROOT, "samples", "quickstart", "expected", "result.json")
    if not os.path.exists(path):
        print("note: golden result.json not found; skipping fixture assertion")
        return
    with open(path, encoding="utf-8") as fh:
        golden = json.load(fh)
    checks = {
        "bills": (len(BILLS), golden["audit"]["bills"]),
        "variance_total_cents": (NET, golden["audit"]["variance_total_cents"]),
        "outliers": (OUTLIERS, golden["audit"]["outliers"]),
        "overcharge_cents": (OVER, golden["recovery"]["overcharge_cents"]),
        "undercharge_cents": (UNDER, golden["recovery"]["undercharge_cents"]),
        "net_cents": (NET, golden["recovery"]["net_cents"]),
        "dispute_shipments": (len(OUTLIERS), golden["dispute"]["shipments"]),
        "export_rows": (len(BILLS), golden["export"]["rows"]),
    }
    bad = {k: v for k, v in checks.items() if v[0] != v[1]}
    if bad:
        raise SystemExit(f"FATAL: fixture drift, figures would lie: {bad}")
    print(f"fixture verified: {len(BILLS)} bills, net {NET} cents, "
          f"{len(OUTLIERS)} dispute rows")


verify_against_golden()

WARNINGS: list[str] = []

SKIN = {
    "light": dict(
        bg_from="#f9f6fd", bg_to="#e4eaf8", card="#ffffff",
        card_edge="#e4e1ee", zone="#f7f4fc", zone_edge="#e3def1",
        text="#141419", sub="#4d5261", faint="#8f94a4",
        accent="#4B67B4", over="#4B67B4", under="#c2410c", good="#16a34a",
        pill="#ece7f9", track="#ece8f5", grid="#e7e4f0", dot="#d9d3ea",
        shadow=(32, 26, 64),
    ),
    "dark": dict(
        bg_from="#131a2a", bg_to="#0c1016", card="#1b2231",
        card_edge="#2e374b", zone="#171e2d", zone_edge="#2b3448",
        text="#f0f3f9", sub="#a8b1c4", faint="#737b8d",
        accent="#8496f5", over="#8496f5", under="#e0a85a", good="#3fb950",
        pill="#242d42", track="#243049", grid="#1e2636", dot="#26314a",
        shadow=(0, 0, 0),
    ),
}


def font(size, kind="cjk"):
    return ImageFont.truetype(
        {"cjk": FONT_CJK, "cjk_bold": FONT_CJK_BOLD, "mono": FONT_MONO,
         "en": FONT_EN, "en_bold": FONT_EN_BOLD}[kind], max(8, int(size)))


def hx(value):
    value = value.lstrip("#")
    return tuple(int(value[i:i + 2], 16) for i in (0, 2, 4))


def gradient(w, h, c1, c2):
    img = Image.new("RGB", (w, h))
    d = ImageDraw.Draw(img)
    for y in range(h):
        t = 0.22 * (y / h) + 0.78 * (y / h) ** 1.55
        d.line([(0, y), (w, y)],
               fill=tuple(int(p + (q - p) * t) for p, q in zip(hx(c1), hx(c2))))
    return img


def glow(img, cx, cy, r, color, alpha=40):
    layer = Image.new("RGBA", img.size, (0, 0, 0, 0))
    d = ImageDraw.Draw(layer)
    for i in range(10, 0, -1):
        rr = r * i / 10
        d.ellipse([cx - rr, cy - rr, cx + rr, cy + rr],
                  fill=color + (int(alpha * (1 - i / 11)),))
    return Image.alpha_composite(img.convert("RGBA"), layer).convert("RGB")


def card(img, box, skin, radius=22, shadow=26, fill="card", edge="card_edge"):
    x0, y0, x1, y1 = box
    sh = Image.new("RGBA", img.size, (0, 0, 0, 0))
    sd = ImageDraw.Draw(sh)
    for i in range(shadow, 0, -3):
        sd.rounded_rectangle([x0 - i // 6, y0 + i // 2, x1 + i // 6, y1 + i],
                             radius=radius + i // 6,
                             fill=skin["shadow"] + (int(7 * (1 - i / shadow)),))
    base = Image.alpha_composite(
        img.convert("RGBA"), sh.filter(ImageFilter.GaussianBlur(13)))
    d = ImageDraw.Draw(base)
    d.rounded_rectangle(box, radius=radius, fill=hx(skin[fill]),
                        outline=hx(skin[edge]), width=2)
    return base.convert("RGB")


def fit(d, text, kind, max_w, size, min_size=14):
    size = int(size)
    while size > min_size:
        if d.textlength(text, font=font(size, kind)) <= max_w:
            return size
        size -= 1
    return max(min_size, size)


def write(img, xy, text, skin, size, kind="cjk", color="text", max_w=None,
          min_size=14, tag=""):
    d = ImageDraw.Draw(img)
    if max_w is not None:
        size = fit(d, text, kind, max_w, size, min_size)
        if d.textlength(text, font=font(size, kind)) > max_w:
            WARNINGS.append(f"{tag}: {text!r} wider than {max_w}px at {size}px")
    d.text(xy, text, font=font(size, kind), fill=hx(skin[color]))
    return size


def pill(img, xy, text, skin, size=20, kind="cjk_bold", fg="accent",
         bg="pill", pad_x=18, pad_y=10):
    d = ImageDraw.Draw(img)
    f = font(size, kind)
    tw = d.textlength(text, font=f)
    x, y = xy
    h = size + pad_y * 2
    d.rounded_rectangle([x, y, x + tw + pad_x * 2, y + h], radius=h // 2,
                        fill=hx(skin[bg]))
    d.text((x + pad_x, y + pad_y - 1), text, font=f, fill=hx(skin[fg]))
    return x + tw + pad_x * 2


def legend(img, x_right, y, segments, skin, size=14, kind="cjk"):
    """Right-aligned multi-colour legend; segments are (text, skin colour)."""
    d = ImageDraw.Draw(img)
    widths = [d.textlength(txt, font=font(size, kind)) for txt, _ in segments]
    x = x_right - sum(widths)
    for (txt, color), width in zip(segments, widths):
        d.text((x, y), txt, font=font(size, kind), fill=hx(skin[color]))
        x += width


def dashed_v(d, x, y0, y1, color, dash=6, gap=5, width=2):
    y = y0
    while y < y1:
        d.line([x, y, x, min(y + dash, y1)], fill=color, width=width)
        y += dash + gap


HERO = {
    "zh": dict(
        kicker="DeepSeek Harness · 运费对账插件",
        title1="运费账单", title2="逐票对账",
        value=["多收少收，逐票算到分", "争议单与底稿，本地一次导出"],
        sub="账单 × 费率卡 → 差额（分）→ 争议单 + 底稿",
        meta="R1 本地写 / R0 只读 · 无网络 · 不调模型 · 原账单不动",
        foot="dsh-freight-audit · Apache-2.0 · PerryLink DSH plugin family",
        panel_kicker="逐票对账 · 12 票",
        panel_meta="SYN-LTL | v2026 · 单位 分",
        tape=("账单 billed", "4900", "应计 expected", "4883",
              "差额 Δ", "+17", "SHP-0004 · 25 kg",
              "1500 + 120×25 + 8.5%", "billed − expected"),
        formula="应计 = round((1500 + 120 × 25) × 1.085) = 4883",
        dist_title="12 票差额分布",
        dist_legend=[("多收 4", "over"), (" · ", "faint"), ("零差 2", "faint"), (" · ", "faint"), ("少收 6", "under")],
        call_neg="SHP-0006 −234", call_pos="SHP-0009 +64",
        score=[("多收 over · 4 票", "+100"), ("少收 under · 6 票", "−827"),
               ("净额 net", "−727")],
        note="10 票进争议 CSV · 12 行进 xlsx 底稿 · exports/ 本地",
    ),
    "en": dict(
        kicker="DeepSeek Harness · freight audit plugin",
        title1="freight bill", title2="audit",
        value=["Billed vs ratecard, line by line", "Dispute CSV plus xlsx workpaper"],
        sub="bills + ratecard → cent variance → exports",
        meta="R1 local write / R0 read-only · no network · no model",
        foot="dsh-freight-audit · Apache-2.0 · PerryLink DSH plugin family",
        panel_kicker="per-shipment audit · 12 bills",
        panel_meta="SYN-LTL | v2026 · cents",
        tape=("billed", "4900", "expected", "4883",
              "Δ variance", "+17", "SHP-0004 · 25 kg",
              "1500 + 120×25 + 8.5%", "billed − expected"),
        formula="expected = round((1500 + 120 × 25) × 1.085) = 4883",
        dist_title="variance across 12 bills",
        dist_legend=[("over 4", "over"), (" · ", "faint"), ("zero 2", "faint"), (" · ", "faint"), ("under 6", "under")],
        call_neg="SHP-0006 −234", call_pos="SHP-0009 +64",
        score=[("over · 4 bills", "+100"), ("under · 6 bills", "−827"),
               ("net", "−727")],
        note="10 rows to dispute CSV · 12 rows to xlsx · exports/ local",
    ),
}


def hero(lang, skin_name):
    s = SKIN[skin_name]
    m = HERO[lang]
    w, h = 1440, 576
    img = gradient(w, h, s["bg_from"], s["bg_to"])
    img = glow(img, 1210, 20, 430, hx(s["accent"]),
               16 if skin_name == "light" else 34)
    img = glow(img, 120, 580, 300, hx(s["accent"]),
               8 if skin_name == "light" else 13)

    # ------------------------------------------------------------- left copy
    pill(img, (60, 50), m["kicker"], s,
         size=20 if lang == "zh" else 18,
         kind="cjk_bold" if lang == "zh" else "en_bold")

    d = ImageDraw.Draw(img)
    title_kind = "cjk_bold" if lang == "zh" else "en_bold"
    tsize = 84
    for i, line in enumerate((m["title1"], m["title2"])):
        size = fit(d, line, title_kind, 600, tsize, 48)
        if size < 76:
            WARNINGS.append(f"hero.{lang}.title{i} shrank to {size}px")
        d.text((60, 106 + i * 106), line, font=font(size, title_kind),
               fill=hx(s["text"]))

    vkind = "cjk_bold" if lang == "zh" else "en_bold"
    vsize = 34
    for line in m["value"]:
        vsize = min(vsize, fit(d, line, vkind, 600, vsize, 24))
    for i, line in enumerate(m["value"]):
        write(img, (60, 338 + i * 46), line, s, vsize, vkind, "text", 600, 24,
              f"hero.{lang}.value{i}")

    sub_size = write(img, (60, 440), m["sub"], s, 26,
                     "cjk" if lang == "zh" else "en", "sub", 600, 22,
                     f"hero.{lang}.sub")
    if sub_size * 880 / 1440 < 15:
        WARNINGS.append(f"hero.{lang}.sub {sub_size}px < 15px displayed")

    meta_size = write(img, (60, 484), m["meta"], s, 20,
                      "cjk" if lang == "zh" else "en", "faint", 600, 16,
                      f"hero.{lang}.meta")
    if meta_size * 880 / 1440 < 12:
        WARNINGS.append(f"hero.{lang}.meta {meta_size}px < 12px displayed")

    d = ImageDraw.Draw(img)
    d.line([60, 518, 630, 518], fill=hx(s["grid"]), width=2)
    foot_size = write(img, (60, 526), m["foot"], s, 19, "en", "faint", 600, 16,
                      f"hero.{lang}.foot")
    if foot_size * 880 / 1440 < 11:
        WARNINGS.append(f"hero.{lang}.foot {foot_size}px < 11px displayed")

    # ---------------------------------------------------------- audit panel
    img = card(img, (700, 44, 1392, 552), s, radius=22)
    d = ImageDraw.Draw(img)

    label_kind = "cjk_bold" if lang == "zh" else "en_bold"
    write(img, (726, 62), m["panel_kicker"], s, 18, label_kind, "accent",
          400, 14, f"hero.{lang}.panel_kicker")
    d.text((1366, 66), m["panel_meta"], font=font(15, "cjk" if lang == "zh" else "mono"),
           fill=hx(s["faint"]), anchor="ra")
    d.line([726, 96, 1366, 96], fill=hx(s["grid"]), width=2)

    # --- one shipment opened as a tape: billed - expected = variance
    t = m["tape"]
    d.rounded_rectangle([726, 108, 1366, 214], radius=18,
                        fill=hx(s["zone"]), outline=hx(s["zone_edge"]),
                        width=2)
    cells = [(742, t[0], t[1], t[6]),
             (932, t[2], t[3], t[7]),
             (1146, t[4], t[5], t[8])]
    for i, (cx, label, value, small) in enumerate(cells):
        write(img, (cx, 120), label, s, 13.5,
              "cjk" if lang == "zh" else "en", "sub", 170, 11,
              f"hero.{lang}.tape_label{i}")
        amount = int(value.replace("+", "").replace("−", "-"))
        color = s["text"] if i < 2 else (s["over"] if amount > 0 else s["under"])
        d.text((cx, 138), value, font=font(28, "mono"), fill=hx(color))
        write(img, (cx, 180), small, s, 13,
              "mono" if i < 2 else ("cjk" if lang == "zh" else "en"),
              "faint", 200, 10, f"hero.{lang}.tape_small{i}")
    dashed_v(d, 916, 118, 204, hx(s["zone_edge"]))
    dashed_v(d, 1130, 118, 204, hx(s["zone_edge"]))
    for cx, glyph in ((916, "−"), (1130, "=")):
        d.ellipse([cx - 12, 148, cx + 12, 172], fill=hx(s["card"]),
                  outline=hx(s["zone_edge"]), width=1)
        d.text((cx, 160), glyph, font=font(17, "mono"), fill=hx(s["sub"]),
               anchor="mm")

    write(img, (726, 226), m["formula"], s, 14,
          "cjk" if lang == "zh" else "mono", "sub", 630, 11,
          f"hero.{lang}.formula")

    # --- 12-bill variance distribution around one zero axis
    write(img, (726, 258), m["dist_title"], s, 16, label_kind, "text", 300, 12,
          f"hero.{lang}.dist_title")
    legend(img, 1366, 260, m["dist_legend"], s, 14,
           "cjk" if lang == "zh" else "en")

    zero_y = 368
    slot = 640 / 12
    scale = 80 / MAX_ABS  # the deepest variance reaches 80px
    d.line([726, zero_y, 1366, zero_y], fill=hx(s["faint"]), width=2)
    d.text((1366, zero_y - 8), "0", font=font(12, "mono"),
           fill=hx(s["faint"]), anchor="ra")
    for i, bill in enumerate(BILLS):
        cx = 726 + slot * (i + 0.5)
        v = bill["variance"]
        if v == 0:
            d.ellipse([cx - 3, zero_y - 3, cx + 3, zero_y + 3],
                      fill=hx(s["faint"]))
            continue
        length = max(4.0, abs(v) * scale)
        color = hx(s["over"] if v > 0 else s["under"])
        if v > 0:
            box = [cx - 11, zero_y - length, cx + 11, zero_y]
        else:
            box = [cx - 11, zero_y, cx + 11, zero_y + length]
        d.rounded_rectangle(box, radius=4, fill=color)

    # two callouts on the extremes (index 5 = SHP-0006, index 8 = SHP-0009)
    neg_cx = 726 + slot * 5.5
    pos_cx = 726 + slot * 8.5
    write(img, (neg_cx - 52, 456), m["call_neg"], s, 13, "mono",
          "under", 130, 10, f"hero.{lang}.call_neg")
    write(img, (pos_cx - 48, 326), m["call_pos"], s, 13, "mono",
          "accent", 120, 10, f"hero.{lang}.call_pos")

    # --- recovery scoreboard
    d.line([726, 474, 1366, 474], fill=hx(s["grid"]), width=2)
    for i, (label, value) in enumerate(m["score"]):
        cx = 726 + i * 220
        write(img, (cx, 482), label, s, 13,
              "cjk" if lang == "zh" else "en", "sub", 200, 11,
              f"hero.{lang}.score_label{i}")
        color = "accent" if i == 2 else ("over" if i == 0 else "under")
        d.text((cx, 498), value, font=font(24, "mono"), fill=hx(s[color]))
    write(img, (726, 530), m["note"], s, 13, "cjk" if lang == "zh" else "mono",
          "faint", 640, 10, f"hero.{lang}.note")

    path = os.path.join(OUT, f"dsh-freight-audit-hero-{lang}-{skin_name}.webp")
    img.save(path, "WEBP", quality=92, method=6)
    print(f"wrote dsh-freight-audit-hero-{lang}-{skin_name}.webp")


# --------------------------------------------------------------- flow (SVG)
FLOW = {
    "light": dict(
        bg_from="#f9f6fd", bg_to="#e4eaf8", card="#ffffff",
        edge="#e4e1ee", zone="#f7f4fc", zone_edge="#e3def1",
        text="#141419", sub="#4d5261", faint="#8f94a4",
        accent="#4B67B4", over="#4B67B4", under="#c2410c", good="#16a34a",
        pill="#ece7f9", track="#ece8f5", grid="#e7e4f0", dot="#d9d3ea",
    ),
    "dark": dict(
        bg_from="#131a2a", bg_to="#0c1016", card="#1b2231",
        edge="#2e374b", zone="#171e2d", zone_edge="#2b3448",
        text="#f0f3f9", sub="#a8b1c4", faint="#737b8d",
        accent="#8496f5", over="#8496f5", under="#e0a85a", good="#3fb950",
        pill="#242d42", track="#243049", grid="#1e2636", dot="#26314a",
    ),
}

MONO = "Consolas, 'SFMono-Regular', Menlo, ui-monospace, monospace"
SANS = ("'Segoe UI', 'Microsoft YaHei', 'PingFang SC', 'Hiragino Sans GB', "
        "ui-sans-serif, sans-serif")


def esc(text):
    return (text.replace("&", "&amp;").replace("<", "&lt;")
            .replace(">", "&gt;"))


def flow_svg(skin_name):
    s = FLOW[skin_name]
    p: list[str] = []
    shadow_op = "0.10" if skin_name == "light" else "0.55"
    shadow_col = "#1b1735" if skin_name == "light" else "#000000"

    def t(x, y, text, size, color="text", family=MONO, weight=400,
          anchor="start", opacity=None):
        o = f' opacity="{opacity}"' if opacity else ""
        p.append(
            f'<text x="{x}" y="{y}" fill="{s[color]}" font-family="{family}" '
            f'font-size="{size}" font-weight="{weight}" '
            f'text-anchor="{anchor}"{o}>{esc(text)}</text>')

    def box(x, y, w, h, fill="card", stroke="edge", r=18, sw=1.5):
        p.append(
            f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{r}" '
            f'fill="{s[fill]}" stroke="{s[stroke]}" stroke-width="{sw}"/>')

    def line(x1, y1, x2, y2, color="grid", width=1.5, dash=None, opacity=None):
        dd = f' stroke-dasharray="{dash}"' if dash else ""
        o = f' opacity="{opacity}"' if opacity else ""
        p.append(f'<line x1="{x1}" y1="{y1}" x2="{x2}" y2="{y2}" '
                 f'stroke="{s[color]}" stroke-width="{width}"{dd}{o}/>')

    def chip(x, y, w, h, label, fg="accent", bg="pill", size=13,
             family=MONO, weight=700):
        p.append(f'<rect x="{x}" y="{y}" width="{w}" height="{h}" rx="{h / 2}" '
                 f'fill="{s[bg]}"/>')
        t(x + w / 2, y + h / 2 + size * 0.36, label, size, fg, family,
          weight, anchor="middle")

    p.append(
        f'<svg xmlns="http://www.w3.org/2000/svg" width="1100" height="660" '
        f'viewBox="0 0 1100 660" role="img" aria-label="dsh-freight-audit '
        f'structure: a carrier bill CSV and a ratecard JSON feed one '
        f'per-shipment ledger; each row computes expected cost from base + '
        f'per-kg x weight plus fuel, records the signed variance in cents, '
        f'and is split around a central zero axis (undercharge left, '
        f'overcharge right); the recovery scoreboard sums over and under into '
        f'a net; two R1 write gates export a dispute CSV and an xlsx '
        f'workpaper, while a read-only rail holds zone_lookup, '
        f'ratecard_validate and accessorial_check">\n'
        f'<title>dsh-freight-audit: one signed-variance ledger, two write '
        f'gates, one read-only rail</title>\n'
        f'<defs>\n'
        f'  <linearGradient id="bg" x1="0" y1="0" x2="0.35" y2="1">\n'
        f'    <stop offset="0" stop-color="{s["bg_from"]}"/>\n'
        f'    <stop offset="1" stop-color="{s["bg_to"]}"/>\n'
        f'  </linearGradient>\n'
        f'  <filter id="soft" x="-30%" y="-30%" width="160%" height="180%">\n'
        f'    <feDropShadow dx="0" dy="7" stdDeviation="10" '
        f'flood-color="{shadow_col}" flood-opacity="{shadow_op}"/>\n'
        f'  </filter>\n'
        f'  <pattern id="dots" width="26" height="26" '
        f'patternUnits="userSpaceOnUse">\n'
        f'    <circle cx="1.4" cy="1.4" r="1.4" fill="{s["dot"]}"/>\n'
        f'  </pattern>\n'
        f'</defs>\n'
        f'<rect width="1100" height="660" fill="url(#bg)"/>\n'
        f'<rect width="1100" height="660" fill="url(#dots)" opacity=".38"/>')

    # ---------------------------------------------------------------- header
    t(44, 54, "dsh-freight-audit", 30, "text", MONO, 700)
    t(44, 80, "bills × ratecard → expected → signed variance in cents → "
      "exports", 15, "sub", SANS)
    p.append(f'<rect x="782" y="36" width="274" height="32" rx="16" '
             f'fill="{s["pill"]}"/>')
    t(919, 57, "SYN-LTL | v2026 · 12 bills · cents", 13, "accent", MONO,
      700, anchor="middle")
    line(44, 100, 1056, 100, "grid", 1.5)

    # ---------------------------------------------------------------- inputs
    p.append('<g filter="url(#soft)">')
    box(40, 112, 430, 94)
    p.append('</g>')
    t(58, 138, "① BILLS CSV", 14, "accent", MONO, 700)
    t(452, 138, "12 rows", 12, "faint", MONO, anchor="end")
    t(58, 162, "shipment_id, weight_kg, billed", 14, "text", MONO)
    t(58, 186, "synthetic fixture · originals untouched", 12, "sub", SANS)

    p.append('<g filter="url(#soft)">')
    box(486, 112, 574, 94)
    p.append('</g>')
    t(504, 138, "② RATECARD JSON", 14, "accent", MONO, 700)
    t(1042, 138, "carrier|version", 12, "faint", MONO, anchor="end")
    t(504, 162, "SYN-LTL | v2026 · base 1500 + per_kg 120 · fuel 8.5%", 14,
      "text", MONO)
    t(504, 186, "window 2026-01-01 → 2026-12-31 · overlap rejected", 12,
      "sub", SANS)
    # two short feeders, one per input, into the ledger
    line(255, 206, 255, 216, "accent", 2)
    p.append(f'<path d="M250 214 L255 220 L260 214" fill="none" '
             f'stroke="{s["accent"]}" stroke-width="2" stroke-linecap="round"/>')
    line(1000, 206, 1000, 216, "accent", 2)
    p.append(f'<path d="M995 214 L1000 220 L1005 214" fill="none" '
             f'stroke="{s["accent"]}" stroke-width="2" stroke-linecap="round"/>')

    # ---------------------------------------------------------- ledger desk
    p.append('<g filter="url(#soft)">')
    box(40, 222, 1020, 286, "zone", "zone_edge", 20)
    p.append('</g>')
    t(58, 250, "PER-SHIPMENT LEDGER", 15, "accent", MONO, 700)
    chip(246, 236, 56, 20, "R1", "accent", "pill", 12)
    t(1042, 250, "expected = round((base + per_kg × kg) × (1 + fuel%))",
      12, "faint", MONO, anchor="end")
    line(56, 260, 1044, 260, "grid", 1.2)

    # column headers
    t(56, 276, "shipment", 13, "faint", MONO)
    t(226, 276, "kg", 13, "faint", MONO, anchor="end")
    t(356, 276, "billed", 13, "faint", MONO, anchor="end")
    t(372, 276, "under −", 13, "faint", MONO)
    t(616, 276, "0", 13, "faint", MONO, anchor="middle")
    t(848, 276, "over +", 13, "faint", MONO, anchor="end")
    t(944, 276, "Δ variance", 13, "faint", MONO, anchor="end")
    t(1044, 276, "expected", 13, "faint", MONO, anchor="end")

    zero_x = 616
    half = 232.0
    scale = half / MAX_ABS
    axis_top, axis_bottom = 282, 500
    # signed halves behind the bars: undercharge left, overcharge right
    p.append(f'<rect x="384" y="280" width="232" height="220" rx="8" '
             f'fill="{s["under"]}" opacity=".07"/>')
    p.append(f'<rect x="616" y="280" width="232" height="220" rx="8" '
             f'fill="{s["over"]}" opacity=".08"/>')
    line(zero_x, axis_top, zero_x, axis_bottom, "accent", 1.4, dash="3 5",
         opacity=".55")

    first_y = 294
    pitch = 18
    for i, bill in enumerate(BILLS):
        y = first_y + i * pitch          # text baseline
        cy = y - 4.6                     # row centre
        if i:
            line(56, y - pitch + 6.5, 1044, y - pitch + 6.5, "grid", 1,
                 opacity=".55")
        v = bill["variance"]
        color = "over" if v > 0 else ("under" if v < 0 else "faint")
        t(56, y, bill["id"], 13, "sub", MONO)
        t(226, y, str(bill["kg"]), 13, "sub", MONO, anchor="end")
        t(356, y, str(bill["billed"]), 13, "text", MONO, anchor="end")
        if v == 0:
            p.append(f'<circle cx="{zero_x}" cy="{cy}" r="2.6" '
                     f'fill="{s["faint"]}"/>')
        else:
            length = max(3.5, abs(v) * scale)
            x0 = zero_x - length if v < 0 else zero_x
            p.append(f'<rect x="{x0:.1f}" y="{cy - 4.2:.1f}" width="{length:.1f}" '
                     f'height="8.4" rx="3.2" fill="{s[color]}"/>')
        t(944, y, ("+" if v > 0 else "") + str(v).replace("-", "−"), 13,
          color, MONO, 700 if abs(v) >= 170 else 400, anchor="end")
        t(1044, y, str(bill["expected"]), 13, "sub", MONO, anchor="end")

    # ------------------------------------------------- bottom: scoreboard
    p.append('<g filter="url(#soft)">')
    box(40, 528, 352, 108, "card", "edge", 18)
    p.append('</g>')
    t(58, 552, "RECOVERY · freight.recovery_summary", 13, "accent", MONO, 700)
    t(376, 552, "R0", 11.5, "faint", MONO, anchor="end")
    stats = [(58, "over", "+100", "over"), (176, "under", "−827", "under"),
             (304, "net", "−727", "accent")]
    for x, label, value, color in stats:
        t(x, 574, label, 12, "faint", MONO)
        t(x, 600, value, 22, color, MONO, 700)
    t(58, 624, "over + under = net · from the bills table", 11, "sub", SANS)

    # ------------------------------------------------- bottom: write gates
    p.append('<g filter="url(#soft)">')
    box(408, 528, 352, 108, "card", "edge", 18)
    p.append('</g>')
    t(426, 552, "WRITE GATES · R1", 13, "accent", MONO, 700)
    t(742, 552, "→ exports/", 11.5, "faint", MONO, anchor="end")
    t(426, 576, "freight-dispute-SYN-LTL-v2026.csv", 12, "text", MONO)
    t(426, 594, "10 rows · '=+-@ neutralised · safe-path", 11, "sub", SANS)
    t(426, 616, "freight-SYN-LTL-v2026.xlsx", 12, "text", MONO)
    t(742, 616, "12 rows", 11.5, "faint", MONO, anchor="end")
    t(426, 632, "sheet Audit · billed/expected/Δ", 11, "sub", SANS)

    # ------------------------------------------------ bottom: read-only rail
    p.append('<g filter="url(#soft)">')
    box(776, 528, 284, 108, "card", "edge", 18)
    p.append('</g>')
    t(794, 552, "READ-ONLY RAIL", 13, "accent", MONO, 700)
    t(1042, 552, "R0", 11.5, "faint", MONO, anchor="end")
    t(794, 576, "zone_lookup · zone 3 → 23.27", 11.5, "sub", MONO)
    t(794, 596, "ratecard_validate · 3 issues", 11.5, "sub", MONO)
    t(794, 616, "accessorial_check · 4 issues", 11.5, "sub", MONO)
    t(794, 632, "yuan as listed · never folded in", 11, "faint", SANS)

    # ---------------------------------------------------------------- footer
    line(44, 642, 1056, 642, "grid", 1.2, opacity=".8")
    t(44, 653, "R1: ratecard · audit · dispute · export   |   R0: zone_lookup · "
      "recovery_summary · ratecard_validate · accessorial_check   |   "
      "no network · no model · originals untouched", 11.5, "sub", MONO)

    p.append('</svg>')

    path = os.path.join(OUT, f"dsh-freight-audit-flow-v5-{skin_name}.svg")
    with open(path, "w", encoding="utf-8", newline="\n") as fh:
        fh.write("\n".join(p) + "\n")
    print(f"wrote dsh-freight-audit-flow-v5-{skin_name}.svg")


def main():
    os.makedirs(OUT, exist_ok=True)
    for skin_name in ("light", "dark"):
        for lang in ("zh", "en"):
            hero(lang, skin_name)
        flow_svg(skin_name)
    if WARNINGS:
        print(f"{len(WARNINGS)} layout warning(s)")
        for warning in WARNINGS:
            print(f"  WARN {warning}")
    else:
        print("no layout warnings")


if __name__ == "__main__":
    main()
