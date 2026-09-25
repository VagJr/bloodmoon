const VFX={
 strike:{sheet:'blood-slash',cell:3,motion:'slash',glow:'#ff3854',size:145,duration:480,layers:[['realm-slashes',2],['vampire-omens',9]]},
 cleave:{sheet:'blood-slash',cell:7,motion:'sweep',glow:'#ff5369',size:188,duration:590,layers:[['realm-slashes',10],['moon-rites',7]]},
 dash:{sheet:'moon-silver',cell:1,motion:'dash',glow:'#b9eaff',size:142,duration:480,layers:[['realm-slashes',5],['moon-rites',13]]},
 guard:{sheet:'blood-ward',cell:3,motion:'ward',glow:'#e8d3a0',size:162,duration:700,layers:[['gothic-rites',7],['moon-rites',18]]},
 mend:{sheet:'violet-arcana',cell:4,motion:'heal',glow:'#b7ecbb',size:164,duration:760,layers:[['card-rites',9],['vampire-omens',2]]},
 frost:{sheet:'moon-frost',cell:1,motion:'burst',glow:'#a8e7ff',size:196,duration:790,layers:[['storm-magic',4],['moon-rites',21]]},
 drain:{sheet:'crimson-sigils',cell:4,motion:'drain',glow:'#ff234f',size:154,duration:740,layers:[['vampire-omens',16],['gothic-rites',12]]},
 bolt:{sheet:'blood-orbits',cell:0,motion:'projectile',glow:'#ff4764',size:114,duration:560,layers:[['storm-magic',16],['realm-slashes',23]]},
 tempest:{sheet:'ember',cell:2,motion:'burst',glow:'#ff9c55',size:226,duration:900,layers:[['storm-magic',14],['gothic-rites',24]]},
 moonfire:{sheet:'ember',cell:4,motion:'projectile',glow:'#ff9c55',size:146,duration:620,layers:[['storm-magic',10],['moon-rites',30]]},
 howl:{sheet:'moon-silver',cell:0,motion:'sweep',glow:'#c2ecff',size:180,duration:650,layers:[['moon-rites',2],['realm-slashes',15]]},
 renewal:{sheet:'violet-arcana',cell:6,motion:'heal',glow:'#b7ecbb',size:168,duration:780,layers:[['card-rites',17],['moon-rites',26]]},
 blood:{sheet:'blood-orbits',cell:4,motion:'burst',glow:'#ff2850',size:172,duration:700,layers:[['vampire-omens',15],['gothic-rites',2]]},
 pact:{sheet:'crimson-sigils',cell:0,motion:'ward',glow:'#ff4662',size:172,duration:730,layers:[['gothic-rites',18],['card-rites',13]]},
 pounce:{sheet:'moon-silver',cell:2,motion:'dash',glow:'#d4efff',size:158,duration:530,layers:[['realm-slashes',8],['moon-rites',10]]},
 rend:{sheet:'blood-impact',cell:0,motion:'slash',glow:'#ff2849',size:178,duration:570,layers:[['realm-slashes',12],['vampire-omens',10]]},
 execution:{sheet:'blood-impact',cell:5,motion:'impact',glow:'#ff7759',size:224,duration:840,layers:[['gothic-rites',20],['card-rites',22]]}
};
const IMPACTS={
 critical:{sheet:'blood-impact',cell:3,motion:'impact',glow:'#ffe0ad',size:202,duration:850,layers:[['gothic-rites',21],['realm-slashes',17]]},
 'enemy-hit':{sheet:'blood-impact',cell:1,motion:'impact',glow:'#ff596b',size:166,duration:650,layers:[['moon-rites',27],['realm-slashes',20]]},
 hit:{sheet:'blood-impact',cell:2,motion:'impact',glow:'#ff536a',size:140,duration:570,layers:[['realm-slashes',14],['vampire-omens',12]]},
 miss:{sheet:'moon-silver',cell:5,motion:'dash',glow:'#b9eaff',size:130,duration:480,layers:[['moon-rites',11]]},
 evade:{sheet:'moon-silver',cell:1,motion:'dash',glow:'#c9f3ff',size:148,duration:520,layers:[['realm-slashes',29],['moon-rites',5]]},
 heal:{sheet:'violet-arcana',cell:4,motion:'heal',glow:'#b8edbd',size:170,duration:760,layers:[['card-rites',9],['vampire-omens',2]]},
 guard:{sheet:'blood-ward',cell:3,motion:'ward',glow:'#e8d3a0',size:162,duration:700,layers:[['gothic-rites',7]]}
};
const SOURCE_CELLS={
 'blood-slash':[0,1,2,3,4,5,6,7], 'moon-silver':[0,1,2,3,4,5,6,7,13,19,25,31],
 'blood-ward':[3,9,15,21,27,33], 'violet-arcana':[4,6,10,12,16,18,22,24,28,30,34],
 'moon-frost':[1,7,13,19,25,31], 'crimson-sigils':[0,4], 'blood-orbits':[0,4],
 'ember':[2,4], 'blood-impact':[0,1,2,3,5], 'vampire-omens':[0,2,9,10,12,15,16],
 'moon-rites':[2,5,7,10,11,13,18,21,26,27,30], 'realm-slashes':[2,5,8,10,12,14,15,17,20,23,29],
 'card-rites':[9,13,17,22], 'storm-magic':[4,10,14,16], 'gothic-rites':[2,7,12,18,20,21,24]
};
const SHEET_IMAGES=new Map(),SHEET_INDEX=new Map(Object.entries(SOURCE_CELLS).map(([name,cells])=>[name,new Map(cells.map((cell,index)=>[cell,index]))]));
const ABILITY_ICONS={strike:9,cleave:11,bolt:13,dash:6,guard:4,mend:2,frost:3,drain:0,tempest:27,moonfire:28,howl:14,renewal:1,blood:15,pact:18,pounce:6,rend:10,execution:12};
const ABILITY_NAMES={strike:'Corte',cleave:'Arco de aço',bolt:'Lança do Véu',dash:'Passo espectral',guard:'Guarda de ferro',mend:'Sangue renovado',frost:'Círculo lunar',drain:'Pacto carmesim',tempest:'Eclipse',moonfire:'Chama lunar',howl:'Uivo da matilha',renewal:'Renovação',blood:'Sangria',pact:'Juramento',pounce:'Bote lupino',rend:'Rasgo',execution:'Execução'};
const COLOR={vampire:'#ff3154',werewolf:'#b9eaff'};
function keyFor(event){if(IMPACTS[event.kind])return event.kind;if(VFX[event.ability])return event.ability;if(event.kind==='ritual')return 'pact';if(event.kind==='heal')return 'heal';return event.sourceFaction==='werewolf'?'howl':'strike';}
function themeFor(event,config){if(event.sourceFaction==='werewolf'&&['strike','cleave','rend','pounce','howl'].includes(event.ability))return COLOR.werewolf;return config.glow||COLOR.vampire;}
function loadSheet(name){if(SHEET_IMAGES.has(name))return SHEET_IMAGES.get(name).ready;const image=new Image();image.decoding='async';image.ready=new Promise(resolve=>{image.onload=()=>resolve(image);image.onerror=()=>resolve(null);});SHEET_IMAGES.set(name,image);image.src=`/assets/world/vfx/frames/${name}.webp`;return image.ready;}
function layersFor(config){return [[config.sheet,config.cell],...(config.layers||[])];}
export function primeVfx(event){const config=VFX[event.ability]||IMPACTS[event.kind]||VFX[keyFor(event)];for(const [sheet] of layersFor(config))loadSheet(sheet);const impact=IMPACTS[event.kind];if(impact&&config!==impact)for(const [sheet] of layersFor(impact))loadSheet(sheet);}
export function warmVfx(rpg){const ids=new Set(['strike','cleave','dash',...(rpg?.abilities||[]).filter(a=>a.unlocked).map(a=>a.id)]),sheets=new Set();for(const id of ids){const config=VFX[id];if(config)for(const [sheet] of layersFor(config))sheets.add(sheet);}for(const config of Object.values(IMPACTS))for(const [sheet] of layersFor(config))sheets.add(sheet);return Promise.all([...sheets].map(loadSheet));}
export function abilityIcon(id){return `/assets/world/ability-icons/${id}.webp`;}
function drawCell(ctx,sheet,cell,x,y,size,rotation,alpha,glow){const image=SHEET_IMAGES.get(sheet),index=SHEET_INDEX.get(sheet)?.get(cell);if(!image?.complete||!image.naturalWidth||index===undefined)return false;const frame=image.naturalHeight||209;ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.globalCompositeOperation='lighter';ctx.globalAlpha=alpha;ctx.shadowColor=glow;ctx.shadowBlur=Math.max(8,size*.13);ctx.drawImage(image,index*frame,0,frame,frame,-size/2,-size/2,size,size);ctx.restore();return true;}
export function drawVfx(ctx,event,now,to,from,zoom=1){const id=keyFor(event),abilityConfig=VFX[event.ability],impactConfig=IMPACTS[event.kind],config=abilityConfig||impactConfig||VFX[id];if(!config)return false;const elapsed=now-event.started,duration=config.duration||650,t=Math.max(0,Math.min(1,elapsed/duration)),ease=1-Math.pow(1-t,2),color=themeFor(event,config);let x=to.x,y=to.y-22*zoom,rotation=Math.atan2(to.y-from.y,to.x-from.x),travel=0;
 if(config.motion==='projectile'){travel=Math.min(1,t*2.55);x=from.x+(to.x-from.x)*travel;y=from.y+(to.y-from.y)*travel-20*zoom;}
 else if(config.motion==='dash'){travel=Math.min(1,t*2);x=from.x+(to.x-from.x)*travel;y=from.y+(to.y-from.y)*travel-15*zoom;}
 if(config.motion==='ward'||config.motion==='heal')rotation=t*.7;
 const size=(config.size||150)*zoom*(config.motion==='impact'?(.48+ease*.75):config.motion==='projectile'?.58+ease*.25:.63+ease*.45),fade=Math.sin(Math.PI*Math.min(.99,t*1.2))*(1-t*.18),layers=layersFor(config);if(impactConfig&&abilityConfig){layers.push([impactConfig.sheet,impactConfig.cell],...(impactConfig.layers||[]).slice(0,1));}
 let drawn=false;for(let i=0;i<layers.length;i++){const [sheet,cell]=layers[i],spread=i===0?0:((i%2?1:-1)*size*.07),scale=i===0?1:i===1?.7:.47,angle=rotation+(i===0?0:(i%2?-.22:.24));drawn=drawCell(ctx,sheet,cell,x+Math.cos(rotation+Math.PI/2)*spread,y+Math.sin(rotation+Math.PI/2)*spread,size*scale,angle,fade*(i===0?.92:i===1?.7:.5),color)||drawn;}if(!drawn)return false;
 if(t<.82&&['impact','burst','slash','sweep'].includes(config.motion)){const ring=12+ease*size*.39;ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=(1-t)*.62;ctx.strokeStyle=color;ctx.shadowColor=color;ctx.shadowBlur=14*zoom;ctx.lineWidth=(event.kind==='critical'?3.1:2)*zoom*(1-t*.5);ctx.beginPath();if(config.motion==='slash'||config.motion==='sweep'){ctx.ellipse(to.x,to.y-18*zoom,ring,ring*.42,rotation,-1.12+t*.45,1.15+t*.45);}else ctx.ellipse(to.x,to.y-18*zoom,ring,ring*.62,0,0,Math.PI*2);ctx.stroke();ctx.restore();}
 return true;
}
export function getAbilityArt(id){return {icon:abilityIcon(id),name:ABILITY_NAMES[id]||id};}
