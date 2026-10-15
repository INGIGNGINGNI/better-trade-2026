#!/usr/bin/env python3
"""Make a static artwork rendering of ticket plans at the 1920px desktop layout.

This is a local graphics reconstruction from the page's copy, fonts, image assets,
and design tokens. It is not a browser screenshot. All coordinates below are CSS
pixels at a 1920px viewport; the master render is sampled at 4x.
"""

from __future__ import annotations

import json
import math
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

from PIL import Image, ImageDraw, ImageEnhance, ImageFont


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "exports" / "ticket-plans"
S = 4
VW, VH = 1920, 1240
PLANS_X, PLANS_W = 260, 1400
CARD_W = PLANS_W / 3

PAPER = "#fbfbfb"
INK = "#111318"
MUTED = "#687078"
LINE = "#dbded5"
BLUE_PALE = "#eaf2ff"
BLUE = "#1863dc"
BLUE_EDGE = "#6598ff"

FONT_FILES = {
    "regular": ROOT / "fonts" / "fc-minimal-regular.woff2",
    "medium": ROOT / "fonts" / "fc-minimal-medium.woff2",
    "light": ROOT / "fonts" / "fc-minimal-light.woff2",
    "serif": Path("/System/Library/Fonts/Supplemental/Baskerville.ttc"),
}
FONT_CACHE: dict[tuple[str, int], ImageFont.FreeTypeFont] = {}


def font(weight: str, px: int) -> ImageFont.FreeTypeFont:
    key = (weight, px)
    if key not in FONT_CACHE:
        FONT_CACHE[key] = ImageFont.truetype(str(FONT_FILES[weight]), px * S)
    return FONT_CACHE[key]


def p(value: float) -> int:
    return round(value * S)


def text(
    draw: ImageDraw.ImageDraw,
    value: str,
    x: float,
    y: float,
    size: int,
    color: str = INK,
    weight: str = "regular",
    align: str = "left",
) -> float:
    face = font(weight, size)
    width = draw.textlength(value, font=face) / S
    if align == "center":
        x -= width / 2
    elif align == "right":
        x -= width
    draw.text((p(x), p(y)), value, font=face, fill=color, anchor="lt")
    return width


def fitted_lines(draw, value: str, max_width: float, size: int, weight="regular") -> list[str]:
    words = value.split()
    lines: list[str] = []
    current = ""
    for word in words:
        candidate = (current + " " + word).strip()
        if draw.textlength(candidate, font=font(weight, size)) / S <= max_width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines or [""]


def rounded(draw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(
        tuple(p(v) for v in box),
        radius=p(radius),
        fill=fill,
        outline=outline,
        width=max(1, p(width)),
    )


def line(draw, points, color=LINE, width=1):
    draw.line([(p(x), p(y)) for x, y in points], fill=color, width=max(1, p(width)), joint="curve")


def paste_icon(canvas: Image.Image, source: str, cx: float, top: float, size: float) -> None:
    icon = Image.open(ROOT / "images" / source).convert("RGBA")
    icon = ImageEnhance.Color(icon).enhance(1.5)
    icon.thumbnail((p(size), p(size)), Image.Resampling.LANCZOS)
    canvas.alpha_composite(icon, (p(cx - size / 2), p(top)))


def draw_line_icon(draw: ImageDraw.ImageDraw, kind: str, x: float, y: float) -> None:
    """Small line icons matching the six source SVG symbols at artwork scale."""
    c = BLUE
    w = 1.65
    if kind == "conference":
        rounded(draw, (x + 9, y + 2, x + 15, y + 15), 3, None, c, w)
        line(draw, [(x + 5, y + 11), (x + 5, y + 13), (x + 7, y + 17), (x + 12, y + 19), (x + 17, y + 17), (x + 19, y + 13), (x + 19, y + 11)], c, w)
        line(draw, [(x + 12, y + 19), (x + 12, y + 22)], c, w)
        line(draw, [(x + 8, y + 22), (x + 16, y + 22)], c, w)
    elif kind == "experience":
        line(draw, [(x + 3, y + 7), (x + 12, y + 2), (x + 21, y + 7), (x + 21, y + 17), (x + 12, y + 22), (x + 3, y + 17), (x + 3, y + 7)], c, w)
        line(draw, [(x + 3, y + 7), (x + 12, y + 12), (x + 21, y + 7)], c, w)
        line(draw, [(x + 12, y + 12), (x + 12, y + 22)], c, w)
    elif kind == "pavilions":
        line(draw, [(x + 2, y + 7), (x + 4, y + 3), (x + 20, y + 3), (x + 22, y + 7), (x + 2, y + 7)], c, w)
        line(draw, [(x + 4, y + 7), (x + 4, y + 21), (x + 20, y + 21), (x + 20, y + 7)], c, w)
        line(draw, [(x + 8, y + 21), (x + 8, y + 14), (x + 16, y + 14), (x + 16, y + 21)], c, w)
    elif kind == "workshop":
        line(draw, [(x + 2, y + 3), (x + 22, y + 3)], c, w)
        line(draw, [(x + 3, y + 3), (x + 3, y + 14), (x + 5, y + 16), (x + 19, y + 16), (x + 21, y + 14), (x + 21, y + 3)], c, w)
        line(draw, [(x + 7, y + 21), (x + 12, y + 16), (x + 17, y + 21)], c, w)
    elif kind == "master-class":
        draw.ellipse((p(x + 9), p(y + 3), p(x + 15), p(y + 9)), outline=c, width=p(w))
        draw.ellipse((p(x + 2), p(y + 7), p(x + 7), p(y + 12)), outline=c, width=p(w))
        draw.ellipse((p(x + 17), p(y + 7), p(x + 22), p(y + 12)), outline=c, width=p(w))
        line(draw, [(x + 5, y + 20), (x + 6, y + 16), (x + 9, y + 14), (x + 15, y + 14), (x + 18, y + 16), (x + 19, y + 20)], c, w)
        line(draw, [(x + 1, y + 20), (x + 2, y + 16), (x + 5, y + 14)], c, w)
        line(draw, [(x + 23, y + 20), (x + 22, y + 16), (x + 19, y + 14)], c, w)
    else:
        line(draw, [(x + 12, y + 7), (x + 12, y + 21)], c, w)
        line(draw, [(x + 2, y + 4), (x + 8, y + 4), (x + 12, y + 7), (x + 12, y + 21), (x + 8, y + 18), (x + 2, y + 18), (x + 2, y + 4)], c, w)
        line(draw, [(x + 22, y + 4), (x + 16, y + 4), (x + 12, y + 7)], c, w)
        line(draw, [(x + 22, y + 4), (x + 22, y + 18), (x + 16, y + 18), (x + 12, y + 21)], c, w)


ACCESS = [
    ("conference", "Conference", "(เวทีใหญ่)", "วิทยากร 30+ ท่าน รวม 20+ เซสชัน บนเวทีหลัก"),
    ("experience", "Experience", "(โซนกิจกรรม)", "บูธแบรนด์ชั้นนำ ร่วมกิจกรรม ลุ้นของรางวัล"),
    ("pavilions", "Pavilions", "(ตลาดนักสะสม)", "90+ บูธ การ์ดสะสม ของแบรนด์เนม ของหายาก"),
    ("workshop", "Workshop", "(คลาสลงมือทำ)", "8 Session เรียนทีละขั้น กับมืออาชีพตัวจริง (ที่นั่งจำกัด)"),
    ("master-class", "Master Class", "(คลาสเชิงลึก)", "4 Session กลุ่มเล็ก เจาะลึกแบบใกล้ชิด"),
    ("playbook", "Playbook", "(คู่มือเข้าใจสไตล์การลงทุน)", "รับ PERSONALIZED PLAYBOOK เฉพาะตัว สร้างจากพฤติกรรมจริงในงาน"),
]

CARDS = [
    {
        "name": "Explorer", "key": "explorer", "icon": "explorer.webp", "note": "เดินชมงาน สัมผัสทุกประสบการณ์",
        "prices": [("บัตร 1 วัน", "150", "เลือกวันเข้างานได้ 1 วัน"), ("บัตร 2 วัน", "200", "+50 บาท ได้เพิ่มอีก 1 วัน")],
        "button": "ซื้อบัตร Explorer 2 วัน 200 บาท",
        "statuses": ["บัตร Ultimate เท่านั้น", "รวมในบัตร", "รวมในบัตร", "บัตร Ultimate เท่านั้น", "บัตร Master Class เท่านั้น", "ฉบับย่อ"],
    },
    {
        "name": "Ultimate", "key": "ultimate", "icon": "ultimate-2.webp", "note": "ครบทุกเวที พร้อม Playbook ฉบับเต็ม",
        "prices": [("บัตร 1 วัน", "1,500", "ฟรี Workshop 1 Session (เฉพาะวันที่บนบัตร)"), ("บัตร 2 วัน", "2,500", "ฟรี Workshop วันละ 1 Session รวม 2 Session")],
        "button": "ซื้อบัตร Ultimate 2 วัน 2,500 บาท",
        "statuses": ["รวมในบัตร", "รวมในบัตร", "รวมในบัตร", "รวมในบัตร", "บัตร Master Class เท่านั้น", "ฉบับเต็ม"],
    },
    {
        "name": "Master Class", "key": "master", "icon": "master.webp", "note": "เจาะลึกเฉพาะทางกับตัวจริง กลุ่มเล็ก",
        "prices": [("ราคาบัตรเริ่มต้นเพียง", "490", "เรียนรู้เชิงลึก พร้อมแลกเปลี่ยนกับผู้เชี่ยวชาญ")],
        "button": "ซื้อบัตร Master Class",
        "statuses": ["บัตร Ultimate เท่านั้น", "รวมในบัตร", "รวมในบัตร", "บัตร Ultimate เท่านั้น", "รวมในบัตร", "ฉบับย่อ"],
    },
]


def draw_card_background(canvas: Image.Image, x: float, top: float, bottom: float, ultimate: bool) -> None:
    draw = ImageDraw.Draw(canvas)
    rounded(draw, (x, top, x + CARD_W, bottom), 8, PAPER)
    if not ultimate:
        return
    # Website: ultimate-bg.webp under a pale white tint and faint color haze.
    background = Image.open(ROOT / "images" / "ultimate-bg.webp").convert("RGBA")
    bw, bh = p(CARD_W), p(bottom - top)
    fit = max(bw / background.width, bh / background.height)
    background = background.resize((round(background.width * fit), round(background.height * fit)), Image.Resampling.LANCZOS)
    left = (background.width - bw) // 2
    upper = (background.height - bh) // 2
    background = background.crop((left, upper, left + bw, upper + bh))
    tint = Image.new("RGBA", (bw, bh), (251, 251, 251, 180))
    background = Image.alpha_composite(background, tint)
    mask = Image.new("L", (bw, bh))
    ImageDraw.Draw(mask).rounded_rectangle((0, 0, bw - 1, bh - 1), radius=p(8), fill=255)
    canvas.paste(background, (p(x), p(top)), mask)
    rounded(draw, (x, top, x + CARD_W, bottom), 8, None, "#19274a", 2)
    rounded(draw, (x + 2, top, x + CARD_W - 2, top + 48), 6, "#19274a")
    for step in range(p(48)):
        t = step / max(1, p(48) - 1)
        color = tuple(round(a * (1 - t) + b * t) for a, b in zip((25, 39, 74), (2, 11, 30)))
        draw.line([(p(x + 2), p(top) + step), (p(x + CARD_W - 2), p(top) + step)], fill=color, width=1)
    text(draw, "คุ้มที่สุด", x + CARD_W / 2, top + 12, 18, "#f7f9ff", align="center")


def draw_price_block(draw, x: float, y: float, width: float, card: dict) -> None:
    line(draw, [(x, y), (x + width, y)], LINE)
    line(draw, [(x, y + 160), (x + width, y + 160)], LINE)
    options = card["prices"]
    cell_width = width / len(options)
    for index, (day, amount, note) in enumerate(options):
        left = x + index * cell_width
        selected = len(options) == 2 and index == 1
        if index:
            line(draw, [(left, y), (left, y + 160)], LINE)
        if selected:
            rounded(draw, (left + 1, y + 1, left + cell_width - 1, y + 159), 0, "#eef4ff", BLUE_EDGE, 1)
        px = left + 24
        text(draw, day, px, y + 24, 14, MUTED, "medium")
        if len(options) == 2:
            cx, cy = left + cell_width - 33, y + 32
            draw.ellipse((p(cx - 8), p(cy - 8), p(cx + 8), p(cy + 8)), fill="white", outline=BLUE if selected else "#b8bec6", width=p(1))
            if selected:
                draw.ellipse((p(cx - 5), p(cy - 5), p(cx + 5), p(cy + 5)), fill=BLUE)
        number_width = text(draw, amount, px, y + 51, 40, BLUE if selected else INK, "medium" if selected else "regular")
        text(draw, "บาท", px + number_width + 7, y + 75, 14, MUTED)
        note_lines = fitted_lines(draw, note, cell_width - 48, 14)
        for j, piece in enumerate(note_lines[:2]):
            text(draw, piece, px, y + 116 + j * 17, 14, MUTED)


def draw_button(draw, x: float, y: float, width: float, label: str, primary: bool) -> None:
    rounded(draw, (x, y, x + width, y + 48), 24, INK if primary else "#fafafa", INK if primary else "#b9bdc3", 2)
    text(draw, label, x + width / 2, y + 14, 16, "#eef1f6" if primary else INK, align="center")


def draw_access(draw, x: float, y: float, width: float, statuses: list[str]) -> None:
    row_height = 74
    for index, ((key, title, subtitle, description), status) in enumerate(zip(ACCESS, statuses)):
        row_y = y + index * row_height
        if index:
            line(draw, [(x, row_y), (x + width, row_y)], LINE)
        icon_x = x + 1
        draw_line_icon(draw, key, icon_x, row_y + 19)
        title_x = x + 33
        title_width = text(draw, title, title_x, row_y + 11, 14, INK, "medium")
        text(draw, " " + subtitle, title_x + title_width, row_y + 11, 14, MUTED, "medium")
        desc_lines = fitted_lines(draw, description, 224, 12)
        for j, piece in enumerate(desc_lines[:2]):
            text(draw, piece, title_x, row_y + 36 + j * 16, 12, MUTED)
        badge_width = min(148, max(60, draw.textlength(status, font=font("regular", 12)) / S + 18))
        badge_x = x + width - badge_width
        rounded(draw, (badge_x, row_y + 27, x + width, row_y + 49), 11, BLUE_PALE, "#cfe1ff", 1)
        text(draw, status, badge_x + badge_width / 2, row_y + 32, 12, BLUE_EDGE, align="center")


def draw_workshop(draw, x: float, y: float, width: float) -> None:
    rounded(draw, (x, y, x + width, y + 116), 8, BLUE_PALE, BLUE_EDGE, 1)
    text(draw, "สำรองที่นั่ง Workshop ได้แล้ววันนี้", x + 16, y + 16, 14, INK, "medium")
    text(draw, "(บัตร Ultimate เท่านั้น)", x + 16, y + 36, 12, BLUE, "medium")
    text(draw, "8 Session เรียนทีละขั้นกับมืออาชีพตัวจริง", x + 16, y + 64, 12, MUTED)
    text(draw, "(ที่นั่งจำกัด)", x + 16, y + 81, 12, MUTED)
    rounded(draw, (x + width - 162, y + 65, x + width - 16, y + 103), 19, INK)
    text(draw, "สำรองที่นั่ง Workshop", x + width - 89, y + 75, 14, "#eef1f6", align="center")


def draw_card(canvas: Image.Image, draw: ImageDraw.ImageDraw, index: int, card: dict) -> None:
    x = PLANS_X + index * CARD_W
    ultimate = card["key"] == "ultimate"
    top = 24 if ultimate else 112
    bottom = 1220 if ultimate else 1132
    draw_card_background(canvas, x, top, bottom, ultimate)
    inner_x = x + 32
    inner_width = CARD_W - 64
    icon_size = 80 if ultimate else 44
    # The six-pixel top border precedes the card's padding in the website layout.
    # Every header element starts at the card's 32px inner edge.
    icon_y = 136 if ultimate else 166
    paste_icon(canvas, card["icon"], inner_x + icon_size / 2, icon_y, icon_size)
    text(draw, "บัตร", inner_x, 238, 16, INK)
    text(draw, card["name"].upper(), inner_x, 264, 32, INK, "serif")
    text(draw, card["note"], inner_x, 314, 16, MUTED)
    draw_price_block(draw, inner_x, 362, inner_width, card)
    draw_button(draw, inner_x, 546, inner_width, card["button"], ultimate)
    draw_access(draw, inner_x, 618, inner_width, card["statuses"])
    if ultimate:
        draw_workshop(draw, inner_x, 1086, inner_width)


def main() -> None:
    OUT.mkdir(parents=True, exist_ok=True)
    canvas = Image.new("RGBA", (p(VW), p(VH)), PAPER)
    draw = ImageDraw.Draw(canvas)
    rounded(draw, (PLANS_X, 112, PLANS_X + PLANS_W, 1132), 8, None, "#eaeaea", 1)
    for index in (0, 2, 1):  # Ultimate is painted on top, as on the page.
        draw_card(canvas, draw, index, CARDS[index])

    full_4x = OUT / "ticket-plans-1920-layout-4x.png"
    full_2x = OUT / "ticket-plans-1920-layout-2x.png"
    full_1x = OUT / "ticket-plans-1920-layout-1x.png"
    tight_4x = OUT / "ticket-plans-cards-4x.png"
    tight_2x = OUT / "ticket-plans-cards-2x.png"
    canvas.convert("RGB").save(full_4x, dpi=(300, 300), optimize=True)
    canvas.resize((VW * 2, VH * 2), Image.Resampling.LANCZOS).convert("RGB").save(full_2x, dpi=(300, 300), optimize=True)
    canvas.resize((VW, VH), Image.Resampling.LANCZOS).convert("RGB").save(full_1x, dpi=(96, 96), optimize=True)
    crop = canvas.crop((p(PLANS_X), 0, p(PLANS_X + PLANS_W), p(VH)))
    crop.convert("RGB").save(tight_4x, dpi=(300, 300), optimize=True)
    crop.resize((PLANS_W * 2, VH * 2), Image.Resampling.LANCZOS).convert("RGB").save(tight_2x, dpi=(300, 300), optimize=True)
    (OUT / "README.json").write_text(json.dumps({
        "source": "landing-page/index.html and CSS design tokens",
        "layout_viewport_css_px": [VW, VH],
        "plans_css_width_px": PLANS_W,
        "recommended_file": full_2x.name,
        "note": "Static local graphics reconstruction, not a pixel-exact browser screenshot. Exact print size depends on target artwork dimensions.",
        "files": {name: list(Image.open(OUT / name).size) for name in (full_1x.name, full_2x.name, full_4x.name, tight_2x.name, tight_4x.name)},
    }, ensure_ascii=False, indent=2), encoding="utf-8")
    archive = OUT / "ticket-plans-png.zip"
    with ZipFile(archive, "w", ZIP_DEFLATED) as bundle:
        for path in sorted(OUT.glob("*.png")):
            bundle.write(path, path.name)
        bundle.write(OUT / "README.json", "README.json")
    print(f"Wrote ticket plan PNGs to {OUT}")


if __name__ == "__main__":
    main()
