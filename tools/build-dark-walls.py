#!/usr/bin/env python3
"""Build dark wall panels with reduced-scale masonry from a visual reference."""

from __future__ import annotations

import argparse
from pathlib import Path

import numpy as np
from PIL import Image, ImageFilter, ImageOps


MASTER_WIDTH = 3240
MASTER_HEIGHT = 4050
RESPONSIVE_WIDTHS = (2560, 1920, 1280)
TARGET_EDGE_FRACTIONS = {
    "left": (0.205, 0.365),
    "right": (0.795, 0.635),
}
TARGET_KNEE = 0.375
LIGHTING_EDGE_FRACTIONS = {
    "left": (0.188, 0.366),
    "right": (0.778, 0.634),
}


def perspective_edge(width: int, height: int, side: str) -> np.ndarray:
    top, vertical = TARGET_EDGE_FRACTIONS[side]
    rows = np.linspace(0.0, 1.0, height)
    edge = np.interp(rows, (0.0, TARGET_KNEE, 1.0), (top, vertical, vertical))
    return np.rint(edge * width).astype(np.int32)


def soft_noise(
    rng: np.random.Generator,
    sample_size: tuple[int, int],
    blur_radius: float,
) -> np.ndarray:
    """Create broad, non-repeating variation without visible grain."""
    sample_width, sample_height = sample_size
    values = rng.normal(128.0, 24.0, (sample_height, sample_width))
    image = Image.fromarray(np.clip(values, 0, 255).astype(np.uint8), "L")
    image = image.filter(ImageFilter.GaussianBlur(radius=blur_radius))
    image = image.resize((MASTER_WIDTH, MASTER_HEIGHT), Image.Resampling.BICUBIC)
    return (np.asarray(image, dtype=np.float32) - 128.0) / 24.0


def reduced_brick_detail(source: Image.Image, side: str) -> np.ndarray:
    """Extract fine masonry relief from the reference without its lighting."""
    crop_box = (
        (20, 220, 230, 1320)
        if side == "left"
        else (900, 220, 1102, 1320)
    )
    crop = ImageOps.grayscale(source.convert("RGB").crop(crop_box))
    crop = crop.resize(
        (max(1, round(crop.width * 0.82)), max(1, round(crop.height * 0.82))),
        Image.Resampling.LANCZOS,
    )
    blurred = crop.filter(ImageFilter.GaussianBlur(radius=4.0))
    detail = np.asarray(crop, dtype=np.float32) - np.asarray(blurred, dtype=np.float32)
    detail = np.clip(detail * 1.45, -24.0, 24.0)

    # Offset each boundary to the middle, then cover it with another intact
    # region from the same draft texture. The outer edges remain continuous.
    detail = heal_texture_seam(detail, axis=1, radius=18)
    detail -= detail.mean(dtype=np.float64)
    detail = np.clip(detail, -24.0, 24.0)

    repeats_x = (MASTER_WIDTH + detail.shape[1] - 1) // detail.shape[1]
    strip = np.tile(detail, (1, repeats_x))[:, :MASTER_WIDTH]
    return stack_texture_strips(strip, side)


def heal_texture_seam(detail: np.ndarray, axis: int, radius: int) -> np.ndarray:
    length = detail.shape[axis]
    center = length // 2
    radius = min(radius, center - 1)
    shifted = np.roll(detail, center, axis=axis)
    donor_axis = 1 - axis
    donor = np.roll(detail, detail.shape[donor_axis] // 3, axis=donor_axis)

    positions = np.arange(length, dtype=np.float32)
    distance = np.abs(positions - center)
    alpha = np.clip(1.0 - distance / radius, 0.0, 1.0)
    alpha = 0.5 - 0.5 * np.cos(alpha * np.pi)
    shape = [1, 1]
    shape[axis] = length
    alpha = alpha.reshape(shape)
    return shifted * (1.0 - alpha) + donor * alpha


def stack_texture_strips(strip: np.ndarray, side: str) -> np.ndarray:
    """Stagger repeated source strips and crossfade their horizontal seams."""
    result = np.zeros((MASTER_HEIGHT, MASTER_WIDTH), dtype=np.float32)
    overlap = min(120, strip.shape[0] // 4)
    step = strip.shape[0] - overlap
    cursor = 0
    index = 0
    direction = 1 if side == "left" else -1

    while cursor < MASTER_HEIGHT:
        shift = direction * ((index * 53 + index * index * 17) % strip.shape[1])
        block = np.roll(strip, shift, axis=1)
        block_height = min(block.shape[0], MASTER_HEIGHT - cursor)
        if cursor == 0:
            result[:block_height] = block[:block_height]
        else:
            blend_height = min(overlap, block_height)
            alpha = np.linspace(0.0, 1.0, blend_height, dtype=np.float32)[:, None]
            alpha = 0.5 - 0.5 * np.cos(alpha * np.pi)
            result[cursor : cursor + blend_height] = (
                result[cursor : cursor + blend_height] * (1.0 - alpha)
                + block[:blend_height] * alpha
            )
            result[cursor + blend_height : cursor + block_height] = block[
                blend_height:block_height
            ]
        cursor += step
        index += 1

    return result


def reference_lighting(
    source: Image.Image,
    side: str,
    wall_depth: np.ndarray,
) -> np.ndarray:
    """Map the old wall's blue tone and directional light onto target geometry."""
    source = source.convert("RGB").filter(ImageFilter.GaussianBlur(radius=10.0))
    source_pixels = np.asarray(source, dtype=np.float32)
    source_height, source_width = source_pixels.shape[:2]

    rows = np.linspace(0.0, 1.0, MASTER_HEIGHT, dtype=np.float32)
    top, vertical = LIGHTING_EDGE_FRACTIONS[side]
    source_edge = np.interp(
        rows,
        (0.0, TARGET_KNEE, 1.0),
        (top, vertical, vertical),
    )[:, None]
    edge_inset = 0.018
    if side == "left":
        source_x = wall_depth * (source_edge - edge_inset)
    else:
        source_x = 1.0 - wall_depth * (1.0 - source_edge - edge_inset)

    source_x = np.clip(
        np.rint(source_x * (source_width - 1)),
        0,
        source_width - 1,
    ).astype(np.int32)
    source_y = np.rint(rows * (source_height - 1)).astype(np.int32)[:, None]
    return source_pixels[source_y, source_x]


def build_wall(
    side: str,
    texture_source: Image.Image,
    lighting_source: Image.Image,
) -> Image.Image:
    rng = np.random.default_rng(20261031 + (0 if side == "left" else 1))
    broad_variation = soft_noise(rng, (54, 68), 2.4) * 7.0

    x = np.linspace(0.0, 1.0, MASTER_WIDTH, dtype=np.float32)[None, :]
    y = np.linspace(0.0, 1.0, MASTER_HEIGHT, dtype=np.float32)[:, None]
    edge = perspective_edge(MASTER_WIDTH, MASTER_HEIGHT, side)
    edge_fraction = edge[:, None] / MASTER_WIDTH
    if side == "left":
        wall_depth = np.clip(x / edge_fraction, 0.0, 1.0)
    else:
        wall_depth = np.clip((1.0 - x) / (1.0 - edge_fraction), 0.0, 1.0)

    lighting = reference_lighting(lighting_source, side, wall_depth)
    tone = broad_variation + reduced_brick_detail(texture_source, side)
    pixels = np.clip(lighting + tone[:, :, None], 0, 255).astype(np.uint8)

    alpha = np.zeros((MASTER_HEIGHT, MASTER_WIDTH), dtype=np.uint8)
    columns = np.arange(MASTER_WIDTH)[None, :]
    if side == "left":
        alpha[columns < edge[:, None]] = 255
    else:
        alpha[columns >= edge[:, None]] = 255

    result = Image.fromarray(pixels, "RGB")
    result.putalpha(Image.fromarray(alpha, "L"))
    return result


def save_webp(image: Image.Image, path: Path, quality: int) -> None:
    image.save(path, "WEBP", quality=quality, method=6)


def build_side(
    side: str,
    texture_path: Path,
    lighting_path: Path,
    output_dir: Path,
    desktop_only: bool,
) -> None:
    texture_source = Image.open(texture_path)
    lighting_source = Image.open(lighting_path)
    master = build_wall(side, texture_source, lighting_source)
    save_webp(master, output_dir / f"wall-{side}.webp", quality=96)

    if desktop_only:
        return

    for width in RESPONSIVE_WIDTHS:
        height = round(width * MASTER_HEIGHT / MASTER_WIDTH)
        resized = master.resize((width, height), Image.Resampling.LANCZOS)
        save_webp(resized, output_dir / f"wall-{side}-{width}.webp", quality=95)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--left-texture", type=Path, required=True)
    parser.add_argument("--right-texture", type=Path, required=True)
    parser.add_argument("--left-lighting", type=Path, required=True)
    parser.add_argument("--right-lighting", type=Path, required=True)
    parser.add_argument("--images-dir", type=Path, default=Path("images"))
    parser.add_argument("--desktop-only", action="store_true")
    args = parser.parse_args()

    images_dir = args.images_dir.resolve()
    build_side(
        "left",
        args.left_texture.resolve(),
        args.left_lighting.resolve(),
        images_dir,
        args.desktop_only,
    )
    build_side(
        "right",
        args.right_texture.resolve(),
        args.right_lighting.resolve(),
        images_dir,
        args.desktop_only,
    )


if __name__ == "__main__":
    main()
