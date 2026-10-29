#!/usr/bin/env python3
"""Export the newly added Agenda portraits with the existing 4x frame/glow recipe."""

from __future__ import annotations

import json
from pathlib import Path
from zipfile import ZIP_DEFLATED, ZipFile

from lxml import html

from export_agenda_all_tabs import STAGES, contact_sheet, tab_speakers
from export_agenda_speakers import HEIGHT, ROOT, SCALE, WIDTH, export_one


OUTPUT = ROOT / "exports" / "agenda-speakers" / "new-speakers"
ARCHIVE = OUTPUT.parent / "agenda-speakers-new.zip"
NEW_SOURCES = {
    "images/agenda/day-1/D1-โช๊ค-โชกุล.webp",
    "images/agenda/day-1/D1-ศุภกร-สุนทรกิจ.webp",
    "images/agenda/day-1/D1-ชยกร-เหรียญทองคำ.webp",
    "images/agenda/day-1/D1-ธีรศักดิ์-ธนวรากุล.webp",
    "images/agenda/day-1/D1-ภัครัฐพีร์-ตั้งสำเริงวงศ์.webp",
    "images/agenda/day-1/D1-โค้ชฟิล์ม.webp",
    "images/agenda/day-2/D2-นฤมล-บุญสนอง.webp",
    "images/agenda/day-2/D2-อธิป-อัศวานันท์.webp",
    "images/agenda/day-2/D2-เผดิมภพ-สงเคราะห์.webp",
    "images/agenda/mc/MC-Jessie.webp",
}


def main() -> None:
    document = html.parse(str(ROOT / "index.html"))
    OUTPUT.mkdir(parents=True, exist_ok=True)
    exported = []

    for day in (1, 2):
        for source_stage, output_stage in STAGES:
            panel_id = f"agenda-day-{'one' if day == 1 else 'two'}-{source_stage}"
            for speaker in tab_speakers(document, panel_id, day, output_stage):
                if speaker["source"] not in NEW_SOURCES:
                    continue
                destination = OUTPUT / f"day-{day}" / output_stage
                destination.mkdir(parents=True, exist_ok=True)
                item = export_one(speaker, destination)
                item["folder"] = str(destination.relative_to(OUTPUT))
                exported.append(item)

    found = {item["source"] for item in exported}
    if found != NEW_SOURCES:
        raise RuntimeError(f"Agenda speaker sources changed: missing {NEW_SOURCES - found}")

    preview = OUTPUT / "_previews"
    preview.mkdir(exist_ok=True)
    contact_sheet(
        [OUTPUT / item["folder"] / item["output"] for item in exported],
        preview / "new-speakers.png",
    )
    (OUTPUT / "manifest.json").write_text(
        json.dumps(
            {
                "source": "landing-page/index.html and css/style.css",
                "description": "New Agenda speakers, exported with the previous frame, portrait crop and static glow recipe.",
                "design_size_css_px": [WIDTH, HEIGHT],
                "export_scale": SCALE,
                "size_px": [WIDTH * SCALE, HEIGHT * SCALE],
                "note": "The glow is a static, locally composed approximation of the site's animation.",
                "speakers": exported,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )
    with ZipFile(ARCHIVE, "w", ZIP_DEFLATED) as bundle:
        for path in sorted(OUTPUT.rglob("*")):
            if path.is_file():
                bundle.write(path, path.relative_to(OUTPUT))
    print(f"Exported {len(exported)} new speakers to {OUTPUT}")
    print(f"ZIP: {ARCHIVE}")


if __name__ == "__main__":
    main()
