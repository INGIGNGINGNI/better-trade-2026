#!/usr/bin/env python3
"""Remove a connected black video background while preserving interior blacks."""

from __future__ import annotations

import argparse
import subprocess
import tempfile
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter


def run(command: list[str]) -> None:
    subprocess.run(command, check=True)


def large_dark_components(
    rgb: Image.Image, threshold: int, min_area: int
) -> np.ndarray:
    pixels = np.asarray(rgb)
    dark = np.max(pixels, axis=2) <= threshold
    height, width = dark.shape
    parent: list[int] = []
    runs: list[tuple[int, int, int, int]] = []
    previous: list[tuple[int, int, int]] = []

    def find(label: int) -> int:
        while parent[label] != label:
            parent[label] = parent[parent[label]]
            label = parent[label]
        return label

    def union(first: int, second: int) -> None:
        first_root = find(first)
        second_root = find(second)
        if first_root != second_root:
            parent[second_root] = first_root

    for y in range(height):
        padded = np.pad(dark[y], (1, 1), constant_values=False)
        changes = np.diff(padded.astype(np.int8))
        starts = np.flatnonzero(changes == 1)
        ends = np.flatnonzero(changes == -1) - 1
        current: list[tuple[int, int, int]] = []
        previous_index = 0

        for start, end in zip(starts, ends):
            label = len(parent)
            parent.append(label)
            runs.append((y, int(start), int(end), label))

            while (
                previous_index < len(previous)
                and previous[previous_index][1] < start - 1
            ):
                previous_index += 1

            overlap_index = previous_index
            while (
                overlap_index < len(previous)
                and previous[overlap_index][0] <= end + 1
            ):
                union(label, previous[overlap_index][2])
                overlap_index += 1

            current.append((int(start), int(end), label))

        previous = current

    component_areas: dict[int, int] = {}
    for _, start, end, label in runs:
        root = find(label)
        component_areas[root] = component_areas.get(root, 0) + end - start + 1

    result = np.zeros((height, width), dtype=bool)
    for y, start, end, label in runs:
        if component_areas[find(label)] >= min_area:
            result[y, start : end + 1] = True

    return result


def build_alpha(
    frame: Image.Image,
    threshold: int,
    feather: float,
    remove_enclosed_black: bool = False,
    enclosed_min_area: int = 6000,
    seed_top: bool = True,
    seed_ceiling: int | None = None,
) -> Image.Image:
    rgb = frame.convert("RGB")
    flood = rgb.copy()
    marker = (255, 0, 255)
    width, height = flood.size

    side_limit = int(height * 0.74)
    border_points = (
        ([(x, 0) for x in range(width)] if seed_top else [])
        + [(0, y) for y in range(side_limit)]
        + [(width - 1, y) for y in range(side_limit)]
        + [(0, height - 1), (width - 1, height - 1)]
    )
    flood_pixels = flood.load()
    seed_ceiling = threshold + 2 if seed_ceiling is None else seed_ceiling
    for point in border_points:
        pixel = flood_pixels[point]
        if pixel != marker and max(pixel) <= seed_ceiling:
            ImageDraw.floodfill(flood, point, marker, thresh=threshold)

    flood_pixels = np.asarray(flood)
    background = np.all(flood_pixels == marker, axis=2)
    alpha_pixels = np.where(background, 0, 255).astype(np.float32)

    if remove_enclosed_black:
        enclosed_background = large_dark_components(
            rgb, threshold + 2, enclosed_min_area
        )
        alpha_pixels[enclosed_background] = 0

    alpha = Image.fromarray(alpha_pixels.astype(np.uint8), "L")

    if feather > 0:
        alpha = alpha.filter(ImageFilter.GaussianBlur(feather))

    return alpha


def process_frames(
    source: Path,
    frames_dir: Path,
    threshold: int,
    feather: float,
    fps: float,
    remove_enclosed_until: float | None,
    enclosed_min_area: int,
    top_border_until: float | None,
    opaque_from: float | None,
    opaque_duration: float,
    decontaminate: float,
    seed_ceiling: int | None,
) -> None:
    raw_dir = frames_dir / "raw"
    alpha_dir = frames_dir / "alpha"
    raw_dir.mkdir(parents=True)
    alpha_dir.mkdir(parents=True)

    run([
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
        "-i", str(source), str(raw_dir / "%05d.png"),
    ])

    frame_paths = sorted(raw_dir.glob("*.png"))
    total = len(frame_paths)
    for index, frame_path in enumerate(frame_paths, 1):
        with Image.open(frame_path) as frame:
            rgba = frame.convert("RGBA")
            timestamp = (index - 1) / fps
            alpha = build_alpha(
                frame,
                threshold,
                feather,
                remove_enclosed_black=(
                    remove_enclosed_until is not None
                    and timestamp < remove_enclosed_until
                ),
                enclosed_min_area=enclosed_min_area,
                seed_top=(
                    top_border_until is None or timestamp < top_border_until
                ),
                seed_ceiling=seed_ceiling,
            )

            if opaque_from is not None:
                opacity_mix = np.clip(
                    (timestamp - opaque_from) / max(opaque_duration, 0.001), 0, 1
                )
                opacity_mix = opacity_mix * opacity_mix * (3 - 2 * opacity_mix)
                if opacity_mix > 0:
                    alpha_pixels = np.asarray(alpha, dtype=np.float32)
                    alpha_pixels += (255 - alpha_pixels) * opacity_mix
                    alpha = Image.fromarray(alpha_pixels.astype(np.uint8), "L")

            if decontaminate > 0:
                # The source was rendered over black, so partially transparent edge
                # pixels contain premultiplied black. Recover part of their foreground
                # colour before encoding to avoid a dark fringe on light backgrounds.
                rgba_pixels = np.asarray(rgba, dtype=np.float32).copy()
                alpha_pixels = np.asarray(alpha, dtype=np.float32) / 255.0
                edge = (alpha_pixels > 0.02) & (alpha_pixels < 0.995)
                safe_alpha = np.maximum(alpha_pixels, 0.10)
                recovered = np.clip(
                    rgba_pixels[:, :, :3] / safe_alpha[:, :, None],
                    0,
                    255,
                )
                blend = (
                    (1.0 - alpha_pixels) * decontaminate * edge
                )[:, :, None]
                rgba_pixels[:, :, :3] += (
                    recovered - rgba_pixels[:, :, :3]
                ) * blend
                rgba = Image.fromarray(rgba_pixels.astype(np.uint8), "RGBA")

            rgba.putalpha(alpha)
            rgba.save(alpha_dir / frame_path.name, optimize=False)

        if index == 1 or index % 24 == 0 or index == total:
            print(f"Processed {index}/{total} frames", flush=True)


def encode(source: Path, frames_dir: Path, output: Path, fps: str) -> None:
    alpha_pattern = str(frames_dir / "alpha" / "%05d.png")
    command = [
        "ffmpeg", "-hide_banner", "-loglevel", "error", "-y",
        "-framerate", fps, "-i", alpha_pattern,
        "-i", str(source),
        "-map", "0:v:0", "-map", "1:a?",
    ]

    if output.suffix.lower() == ".mov":
        command += [
            "-c:v", "prores_ks", "-profile:v", "4",
            "-pix_fmt", "yuva444p10le", "-alpha_bits", "16",
            "-vendor", "apl0", "-an", str(output),
        ]
    else:
        command += [
            "-c:v", "libvpx-vp9", "-pix_fmt", "yuva420p",
            "-crf", "24", "-b:v", "0", "-row-mt", "1",
            "-auto-alt-ref", "0", "-an", str(output),
        ]

    run(command)


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("source", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--fps", default="24")
    parser.add_argument("--threshold", type=int, default=4)
    parser.add_argument("--feather", type=float, default=0.45)
    parser.add_argument("--remove-enclosed-until", type=float)
    parser.add_argument("--enclosed-min-area", type=int, default=6000)
    parser.add_argument("--top-border-until", type=float)
    parser.add_argument("--opaque-from", type=float)
    parser.add_argument("--opaque-duration", type=float, default=0.5)
    parser.add_argument("--decontaminate", type=float, default=0.8)
    parser.add_argument("--seed-ceiling", type=int)
    args = parser.parse_args()

    args.output.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(prefix="connected-black-") as temp_dir:
        frames_dir = Path(temp_dir)
        process_frames(
            args.source,
            frames_dir,
            args.threshold,
            args.feather,
            float(args.fps),
            args.remove_enclosed_until,
            args.enclosed_min_area,
            args.top_border_until,
            args.opaque_from,
            args.opaque_duration,
            args.decontaminate,
            args.seed_ceiling,
        )
        encode(args.source, frames_dir, args.output, args.fps)

    print(f"Created {args.output}")


if __name__ == "__main__":
    main()
