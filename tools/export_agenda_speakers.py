#!/usr/bin/env python3
"""Export still Agenda speaker portraits using the page's frame and glow styling.

Run with the Codex bundled Python runtime (Pillow, NumPy, and lxml available).
The output is a static design asset; the live page animates its CSS gradients.
"""

from __future__ import annotations

import hashlib
import json
import math
from pathlib import Path

import numpy as np
from lxml import html
from PIL import Image, ImageDraw, ImageEnhance, ImageFilter


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "exports" / "agenda-speakers" / "conference"
SCALE = 4
WIDTH, HEIGHT = 80, 100  # >=1200px Agenda layout, in CSS pixels
BACKGROUND = "#f5f5f5"
BORDER = "#eaeaea"


def read_conference_speakers() -> list[dict]:
    document = html.parse(str(ROOT / "index.html"))
    speakers = []
    seen = set()
    for day, panel_id in (
        (1, "agenda-day-one-main-stage"),
        (2, "agenda-day-two-main-stage"),
    ):
        panel = document.getroot().get_element_by_id(panel_id)
        for row_number, row in enumerate(panel.xpath(".//tbody/tr"), 1):
            frames = row.xpath(
                ".//td[contains(concat(' ', normalize-space(@class), ' '), ' agenda__speakers ')]"
                "/span[contains(concat(' ', normalize-space(@class), ' '), ' agenda__speaker-frame ')]"
            )
            for frame_number, frame in enumerate(frames, 1):
                images = frame.xpath(".//img[@src]")
                if not images:
                    continue
                image = images[0]
                source = image.get("src")
                if source.endswith("profile-empty.webp") or source in seen:
                    continue
                seen.add(source)
                speakers.append(
                    {
                        "day": day,
                        "row": row_number,
                        "frame": frame_number,
                        "source": source,
                        "name": image.get("alt", ""),
                    }
                )
    return speakers


def phase_for(source: str, layer: str) -> float:
    digest = hashlib.sha256(f"{source}|{layer}|agenda-static-v1".encode()).digest()
    return int.from_bytes(digest[:8], "big") / 2**64


def keyframe_at(phase: float, layer: str) -> tuple[float, float, float, float]:
    if layer == "a":
        frames = (
            (0, 0, 0, 1),
            (90, 0.06, -0.05, 1.08),
            (180, -0.05, 0.06, 0.95),
            (270, -0.06, -0.04, 1.06),
            (360, 0, 0, 1),
        )
    else:
        frames = (
            (0, 0, 0, 1.04),
            (-90, -0.07, 0.04, 0.96),
            (-180, 0.05, -0.06, 1.1),
            (-270, 0.04, 0.06, 0.98),
            (-360, 0, 0, 1.04),
        )
    position = phase * 4
    index = min(int(position), 3)
    fraction = position - index
    return tuple(
        frames[index][value] * (1 - fraction)
        + frames[index + 1][value] * fraction
        for value in range(4)
    )


def radial_gradient(
    size: tuple[int, int], center: tuple[float, float], color: str, stop: float
) -> Image.Image:
    width, height = size
    cx, cy = center[0] * width, center[1] * height
    corner_radius = max(
        math.hypot(x - cx, y - cy)
        for x in (0, width)
        for y in (0, height)
    )
    yy, xx = np.ogrid[:height, :width]
    distance = np.hypot(xx - cx, yy - cy)
    alpha = np.clip(1 - distance / (stop * corner_radius), 0, 1)
    rgb = tuple(int(color[i : i + 2], 16) for i in (1, 3, 5))
    rgba = np.empty((height, width, 4), dtype=np.uint8)
    rgba[:, :, :3] = rgb
    rgba[:, :, 3] = np.rint(alpha * 255).astype(np.uint8)
    return Image.fromarray(rgba, "RGBA")


def glow_layer(layer: str, phase: float) -> Image.Image:
    box_width = round(WIDTH * 0.8 * SCALE)
    box_height = round(HEIGHT * 0.8 * SCALE)
    colors = (
        ((0.28, 0.30), "#34d4dc", 0.52, (0.72, 0.66), "#7c6df2", 0.52)
        if layer == "a"
        else ((0.70, 0.26), "#dd4fc2", 0.50, (0.30, 0.74), "#c2b52d", 0.54)
    )
    top = radial_gradient((box_width, box_height), colors[0], colors[1], colors[2])
    bottom = radial_gradient((box_width, box_height), colors[3], colors[4], colors[5])
    blob = Image.alpha_composite(bottom, top)
    rounded = Image.new("L", blob.size)
    ImageDraw.Draw(rounded).rounded_rectangle(
        (0, 0, box_width - 1, box_height - 1),
        radius=round(min(box_width, box_height) * 0.2),
        fill=255,
    )
    blob.putalpha(Image.composite(blob.getchannel("A"), Image.new("L", blob.size), rounded))
    blob = ImageEnhance.Color(blob).enhance(1.5)

    angle, tx, ty, scale = keyframe_at(phase, layer)
    blob = blob.resize(
        (round(blob.width * scale), round(blob.height * scale)), Image.Resampling.BICUBIC
    )
    blob = blob.rotate(-angle, resample=Image.Resampling.BICUBIC, expand=True)
    blob = blob.filter(ImageFilter.GaussianBlur(4 * SCALE))

    radians = math.radians(angle)
    dx = tx * box_width * math.cos(radians) - ty * box_height * math.sin(radians)
    dy = tx * box_width * math.sin(radians) + ty * box_height * math.cos(radians)
    output = Image.new("RGBA", (WIDTH * SCALE, HEIGHT * SCALE))
    x = round(WIDTH * SCALE / 2 - blob.width / 2 + dx)
    y = round(HEIGHT * SCALE / 2 - blob.height / 2 + dy)
    output.alpha_composite(blob, (x, y))
    opacity = 0.52 if layer == "a" else 0.42
    output.putalpha(output.getchannel("A").point(lambda v: round(v * opacity)))
    return output


def portrait_layer(source: Path) -> Image.Image:
    image = Image.open(source).convert("RGBA")
    inner_width = WIDTH - 2
    inner_height = HEIGHT - 2
    # CSS object-fit: cover; object-position: center top; transform: scale(1.2).
    fit = max(inner_width / image.width, inner_height / image.height)
    output_width = round(image.width * fit * 1.2 * SCALE)
    output_height = round(image.height * fit * 1.2 * SCALE)
    image = image.resize((output_width, output_height), Image.Resampling.LANCZOS)
    portrait = Image.new("RGBA", (WIDTH * SCALE, HEIGHT * SCALE))
    x = round((WIDTH * SCALE - output_width) / 2)
    portrait.alpha_composite(image, (x, SCALE))
    return portrait


def export_one(speaker: dict, output_dir: Path = OUTPUT) -> dict:
    source = ROOT / speaker["source"]
    phases = {layer: phase_for(speaker["source"], layer) for layer in ("a", "b")}
    canvas = Image.new("RGBA", (WIDTH * SCALE, HEIGHT * SCALE), BACKGROUND)
    for layer in ("a", "b"):
        canvas = Image.alpha_composite(canvas, glow_layer(layer, phases[layer]))
    canvas = Image.alpha_composite(canvas, portrait_layer(source))

    outer = Image.new("L", canvas.size)
    draw = ImageDraw.Draw(outer)
    draw.rounded_rectangle(
        (0, 0, canvas.width - 1, canvas.height - 1),
        radius=4 * SCALE,
        fill=255,
    )
    inner = Image.new("L", canvas.size)
    draw = ImageDraw.Draw(inner)
    draw.rounded_rectangle(
        (SCALE, SCALE, canvas.width - SCALE - 1, canvas.height - SCALE - 1),
        radius=3 * SCALE,
        fill=255,
    )
    result = Image.new("RGBA", canvas.size)
    border = Image.new("RGBA", canvas.size, BORDER)
    result.paste(border, (0, 0), outer)
    result.paste(canvas, (0, 0), inner)

    filename = Path(speaker["source"]).stem + ".png"
    destination = output_dir / filename
    result.save(destination, optimize=True)
    return {
        **speaker,
        "output": filename,
        "size_px": [result.width, result.height],
        "glow_phase": {layer: round(value, 5) for layer, value in phases.items()},
    }


def main() -> None:
    OUTPUT.mkdir(parents=True, exist_ok=True)
    speakers = read_conference_speakers()
    manifest = [export_one(speaker) for speaker in speakers]
    (OUTPUT / "manifest.json").write_text(
        json.dumps(
            {
                "source": "landing-page/index.html and css/style.css",
                "scope": "Conference Stage, Day 1 and Day 2; placeholders excluded",
                "design_size_css_px": [WIDTH, HEIGHT],
                "export_scale": SCALE,
                "note": "Static locally composited preview. CSS glow is approximated; phases are stable per source image.",
                "speakers": manifest,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    print(f"Exported {len(manifest)} portraits to {OUTPUT}")


if __name__ == "__main__":
    main()
