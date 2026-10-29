#!/usr/bin/env python3
"""Export the five Agenda portraits added since the previous speaker batch."""

from __future__ import annotations

import json
from zipfile import ZIP_DEFLATED, ZipFile

from lxml import html

from export_agenda_all_tabs import STAGES, contact_sheet, tab_speakers
from export_agenda_speakers import HEIGHT, ROOT, SCALE, WIDTH, export_one


OUTPUT = ROOT / "exports" / "agenda-speakers" / "new-2026-10-29"
ARCHIVE = OUTPUT.parent / "agenda-speakers-new-2026-10-29.zip"
SOURCES = {
    "images/agenda/day-1/D1-ชยกร-เหรียญทองคำ.webp",
    "images/agenda/day-1/D1-ธีรศักดิ์-ธนวรากุล.webp",
    "images/agenda/day-1/D1-ภัครัฐพีร์-ตั้งสำเริงวงศ์.webp",
    "images/agenda/day-2/D2-อธิป-อัศวานันท์.webp",
    "images/agenda/mc/MC-Jessie.webp",
}


def main() -> None:
    document = html.parse(str(ROOT / "index.html"))
    OUTPUT.mkdir(parents=True, exist_ok=True)
    speakers_by_source = {}

    for day in (1, 2):
        for source_stage, output_stage in STAGES:
            panel_id = f"agenda-day-{'one' if day == 1 else 'two'}-{source_stage}"
            for speaker in tab_speakers(document, panel_id, day, output_stage):
                source = speaker["source"]
                if source not in SOURCES:
                    continue
                if source not in speakers_by_source:
                    destination = OUTPUT / f"day-{day}" / output_stage
                    destination.mkdir(parents=True, exist_ok=True)
                    item = export_one(speaker, destination)
                    item["folder"] = str(destination.relative_to(OUTPUT))
                    item["appears_in"] = []
                    speakers_by_source[source] = item
                appearance = f"day-{day}/{output_stage}"
                if appearance not in speakers_by_source[source]["appears_in"]:
                    speakers_by_source[source]["appears_in"].append(appearance)

    if set(speakers_by_source) != SOURCES:
        raise RuntimeError(f"Missing Agenda images: {SOURCES - set(speakers_by_source)}")

    exported = list(speakers_by_source.values())
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
                "description": "Five new, unique Agenda speaker images with the previous frame, crop and static glow recipe.",
                "design_size_css_px": [WIDTH, HEIGHT],
                "export_scale": SCALE,
                "size_px": [WIDTH * SCALE, HEIGHT * SCALE],
                "note": "Glow is a static, locally composed approximation of the website animation.",
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
    print(f"Exported {len(exported)} unique portraits to {OUTPUT}")
    print(f"ZIP: {ARCHIVE}")


if __name__ == "__main__":
    main()
