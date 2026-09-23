"""Crop the generated 4x4 sheets without resizing or inventing new artwork."""
from pathlib import Path
import json
from PIL import Image

root = Path(__file__).resolve().parents[1]
plans = json.loads((root / 'docs/art/sheets.json').read_text(encoding='utf-8'))
report = []
for sheet in plans:
    source = root / 'client/assets/sheets' / (sheet['id'] + '.png')
    if not source.exists():
        continue
    im = Image.open(source)
    for index, card in enumerate(sheet['cards']):
        x, y = index % 4, index // 4
        bounds = (round(x * im.width / 4), round(y * im.height / 4), round((x+1) * im.width / 4), round((y+1) * im.height / 4))
        target = root / 'client/assets/cards' / (card['id'] + '.png')
        if not target.exists():
            im.crop(bounds).save(target)
        report.append({'id':card['id'], 'sheet':sheet['id'], 'bounds':bounds, 'sourceSize':im.size})
(root / 'docs/art/crops.json').write_text(json.dumps(report, indent=2), encoding='utf-8')
print(json.dumps({'cropped':len(report),'sheets':len(set(r['sheet'] for r in report)),'sizes':list(set(tuple(r['sourceSize']) for r in report))}))
