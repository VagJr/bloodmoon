const active=new Set();
const killKinds=new Set(['kill','pk-kill','defeat']);
export function deathStyle(event={},id=''){
 if(['tempest','bolt','moonfire','frost'].includes(event.ability)||event.damageType==='magic')return 'burst';
 if(['rend','pounce','execution'].includes(event.ability))return 'shred';
 if(['cleave','strike'].includes(event.ability))return 'split';
 return ['split','shred','burst'][[...String(id)].reduce((sum,c)=>sum+c.charCodeAt(0),0)%3];
}
export function deathEvent(world,id){
 const events=(world.combatEvents||[]).filter(e=>e.targetId===id&&world.serverTime-e.at<2500&&e.at<=world.serverTime);
 // The final damage event carries the actual weapon; generic kill events often
 // say "strike" even for a spell. Prefer the latest damaging hit when present.
 return events.findLast(e=>['hit','critical','enemy-hit'].includes(e.kind))||events.findLast(e=>killKinds.has(e.kind))||{};
}
export function shouldAnimateDeath(wasAlive,hp){return wasAlive===true&&Number.isFinite(hp)&&hp<=0;}
export function corpseFigure(){return '<span class="rw-corpse-mark" aria-hidden="true"><i></i><i></i><i></i></span>';}

/** Capture the original face before DOM morphing replaces it with a remnant. */
export function animateTokenDeath(token,entity,world,zoom){
 const face=token.querySelector(':scope > img'),plane=token.closest('.rw-plane');
 if(!face||!plane||!face.complete||!face.naturalWidth)return;
 const rect=face.getBoundingClientRect(),base=plane.getBoundingClientRect();
 if(!rect.width||!rect.height)return;
 if(active.size>=16){const first=active.values().next().value;first.remove();active.delete(first);}
 const effect=document.createElement('div'),style=deathStyle(deathEvent(world,entity.id||entity.publicId),entity.id||entity.publicId);
 effect.className=`rw-token-death death-${style}`;effect.setAttribute('aria-hidden','true');
 Object.assign(effect.style,{left:`${(rect.left-base.left)/zoom}px`,top:`${(rect.top-base.top)/zoom}px`,width:`${rect.width/zoom}px`,height:`${rect.height/zoom}px`});
 plane.append(effect);active.add(effect);
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches,computed=getComputedStyle(face);
 const polygons=style==='split'?['polygon(0 0,55% 0,47% 24%,56% 43%,43% 59%,52% 78%,45% 100%,0 100%)','polygon(55% 0,100% 0,100% 100%,45% 100%,52% 78%,43% 59%,56% 43%,47% 24%)']:
  Array.from({length:style==='shred'?6:9},(_,i)=>{const cols=3,rows=style==='shred'?2:3,x=i%cols*100/cols,y=Math.floor(i/cols)*100/rows;return `polygon(${x}% ${y}%,${x+100/cols}% ${y}%,${x+100/cols-4}% ${y+100/rows}%,${x}% ${y+100/rows}%)`;});
 const animations=polygons.map((polygon,i)=>{
  const piece=document.createElement('div');piece.className='rw-death-fragment';piece.style.clipPath=polygon;
  const image=document.createElement('img');image.src=face.currentSrc||face.src;image.alt='';
  Object.assign(image.style,{border:computed.border,borderRadius:computed.borderRadius,objectFit:computed.objectFit});piece.append(image);effect.append(piece);
  const angle=(i+.25)/polygons.length*Math.PI*2,dx=style==='split'?(i?32:-32):Math.cos(angle)*(style==='burst'?70:45),dy=style==='split'?20:Math.sin(angle)*38+24;
  return piece.animate(reduced?[{opacity:1},{opacity:0}]:[
   {transform:'translate(0,0) rotate(0deg)',opacity:1,filter:'brightness(1.8)'},
   {transform:`translate(${dx*.45}px,${dy*.2-8}px) rotate(${(i%2?1:-1)*12}deg)`,opacity:1,filter:'brightness(1.2)',offset:.35},
   {transform:`translate(${dx}px,${dy+36}px) rotate(${(i%2?1:-1)*(25+i*8)}deg) scale(.68)`,opacity:0,filter:'brightness(.35)'}
  ],{duration:reduced?180:style==='split'?880:1050,easing:'cubic-bezier(.2,.45,.45,1)',fill:'forwards'});
 });
 if(!reduced){const flare=document.createElement('i');flare.className='rw-death-flare';effect.append(flare);animations.push(flare.animate([{transform:'scale(.25)',opacity:.8},{transform:'scale(1.5)',opacity:0}],{duration:420,fill:'forwards'}));}
 Promise.allSettled(animations.map(a=>a.finished)).then(()=>{effect.remove();active.delete(effect);});
}
export function clearTokenDeaths(){for(const effect of active){for(const animation of effect.getAnimations({subtree:true}))animation.cancel();effect.remove();}active.clear();}
