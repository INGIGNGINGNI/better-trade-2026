#!/usr/bin/env python3
"""Export every Agenda tab into a day/stage folder, including the empty portrait."""

from __future__ import annotations

import json
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

from lxml import html
from PIL import Image

from export_agenda_speakers import ROOT, SCALE, WIDTH, HEIGHT, export_one


OUTPUT_ROOT = ROOT / "exports" / "agenda-speakers" / "all-tabs"
PREVIEW_ROOT = OUTPUT_ROOT / "_previews"
ARCHIVE = OUTPUT_ROOT.parent / "agenda-speakers-all-tabs.zip"
STAGES = (
    ("main-stage", "conference"),
    ("mini-stage", "experience"),
    ("workshop", "workshop"),
    ("private-class", "master-class"),
)


def tab_speakers(document, panel_id: str, day: int, stage: str) -> list[dict]:
    panel = document.getroot().get_element_by_id(panel_id)
    speakers = []
    seen = set()
    for table_number, tbody in enumerate(panel.xpath(".//tbody"), 1):
        for row_number, row in enumerate(tbody.xpath("./tr"), 1):
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
                if source in seen:
                    continue
                seen.add(source)
                speakers.append(
                    {
                        "day": day,
                        "stage": stage,
                        "table": table_number,
                        "row": row_number,
                        "frame": frame_number,
                        "source": source,
                        "name": image.get("alt") or ("ภาพเงาดำ (empty)" if source.endswith("profile-empty.webp") else ""),
                        "is_placeholder": source.endswith("profile-empty.webp"),
                    }
                )
    return speakers


def contact_sheet(files: list[Path], destination: Path) -> None:
    columns = min(5, len(files))
    rows = (len(files) + columns - 1) // columns
    thumb_width, thumb_height, gap, margin = 160, 200, 16, 20
    sheet = Image.new(
        "RGB",
        (
            2 * margin + columns * thumb_width + (columns - 1) * gap,
            2 * margin + rows * thumb_height + (rows - 1) * gap,
        ),
        "#eaeaea",
    )
    for index, path in enumerate(files):
        image = Image.open(path).convert("RGBA")
        image = image.resize((thumb_width, thumb_height), Image.Resampling.LANCZOS)
        background = Image.new("RGBA", image.size, "white")
        background.alpha_composite(image)
        x = margin + (index % columns) * (thumb_width + gap)
        y = margin + (index // columns) * (thumb_height + gap)
        sheet.paste(background.convert("RGB"), (x, y))
    sheet.save(destination, optimize=True)


def main() -> None:
    document = html.parse(str(ROOT / "index.html"))
    OUTPUT_ROOT.mkdir(parents=True, exist_ok=True)
    PREVIEW_ROOT.mkdir(parents=True, exist_ok=True)
    summary = []
    all_sources = set()

    for day in (1, 2):
        for source_stage, output_stage in STAGES:
            panel_id = f"agenda-day-{'one' if day == 1 else 'two'}-{source_stage}"
            output_dir = OUTPUT_ROOT / f"day-{day}" / output_stage
            output_dir.mkdir(parents=True, exist_ok=True)
            speakers = tab_speakers(document, panel_id, day, output_stage)
            exported = [export_one(speaker, output_dir) for speaker in speakers]
            all_sources.update(speaker["source"] for speaker in speakers)

            if exported:
                contact_sheet(
                    [output_dir / item["output"] for item in exported],
                    PREVIEW_ROOT / f"day-{day}-{output_stage}.png",
                )
            else:
                (output_dir / "README.txt").write_text(
                    "This Agenda tab currently has no speaker images.\n",
                    encoding="utf-8",
                )
            summary.append(
                {
                    "panel_id": panel_id,
                    "day": day,
                    "tab": output_stage,
                    "folder": str(output_dir.relative_to(OUTPUT_ROOT)),
                    "count": len(exported),
                    "placeholder_count": sum(item["is_placeholder"] for item in exported),
                    "speakers": exported,
                }
            )

    root_manifest = {
        "source": "landing-page/index.html and css/style.css",
        "description": "Static PNG assets with the Agenda frame, crop, and locally composed glow.",
        "design_size_css_px": [WIDTH, HEIGHT],
        "export_scale": SCALE,
        "size_px": [WIDTH * SCALE, HEIGHT * SCALE],
        "tab_count": len(summary),
        "exported_png_count": sum(item["count"] for item in summary),
        "unique_source_image_count": len(all_sources),
        "unique_speaker_image_count": len(
            [source for source in all_sources if not source.endswith("profile-empty.webp")]
        ),
        "note": "A speaker may occur in more than one tab. Blank tabs contain a README but no PNG. Glow is a static, locally composed approximation of the CSS animation.",
        "tabs": summary,
    }
    (OUTPUT_ROOT / "manifest.json").write_text(
        json.dumps(root_manifest, ensure_ascii=False, indent=2), encoding="utf-8"
    )

    with ZipFile(ARCHIVE, "w", ZIP_DEFLATED) as archive:
        for file in sorted(OUTPUT_ROOT.rglob("*")):
            if file.is_file():
                archive.write(file, file.relative_to(OUTPUT_ROOT))

    print(
        f"Exported {root_manifest['exported_png_count']} PNGs across "
        f"{root_manifest['tab_count']} tabs "
        f"({root_manifest['unique_source_image_count']} unique source images, "
        f"including the empty portrait)."
    )
    for tab in summary:
        print(f"{tab['folder']}: {tab['count']} images")
    print(f"ZIP: {ARCHIVE}")


if __name__ == "__main__":
    main()
