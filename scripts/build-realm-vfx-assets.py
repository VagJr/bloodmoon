from pathlib import Path
import json
import re
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
VFX_JS = ROOT / "client/realm-vfx.js"
OUT = ROOT / "client/assets/world/vfx/frames"
ICON_OUT = ROOT / "client/assets/world/ability-icons"
SHEETS = {
    "vampire-omens": ROOT / "assets_visuais/Imagem do ChatGPT 24 de set. de 2026, 20_43_51-1.png",
    "moon-rites": ROOT / "assets_visuais/Imagem do ChatGPT 24 de set. de 2026, 20_43_52-2.png",
    "realm-slashes": ROOT / "assets_visuais/Imagem do ChatGPT 24 de set. de 2026, 20_43_53-3.png",
    "card-rites": ROOT / "assets_visuais/Imagem do ChatGPT 24 de set. de 2026, 20_43_55-4.png",
    "storm-magic": ROOT / "assets_visuais/Imagem do ChatGPT 24 de set. de 2026, 20_43_55-5.png",
    "gothic-rites": ROOT / "assets_visuais/Imagem do ChatGPT 24 de set. de 2026, 20_43_56-6.png",
}
LEGACY = ROOT / "client/assets/world/vfx"
ICONS = {
    "strike": 9, "cleave": 11, "bolt": 13, "dash": 6, "guard": 4,
    "mend": 2, "frost": 3, "drain": 0, "tempest": 27, "moonfire": 28,
    "howl": 14, "renewal": 1, "blood": 15, "pact": 18, "pounce": 6,
    "rend": 10, "execution": 12,
}

def crop_grid(source, cell):
    source = source.convert("RGBA")
    if source.width % 6 or source.height % 6 or source.width // 6 != source.height // 6:
        raise ValueError(f"Expected a square 6x6 sheet: {source.size}")
    edge = source.width // 6
    x, y = (cell % 6) * edge, (cell // 6) * edge
    return source.crop((x, y, x + edge, y + edge))

def save_webp(image, destination):
    destination.parent.mkdir(parents=True, exist_ok=True)
    image.save(destination, "WEBP", quality=92, method=4)

def main():
    source_text = VFX_JS.read_text(encoding="utf-8")
    match = re.search(r"const SOURCE_CELLS=(\{.*?\});", source_text, re.S)
    if not match:
        raise ValueError("Could not read the VFX cell map")
    cells_by_sheet = {name: [int(n) for n in values.split(",") if n.strip()]
                      for name, values in re.findall(r"'([^']+)'\s*:\s*\[([0-9,\s]+)\]", match.group(1))}
    if not cells_by_sheet:
        raise ValueError("The VFX cell map is empty")
    manifest = {}
    for name, cells in cells_by_sheet.items():
        source_path = SHEETS.get(name, LEGACY / f"{name}.webp")
        if not source_path.is_file():
            raise FileNotFoundError(source_path)
        with Image.open(source_path) as source:
            frames = [crop_grid(source, cell) for cell in cells]
        strip = Image.new("RGBA", (frames[0].width * len(frames), frames[0].height))
        for i, frame in enumerate(frames):
            strip.alpha_composite(frame, (i * frame.width, 0))
        destination = OUT / f"{name}.webp"
        save_webp(strip, destination)
        manifest[name] = {"cells": cells, "source": str(source_path.relative_to(ROOT)), "bytes": destination.stat().st_size}
    manifest["ability-icons"] = {}
    with Image.open(SHEETS["vampire-omens"]) as source:
        for name, cell in ICONS.items():
            destination = ICON_OUT / f"{name}.webp"
            save_webp(crop_grid(source, cell), destination)
            manifest["ability-icons"][name] = {"cell": cell, "bytes": destination.stat().st_size}
    (OUT / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(f"Prepared {len(cells_by_sheet)} compact effect atlases and {len(ICONS)} ability icons; {sum(v['bytes'] for v in manifest.values() if isinstance(v, dict) and 'bytes' in v):,} bytes of effect atlases")

if __name__ == "__main__":
    main()
