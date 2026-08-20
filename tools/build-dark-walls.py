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
    """Extract continuous masonry relief while preserving each wall's angle."""
    crop_box = (
        (20, 220, 230, 1320)
        if side == "left"
        else (900, 220, 1102, 1320)
    )
    crop = ImageOps.grayscale(source.convert("RGB").crop(crop_box))
    crop = crop.resize(
        (max(1, round(crop.width * 0.90)), max(1, round(crop.height * 0.90))),
        Image.Resampling.LANCZOS,
    )
    blurred = crop.filter(ImageFilter.GaussianBlur(radius=4.0))
    detail = np.asarray(crop, dtype=np.float32) - np.asarray(blurred, dtype=np.float32)
    detail = np.clip(detail * 1.45, -24.0, 24.0)

    # Remove residual bands from the reference lighting before repeating the
    # relief. They otherwise become increasingly obvious on the lower wall.
    row_bias = detail.mean(axis=1, keepdims=True)
    column_bias = detail.mean(axis=0, keepdims=True)
    detail -= row_bias - row_bias.mean(dtype=np.float64)
    detail -= column_bias - column_bias.mean(dtype=np.float64)

    # The source already carries the correct opposing perspective: roughly 45
    # degrees on the left and 135 degrees on the right. Keep the horizontal edge
    # periodic, then align each following vertical repeat to that diagonal flow.
    detail = heal_texture_seam(detail, axis=1, radius=14)
    detail -= detail.mean(dtype=np.float64)
    detail = np.clip(detail, -24.0, 24.0)

    repeats_x = (MASTER_WIDTH + detail.shape[1] - 1) // detail.shape[1]
    strip = np.tile(detail, (1, repeats_x))[:, :MASTER_WIDTH]
    stacked = stack_aligned_texture(strip, detail)

    # The source wall changes scale from top to bottom. Equalize the local
    # relief energy after stacking so that transition does not repeat as broad
    # horizontal bands in the lower half of the generated panel.
    row_rms = np.sqrt(np.mean(stacked**2, axis=1, keepdims=True) + 1e-6)
    target_rms = float(np.median(row_rms))
    gain = np.clip(target_rms / row_rms, 0.78, 1.45)
    return np.clip(stacked * gain, -24.0, 24.0)


def stack_aligned_texture(strip: np.ndarray, tile: np.ndarray) -> np.ndarray:
    """Repeat relief vertically without visible bands or broken brick angles."""
    # Match a generous section of the relief, so the blend preserves the brick
    # pattern instead of creating a thin low-contrast stripe at each repeat.
    overlap = min(180, tile.shape[0] // 5)
    search_width = tile.shape[1]
    lower_edge = tile[-overlap:]

    best_shift = 0
    best_error = float("inf")
    for shift in range(search_width):
        upper_edge = np.roll(tile[:overlap], shift, axis=1)
        error = float(np.mean((lower_edge - upper_edge) ** 2))
        if error < best_error:
            best_error = error
            best_shift = shift

    result = np.zeros((MASTER_HEIGHT, MASTER_WIDTH), dtype=np.float32)
    weights = np.zeros((MASTER_HEIGHT, 1), dtype=np.float32)
    step = strip.shape[0] - overlap
    cursor = 0
    index = 0

    while cursor < MASTER_HEIGHT:
        block = np.roll(strip, index * best_shift, axis=1)
        block_height = min(block.shape[0], MASTER_HEIGHT - cursor)
        window = np.ones((block_height, 1), dtype=np.float32)

        if cursor > 0:
            fade_height = min(overlap, block_height)
            phase = np.linspace(0.0, 1.0, fade_height, dtype=np.float32)
            window[:fade_height, 0] = 0.5 - 0.5 * np.cos(phase * np.pi)

        if cursor + block_height < MASTER_HEIGHT:
            fade_height = min(overlap, block_height)
            phase = np.linspace(1.0, 0.0, fade_height, dtype=np.float32)
            window[-fade_height:, 0] = np.minimum(
                window[-fade_height:, 0],
                0.5 - 0.5 * np.cos(phase * np.pi),
            )

        result[cursor : cursor + block_height] += block[:block_height] * window
        weights[cursor : cursor + block_height] += window
        cursor += step
        index += 1

    return result / np.maximum(weights, 1e-6)


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


def reference_lighting(
    source: Image.Image,
    side: str,
    wall_depth: np.ndarray,
) -> np.ndarray:
    """Map the old wall's blue tone and directional light onto target geometry."""
    source = source.convert("RGB").filter(ImageFilter.GaussianBlur(radius=220.0))
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


def sky_reflection(side: str, wall_depth: np.ndarray) -> np.ndarray:
    """Add the cool directional light cast by the open sky above the walls."""
    y = np.linspace(0.0, 1.0, MASTER_HEIGHT, dtype=np.float32)[:, None]
    top_falloff = np.exp(-((y / 0.34) ** 1.45))

    # The inner face sees the sky directly while the outer edge remains almost
    # black. Smoothstep keeps that transition broad enough to read as light,
    # rather than as another stripe in the masonry.
    inner = np.clip((wall_depth - 0.08) / 0.92, 0.0, 1.0)
    inner = inner * inner * (3.0 - 2.0 * inner)
    wash = top_falloff * (0.12 * np.sqrt(inner) + 0.88 * inner**1.55)
    rim = top_falloff * np.clip((wall_depth - 0.72) / 0.28, 0.0, 1.0) ** 1.7

    if side == "left":
        wash_color = np.array((22.0, 29.0, 38.0), dtype=np.float32)
        rim_color = np.array((10.0, 12.0, 13.0), dtype=np.float32)
    else:
        wash_color = np.array((17.0, 25.0, 35.0), dtype=np.float32)
        rim_color = np.array((7.0, 10.0, 13.0), dtype=np.float32)

    reflection = wash[:, :, None] * wash_color
    reflection += rim[:, :, None] * rim_color

    # Preserve the near-black exterior corners visible in the key visual.
    outer_shadow = top_falloff * (1.0 - inner) ** 2.4
    reflection -= outer_shadow[:, :, None] * np.array(
        (6.0, 5.0, 3.0), dtype=np.float32
    )
    return reflection


def upper_edge_rim_light(side: str, edge: np.ndarray) -> np.ndarray:
    """Create a restrained warm sky-lit rim along the upper inner wall edge."""
    columns = np.arange(MASTER_WIDTH, dtype=np.float32)[None, :]
    rows = np.linspace(0.0, 1.0, MASTER_HEIGHT, dtype=np.float32)[:, None]
    if side == "left":
        distance = edge[:, None].astype(np.float32) - 1.0 - columns
    else:
        distance = columns - edge[:, None].astype(np.float32)

    inside = distance >= 0.0
    core = np.exp(-((np.maximum(distance, 0.0) / 3.8) ** 2))
    bloom = np.exp(-((np.maximum(distance, 0.0) / 19.0) ** 2))
    surface_spill = np.exp(-((np.maximum(distance, 0.0) / 115.0) ** 1.55))

    if side == "left":
        core_color = np.array((116.0, 86.0, 40.0), dtype=np.float32)
        bloom_color = np.array((31.0, 19.0, 7.0), dtype=np.float32)
        spill_color = np.array((17.0, 11.0, 5.0), dtype=np.float32)
        # The cloud opening sits closer to the left wall in the key visual. Keep
        # the highlight in separated pools instead of tracing the full edge.
        sky_strength = np.exp(-((rows - 0.07) / 0.11) ** 2)
        knee_glint = 0.24 * np.exp(-((rows - 0.36) / 0.035) ** 2)
    else:
        core_color = np.array((94.0, 73.0, 39.0), dtype=np.float32)
        bloom_color = np.array((25.0, 17.0, 7.0), dtype=np.float32)
        spill_color = np.array((13.0, 9.0, 4.0), dtype=np.float32)
        sky_strength = 0.78 * np.exp(-((rows - 0.05) / 0.095) ** 2)
        knee_glint = 0.18 * np.exp(-((rows - 0.35) / 0.03) ** 2)

    strength = np.clip(sky_strength + knee_glint, 0.0, 1.0) * inside
    return strength[:, :, None] * (
        core[:, :, None] * core_color
        + bloom[:, :, None] * bloom_color
        + surface_spill[:, :, None] * spill_color
    )


def cinematic_grade(
    pixels: np.ndarray,
    side: str,
    wall_depth: np.ndarray,
) -> np.ndarray:
    """Push the wall into deep navy shadow while retaining the sky-facing top."""
    y = np.linspace(0.0, 1.0, MASTER_HEIGHT, dtype=np.float32)[:, None]
    top_light = np.exp(-((y / 0.48) ** 1.55))

    inner = np.clip((wall_depth - 0.04) / 0.96, 0.0, 1.0)
    inner = inner * inner * (3.0 - 2.0 * inner)
    sky_face = top_light * (0.22 + 0.78 * inner**1.35)

    # Keep the top readable, then fall to an almost-black lower wall. The
    # right panel receives slightly less ambient light in the supplied mockup.
    exposure = 0.30 + 0.24 * top_light + 0.18 * sky_face
    if side == "right":
        exposure *= 0.94

    graded = pixels * exposure[:, :, None]
    graded *= np.array((0.78, 0.84, 0.94), dtype=np.float32)

    lower_shadow = (3.0 + 8.0 * y**1.35)[:, :, None]
    outer_shadow = ((1.0 - inner) ** 2.1 * (5.0 + 4.0 * y))[:, :, None]
    return np.clip(graded - lower_shadow - outer_shadow, 0.0, 255.0)


def regrade_existing_wall(side: str, source: Image.Image) -> Image.Image:
    """Apply the final cinematic lighting pass without rebuilding the texture."""
    source = source.convert("RGBA").resize(
        (MASTER_WIDTH, MASTER_HEIGHT),
        Image.Resampling.LANCZOS,
    )
    source_pixels = np.asarray(source, dtype=np.uint8)

    x = np.linspace(0.0, 1.0, MASTER_WIDTH, dtype=np.float32)[None, :]
    edge = perspective_edge(MASTER_WIDTH, MASTER_HEIGHT, side)
    edge_fraction = edge[:, None] / MASTER_WIDTH
    if side == "left":
        wall_depth = np.clip(x / edge_fraction, 0.0, 1.0)
    else:
        wall_depth = np.clip((1.0 - x) / (1.0 - edge_fraction), 0.0, 1.0)

    pixels = cinematic_grade(source_pixels[:, :, :3].astype(np.float32), side, wall_depth)
    pixels = np.clip(pixels + upper_edge_rim_light(side, edge), 0, 255).astype(np.uint8)

    result = Image.fromarray(pixels, "RGB")
    result.putalpha(Image.fromarray(source_pixels[:, :, 3], "L"))
    return result


def build_wall(
    side: str,
    texture_source: Image.Image,
    lighting_source: Image.Image,
) -> Image.Image:
    rng = np.random.default_rng(20261031 + (0 if side == "left" else 1))
    broad_variation = soft_noise(rng, (36, 46), 3.0) * 4.5

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
    pixels = np.clip(
        lighting
        + sky_reflection(side, wall_depth)
        + upper_edge_rim_light(side, edge)
        + tone[:, :, None],
        0,
        255,
    ).astype(np.uint8)

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
    texture_path: Path | None,
    lighting_path: Path,
    output_dir: Path,
    desktop_only: bool,
    regrade_existing: bool,
) -> None:
    lighting_source = Image.open(lighting_path)
    if regrade_existing:
        master = regrade_existing_wall(side, lighting_source)
    else:
        if texture_path is None:
            raise ValueError("A texture source is required when rebuilding walls")
        texture_source = Image.open(texture_path)
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
    parser.add_argument("--left-texture", type=Path)
    parser.add_argument("--right-texture", type=Path)
    parser.add_argument("--left-lighting", type=Path, required=True)
    parser.add_argument("--right-lighting", type=Path, required=True)
    parser.add_argument("--images-dir", type=Path, default=Path("images"))
    parser.add_argument("--desktop-only", action="store_true")
    parser.add_argument("--regrade-existing", action="store_true")
    args = parser.parse_args()

    images_dir = args.images_dir.resolve()
    left_texture = args.left_texture.resolve() if args.left_texture else None
    right_texture = args.right_texture.resolve() if args.right_texture else None
    build_side(
        "left",
        left_texture,
        args.left_lighting.resolve(),
        images_dir,
        args.desktop_only,
        args.regrade_existing,
    )
    build_side(
        "right",
        right_texture,
        args.right_lighting.resolve(),
        images_dir,
        args.desktop_only,
        args.regrade_existing,
    )


if __name__ == "__main__":
    main()
