"""Extract deliberate art cells from the eight supplied 6x6 sheets.

The originals stay untouched. Compact strips feed the action canvas; small
individual crops feed map scenery and the four lineage karma crests.
"""
from pathlib import Path
import json
from PIL import Image, ImageChops

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "assets_sheets2"
OUT = ROOT / "client/assets/world/vfx/frames"
DETAILS = ROOT / "client/assets/world/sheet-details"
SHEETS = {
    "blood-court": ("21_30_23-1", [0, 3, 6, 11, 12, 18, 24, 27, 32, 33]),
    "wolf-rites": ("21_30_24-2", [0, 3, 5, 7, 12, 14, 18, 20, 26, 35]),
    "blood-architecture": ("21_30_26-3", [0, 2, 5, 10, 14, 17, 20, 26, 28, 32]),
    "moon-architecture": ("21_30_27-4", [0, 1, 3, 5, 14, 17, 20, 25, 28, 33]),
    "blood-atmosphere": ("21_30_28-5", [0, 1, 3, 5, 11, 14, 18, 24, 29, 35]),
    "moon-atmosphere": ("21_30_28-6", [0, 4, 5, 6, 12, 17, 18, 24, 28, 34]),
    "vampire-frame": ("21_43_25-1", [0, 7, 12, 20, 27, 32]),
    "werewolf-frame": ("21_43_26-2", [0, 7, 12, 20, 25, 32]),
}
SCENERY = {
    "blood-gate": ("blood-architecture", 14),
    "blood-eclipse": ("blood-architecture", 0),
    "moon-gate": ("moon-architecture", 1),
    "moon-spring": ("moon-architecture", 17),
    "blood-embers": ("blood-atmosphere", 3),
    "blood-candles": ("blood-atmosphere", 4),
    "moon-snow": ("moon-atmosphere", 4),
    "moon-flora": ("moon-atmosphere", 34),
}
RANK_CELLS = {"white": 0, "red": 7, "black": 20, "gold": 32}


def grid_cell(image, cell):
    edge = image.width // 6
    return image.crop(((cell % 6) * edge, (cell // 6) * edge,
                       (cell % 6 + 1) * edge, (cell // 6 + 1) * edge))


def save(image, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    image.save(path, "WEBP", quality=88, method=5)


def transparent_vfx(frame):
    """Key the supplied black sheet background before canvas compositing.

    Canvas additive blending alone leaves an opaque black alpha plane, which
    masks the character when the effect canvas is composited over the map.
    The soft ramp keeps dim colored edge pixels instead of a jagged cutout.
    """
    red, green, blue = frame.convert("RGB").split()
    light = ImageChops.lighter(red, ImageChops.lighter(green, blue))
    alpha = light.point(lambda value: max(0, min(255, (value - 8) * 5)))
    keyed = frame.copy()
    keyed.putalpha(ImageChops.multiply(frame.getchannel("A"), alpha))
    return keyed


def rank_crest(image, rank):
    """Tint existing lineage art; black sheet background becomes transparent."""
    source = image.convert("RGB")
    out = Image.new("RGBA", source.size)
    original = source.load()
    target = out.load()
    for y in range(source.height):
        for x in range(source.width):
            r, g, b = original[x, y]
            light = max(r, g, b)
            alpha = max(0, min(255, round((light - 8) * 1.65)))
            if rank == "white":
                tone = (min(255, int(light * 1.05)), min(255, int(light * 1.08)), min(255, int(light * 1.16)))
            elif rank == "red":
                tone = (r, g, b) if r >= b else (light, int(light * .28), int(light * .37))
            elif rank == "black":
                tone = (int(light * .48), int(light * .31), int(light * .51))
                alpha = min(255, int(alpha * 1.15))
            else:
                tone = (min(255, int(light * 1.12)), int(light * .82), int(light * .4))
            target[x, y] = (*tone, alpha)
    return out


def main():
    originals = {}
    sources = {}
    for name, (suffix, cells) in SHEETS.items():
        matches = sorted(SOURCE.glob(f"*{suffix}.png"))
        if len(matches) != 1:
            raise FileNotFoundError(f"Expected one sheet ending in {suffix}: {matches}")
        with Image.open(matches[0]) as source:
            if source.size != (1254, 1254):
                raise ValueError(f"{matches[0]} must be a 1254x1254 6x6 sheet")
            originals[name] = source.convert("RGBA")
            sources[name] = str(matches[0].relative_to(ROOT))
    manifest = {}
    for name, (_, cells) in SHEETS.items():
        frames = [transparent_vfx(grid_cell(originals[name], cell)) for cell in cells]
        strip = Image.new("RGBA", (209 * len(frames), 209))
        for index, frame in enumerate(frames):
            strip.alpha_composite(frame, (index * 209, 0))
        path = OUT / f"{name}.webp"
        save(strip, path)
        manifest[name] = {"cells": cells, "source": sources[name], "bytes": path.stat().st_size}
    for name, (sheet, cell) in SCENERY.items():
        path = DETAILS / f"{name}.webp"
        save(grid_cell(originals[sheet], cell), path)
        manifest[name] = {"source": sheet, "cell": cell, "bytes": path.stat().st_size}
    for lineage in ("vampire", "werewolf"):
        for rank, cell in RANK_CELLS.items():
            name = f"{lineage}-{rank}"
            path = DETAILS / f"{name}.webp"
            save(rank_crest(grid_cell(originals[f"{lineage}-frame"], cell), rank), path)
            manifest[name] = {"cell": cell, "bytes": path.stat().st_size}
    (DETAILS / "manifest.json").write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")
    frame_manifest = OUT / "manifest.json"
    combined = json.loads(frame_manifest.read_text(encoding="utf-8")) if frame_manifest.exists() else {}
    combined.update({name: manifest[name] for name in SHEETS})
    frame_manifest.write_text(json.dumps(combined, indent=2) + "\n", encoding="utf-8")
    print(f"Built {len(SHEETS)} atlases and {len(SCENERY) + len(RANK_CELLS) * 2} detail crops ({sum(item['bytes'] for item in manifest.values()):,} bytes)")


if __name__ == "__main__":
    main()
