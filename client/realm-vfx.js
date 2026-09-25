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
 execution:{sheet:'blood-impact',cell:5,motion:'impact',glow:'#ff7759',size:224,duration:840,layers:[['gothic-rites',20],['card-rites',22]]},
 parry:{sheet:'moon-silver',cell:0,motion:'ward',glow:'#ffe6ad',size:136,duration:540,layers:[['realm-slashes',17]]},
 reflect:{sheet:'moon-frost',cell:1,motion:'ward',glow:'#97e8ff',size:164,duration:620,layers:[['moon-rites',18]]}
};
const IMPACTS={
 critical:{sheet:'blood-impact',cell:3,motion:'impact',glow:'#ffe0ad',size:202,duration:850,layers:[['gothic-rites',21],['realm-slashes',17]]},
 'enemy-hit':{sheet:'blood-impact',cell:1,motion:'impact',glow:'#ff596b',size:166,duration:650,layers:[['moon-rites',27],['realm-slashes',20]]},
 hit:{sheet:'blood-impact',cell:2,motion:'impact',glow:'#ff536a',size:140,duration:570,layers:[['realm-slashes',14],['vampire-omens',12]]},
 miss:{sheet:'moon-silver',cell:5,motion:'dash',glow:'#b9eaff',size:130,duration:480,layers:[['moon-rites',11]]},
 evade:{sheet:'moon-silver',cell:1,motion:'dash',glow:'#c9f3ff',size:148,duration:520,layers:[['realm-slashes',29],['moon-rites',5]]},
 heal:{sheet:'violet-arcana',cell:4,motion:'heal',glow:'#b8edbd',size:170,duration:760,layers:[['card-rites',9],['vampire-omens',2]]},
 guard:{sheet:'blood-ward',cell:21,motion:'ward',glow:'#e8d3a0',size:162,duration:560,layers:[['gothic-rites',7]]},
 block:{sheet:'moon-silver',cell:0,motion:'deflect',glow:'#ffe0a0',size:122,duration:420,layers:[['realm-slashes',17]]},
 parry:{sheet:'moon-silver',cell:2,motion:'deflect',glow:'#fff0c7',size:174,duration:620,layers:[['realm-slashes',20]]},
 reflect:{sheet:'moon-frost',cell:1,motion:'deflect',glow:'#9deaff',size:182,duration:660,layers:[['moon-rites',21]]},
 'guard-break':{sheet:'blood-ward',cell:27,motion:'shatter',glow:'#ffa66c',size:176,duration:760,layers:[['gothic-rites',21]]},
 interrupt:{sheet:'moon-silver',cell:2,motion:'shatter',glow:'#e0d0ff',size:120,duration:500,layers:[['moon-rites',11]]},
 collision:{sheet:'blood-impact',cell:1,motion:'impact',glow:'#e8c9a0',size:108,duration:400,layers:[]},
 expire:{sheet:'moon-silver',cell:5,motion:'dissolve',glow:'#b9eaff',size:78,duration:320,layers:[]}
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
  image.onerror=()=>finish(false);image.src=`/assets/world/vfx/frames/${name}.webp`;
 }
}
function loadSheet(name){
 if(SHEET_IMAGES.has(name))return SHEET_IMAGES.get(name).ready;
 if(typeof Image==='undefined'||!SHEET_INDEX.has(name))return Promise.resolve(null);
 const entry={image:null,loaded:false};entry.ready=new Promise(resolve=>entry.resolve=resolve);
 SHEET_IMAGES.set(name,entry);loadQueue.push({name,entry});pumpSheets();return entry.ready;
}
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
 return Promise.all([...configs].filter(Boolean).flatMap(config=>config.frames.map(([sheet])=>loadSheet(sheet))));
}
export function warmVfx(rpg){
 const ids=new Set(['strike','bolt','dash','guard','parry','reflect',...(rpg?.loadout||[]),...(rpg?.abilities||[]).filter(a=>a.unlocked).map(a=>a.id)]);
 const sheets=new Set();
 for(const id of ids)for(const [sheet] of VFX[id]?.frames||[])sheets.add(sheet);
 for(const config of Object.values(IMPACTS))for(const [sheet] of config.frames)sheets.add(sheet);
 return Promise.all([...sheets].map(loadSheet));
}
export function abilityIcon(id){return `/assets/world/ability-icons/${ICON_ALIASES[id]||id}.webp`;}
export function getAbilityArt(id){return {icon:abilityIcon(id),name:ABILITY_NAMES[id]||id};}
export function vfxDuration(event){
 // Sustained casts/wards are drawn from authoritative entities, not event replay.
 if(event.kind==='cast')return 260;
 if(event.kind==='launch')return 230;
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
function drawCharge(ctx,event,t,from,zoom,color){
 const progress=1-t,radius=(10+progress*20)*zoom;
 glow(ctx,from.x,from.y-22*zoom,radius,color,progress*.26);
 ring(ctx,from.x,from.y-2*zoom,radius*1.3,color,progress*.65,1.4*zoom);
}

export function drawVfx(ctx,event,now,to,from,zoom=1){
 const config=configFor(event),elapsed=now-finite(event.started,now),duration=vfxDuration(event);
 // Returning "handled" after expiry prevents the caller from reviving its legacy
 // fallback animation while a damage label is still alive.
 if(elapsed<0||elapsed>=duration)return true;
 const t=clamp(elapsed/duration),ease=1-(1-t)**3,color=themeFor(event,config),motion=motionScale();
 if(event.kind==='cast'||event.kind==='launch'){drawCharge(ctx,event,t,from,zoom,color);return true;}
 const impact=!!IMPACTS[event.kind]&&!['guard','heal','miss','evade'].includes(event.kind);
 let x=to.x,y=to.y-22*zoom,rotation=Math.atan2(to.y-from.y,to.x-from.x);
 if(config.motion==='dash'){
  const travel=clamp(t*2.1);x=from.x+(to.x-from.x)*travel;y=from.y+(to.y-from.y)*travel-18*zoom;
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
 const limit=compact()?1:2;
 for(let i=0;i<Math.min(limit,config.frames.length);i++){
  const [sheet,cell]=config.frames[i],delay=i*.075,phase=clamp((t-delay)/(1-delay));
  if(t<delay)continue;
  drawCell(ctx,sheet,cell,x,y,size*(i?.62:1),rotation+(i?.3:-.12)*(1-phase)*motion,fade*(i?.65:1));
 }
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
function drawProjectile(ctx,shot,clock,snapshotAge,project,zoom,now){
 if(shot.expiresAt<=clock)return;
 const vx=finite(shot.velocityX),vy=finite(shot.velocityY),extra=Math.min(100,Math.max(0,snapshotAge))/1000;
 const position={x:shot.x+vx*extra,y:shot.y+vy*extra},point=project(position),tail=project({x:position.x-vx*.11,y:position.y-vy*.11});
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

/** Draw server-owned combat geometry. `now` is the RAF/performance timestamp;
 * project accepts world {x,y}; pose may be the locally interpolated player. */
export function drawCombatEntities(ctx,world,now,project,zoom=1,playerPose){
 if(!world?.combat||typeof project!=='function')return;
 const age=Math.max(0,Date.now()-finite(world._receivedAt,Date.now())),clock=finite(world.serverTime,Date.now())+age;
 for(const cast of (world.combat.casts||[]).slice(0,32))drawCast(ctx,cast,world,clock,now,project,zoom,playerPose);
 for(const barrier of (world.combat.barriers||[]).slice(0,32))drawBarrier(ctx,barrier,world,clock,now,project,zoom,playerPose);
 for(const shot of (world.combat.projectiles||[]).slice(0,64))drawProjectile(ctx,shot,clock,clock-finite(shot.updatedAt,world.serverTime),project,zoom,now);
}
