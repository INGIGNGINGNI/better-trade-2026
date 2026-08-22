#!/usr/bin/env python3
"""Map AI-authored wall lighting onto the production wall masks."""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter


MASTER_SIZE = (3240, 4050)
RESPONSIVE_WIDTHS = (2560, 1920, 1280)
TARGET_EDGE_FRACTIONS = {
    "left": (0.205, 0.365),
    "right": (0.795, 0.635),
}
EDGE_KNEE = 0.375


def edge_positions(
    height: int,
    width: int,
    fractions: tuple[float, float],
) -> np.ndarray:
    rows = np.linspace(0.0, 1.0, height)
    edge = np.interp(rows, (0.0, EDGE_KNEE, 1.0), (fractions[0], fractions[1], fractions[1]))
    return np.rint(edge * width).astype(np.int32)


def normalize_source(source: Image.Image, side: str) -> Image.Image:
    """Normalize generated drafts to the production 4:5 aspect ratio."""
    target_ratio = MASTER_SIZE[0] / MASTER_SIZE[1]
    source_ratio = source.width / source.height
    if source_ratio > target_ratio:
        crop_width = round(source.height * target_ratio)
        if side == "left":
            box = (0, 0, crop_width, source.height)
        else:
            box = (source.width - crop_width, 0, source.width, source.height)
        source = source.crop(box)
    elif source_ratio < target_ratio:
        crop_height = round(source.width / target_ratio)
        top = max(0, (source.height - crop_height) // 2)
        source = source.crop((0, top, source.width, top + crop_height))
    return source.convert("RGB")


def detect_source_edges(source_pixels: np.ndarray, side: str) -> np.ndarray:
    """Find the actual wall/background transition in the generated draft."""
    gray = np.asarray(
        Image.fromarray(source_pixels, "RGB").convert("L").filter(
            ImageFilter.GaussianBlur(radius=2.0)
        ),
        dtype=np.float32,
    )
    height, width = gray.shape
    fallback = edge_positions(height, width, TARGET_EDGE_FRACTIONS[side])
    edges = np.empty(height, dtype=np.int32)
    radius = max(5, round(width * 0.085))

    for row in range(height):
        center = int(fallback[row])
        start = max(4, center - radius)
        stop = min(width - 4, center + radius)
        if side == "left":
            score = gray[row, start - 3 : stop - 3] - gray[row, start + 3 : stop + 3]
        else:
            score = gray[row, start + 3 : stop + 3] - gray[row, start - 3 : stop - 3]
        edges[row] = start + int(np.argmax(score))

    # A long median window removes texture-driven jitter without shifting the
    # slanted geometry or the knee.
    radius = 15
    padded = np.pad(edges, (radius, radius), mode="edge")
    return np.array(
        [np.median(padded[row : row + radius * 2 + 1]) for row in range(len(edges))],
        dtype=np.int32,
    )


def micro_plaster(side: str) -> np.ndarray:
    """Create sharp, very low-contrast plaster relief at true master scale."""
    seed = 20261031 if side == "left" else 20261101
    rng = np.random.default_rng(seed)
    height, width = MASTER_SIZE[1], MASTER_SIZE[0]
    noise = rng.normal(127.5, 18.0, (height, width)).clip(0, 255).astype(np.uint8)
    noise_image = Image.fromarray(noise, "L")
    fine = np.asarray(noise_image.filter(ImageFilter.GaussianBlur(radius=0.65)), dtype=np.float32)
    medium = np.asarray(noise_image.filter(ImageFilter.GaussianBlur(radius=2.2)), dtype=np.float32)
    return np.clip((fine - medium) * 0.16, -2.2, 2.2)


def grade_wall(
    mapped_pixels: np.ndarray,
    side: str,
    target_edge: np.ndarray,
) -> np.ndarray:
    """Match the reference's deep navy plaster and restrained upper lighting."""
    height, width = mapped_pixels.shape[:2]
    lighting = Image.fromarray(mapped_pixels, "RGB").convert("L")
    lighting = lighting.filter(ImageFilter.GaussianBlur(radius=18.0))
    light = np.asarray(lighting, dtype=np.float32) / 255.0
    light = np.clip((light - 0.015) / 0.34, 0.0, 1.0) ** 0.78

    rows = np.linspace(0.0, 1.0, height, dtype=np.float32)[:, None]
    columns = np.arange(width, dtype=np.float32)[None, :]
    edge = target_edge[:, None].astype(np.float32)
    if side == "left":
        wall_depth = np.clip(columns / np.maximum(edge, 1.0), 0.0, 1.0)
        distance = edge - 1.0 - columns
    else:
        wall_depth = np.clip((width - columns) / np.maximum(width - edge, 1.0), 0.0, 1.0)
        distance = columns - edge

    # Keep the very top subdued, let the broad spill peak below the opening,
    # then fall smoothly into an almost-black lower wall.
    upper_control = 0.68 + 0.28 * np.exp(-((rows - 0.24) / 0.22) ** 2)
    lower_falloff = 1.0 - 0.46 * np.clip((rows - 0.42) / 0.58, 0.0, 1.0) ** 1.25
    inner_face = 0.60 + 0.40 * wall_depth**1.35
    illumination = light * upper_control * lower_falloff * inner_face

    dark = np.array((2.0, 9.0, 15.0), dtype=np.float32)
    lit = np.array((29.0, 38.0, 47.0), dtype=np.float32)
    pixels = dark + illumination[:, :, None] * lit

    detail = micro_plaster(side)
    pixels += detail[:, :, None] * np.array((0.72, 0.82, 0.92), dtype=np.float32)

    # Hairline warm rim and a faint nearby spill, restricted to the slanted
    # upper edge. This avoids a long artificial outline on the vertical wall.
    inside = distance >= 0.0
    core = np.exp(-((np.maximum(distance, 0.0) / 2.4) ** 2))
    bloom = np.exp(-((np.maximum(distance, 0.0) / 17.0) ** 2))
    spill = np.exp(-((np.maximum(distance, 0.0) / 72.0) ** 1.6))
    top_gate = np.clip((0.405 - rows) / 0.075, 0.0, 1.0)
    top_gate *= 0.62 + 0.38 * np.exp(-((rows - 0.21) / 0.18) ** 2)
    strength = inside * top_gate

    pixels += strength[:, :, None] * (
        core[:, :, None] * np.array((126.0, 105.0, 74.0), dtype=np.float32)
        + bloom[:, :, None] * np.array((24.0, 18.0, 10.0), dtype=np.float32)
        + spill[:, :, None] * np.array((4.0, 4.0, 3.0), dtype=np.float32)
    )
    return np.clip(pixels, 0.0, 255.0).astype(np.uint8)


def map_wall_style(
    side: str,
    source: Image.Image,
    alpha_source: Image.Image,
) -> Image.Image:
    source = normalize_source(source, side)
    source = source.resize(MASTER_SIZE, Image.Resampling.LANCZOS)
    source_pixels = np.asarray(source, dtype=np.uint8)

    target = alpha_source.convert("RGBA").resize(MASTER_SIZE, Image.Resampling.LANCZOS)
    target_alpha = np.asarray(target, dtype=np.uint8)[:, :, 3]
    output = np.zeros((MASTER_SIZE[1], MASTER_SIZE[0], 3), dtype=np.uint8)

    source_edges = detect_source_edges(source_pixels, side)
    target_edges = edge_positions(
        MASTER_SIZE[1], MASTER_SIZE[0], TARGET_EDGE_FRACTIONS[side]
    )

    for row in range(MASTER_SIZE[1]):
        source_edge = int(source_edges[row])
        target_edge = int(target_edges[row])
        if side == "left":
            source_strip = Image.fromarray(source_pixels[row : row + 1, :source_edge])
            mapped = source_strip.resize((target_edge, 1), Image.Resampling.BILINEAR)
            output[row, :target_edge] = np.asarray(mapped)[0]
        else:
            source_strip = Image.fromarray(source_pixels[row : row + 1, source_edge:])
            target_width = MASTER_SIZE[0] - target_edge
            mapped = source_strip.resize((target_width, 1), Image.Resampling.BILINEAR)
            output[row, target_edge:] = np.asarray(mapped)[0]

    output = grade_wall(output, side, target_edges)
    result = Image.fromarray(output, "RGB")
    result.putalpha(Image.fromarray(target_alpha, "L"))
    return result


def save_variants(
    master: Image.Image,
    side: str,
    output_dir: Path,
    desktop_only: bool,
) -> None:
    master.save(output_dir / f"wall-{side}.webp", "WEBP", quality=96, method=6)
    if desktop_only:
        return
    for width in RESPONSIVE_WIDTHS:
        height = round(width * MASTER_SIZE[1] / MASTER_SIZE[0])
        resized = master.resize((width, height), Image.Resampling.LANCZOS)
        resized.save(
            output_dir / f"wall-{side}-{width}.webp",
            "WEBP",
            quality=95,
            method=6,
        )


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--left-style", type=Path, required=True)
    parser.add_argument("--right-style", type=Path, required=True)
    parser.add_argument("--images-dir", type=Path, default=Path("images"))
    parser.add_argument("--desktop-only", action="store_true")
    args = parser.parse_args()

    images_dir = args.images_dir.resolve()
    for side, style_path in (
        ("left", args.left_style),
        ("right", args.right_style),
    ):
        current_wall = Image.open(images_dir / f"wall-{side}.webp")
        style = Image.open(style_path.resolve())
        master = map_wall_style(side, style, current_wall)
        save_variants(master, side, images_dir, args.desktop_only)


if __name__ == "__main__":
    main()
