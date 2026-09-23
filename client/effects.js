import {savageImpact} from '/visceral.js';
import {richSound} from '/soundscape.js';
let enabled=localStorage.getItem('bloodmoon.sound')==='true',context;
const musicTracks={
  title:'/music/song1.mp3',
  ambient:'/music/ambient_idle.mp3',
  battle:'/music/battle.mp3',
  expedition:'/music/battle2.mp3'
};
let musicAudio=null,musicScene=null,musicFade=null,musicTransition=0;
export const soundEnabled=()=>enabled;
export function setMusicScene(scene){
  if(!musicTracks[scene])return;
  musicScene=scene;
  if(!enabled){musicAudio?.pause();return;}
  if(!musicAudio){musicAudio=new Audio();musicAudio.loop=true;musicAudio.preload='none';musicAudio.volume=0;}
  const source=new URL(musicTracks[scene],location.href).href;
  if(musicAudio.src===source){
    if(musicAudio.paused)musicAudio.play().then(()=>fadeMusic(0.32,500)).catch(()=>{});
    else if(musicAudio.volume<0.32)fadeMusic(0.32,500);
    return;
  }
  const transition=++musicTransition;
  clearInterval(musicFade);
  const fadeOut=()=>{
    if(transition!==musicTransition)return;
    const next=Math.max(0,musicAudio.volume-0.06);
    musicAudio.volume=next;
    if(next>0){musicFade=setTimeout(fadeOut,35);return;}
    musicAudio.pause();musicAudio.src=source;musicAudio.load();
    musicAudio.play().then(()=>{if(transition===musicTransition)fadeMusic(0.32,900);}).catch(()=>{});
  };
  if(musicAudio.paused||!musicAudio.src){musicAudio.src=source;musicAudio.play().then(()=>{if(transition===musicTransition)fadeMusic(0.32,900);}).catch(()=>{});}
  else fadeOut();
}
function fadeMusic(target,duration){
  clearInterval(musicFade);
  const start=musicAudio?.volume||0,started=performance.now();
  musicFade=setInterval(()=>{
    if(!musicAudio){clearInterval(musicFade);return;}
    const progress=Math.min(1,(performance.now()-started)/duration);
    musicAudio.volume=Math.max(0,Math.min(1,start+(target-start)*progress));
    if(progress>=1)clearInterval(musicFade);
  },40);
}
export function toggleSound(){
  enabled=!enabled;localStorage.setItem('bloodmoon.sound',String(enabled));
  if(enabled){playSound('start');if(musicScene)setMusicScene(musicScene);}
  else{musicTransition++;clearInterval(musicFade);if(musicAudio){fadeMusic(0,180);setTimeout(()=>{if(!enabled)musicAudio?.pause();},200);}}
}
export function playSound(type){if(enabled)richSound(type);}
const sleep=ms=>new Promise(resolve=>setTimeout(resolve,ms));
const rect=el=>el?.getBoundingClientRect?.()||null;
const center=r=>r?{x:r.left+r.width/2,y:r.top+r.height/2}:null;
const findUnit=id=>[...document.querySelectorAll('[data-unit]')].find(el=>el.dataset.unit===String(id));
const findHero=seat=>[...document.querySelectorAll('[data-hero]')].find(el=>el.dataset.hero===String(seat))?.querySelector('.hero-portrait');

function cloneForFlight(source,kind,r){
  if(!source||!r)return null;
  const node=source.cloneNode(true);node.removeAttribute('data-card');node.removeAttribute('data-unit');node.removeAttribute('data-preview');
  node.classList.remove('selected','affordable','unaffordable','ready','chosen-fighter');node.classList.add(kind==='card'?'card-flight':'fighter-flight');
  node.setAttribute('aria-hidden','true');node.style.position='absolute';node.style.left=`${r.left}px`;node.style.top=`${r.top}px`;
  node.style.width=`${r.width}px`;node.style.height=`${r.height}px`;node.style.margin='0';node.style.transform='none';node.style.opacity='1';node.style.pointerEvents='none';
  node.style.setProperty('--angle','0deg');node.style.setProperty('--lift','0px');node.style.setProperty('--order','100');
  return node;
}

export function captureCombatFrame(action){
  const positions={units:{},heroes:{}},frame={positions,cardFlight:null,sourceFlight:null};
  for(const el of document.querySelectorAll('[data-unit]'))positions.units[el.dataset.unit]=rect(el);
  for(const el of document.querySelectorAll('[data-hero]')){
    const portrait=el.querySelector('.hero-portrait');positions.heroes[el.dataset.hero]=rect(portrait);
  }
  if(action?.type==='play'){
    const card=[...document.querySelectorAll('[data-card]')].find(el=>el.dataset.card===String(action.uid));
    frame.cardRect=rect(card);frame.cardFlight=cloneForFlight(card,'card',frame.cardRect);
  }
  if(action?.type==='attack'){
    const source=findUnit(action.uid);frame.sourceRect=rect(source);frame.sourceFlight=cloneForFlight(source,'fighter',frame.sourceRect);
  }else if(action?.type==='skill'||action?.type==='ultimate'){
    const source=document.querySelector(action.type==='skill'?'.skill-button':'.ultimate-button');
    frame.sourceRect=rect(source);frame.sourceFlight=cloneForFlight(source,'fighter',frame.sourceRect);
  }
  return frame;
}

function eventTargetRect(e,seat,frame,preferOld=false){
  const live=e.target==='hero'?rect(findHero(e.seat)):e.target?rect(findUnit(e.target)):null;
  if(live)return live;
  if(e.target==='hero'&&frame?.positions?.heroes?.[e.seat])return frame.positions.heroes[e.seat];
  if(e.target&&frame?.positions?.units?.[e.target])return frame.positions.units[e.target];
  if(e.lane){
    const lane=document.querySelector(`[data-zone="${e.lane}"]`),side=e.seat===seat?'player-squad':'enemy-squad';
    const row=lane?.querySelector(`.${side}`)||lane;
    return rect(row)||rect(lane);
  }
  return rect(document.querySelector('.battlefield'))||rect(document.querySelector('.arena'));
}
function overlayPoint(r,arena){return{x:r.left-arena.left+r.width/2,y:r.top-arena.top+r.height*.48};}
function appendImpact(root,point,type){
  if(type==='damage'){
    const splash=document.createElement('i');splash.className='blood-splash';splash.style.left=`${point.x}px`;splash.style.top=`${point.y}px`;root.append(splash);setTimeout(()=>splash.remove(),700);
    for(let i=0;i<9;i++){
      const drop=document.createElement('i');drop.className='blood-drop';drop.style.left=`${point.x}px`;drop.style.top=`${point.y}px`;
      const angle=(i*40+(i%2)*12)*Math.PI/180,distance=24+(i%4)*12;
      drop.style.setProperty('--dx',`${Math.cos(angle)*distance}px`);drop.style.setProperty('--dy',`${Math.sin(angle)*distance}px`);root.append(drop);setTimeout(()=>drop.remove(),600);
    }
  }else{
    const wave=document.createElement('i');wave.className='heal-wave';wave.style.left=`${point.x}px`;wave.style.top=`${point.y}px`;root.append(wave);setTimeout(()=>wave.remove(),750);
  }
}
let siphonId=0;
async function appendBloodSiphon(root,sourceRect,targetRect,speed=1){
  if(!root||!sourceRect||!targetRect||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const ns='http://www.w3.org/2000/svg',width=root.clientWidth,height=root.clientHeight;if(!width||!height)return;
  const start=overlayPoint(sourceRect,rect(document.querySelector('.arena'))),end=overlayPoint(targetRect,rect(document.querySelector('.arena'))),dx=end.x-start.x,dy=end.y-start.y,distance=Math.hypot(dx,dy)||1,nx=-dy/distance,ny=dx/distance;
  const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox',`0 0 ${width} ${height}`);svg.setAttribute('preserveAspectRatio','none');svg.classList.add('blood-siphon');svg.setAttribute('aria-hidden','true');
  const defs=document.createElementNS(ns,'defs'),filter=document.createElementNS(ns,'filter'),blur=document.createElementNS(ns,'feGaussianBlur'),merge=document.createElementNS(ns,'feMerge'),blurNode=document.createElementNS(ns,'feMergeNode'),sourceNode=document.createElementNS(ns,'feMergeNode');filter.id=`blood-siphon-glow-${++siphonId}`;filter.setAttribute('x','-60%');filter.setAttribute('y','-60%');filter.setAttribute('width','220%');filter.setAttribute('height','220%');blur.setAttribute('stdDeviation','1.35');blur.setAttribute('result','glow');blurNode.setAttribute('in','glow');sourceNode.setAttribute('in','SourceGraphic');merge.append(blurNode,sourceNode);filter.append(blur,merge);defs.append(filter);svg.append(defs);
  const duration=900/speed,filamentCount=19,filaments=[];
  // Many separate hairline vessels replace the old broad central ribbon.
  for(let i=0;i<filamentCount;i++){
    const lane=i-(filamentCount-1)/2,phase=i*2.399963,amp=14+(i%5)*5.5;
    const sx=start.x+nx*lane*1.25,sy=start.y+ny*lane*1.25,ex=end.x+nx*Math.sin(phase*.73)*5,ey=end.y+ny*Math.sin(phase*.73)*5;
    const a=Math.sin(phase),b=Math.cos(phase*1.31),c=Math.sin(phase+1.8);
    const p1x=start.x+dx*.22+nx*(a*amp*1.4)+dx/distance*(b*amp*.13),p1y=start.y+dy*.22+ny*(a*amp*1.4)+dy/distance*(b*amp*.13);
    const mx=start.x+dx*.51+nx*(b*amp*.78),my=start.y+dy*.51+ny*(b*amp*.78);
    const p2x=start.x+dx*.79+nx*(c*amp*1.25)-dx/distance*(a*amp*.12),p2y=start.y+dy*.79+ny*(c*amp*1.25)-dy/distance*(a*amp*.12);
    const d=`M ${sx} ${sy} C ${p1x} ${p1y}, ${mx-nx*a*amp*.62} ${my-ny*a*amp*.62}, ${mx} ${my} C ${mx+nx*b*amp*.82} ${my+ny*b*amp*.82}, ${p2x} ${p2y}, ${ex} ${ey}`;
    const color=i%7===0?'#ffb0ae':i%3===0?'#ff5265':i%2?'#d91d42':'#a80d2d',widthPx=i%7===0?1.45:i%3===0?1.08:.72;
    const halo=document.createElementNS(ns,'path');halo.setAttribute('d',d);halo.setAttribute('fill','none');halo.setAttribute('stroke',i%3===0?'#ff1f48':'#c81036');halo.setAttribute('stroke-width',`${widthPx*2.8}`);halo.setAttribute('stroke-linecap','round');halo.setAttribute('opacity','.24');halo.setAttribute('filter',`url(#${filter.id})`);svg.append(halo);
    const core=document.createElementNS(ns,'path');core.setAttribute('d',d);core.setAttribute('fill','none');core.setAttribute('stroke',color);core.setAttribute('stroke-width',`${widthPx}`);core.setAttribute('stroke-linecap','round');core.setAttribute('opacity',i%7===0?'.96':'.78');svg.append(core);
    const length=core.getTotalLength();for(const path of [halo,core]){path.style.strokeDasharray=`${length}`;path.style.strokeDashoffset=`${length}`;path.animate([{strokeDashoffset:length,opacity:0},{strokeDashoffset:length*.66,opacity:1,offset:.28},{strokeDashoffset:0,opacity:path===core?(i%7===0?'.96':'.78'):'.24'}],{duration,easing:'cubic-bezier(.16,.74,.18,1)',delay:(i%6)*15/speed,fill:'forwards'});}
    filaments.push({d,phase,amp});
    if(i%3===0){const pulse=document.createElementNS(ns,'circle');pulse.setAttribute('r',i%6===0?'1.8':'1.25');pulse.setAttribute('fill',i%6===0?'#ffe0cf':'#ff6372');pulse.setAttribute('filter',`url(#${filter.id})`);const motion=document.createElementNS(ns,'animateMotion');motion.setAttribute('path',d);motion.setAttribute('dur',`${duration*.82}ms`);motion.setAttribute('begin',`${(i%5)*28/speed}ms`);motion.setAttribute('fill','freeze');pulse.append(motion);svg.append(pulse);}
  }
  // Fine secondary branches make the stream read as a branching vein network.
  for(let i=0;i<15;i++){
    const lane=filaments[(i*7+3)%filamentCount],t=.13+(i%8)*.095,side=i%2?1:-1,offset=Math.sin(lane.phase+t*4)*lane.amp*.68;
    const ax=start.x+dx*t+nx*offset,ay=start.y+dy*t+ny*offset,branchLen=10+(i%4)*5;
    const bx=ax+nx*side*branchLen+dx/distance*(i%3-1)*4,by=ay+ny*side*branchLen+dy/distance*(i%3-1)*4;
    const branch=document.createElementNS(ns,'path'),d=`M ${bx} ${by} Q ${ax+nx*side*branchLen*.35} ${ay+ny*side*branchLen*.35} ${ax} ${ay}`;
    branch.setAttribute('d',d);branch.setAttribute('fill','none');branch.setAttribute('stroke',i%4===0?'#ff5365':'#a90c2c');branch.setAttribute('stroke-width',i%4===0?'.92':'.62');branch.setAttribute('stroke-linecap','round');branch.setAttribute('opacity','.68');branch.setAttribute('filter',`url(#${filter.id})`);svg.append(branch);
    const length=branch.getTotalLength();branch.style.strokeDasharray=`${length}`;branch.style.strokeDashoffset=`${length}`;branch.animate([{strokeDashoffset:length,opacity:0},{strokeDashoffset:0,opacity:.68}],{duration:duration*.62,delay:70+(i%7)*18,fill:'forwards',easing:'ease-out'});
  }
  for(let i=0;i<3;i++){
    const ring=document.createElementNS(ns,'circle');ring.setAttribute('cx',end.x);ring.setAttribute('cy',end.y);ring.setAttribute('r','18');ring.setAttribute('fill','none');ring.setAttribute('stroke',i===0?'#ff6677':'#c51b3b');ring.setAttribute('stroke-width',i===0?'.9':'.65');ring.setAttribute('opacity',i===0?'.62':'.34');ring.setAttribute('filter',`url(#${filter.id})`);ring.animate([{r:12+i*5,opacity:.04},{r:24+i*7,opacity:i===0?.62:.32,offset:.55},{r:34+i*8,opacity:0}],{duration:duration*.85,delay:duration*.18+i*100/speed,fill:'forwards',easing:'ease-out'});svg.append(ring);
  }
  root.append(svg);const avatar=targetRect?.element?.matches?.('.hero-portrait')?targetRect.element:targetRect?.element?.querySelector?.('.hero-portrait'),wound=sourceRect?.element?.matches?.('.fighter,.hero-portrait')?sourceRect.element:sourceRect?.element?.closest?.('.fighter')||sourceRect?.element?.querySelector?.('.hero-portrait');avatar?.classList.add('blood-siphon-target');wound?.classList.add('blood-siphon-source');setTimeout(()=>{avatar?.classList.remove('blood-siphon-target');wound?.classList.remove('blood-siphon-source');},duration+250);await sleep(duration+80);svg.remove();
}
async function fly(node,from,to,root,arena,{duration=430,scale=.68,arc=-35}={}){
  if(!node||!from||!to)return;
  const a=overlayPoint(from,arena),b=overlayPoint(to,arena),dx=b.x-a.x,dy=b.y-a.y;
  node.style.left=`${a.x-from.width/2}px`;node.style.top=`${a.y-from.height/2}px`;root.append(node);
  const animation=node.animate([
    {transform:'translate(0,0) scale(1) rotate(0deg)',opacity:1,filter:'brightness(1)'},
    {transform:`translate(${dx*.52}px,${dy*.52+arc}px) scale(1.12) rotate(-3deg)`,opacity:1,filter:'brightness(1.55)'},
    {transform:`translate(${dx}px,${dy}px) scale(${scale}) rotate(7deg)`,opacity:.35,filter:'brightness(2)'}
  ],{duration,easing:'cubic-bezier(.18,.76,.22,1)',fill:'forwards'});
  await animation.finished.catch(()=>{});node.remove();
}
function tweenTarget(el,type){
  if(!el||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  try{el.animate(type==='damage'?
    [{transform:'translate(0,0) rotate(0) scale(1)',filter:'brightness(1) saturate(1)'},{transform:'translate(-12px,3px) rotate(-4deg) scale(1.11)',filter:'brightness(2.1) saturate(2.1) contrast(1.25)',offset:.18},{transform:'translate(10px,-2px) rotate(3deg) scale(.94)',filter:'brightness(.68) saturate(1.8)',offset:.38},{transform:'translate(-5px,1px) rotate(-1.5deg) scale(1.025)',filter:'brightness(1.35) saturate(1.45)',offset:.62},{transform:'translate(2px,0) rotate(.5deg) scale(1)',filter:'brightness(1) saturate(1)'}]:
    [{transform:'scale(1)'},{transform:'scale(1.18)',filter:'brightness(1.4)'},{transform:'scale(1)',filter:'brightness(1)'}],{duration:type==='damage'?510:520,easing:'cubic-bezier(.12,.75,.22,1)'});}catch{}
}

export async function animateEvents(events,seat,frame,{speed=1}={}){
  const root=document.querySelector('#effects'),arena=document.querySelector('.arena');
  if(!root||!arena)return;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,arenaRect=rect(arena);
  let cardFlight=frame?.cardFlight||null,cardUsed=false;
  for(const e of events){
    if(!root.isConnected)return;
    const isCardResult=['summon','skill','equip','heal','damage','claim','loot'].includes(e.type);
    if(cardFlight&&!cardUsed&&e.seat===seat&&isCardResult){
      cardUsed=true;
      const destination=eventTargetRect(e,seat,frame);
      if(!reduce&&frame.cardRect)await fly(cardFlight,frame.cardRect,destination,root,arenaRect,{duration:490,scale:.46,arc:-46});
      else cardFlight.remove();
      cardFlight=null;
    }
    if(e.type==='attack'){
      const source=findUnit(e.source),sourceR=rect(source)||frame?.positions?.units?.[e.source];
      const targetR=e.target==='hero'?rect(findHero(1-e.seat))||frame?.positions?.heroes?.[1-e.seat]:rect(findUnit(e.target))||frame?.positions?.units?.[e.target]||eventTargetRect({...e,seat:1-e.seat},seat,frame);
      const ghost=frame?.sourceFlight?.cloneNode?.(true)||cloneForFlight(source,'fighter',sourceR);
      if(ghost)ghost.classList.add('attack-flight');
      if(!reduce&&ghost&&sourceR&&targetR){playSound('attack');await fly(ghost,sourceR,targetR,root,arenaRect,{duration:330,scale:.82,arc:e.seat===seat?-26:26});}
      if(targetR){const p=overlayPoint(targetR,arenaRect);savageImpact(root,p,{heavy:e.target==='hero',wolf:source?.classList.contains('werewolf')||e.seat!==seat});const trail=document.createElement('i');trail.className='strike-flash';trail.style.left=`${p.x}px`;trail.style.top=`${p.y}px`;root.append(trail);setTimeout(()=>trail.remove(),320);}
    }
    if(e.type==='heal'&&e.drain){
      playSound('drain');
      const source=e.source==='hero'?findHero(e.sourceSeat):findUnit(e.source),from=rect(source)||(e.source==='hero'?frame?.positions?.heroes?.[e.sourceSeat]:frame?.positions?.units?.[e.source]),to=rect(findHero(e.seat)),target=document.querySelector(`[data-hero="${e.seat}"] .hero-portrait`);
      if(from&&to&&!reduce)await appendBloodSiphon(root,{left:from.left,top:from.top,width:from.width,height:from.height,element:source?.querySelector?.('.hero-portrait')||source},{left:to.left,top:to.top,width:to.width,height:to.height,element:target},speed);
    }
    if(e.type==='damage'||e.type==='heal'){
      if(e.type==='heal'&&!e.drain)playSound('heal');
      const target=e.target==='hero'?findHero(e.seat):findUnit(e.target);
      const r=rect(target)||eventTargetRect(e,seat,frame),point=overlayPoint(r,arenaRect);
      if(e.amount>0){const amount=document.createElement('span');amount.className=`floating ${e.type} ${e.target==='hero'?'hero-number':'unit-number'}`;amount.textContent=e.type==='damage'?`−${e.amount}`:`+${e.amount}`;amount.style.left=`${point.x}px`;amount.style.top=`${point.y}px`;root.append(amount);setTimeout(()=>amount.remove(),1250);appendImpact(root,point,e.type);}
      if(e.blocked){const block=document.createElement('span');block.className='floating guard-block';block.textContent=`✧ ${e.blocked} BLOQUEADO`;block.style.left=`${point.x}px`;block.style.top=`${point.y-24}px`;root.append(block);setTimeout(()=>block.remove(),1050);const shield=document.createElement('i');shield.className='guard-impact';shield.style.left=`${point.x}px`;shield.style.top=`${point.y}px`;root.append(shield);setTimeout(()=>shield.remove(),520);}
      if(e.amount>0&&e.type==='damage'){savageImpact(root,point,{heavy:e.amount>=4||e.target==='hero',wolf:arena.classList.contains('werewolf')});}
      if(e.amount>0)tweenTarget(target|| (e.target==='hero'?document.querySelector(`[data-hero="${e.seat}"]`):null),e.type);
      if(e.target==='hero'){
        const hero=document.querySelector(`[data-hero="${e.seat}"]`);
        hero?.classList.add(e.type==='damage'?'hero-damaged':'hero-healed');setTimeout(()=>hero?.classList.remove('hero-damaged','hero-healed'),650);
        if(e.type==='damage'&&e.seat===seat&&!reduce){arena.classList.add('player-hit');setTimeout(()=>arena.classList.remove('player-hit'),430);}
      }else{
        const fighter=target?.closest('.fighter');fighter?.classList.add(e.type==='damage'?'unit-damaged':'unit-healed');setTimeout(()=>fighter?.classList.remove('unit-damaged','unit-healed'),560);
        const stat=fighter?.querySelector('.fighter-health');if(stat){stat.classList.add('health-changed');setTimeout(()=>stat.classList.remove('health-changed'),650);}
      }
      if(e.type==='damage')playSound('damage');
    }
    if(['level','equip','loot','claim','death','synergy','status','item-loot','item-break'].includes(e.type)){
      const r=eventTargetRect(e,seat,frame),point=overlayPoint(r,arenaRect),fx=document.createElement('span');
      fx.className=`floating ${e.type}`;fx.textContent=e.type==='death'?'☠':e.label;fx.style.left=`${point.x}px`;fx.style.top=`${point.y}px`;root.append(fx);setTimeout(()=>fx.remove(),1250);
      if(e.type==='death'&&r&&!reduce){const burst=document.createElement('i');burst.className='death-burst';burst.style.left=`${point.x}px`;burst.style.top=`${point.y}px`;root.append(burst);setTimeout(()=>burst.remove(),620);playSound('death');}
      if(['item-break','item-loot'].includes(e.type)&&r&&!reduce){const burst=document.createElement('i');burst.className=e.type==='item-break'?'gear-shatter':'gear-recovered';burst.style.left=`${point.x}px`;burst.style.top=`${point.y}px`;root.append(burst);setTimeout(()=>burst.remove(),720);playSound(e.type==='item-break'?'damage':'loot');}
      if(e.type==='loot')playSound('loot');
      if(e.type==='synergy')playSound('synergy');
      const lane=e.lane&&document.querySelector(`[data-zone="${e.lane}"]`);if(e.type==='claim'&&lane){lane.classList.add('lane-claimed');setTimeout(()=>lane.classList.remove('lane-claimed'),900);}
    }
    if(['ultimate','combo','round','clash','curse'].includes(e.type)){
      const banner=document.createElement('div');banner.className=`combat-banner ${e.type}`;banner.textContent=e.label;root.append(banner);setTimeout(()=>banner.remove(),1300);
      if(['ultimate','clash','curse'].includes(e.type)&&!reduce){try{arena.animate([{transform:'translate(0)'},{transform:'translate(-6px,3px)'},{transform:'translate(5px,-3px)'},{transform:'translate(-2px,1px)'},{transform:'translate(0)'}],{duration:e.type==='ultimate'?430:290,easing:'ease-out'});}catch{}}
      playSound(e.type);
    }
    if(['equip','skill','ultimate','synergy','summon'].includes(e.type)&&!reduce){const r=eventTargetRect(e,seat,frame);if(r){const point=overlayPoint(r,arenaRect),ring=document.createElement('i');ring.className='ritual-ring '+e.type;ring.style.left=point.x+'px';ring.style.top=point.y+'px';root.append(ring);setTimeout(()=>ring.remove(),800);}}
    if(e.type==='summon'){
      const unit=findUnit(e.target);if(unit&&!reduce){try{unit.animate([{transform:'translateY(42px) scale(.48)',opacity:.15,filter:'brightness(2)'},{transform:'translateY(-8px) scale(1.12)',opacity:1,filter:'brightness(1.3)'},{transform:'translateY(0) scale(1)',opacity:1,filter:'brightness(1)'}],{duration:430,easing:'cubic-bezier(.2,.8,.22,1)'});}catch{}}
      playSound('summon');
    }
    if(!reduce)await sleep((['damage','heal'].includes(e.type)?340:['ultimate','clash','round'].includes(e.type)?600:e.type==='summon'?450:120)/speed);
  }
  cardFlight?.remove();
  if(!reduce)await sleep(100);
}
