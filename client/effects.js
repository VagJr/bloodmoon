let enabled=localStorage.getItem('bloodmoon.sound')==='true',context;
export const soundEnabled=()=>enabled;
export function toggleSound(){enabled=!enabled;localStorage.setItem('bloodmoon.sound',String(enabled));if(enabled)playSound('start');}
export function playSound(type){
  if(!enabled)return;
  try{
    context||=new (window.AudioContext||window.webkitAudioContext)();
    if(context.state==='suspended')context.resume();
    const t=context.currentTime,osc=context.createOscillator(),gain=context.createGain();
    osc.connect(gain);gain.connect(context.destination);
    const hit=['attack','damage','ultimate','clash','death'].includes(type);
    osc.type=hit?'sawtooth':'sine';
    osc.frequency.setValueAtTime(hit?145:type==='select'?440:290,t);
    osc.frequency.exponentialRampToValueAtTime(hit?38:720,t+(hit?.28:.18));
    gain.gain.setValueAtTime(0,t);gain.gain.linearRampToValueAtTime(hit?.085:.04,t+.012);
    gain.gain.exponentialRampToValueAtTime(.001,t+(hit?.32:.2));osc.start(t);osc.stop(t+(hit?.33:.21));
  }catch{/* Optional sound never blocks a turn. */}
}
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
    [{transform:'translateX(0) scale(1)',filter:'brightness(1)'},{transform:'translateX(-8px) scale(1.08)',filter:'brightness(2) saturate(1.7)'},{transform:'translateX(6px) scale(.96)',filter:'brightness(1.35)'},{transform:'translateX(0) scale(1)',filter:'brightness(1)'}]:
    [{transform:'scale(1)'},{transform:'scale(1.18)',filter:'brightness(1.4)'},{transform:'scale(1)',filter:'brightness(1)'}],{duration:type==='damage'?430:520,easing:'ease-out'});}catch{}
}

export async function animateEvents(events,seat,frame){
  const root=document.querySelector('#effects'),arena=document.querySelector('.arena');
  if(!root||!arena)return;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches,arenaRect=rect(arena);
  let cardFlight=frame?.cardFlight||null,cardUsed=false;
  for(const e of events.slice(-32)){
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
      if(targetR){const p=overlayPoint(targetR,arenaRect);const trail=document.createElement('i');trail.className='strike-flash';trail.style.left=`${p.x}px`;trail.style.top=`${p.y}px`;root.append(trail);setTimeout(()=>trail.remove(),320);}
    }
    if(e.type==='damage'||e.type==='heal'){
      const target=e.target==='hero'?findHero(e.seat):findUnit(e.target);
      const r=rect(target)||eventTargetRect(e,seat,frame),point=overlayPoint(r,arenaRect);
      if(e.amount>0){const amount=document.createElement('span');amount.className=`floating ${e.type} ${e.target==='hero'?'hero-number':'unit-number'}`;amount.textContent=e.type==='damage'?`−${e.amount}`:`+${e.amount}`;amount.style.left=`${point.x}px`;amount.style.top=`${point.y}px`;root.append(amount);setTimeout(()=>amount.remove(),1250);appendImpact(root,point,e.type);}
      if(e.blocked){const block=document.createElement('span');block.className='floating guard-block';block.textContent=`✧ ${e.blocked} BLOQUEADO`;block.style.left=`${point.x}px`;block.style.top=`${point.y-24}px`;root.append(block);setTimeout(()=>block.remove(),1050);const shield=document.createElement('i');shield.className='guard-impact';shield.style.left=`${point.x}px`;shield.style.top=`${point.y}px`;root.append(shield);setTimeout(()=>shield.remove(),520);}
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
    if(e.type==='summon'){
      const unit=findUnit(e.target);if(unit&&!reduce){try{unit.animate([{transform:'translateY(42px) scale(.48)',opacity:.15,filter:'brightness(2)'},{transform:'translateY(-8px) scale(1.12)',opacity:1,filter:'brightness(1.3)'},{transform:'translateY(0) scale(1)',opacity:1,filter:'brightness(1)'}],{duration:430,easing:'cubic-bezier(.2,.8,.22,1)'});}catch{}}
      playSound('summon');
    }
    if(!reduce)await sleep(e.type==='attack'?50:['ultimate','clash'].includes(e.type)?180:65);
  }
  cardFlight?.remove();
  if(!reduce)await sleep(100);
}
