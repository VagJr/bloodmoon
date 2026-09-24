"""Apply reviewed contact-sheet coordinates, preserve originals, never stretch art."""
from pathlib import Path
from PIL import Image, ImageOps
import json
root=Path(__file__).resolve().parents[1]
plans=json.loads((root/'docs/art/completion-plan.json').read_text(encoding='utf-8'))
report=[]
props=['coin-pouch','treasure-chest','merchant-scales','anvil','ledger','vault-door','trade-seal','forge-fire','gemstones','lantern','guild-bell']
for n,plan in enumerate(plans):
    source=root/'client/assets/sheets'/f'{plan["id"]}.png'
    image=Image.open(source).convert('RGB')
    w,h=image.size
    ys=([0,296,600,898,1254] if n==1 else [0,301,584,898,1254] if n==2 else [0,313,627,940,1254])
    ids=[c['id'] for c in plan['cards']]
    if n==2: ids += ['rivenmirror']
    if n==3: ids=ids[1:]+['silkwidowcloak']
    if n==4: ids=ids[1:]+props
    tiles=[]
    for i,id in enumerate(ids):
        row=i//4 if i<12 or n!=2 else 3
        col=i%4 if i<12 or n!=2 else i-12
        xs=[0,251,502,753,1005,1254] if n==2 and row==3 else [0,313,627,940,1254]
        bounds=(round(xs[col]*w/1254)+1,round(ys[row]*h/1254)+1,round(xs[col+1]*w/1254)-1,round(ys[row+1]*h/1254)-1)
        tile=image.crop(bounds);tiles.append(tile)
        folder=root/'client/assets'/('market' if id in props else 'cards');folder.mkdir(exist_ok=True)
        target=folder/f'{id}.png'
        if target.exists(): raise RuntimeError(f'Refusing to replace existing art: {id}')
        tile.save(target,optimize=True)
        report.append({'id':id,'source':str(source.relative_to(root)),'bounds':bounds,'size':tile.size,'path':'/'+str(target.relative_to(root/'client')).replace('\\','/'),'kind':'prop' if id in props else 'card'})
    grid=Image.new('RGB',(1256,1256),(10,12,16))
    for i,tile in enumerate(tiles[:16]):grid.paste(ImageOps.pad(tile,(314,314),color=(10,12,16)),((i%4)*314,(i//4)*314))
    grid.save(root/'client/assets/sheets'/f'{plan["id"]}-grid.png')
(root/'docs/art/completion-crops.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps({'cards':sum(x['kind']=='card' for x in report),'props':sum(x['kind']=='prop' for x in report),'report':'docs/art/completion-crops.json'}))
