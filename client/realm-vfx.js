import {CLASS_SKILLS,classIcon} from '/shared/realm-skill-trees.js';
const VFX={
 strike:{sheet:'blood-slash',cell:3,motion:'slash',glow:'#ff3854',size:145,duration:480,layers:[['blood-court',3],['realm-slashes',2]]},
 cleave:{sheet:'blood-slash',cell:7,motion:'sweep',glow:'#ff5369',size:188,duration:590,layers:[['realm-slashes',10],['moon-rites',7]]},
 dash:{sheet:'moon-silver',cell:1,motion:'dash',glow:'#b9eaff',size:142,duration:480,layers:[['realm-slashes',5],['moon-rites',13]]},
 guard:{sheet:'blood-ward',cell:3,motion:'ward',glow:'#e8d3a0',size:162,duration:700,layers:[['blood-court',11],['gothic-rites',7]]},
 mend:{sheet:'violet-arcana',cell:4,motion:'heal',glow:'#b7ecbb',size:164,duration:760,layers:[['card-rites',9],['vampire-omens',2]]},
 frost:{sheet:'moon-frost',cell:1,motion:'burst',glow:'#a8e7ff',size:196,duration:790,layers:[['wolf-rites',12],['moon-rites',21]]},
 drain:{sheet:'crimson-sigils',cell:4,motion:'drain',glow:'#ff234f',size:154,duration:740,layers:[['blood-court',18],['vampire-omens',16]]},
 bolt:{sheet:'blood-orbits',cell:0,motion:'projectile',glow:'#ff4764',size:114,duration:560,layers:[['storm-magic',16],['realm-slashes',23]]},
 tempest:{sheet:'ember',cell:2,motion:'burst',glow:'#ff9c55',size:226,duration:900,layers:[['storm-magic',14],['gothic-rites',24]]},
 moonfire:{sheet:'ember',cell:4,motion:'projectile',glow:'#ff9c55',size:146,duration:620,layers:[['storm-magic',10],['moon-rites',30]]},
 howl:{sheet:'moon-silver',cell:0,motion:'sweep',glow:'#c2ecff',size:180,duration:650,layers:[['wolf-rites',18],['moon-rites',2]]},
 renewal:{sheet:'violet-arcana',cell:6,motion:'heal',glow:'#b7ecbb',size:168,duration:780,layers:[['card-rites',17],['moon-rites',26]]},
 blood:{sheet:'blood-orbits',cell:4,motion:'burst',glow:'#ff2850',size:172,duration:700,layers:[['blood-court',24],['vampire-omens',15]]},
 pact:{sheet:'crimson-sigils',cell:0,motion:'ward',glow:'#ff4662',size:172,duration:730,layers:[['gothic-rites',18],['card-rites',13]]},
 pounce:{sheet:'moon-silver',cell:2,motion:'dash',glow:'#d4efff',size:158,duration:530,layers:[['wolf-rites',20],['realm-slashes',8]]},
 rend:{sheet:'blood-impact',cell:0,motion:'slash',glow:'#ff2849',size:178,duration:570,layers:[['realm-slashes',12],['vampire-omens',10]]},
 execution:{sheet:'blood-impact',cell:5,motion:'impact',glow:'#ff7759',size:224,duration:840,layers:[['blood-court',32],['gothic-rites',20]]},
 parry:{sheet:'moon-silver',cell:0,motion:'ward',glow:'#ffe6ad',size:136,duration:540,layers:[['realm-slashes',17]]},
 reflect:{sheet:'moon-frost',cell:1,motion:'ward',glow:'#97e8ff',size:164,duration:620,layers:[['moon-rites',18]]}
};
const IMPACTS={
 critical:{sheet:'blood-impact',cell:3,motion:'impact',glow:'#ffe0ad',size:202,duration:850,layers:[['blood-atmosphere',29],['realm-slashes',17]]},
 'enemy-hit':{sheet:'blood-impact',cell:1,motion:'impact',glow:'#ff596b',size:166,duration:650,layers:[['moon-rites',27],['realm-slashes',20]]},
 hit:{sheet:'blood-impact',cell:2,motion:'impact',glow:'#ff536a',size:140,duration:570,layers:[['realm-slashes',14],['vampire-omens',12]]},
 miss:{sheet:'moon-silver',cell:5,motion:'dash',glow:'#b9eaff',size:130,duration:480,layers:[['moon-rites',11]]},
 evade:{sheet:'moon-silver',cell:1,motion:'dash',glow:'#c9f3ff',size:148,duration:520,layers:[['realm-slashes',29],['moon-rites',5]]},
 heal:{sheet:'violet-arcana',cell:4,motion:'heal',glow:'#b8edbd',size:170,duration:760,layers:[['card-rites',9],['vampire-omens',2]]},
 guard:{sheet:'blood-ward',cell:21,motion:'ward',glow:'#e8d3a0',size:162,duration:560,layers:[['gothic-rites',7]]},
 block:{sheet:'moon-silver',cell:0,motion:'deflect',glow:'#ffe0a0',size:153,duration:520,layers:[['blood-court',11],['blood-atmosphere',29]]},
 parry:{sheet:'moon-silver',cell:2,motion:'deflect',glow:'#fff0c7',size:205,duration:700,layers:[['wolf-rites',26],['blood-court',27]]},
 reflect:{sheet:'moon-frost',cell:1,motion:'deflect',glow:'#9deaff',size:212,duration:740,layers:[['moon-rites',21],['wolf-rites',35]]},
 'enemy-guard':{sheet:'blood-ward',cell:21,motion:'deflect',glow:'#f7cd91',size:156,duration:520,layers:[['blood-atmosphere',29],['realm-slashes',17]]},
 'guard-break':{sheet:'blood-ward',cell:27,motion:'shatter',glow:'#ffa66c',size:176,duration:760,layers:[['blood-court',27],['gothic-rites',21]]},
 kill:{sheet:'blood-impact',cell:5,motion:'impact',glow:'#ff536b',size:188,duration:760,layers:[['blood-atmosphere',18],['blood-court',32]]},
 'pk-kill':{sheet:'blood-impact',cell:5,motion:'impact',glow:'#f2bf74',size:216,duration:900,layers:[['blood-court',33],['wolf-rites',35]]},
 interrupt:{sheet:'moon-silver',cell:2,motion:'shatter',glow:'#e0d0ff',size:120,duration:500,layers:[['moon-rites',11]]},
 collision:{sheet:'blood-impact',cell:1,motion:'deflect',glow:'#e8c9a0',size:168,duration:550,layers:[['blood-atmosphere',29],['moon-atmosphere',18]]},
 expire:{sheet:'moon-silver',cell:5,motion:'dissolve',glow:'#b9eaff',size:78,duration:320,layers:[]}
};
const SOURCE_CELLS={
 'token-auras':[0,1,2,3,4,5],
 'blood-slash':[0,1,2,3,4,5,6,7], 'moon-silver':[0,1,2,3,4,5,6,7,13,19,25,31],
 'blood-ward':[3,9,15,21,27,33], 'violet-arcana':[4,6,10,12,16,18,22,24,28,30,34],
 'moon-frost':[1,7,13,19,25,31], 'crimson-sigils':[0,4], 'blood-orbits':[0,4],
 'ember':[2,4], 'blood-impact':[0,1,2,3,5], 'vampire-omens':[0,2,9,10,12,15,16],
 'moon-rites':[2,5,7,10,11,13,18,21,26,27,30], 'realm-slashes':[2,5,8,10,12,14,15,17,20,23,29],
 'card-rites':[9,13,17,22], 'storm-magic':[4,10,14,16], 'gothic-rites':[2,7,12,18,20,21,24],
 'blood-court':[0,3,6,11,12,18,24,27,32,33], 'wolf-rites':[0,3,5,7,12,14,18,20,26,35],
 'blood-architecture':[0,2,5,10,14,17,20,26,28,32], 'moon-architecture':[0,1,3,5,14,17,20,25,28,33],
 'blood-atmosphere':[0,1,3,5,11,14,18,24,29,35], 'moon-atmosphere':[0,4,5,6,12,17,18,24,28,34],
 'vampire-frame':[0,7,12,20,27,32], 'werewolf-frame':[0,7,12,20,25,32]
};
const SHEET_IMAGES=new Map(),SHEET_INDEX=new Map(Object.entries(SOURCE_CELLS).map(([name,cells])=>[name,new Map(cells.map((cell,index)=>[cell,index]))]));
const ABILITY_NAMES={strike:'Corte',cleave:'Arco de aço',bolt:'Lança do Véu',dash:'Passo espectral',guard:'Guarda de ferro',parry:'Contra-guarda',reflect:'Espelho do Véu',mend:'Sangue renovado',frost:'Círculo lunar',drain:'Pacto carmesim',tempest:'Eclipse',moonfire:'Chama lunar',howl:'Uivo da matilha',renewal:'Renovação',blood:'Sangria',pact:'Juramento',pounce:'Bote lupino',rend:'Rasgo',execution:'Execução'};
const ICON_ALIASES={parry:'cleave',reflect:'frost',barrier:'guard'};
const COLOR={vampire:'#ff4969',werewolf:'#b9eaff',physical:'#ffe1a6',magic:'#98e6ff'};
const TAU=Math.PI*2;
const clamp=(v,min=0,max=1)=>Math.max(min,Math.min(max,v));
const finite=(v,fallback=0)=>Number.isFinite(v)?v:fallback;
const reducedMotion=globalThis.matchMedia?.('(prefers-reduced-motion: reduce)');
const compact=()=>reducedMotion?.matches||globalThis.navigator?.connection?.saveData||globalThis.navigator?.hardwareConcurrency<=4;
const motionScale=()=>reducedMotion?.matches ? .32 : 1;
for(const config of [...Object.values(VFX),...Object.values(IMPACTS)])config.frames=[[config.sheet,config.cell],...(config.layers||[])];

// The atlases contain distinct artwork, not adjacent animation frames. Always crop
// one mapped cell, then animate its transform; advancing cell indices would flash
// unrelated images. Decode each strip once, with bounded mobile loading pressure.
const loadQueue=[];
let loading=0;
function pumpSheets(){
 while(loading<3&&loadQueue.length){
  const {name,entry}=loadQueue.shift();loading++;
  const image=new Image();entry.image=image;image.decoding='async';
  let finished=false;
  const finish=ok=>{if(finished)return;finished=true;entry.loaded=ok;entry.resolve(ok?image:null);loading--;pumpSheets();};
  image.onload=async()=>{try{await image.decode?.();}catch{}finish(!!image.naturalWidth);};
  image.onerror=()=>finish(false);image.src=`/assets/world/vfx/frames/${name}.webp?v=aura2`;
 }
}
function loadSheet(name,priority=false,delayPump=false){
 if(SHEET_IMAGES.has(name)){
  if(priority){const index=loadQueue.findIndex(item=>item.name===name);if(index>0)loadQueue.unshift(...loadQueue.splice(index,1));}
  return SHEET_IMAGES.get(name).ready;
 }
 if(typeof Image==='undefined'||!SHEET_INDEX.has(name))return Promise.resolve(null);
 const entry={image:null,loaded:false};entry.ready=new Promise(resolve=>entry.resolve=resolve);
 SHEET_IMAGES.set(name,entry);if(priority)loadQueue.unshift({name,entry});else loadQueue.push({name,entry});if(!delayPump)pumpSheets();return entry.ready;
}
for(const a of Object.values(CLASS_SKILLS)){VFX[a.id]={...VFX[a.base],glow:a.faction==='werewolf'?'#9fdfee':VFX[a.base].glow};}
function configFor(event){
 if(IMPACTS[event.kind])return IMPACTS[event.kind];
 if(event.kind==='ritual')return VFX.pact;
 return VFX[event.ability]||(event.damageType==='magic'?VFX.bolt:VFX.strike);
}
function themeFor(event,config){
 if(['block','parry','reflect','guard-break','interrupt'].includes(event.kind))return config.glow;
 if(event.sourceFaction==='werewolf'&&['strike','cleave','rend','pounce','howl','dash'].includes(event.ability))return COLOR.werewolf;
 if(event.kind==='hit'||event.kind==='critical')return event.kind==='critical'?IMPACTS.critical.glow:VFX[event.ability]?.glow||config.glow;
 return config.glow||COLOR.vampire;
}
export function primeVfx(event){
 const configs=new Set([configFor(event),VFX[event.ability]]);
 const sheets=[...new Set([...configs].filter(Boolean).flatMap(config=>config.frames.map(([sheet])=>sheet)))];
 // loadSheet moves priority requests to the front; reverse here so the primary
 // frame is decoded before its decorative layers.
 const ready=sheets.reverse().map(sheet=>loadSheet(sheet,true,true));
 pumpSheets();
 return Promise.all(ready);
}
export function warmVfx(rpg){
 const ids=new Set(['strike','bolt','dash','guard','parry','reflect',...(rpg?.loadout||[]),...(rpg?.abilities||[]).filter(a=>a.unlocked).map(a=>a.id)]);
 const sheets=new Set();
 for(const id of ids)for(const [sheet] of VFX[id]?.frames||[])sheets.add(sheet);
 for(const config of Object.values(IMPACTS))for(const [sheet] of config.frames)sheets.add(sheet);
 for(const sheet of ['token-auras','vampire-frame','werewolf-frame','moon-atmosphere','blood-atmosphere'])sheets.add(sheet);
 return Promise.all([...sheets].map(sheet=>loadSheet(sheet)));
}
export function abilityIcon(id){if(CLASS_SKILLS[id]){const a=CLASS_SKILLS[id];return classIcon(a.faction,a.iconIndex);}return `/assets/world/ability-icons/${ICON_ALIASES[id]||id}.webp`;}
export function getAbilityArt(id){return {icon:abilityIcon(id),name:ABILITY_NAMES[id]||id};}
export function vfxDuration(event){
 // Sustained casts/wards are drawn from authoritative entities, not event replay.
 if(event.kind==='cast')return event.local?Math.max(260,Math.min(1200,event.duration||260)):260;
 if(event.kind==='launch')return 230;
 if(event.kind==='release')return Math.max(200,event.duration||330);
 return configFor(event).duration||650;
}
function drawCell(ctx,sheet,cell,x,y,size,rotation,alpha){
 const entry=SHEET_IMAGES.get(sheet),image=entry?.image,index=SHEET_INDEX.get(sheet)?.get(cell);
 if(!entry?.loaded||!image?.naturalWidth||index===undefined||alpha<=0||size<=0)return false;
 const frame=image.naturalHeight;
 if(!frame||(index+1)*frame>image.naturalWidth)return false;
 ctx.save();ctx.translate(x,y);ctx.rotate(rotation);ctx.globalCompositeOperation='lighter';ctx.globalAlpha=clamp(alpha);
 // A half-pixel inset prevents neighboring artwork bleeding when downsampled.
 ctx.drawImage(image,index*frame+.5,.5,frame-1,frame-1,-size/2,-size/2,size,size);ctx.restore();return true;
}
function glow(ctx,x,y,radius,color,alpha){
 if(radius<=0||alpha<=0)return;
 const gradient=ctx.createRadialGradient(x,y,0,x,y,radius);gradient.addColorStop(0,color);gradient.addColorStop(1,'transparent');
 ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=clamp(alpha);ctx.fillStyle=gradient;ctx.beginPath();ctx.arc(x,y,radius,0,TAU);ctx.fill();ctx.restore();
}
function ring(ctx,x,y,radius,color,alpha,width=2,flatten=.58,rotation=0,start=0,end=TAU){
 if(radius<=0||alpha<=0)return;
 ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=clamp(alpha);ctx.strokeStyle=color;ctx.lineWidth=width;
 ctx.beginPath();ctx.ellipse(x,y,radius,radius*flatten,rotation,start,end);ctx.stroke();ctx.restore();
}
function drawEllipticCell(ctx,sheet,cell,x,y,width,height,alpha){
 const entry=SHEET_IMAGES.get(sheet),image=entry?.image,index=SHEET_INDEX.get(sheet)?.get(cell);
 if(!entry?.loaded||!image?.naturalWidth||index===undefined||alpha<=0)return false;
 const frame=image.naturalHeight;if(!frame||(index+1)*frame>image.naturalWidth)return false;
 ctx.save();ctx.translate(x,y);ctx.beginPath();ctx.ellipse(0,0,width/2,height/2,0,0,TAU);ctx.clip();
 ctx.globalCompositeOperation='lighter';ctx.globalAlpha=clamp(alpha);ctx.drawImage(image,index*frame+.5,.5,frame-1,frame-1,-width/2,-height/2,width,height);ctx.restore();return true;
}
function sparks(ctx,event,x,y,t,size,color,shatter=false){
 if(t<=0||t>=1)return;
 const count=compact()?5:event.kind==='critical'?16:10,seed=finite(event.seed,17),reach=size*(shatter?.65:.44)*motionScale();
 ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=(1-t)*(1-t);ctx.strokeStyle=color;ctx.fillStyle=color;ctx.lineWidth=1.5;
 for(let i=0;i<count;i++){
  const angle=i*2.39996+seed*.03,speed=.4+((i*37+seed)%61)/100,progress=Math.sqrt(t),distance=reach*speed*progress;
  const px=x+Math.cos(angle)*distance,py=y+Math.sin(angle)*distance*.7+(shatter?size*t*t*.18:0),length=(1-t)*size*.065+1;
  ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px-Math.cos(angle)*length,py-Math.sin(angle)*length);ctx.stroke();
 }
 ctx.restore();
}
function drawDefenseCollision(ctx,event,x,y,angle,t,size,color,zoom){
 if(t>.78)return;
 const power=event.kind==='parry'||event.kind==='reflect'||event.kind==='guard-break'?1.2:1;
 const burst=clamp(1-t/.78),travel=(12+size*(.33+t*.48))*power,wing=travel*.72;
 const cx=Math.cos(angle),cy=Math.sin(angle),nx=-cy,ny=cx;
 ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineCap='round';
 for(const side of [-1,1]){
  const offset=side*travel;
  ctx.strokeStyle=side<0?color:'#eaf8ff';ctx.globalAlpha=burst*(side<0?.72:.58);
  ctx.lineWidth=(side<0?7:5)*zoom*(1-t*.68);
  ctx.beginPath();ctx.moveTo(x+cx*offset,y+cy*offset);ctx.lineTo(x+cx*side*3,y+cy*side*3);ctx.stroke();
  ctx.lineWidth=1.3*zoom;ctx.globalAlpha=burst*.76;
  ctx.beginPath();ctx.moveTo(x+cx*offset+nx*wing*.2,y+cy*offset+ny*wing*.2);ctx.lineTo(x+cx*side*5,y+cy*side*5);ctx.stroke();
 }
 const count=compact()?7:16,seed=finite(event.seed,0);
 ctx.strokeStyle='#fff2cf';ctx.lineWidth=1.5*zoom;ctx.globalAlpha=burst*.88;
 for(let i=0;i<count;i++){
  const direction=i*2.39996+seed*.013,reach=(.28+(i%5)*.13)*travel*t;
  const px=x+Math.cos(direction)*reach,py=y+Math.sin(direction)*reach*.72;
  ctx.beginPath();ctx.moveTo(px,py);ctx.lineTo(px+Math.cos(direction)*Math.max(2,wing*(1-t)*.22),py+Math.sin(direction)*Math.max(2,wing*(1-t)*.22));ctx.stroke();
 }
 ctx.restore();
 ring(ctx,x,y,12+travel*.6,color,burst*.72,3.6*zoom,1);
 ring(ctx,x,y,7+travel*.92,'#f8f4de',burst*.32,1.3*zoom,1);
 if(t<.22)glow(ctx,x,y,24*zoom*(1-t/.22),'#fffaf0',.7*(1-t/.22));
}
function drawCharge(ctx,event,t,from,to,zoom,color,config){
 const strength=event.local ? .35+.65*t : 1-t,radius=(11+strength*22)*zoom;
 const angle=Math.atan2(to.y-from.y,to.x-from.x);
 glow(ctx,from.x,from.y-22*zoom,radius,color,.18+strength*.2);
 ring(ctx,from.x,from.y-2*zoom,radius*1.25,color,.3+strength*.42,1.4*zoom,.7,-Math.PI/2,0,Math.PI*1.7*strength);
 drawCell(ctx,config.sheet,config.cell,from.x,from.y-22*zoom,(27+strength*27)*zoom,angle,.1+strength*.27);
 if(event.local&&Math.hypot(to.x-from.x,to.y-from.y)>12){
  const reach=Math.min(64*zoom,Math.hypot(to.x-from.x,to.y-from.y)*.34),x=from.x+Math.cos(angle)*reach,y=from.y-22*zoom+Math.sin(angle)*reach;
  ctx.save();ctx.globalAlpha=.12+strength*.2;ctx.strokeStyle=color;ctx.lineWidth=(1+strength)*zoom;ctx.beginPath();ctx.moveTo(from.x,from.y-22*zoom);ctx.lineTo(x,y);ctx.stroke();ctx.restore();
 }
}

export function drawVfx(ctx,event,now,to,from,zoom=1){
 const config=configFor(event),elapsed=now-finite(event.started,now),duration=vfxDuration(event);
 // Returning "handled" after expiry prevents the caller from reviving its legacy
 // fallback animation while a damage label is still alive.
 if(elapsed<0||elapsed>=duration)return true;
 const t=clamp(elapsed/duration),ease=1-(1-t)**3,color=themeFor(event,config),motion=motionScale();
 if(event.kind==='cast'||event.kind==='launch'){drawCharge(ctx,event,t,from,to,zoom,color,config);return true;}
 if(event.kind==='release'){
  const angle=Math.atan2(to.y-from.y,to.x-from.x),size=(24+40*ease)*zoom,px=from.x+Math.cos(angle)*24*zoom,py=from.y-22*zoom+Math.sin(angle)*24*zoom;
  glow(ctx,px,py,size*.75,color,(1-t)*.55);
  ring(ctx,px,py,size*.34,color,(1-t)*.84,2.7*zoom,.9,angle);
  drawCell(ctx,config.sheet,config.cell,px,py,size,angle,(1-t)*.76);
  ctx.save();ctx.globalCompositeOperation='lighter';ctx.globalAlpha=(1-t)*.7;ctx.strokeStyle=color;ctx.lineCap='round';ctx.lineWidth=Math.max(1,5*(1-t))*zoom;ctx.beginPath();ctx.moveTo(from.x,from.y-22*zoom);ctx.lineTo(px+Math.cos(angle)*size*.66,py+Math.sin(angle)*size*.66);ctx.stroke();ctx.restore();
  return true;
 }
 const impact=!!IMPACTS[event.kind]&&!['guard','heal','miss','evade'].includes(event.kind);
 let x=to.x,y=to.y-22*zoom,rotation=Math.atan2(to.y-from.y,to.x-from.x);
 if(config.motion==='dash'){
  const travel=event.kind==='dash'?clamp(t):clamp(t*2.1);x=from.x+(to.x-from.x)*travel;y=from.y+(to.y-from.y)*travel-18*zoom;
  if(!compact())for(let i=1;i<4;i++){
   const k=clamp(travel-i*.13),alpha=(1-t)*(.2-i*.035);
   drawCell(ctx,config.sheet,config.cell,from.x+(to.x-from.x)*k,from.y+(to.y-from.y)*k-18*zoom,config.size*zoom*.5,rotation,alpha);
  }
 }
 // Projectile travel belongs exclusively to world.combat.projectiles. A hit
 // event is rendered at the server's collision position, never at its origin.
 if(config.motion==='ward'||config.motion==='heal')rotation=(t-.5)*.35*motion;
 const size=config.size*Math.max(zoom,compact()?.8:.9)*(impact?.45+ease*.55:.7+ease*.3),fade=clamp(t/.09)*(1-t)**1.3;
 glow(ctx,x,y,size*.36,color,fade*(impact?.27:.14));
 const attack=VFX[event.ability];
 if(impact&&['hit','critical'].includes(event.kind)&&attack&&['slash','sweep'].includes(attack.motion)&&t<.55){
  const slash=t/.55,angle=rotation+(.3-slash*.5)*motion;
  drawCell(ctx,attack.sheet,attack.cell,x,y,attack.size*zoom*(.6+slash*.25),angle,Math.sin(slash*Math.PI)*.68);
  ring(ctx,x,y,(15+slash*30)*zoom,color,(1-slash)*.55,2.6*zoom,.48,rotation,-1+slash,.8+slash);
 }
 const limit=compact()?2:3;
 for(let i=0;i<Math.min(limit,config.frames.length);i++){
  const [sheet,cell]=config.frames[i],delay=i*.075,phase=clamp((t-delay)/(1-delay));
  if(t<delay)continue;
  drawCell(ctx,sheet,cell,x,y,size*(i?.62:1),rotation+(i?.3:-.12)*(1-phase)*motion,fade*(i?.65:1));
 }
 if(['block','parry','reflect','guard-break','collision','enemy-guard'].includes(event.kind))drawDefenseCollision(ctx,event,x,y,Number.isFinite(event.directionX)?Math.atan2(event.directionY,event.directionX):rotation,t,size,color,zoom);
 if(impact){
  const radius=(7+ease*size*.34)*motion;
  ring(ctx,x,y,radius,color,(1-t)**2,(event.kind==='critical'?3:2)*zoom,.65);
  if(t<.16)glow(ctx,x,y,Math.max(4,22*zoom*(1-t/.16)),'#fff3d5',.64*(1-t/.16));
  sparks(ctx,event,x,y,t,size,color,['shatter','deflect'].includes(config.motion));
  if(config.motion==='deflect'){
   const angle=Number.isFinite(event.directionX)?Math.atan2(event.directionY,event.directionX):rotation;
   ring(ctx,x,y,(14+ease*32)*zoom,color,fade,3*zoom,1,angle,-1.15,1.15);
  }
 }else if(['slash','sweep','burst'].includes(config.motion)){
  ring(ctx,x,y,(16+ease*size*.3)*motion,color,fade*.7,2*zoom,.5,rotation,-1.35+t,1.35+t);
 }else if(config.motion==='ward'||config.motion==='heal'){
  ring(ctx,x,to.y-2*zoom,(15+ease*size*.25)*motion,color,fade*.55,1.5*zoom);
  if(config.motion==='heal'&&!compact())for(let i=0;i<5;i++)glow(ctx,x+Math.sin(i*2.4)*size*.21,y+24*zoom-t*size*.35-i*3,3*zoom,color,fade*.7);
 }else if(config.motion==='dissolve')ring(ctx,x,y,size*.2,color,fade*.24,zoom);
 return true;
}

function worldRadius(project,point,radius){
 const center=project(point),edge=project({x:point.x+radius/1.5,y:point.y});
 return Math.max(1,Math.abs(edge.x-center.x));
}
function onScreen(ctx,point,padding=100){
 const element=ctx.canvas,width=element?.clientWidth||element?.width||Infinity,height=element?.clientHeight||element?.height||Infinity;
 return point.x>=-padding&&point.y>=-padding&&point.x<=width+padding&&point.y<=height+padding;
}
function ownerPosition(world,source,pose,fallback){
 if(source===world.player?.publicId)return pose||world.player;
 return world.actors?.find(actor=>actor.id===source)||fallback;
}
function barrierColor(kind){return kind==='reflect'?COLOR.magic:kind==='parry'?'#fff0c7':'#e4c68e';}

function drawBarrier(ctx,barrier,world,clock,now,project,zoom,pose){
 if(barrier.expiresAt<=clock||barrier.hp<=0)return;
 const position=ownerPosition(world,barrier.source,pose,barrier),point=project(position),radius=worldRadius(project,position,barrier.radius||1.15);
 if(!onScreen(ctx,point,radius+70))return;
 const color=barrierColor(barrier.kind),perfect=barrier.perfectUntil>clock,health=clamp(barrier.hp/Math.max(1,barrier.maxHp));
 const fade=clamp((barrier.expiresAt-clock)/220),pulse=reducedMotion?.matches?1:.92+Math.sin(now*.008)*.08;
 const facing=Math.atan2(finite(barrier.facingY),finite(barrier.facingX,1));
 const owner=barrier.source===world.player?.publicId?world.player:world.actors?.find(actor=>actor.id===barrier.source);
 const offsetX=owner?position.x-owner.x:0,offsetY=owner?position.y-owner.y:0;
 const start=Number.isFinite(barrier.startX)?project({x:barrier.startX+offsetX,y:barrier.startY+offsetY}):{x:point.x+Math.cos(facing)*radius*.63-Math.sin(facing)*radius,y:point.y+Math.sin(facing)*radius*.63+Math.cos(facing)*radius};
 const end=Number.isFinite(barrier.endX)?project({x:barrier.endX+offsetX,y:barrier.endY+offsetY}):{x:point.x+Math.cos(facing)*radius*.63+Math.sin(facing)*radius,y:point.y+Math.sin(facing)*radius*.63-Math.cos(facing)*radius};
 const height=42*zoom,front={x:(start.x+end.x)/2,y:(start.y+end.y)/2-height*.5};
 // The grounded edge follows the authoritative capsule endpoints exactly. The
 // raised membrane makes the collision plane readable while leaving feet clear.
 ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineCap='round';ctx.strokeStyle=color;
 ctx.globalAlpha=fade*.2;ctx.lineWidth=Math.max(2,worldRadius(project,position,barrier.thickness||.13)*2);
 ctx.beginPath();ctx.moveTo(start.x,start.y);ctx.lineTo(end.x,end.y);ctx.stroke();
 ctx.globalAlpha=fade*(perfect?.95:.62);ctx.lineWidth=(perfect?2.7:1.6)*zoom;ctx.stroke();
 const membrane=ctx.createLinearGradient(front.x,front.y-height/2,front.x,front.y+height/2);membrane.addColorStop(0,'transparent');membrane.addColorStop(1,color);
 ctx.fillStyle=membrane;ctx.globalAlpha=fade*.16*pulse;ctx.beginPath();ctx.moveTo(start.x,start.y);ctx.lineTo(start.x,start.y-height);ctx.lineTo(end.x,end.y-height);ctx.lineTo(end.x,end.y);ctx.closePath();ctx.fill();
 ctx.globalAlpha=fade*.33;ctx.lineWidth=zoom;ctx.beginPath();ctx.moveTo(start.x,start.y);ctx.lineTo(start.x,start.y-height*.85);ctx.moveTo(end.x,end.y);ctx.lineTo(end.x,end.y-height*.85);ctx.stroke();ctx.restore();
 glow(ctx,front.x,front.y,radius*.85,color,fade*.1*pulse);
 const config=VFX[barrier.kind]||VFX.guard;
 const cell=barrier.kind==='guard'?21:config.cell;
 drawCell(ctx,config.sheet,cell,front.x,front.y,Math.max(48*zoom,radius*2.4),barrier.kind==='guard'?0:facing,fade*(perfect?.42:.27)*pulse);
 // A compact stability rim communicates shield durability without another bar.
 ring(ctx,point.x,point.y+5*zoom,24*zoom,color,fade*.7,2*zoom,.48,0,Math.PI,Math.PI+Math.PI*health);
 if(perfect)for(let i=0;i<3;i++){
  const k=i/2;glow(ctx,start.x+(end.x-start.x)*k,start.y+(end.y-start.y)*k-height*.2,3.5*zoom,'#fff3cc',fade*.85);
 }
}
export function projectilePosition(shot,clock){
 const updatedAt=finite(shot.updatedAt,clock),extra=Math.max(0,Math.min(clock,shot.expiresAt)-updatedAt)/1000;
 return {x:shot.x+finite(shot.velocityX)*extra,y:shot.y+finite(shot.velocityY)*extra};
}
function drawProjectile(ctx,shot,clock,project,zoom,now){
 if(shot.expiresAt<=clock)return;
 // The server supplies a swept, authoritative trajectory. Continue along it
 // between snapshots instead of freezing after 100 ms of a 250-500 ms tick.
 const vx=finite(shot.velocityX),vy=finite(shot.velocityY),position=projectilePosition(shot,clock),point=project(position),tail=project({x:position.x-vx*.11,y:position.y-vy*.11});
 if(!onScreen(ctx,point,100))return;
 const angle=Math.atan2(point.y-tail.y,point.x-tail.x),config=VFX[shot.ability]||(shot.damageType==='physical'?VFX.strike:VFX.bolt);
 const color=shot.reflected?COLOR.magic:shot.damageType==='physical'?'#eec796':config.glow;
 const radius=worldRadius(project,position,shot.radius||.22),size=clamp(radius*5.6,28*zoom,65*zoom);
 const y=point.y-22*zoom,ty=tail.y-22*zoom,pulse=reducedMotion?.matches?1:.93+Math.sin(now*.024)*.07;
 ctx.save();ctx.globalCompositeOperation='lighter';ctx.lineCap='round';
 const trail=ctx.createLinearGradient(tail.x,ty,point.x,y);trail.addColorStop(0,'transparent');trail.addColorStop(1,color);ctx.strokeStyle=trail;
 ctx.globalAlpha=.24;ctx.lineWidth=Math.max(3,radius*2.5);ctx.beginPath();ctx.moveTo(tail.x,ty);ctx.lineTo(point.x,y);ctx.stroke();
 ctx.globalAlpha=.8;ctx.lineWidth=Math.max(1,2*zoom);ctx.stroke();ctx.restore();
 if(!compact())drawCell(ctx,config.sheet,config.cell,(tail.x+point.x)/2,(ty+y)/2,size*.72,angle,.2);
 glow(ctx,point.x,y,size*.52,color,.28*pulse);
 drawCell(ctx,config.sheet,config.cell,point.x,y,size,angle,.87);
 glow(ctx,point.x,y,Math.max(2.5*zoom,radius*.6),'#fff6dd',.85);
 // Ground shadow anchors the elevated artwork to the collision trajectory.
 ring(ctx,point.x,point.y,Math.max(2,radius),color,.27,1,.6);
}
function drawCast(ctx,cast,world,clock,now,project,zoom,pose){
 if(cast.endsAt<=clock)return;
 const owner=ownerPosition(world,cast.source,pose,cast),target={x:finite(cast.aimX,owner.x),y:finite(cast.aimY,owner.y)},point=project(owner),aim=project(target);
 if(!onScreen(ctx,point,100)&&!onScreen(ctx,aim,150))return;
 const config=VFX[cast.ability]||VFX.bolt,color=cast.source===world.player?.publicId?config.glow:'#f49970';
 const progress=clamp((clock-cast.startedAt)/Math.max(1,cast.endsAt-cast.startedAt)),angle=Math.atan2(aim.y-point.y,aim.x-point.x);
 glow(ctx,point.x,point.y-20*zoom,24*zoom,color,.08+progress*.2);
 ring(ctx,point.x,point.y,21*zoom,color,.65,1.5*zoom,.56,-Math.PI/2,0,TAU*progress);
 if(!compact())drawCell(ctx,config.sheet,config.cell,point.x,point.y-22*zoom,(30+progress*18)*zoom,angle,.08+progress*.22);
 if(cast.radius>0){
  const radius=worldRadius(project,target,cast.radius);
  ring(ctx,aim.x,aim.y,radius,color,.4,1.5*zoom,1);
  ring(ctx,aim.x,aim.y,Math.max(2,radius*progress),color,.12+progress*.2,1,1);
 }else{
  ctx.save();ctx.globalAlpha=.18+progress*.14;ctx.strokeStyle=color;ctx.lineWidth=1.3*zoom;ctx.setLineDash([3*zoom,7*zoom]);
  ctx.beginPath();ctx.moveTo(point.x,point.y);ctx.lineTo(aim.x,aim.y);ctx.stroke();ctx.restore();
 }
}

// Geometry is shared with the fixed 92 × 112 world token: 60 × 78 portrait,
// 5px top padding, translate(-50%, -80%). Never paint over the portrait.
export function tokenAuraGeometry(point,zoom=1){
 return {x:point.x,y:point.y-45.6*zoom,top:point.y-84.6*zoom,width:60*zoom,height:78*zoom,foot:point.y-5*zoom};
}
const auraLevels=new Map();
export function travelerAuraState(world,position,karma,clock,now){
 const self=position.publicId===world.player?.publicId||position.id===world.player?.publicId;
 const level=self?world.rpg?.level:position.level;
 const id=position.publicId||position.id;
 let record=auraLevels.get(id);
 if(id&&level){
  if(!record){record={level,at:-Infinity};auraLevels.set(id,record);}
  else if(level>record.level){record.level=level;record.at=now;}
  else if(level<record.level){record.level=level;record.at=-Infinity;}
  if(auraLevels.size>64)auraLevels.delete(auraLevels.keys().next().value);
 }
 const fresh=t=>t>0&&clock>=t;
 const boss=fresh(karma.lastBossKillAt)?clamp(1-(clock-karma.lastBossKillAt)/6500):0;
 const kill=fresh(karma.lastKillAt)?clamp(1-(clock-karma.lastKillAt)/1800):0;
 const combo=clock<karma.comboEndsAt?clamp(karma.comboTier||0,0,4):0;
 const levelUp=record?clamp(1-(now-record.at)/3600):0;
 const ward=world.combat?.barriers?.some(b=>b.source===id&&b.expiresAt>clock);
 const cast=world.combat?.casts?.find(c=>c.source===id&&c.endsAt>clock);
 const heal=cast&&['mend','renewal'].includes(cast.ability)||(world.combatEvents||[]).some(e=>e.source===id&&['heal','buff'].includes(e.kind)&&clock>=e.at&&clock-e.at<2200);
 return {boss,kill,combo,levelUp,ward,heal,level:level||1};
}
function drawTravelerAura(ctx,world,position,karma,clock,now,project,zoom){
 if(!position||!karma||position.hp<=0)return;
 const point=project(position);if(!onScreen(ctx,point,130))return;
 const g=tokenAuraGeometry(point,zoom),state=travelerAuraState(world,position,karma,clock,now);
 const wolf=karma.faction==='werewolf',rank=clamp(karma.rankTier||0,0,7);
 const time=reducedMotion?.matches?0:now;
 const pulse=.94+Math.sin(time*.0023)*.06;
 const flare=Math.max(state.boss,state.levelUp),power=.32+rank*.025+state.combo*.085+flare*.3+(state.heal?.25:0);
 const color=state.heal?'#91f4ce':flare?'#ffe1a0':state.ward?'#c7e9ff':karma.color||COLOR[karma.faction]||COLOR.vampire;
 const cell=state.heal?2:flare?4:state.ward?5:wolf?0:1;
 const width=(83+state.combo*4+flare*15+(state.heal?9:0))*zoom,height=(101+state.combo*7+flare*19+(state.heal?14:0))*zoom;
 // Exclude the entire rounded portrait (including its border) from the overlay.
 // This uses the actual CSS silhouette, not a second drawn character shape.
 ctx.save();ctx.beginPath();ctx.rect(point.x-160*zoom,point.y-200*zoom,320*zoom,300*zoom);
 ctx.roundRect(g.x-g.width/2-2*zoom,g.top-2*zoom,g.width+4*zoom,g.height+4*zoom,[25*zoom,25*zoom,6*zoom,6*zoom]);ctx.clip('evenodd');
 drawEllipticCell(ctx,'token-auras',cell,g.x,g.y+4*zoom,width*pulse,height,power);
 if(state.combo>=2||flare){
  // Two phased layers create rising energy without swapping unrelated art.
  for(let i=0;i<(compact()?1:2);i++){
   const phase=(time*.00038+i*.5)%1,fade=Math.sin(phase*Math.PI);
   drawEllipticCell(ctx,'token-auras',state.combo>=3&&!wolf&&!flare?3:cell,g.x,g.y-phase*13*zoom,width*(1+phase*.12),height*(1+phase*.08),fade*power*.36);
  }
 }
 const count=compact()?3:5+state.combo*2;
 for(let i=0;i<count;i++){
  const phase=(time*(.00018+state.combo*.000025)+i/count)%1,side=i%2?1:-1;
  const x=g.x+side*(32+Math.sin(phase*Math.PI)*9+state.combo)*zoom,y=g.foot-phase*(92+state.combo*5)*zoom;
  glow(ctx,x,y,(1.3+state.combo*.24)*zoom,color,Math.sin(phase*Math.PI)*power*.8);
 }
 ctx.restore();
 const radius=(32+Math.min(3,Math.floor(state.level/10))+state.combo*2)*zoom;
 drawEllipticCell(ctx,'token-auras',cell,g.x,g.foot,radius*2.5,22*zoom,power*.7);
 ring(ctx,g.x,g.foot,radius,color,power*.7,1.2*zoom,.24,0,time*.00035,time*.00035+Math.PI*1.65);
 if(state.ward)ring(ctx,g.x,g.foot,radius+4*zoom,'#c7e9ff',.6,1.5*zoom,.28);
 if(flare)ring(ctx,g.x,g.foot,radius*(1+(1-flare)*.55),'#ffe1a0',flare*.75,2*zoom,.3);
 if(state.kill)ring(ctx,g.x,g.foot,radius*(1+(1-state.kill)*.32),color,state.kill*.6,1.2*zoom,.27);
}
function drawWeather(ctx,world,now,project,zoom,pose){
 if(compact()||!pose)return;
 const near=(world.regions||[]).filter(region=>Math.hypot((region.x-pose.x)*1.5,region.y-pose.y)<12).slice(0,2);
 for(const region of near){
  const point=project(region);if(!onScreen(ctx,point,180))continue;
  const frost=region.x>=100&&region.x<200,ember=region.x>=200;
  const sheet=frost?'moon-atmosphere':ember?'blood-atmosphere':'moon-atmosphere';
  const cell=frost?4:ember?3:28,color=frost?'#a9dff5':ember?'#ed8460':'#9ed8b9';
  const sway=reducedMotion?.matches?0:Math.sin(now*.0004+region.x)*10*zoom;
  drawCell(ctx,sheet,cell,point.x+sway,point.y-72*zoom,130*zoom,0,.11);
  glow(ctx,point.x,point.y-25*zoom,70*zoom,color,.025);
 }
}

/** Draw server-owned combat geometry. `now` is the RAF/performance timestamp;
 * project accepts world {x,y}; pose may be the locally interpolated player. */
export function drawCombatEntities(ctx,world,now,project,zoom=1,playerPose,tokenZoom=zoom){
 if(!world?.combat||typeof project!=='function')return;
 const age=Math.max(0,Date.now()-finite(world._receivedAt,Date.now())),clock=finite(world.serverTime,Date.now())+age;
 drawWeather(ctx,world,now,project,zoom,playerPose||world.player);
 for(const player of (world.players||[]).slice(0,24))if(player.id!==world.player?.publicId)drawTravelerAura(ctx,world,player,player.karma,clock,now,project,tokenZoom);
 drawTravelerAura(ctx,world,{...world.player,...playerPose},world.karma,clock,now,project,tokenZoom);
 for(const cast of (world.combat.casts||[]).slice(0,32))drawCast(ctx,cast,world,clock,now,project,zoom,playerPose);
 for(const barrier of (world.combat.barriers||[]).slice(0,32))drawBarrier(ctx,barrier,world,clock,now,project,zoom,playerPose);
 for(const shot of (world.combat.projectiles||[]).slice(0,64))drawProjectile(ctx,shot,clock,project,zoom,now);
}
