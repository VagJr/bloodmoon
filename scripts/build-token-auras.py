"""Produce token-sized aura layers from supplied artwork; originals are preserved."""
from pathlib import Path
import json
from PIL import Image, ImageChops, ImageOps, ImageDraw, ImageFilter

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'client/assets/world/vfx/frames'
# Each cell is an independent illustration, animated by transforms in the renderer.
SOURCES = [('assets_sheets2', '*21_30_24-2.png', 0),
           ('assets_sheets2', '*21_30_23-1.png', 18),
           ('assets_visuais', '*20_43_55-5.png', 21),
           ('assets_visuais', '*20_43_55-5.png', 14),
           ('assets_sheets2', '*21_30_24-2.png', 0),
           ('assets_visuais', '*20_43_55-5.png', 1)]

def main():
    atlas = Image.new('RGBA', (256 * len(SOURCES), 256))
    records = []
    for index, (folder, pattern, cell) in enumerate(SOURCES):
        path = next((ROOT / folder).glob(pattern))
        source = Image.open(path).convert('RGBA'); edge = source.width // 6
        x, y = cell % 6 * edge, cell // 6 * edge
        box = (0,578,209,797) if index == 1 else (x,y,x+edge,y+edge)
        frame = source.crop(box).resize((256, 256), Image.Resampling.LANCZOS)
        light = ImageChops.lighter(frame.getchannel('R'), ImageChops.lighter(frame.getchannel('G'), frame.getchannel('B')))
        alpha = ImageChops.multiply(frame.getchannel('A'), light.point(lambda v: min(255, max(0, (v-10)*4))))
        # Soften sheet boundaries; never allow the source cell's hard edge to show.
        mask = Image.new('L', (256,256)); d = ImageDraw.Draw(mask)
        d.ellipse((12,12,244,244), fill=255); mask = mask.filter(ImageFilter.GaussianBlur(9))
        edges=Image.new('L',(256,256));edges.putdata([round(255*min(1,x/16,y/16,(255-x)/16,(255-y)/16)) for y in range(256) for x in range(256)])
        mask=ImageChops.multiply(mask,edges)
        frame.putalpha(ImageChops.multiply(alpha, mask))
        if index in (2,4):
            tint = ImageOps.colorize(ImageOps.grayscale(frame), '#031512' if index==2 else '#251309', '#acffe0' if index==2 else '#ffe5a2').convert('RGBA')
            tint.putalpha(frame.getchannel('A')); frame = tint
        atlas.alpha_composite(frame, (index*256,0))
        records.append({'cell':index,'source':str(path.relative_to(ROOT)),'sourceCell':cell})
    OUT.mkdir(parents=True, exist_ok=True)
    atlas.save(OUT/'token-auras.webp', quality=92, method=6)
    manifest_path=OUT/'manifest.json'
    manifest=json.loads(manifest_path.read_text(encoding='utf-8')) if manifest_path.exists() else {}
    manifest['token-auras']={'cells':list(range(len(SOURCES))),'source':'scripts/build-token-auras.py','bytes':(OUT/'token-auras.webp').stat().st_size}
    manifest_path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (OUT/'token-auras.json').write_text(json.dumps(records,indent=2),encoding='utf-8')
    print('Produced six transparent token aura layers.')

if __name__ == '__main__': main()
