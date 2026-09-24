import {playSound} from '/effects.js';

// A presentation barrier: the authoritative reward view is shown only after this resolves.
export async function shatterDefeatedHeroes(before,after,{speed=1}={}){
 if(after.phase!=='finished'||before.phase==='finished')return;
 const seats=after.players.map((p,i)=>p.health<=0&&before.players[i]?.health>0?i:-1).filter(i=>i>=0);
 if(!seats.length||document.hidden)return;
 await Promise.all(seats.map((seat,i)=>shatterPortrait(seat,{speed,sound:i===0})));
}
async function shatterPortrait(seat,{speed,sound}){
 const portrait=document.querySelector(`[data-hero="${seat}"] .hero-portrait`);if(!portrait)return;
 const box=portrait.getBoundingClientRect();if(!box.width||!box.height)return;
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const layer=document.createElement('div');layer.className='hero-finale';layer.setAttribute('aria-hidden','true');
 layer.style.setProperty('--fx-x',`${box.left+box.width/2}px`);layer.style.setProperty('--fx-y',`${box.top+box.height/2}px`);
 layer.innerHTML='<div class="finale-darkness"></div><div class="finale-radial"></div><div class="finale-shockwave"></div><div class="finale-shockwave secondary"></div><div class="finale-corona"></div><div class="finale-fragments"></div><div class="finale-caption"><small>O ÚLTIMO BATIMENTO</small><b>JURAMENTO ESTILHAÇADO</b></div>';
 document.body.append(layer);
 const animations=[],duration=reduced?650:Math.max(1900,2700/Math.min(speed,1.4));
 const animate=(node,keys,options)=>{const a=node.animate(keys,{fill:'both',...options});animations.push(a);return a;};
 const oldVisibility=portrait.style.visibility;
 const fragment=(polygon)=>{const piece=portrait.cloneNode(true);piece.removeAttribute('id');piece.removeAttribute('data-target');piece.removeAttribute('data-seat');piece.querySelectorAll('[id]').forEach(n=>n.removeAttribute('id'));piece.className='finale-portrait-piece';Object.assign(piece.style,{visibility:'visible',left:box.left+'px',top:box.top+'px',width:box.width+'px',height:box.height+'px',clipPath:polygon});piece.querySelectorAll('.hero-health,.hero-gear-display,.target-cue').forEach(n=>n.remove());layer.querySelector('.finale-fragments').append(piece);return piece;};
 try{
  if(sound)playSound('hero-shatter');
  portrait.style.visibility='hidden';
  const whole=fragment('inset(0 round 12%)');
  if(reduced){layer.classList.add('reduced');animate(whole,[{opacity:1},{opacity:0}],{duration});await new Promise(r=>setTimeout(r,duration));return;}
  const charge=duration*.2;
  animate(whole,[{transform:'scale(1)',filter:'brightness(1)'},{transform:'scale(1.15)',filter:'brightness(1.7) saturate(.5)',offset:.7},{transform:'scale(.94)',filter:'brightness(3)',offset:.98},{opacity:0}],{duration:charge,easing:'ease-in'});
  const vertices=[[0,0],[25,0],[50,0],[75,0],[100,0],[100,25],[100,50],[100,75],[100,100],[75,100],[50,100],[25,100],[0,100],[0,75],[0,50],[0,25]],center=[48,53];
  const spread=Math.min(innerWidth,innerHeight)*.55;
  for(let i=0;i<vertices.length;i++){
   const a=vertices[i],b=vertices[(i+1)%vertices.length],angle=Math.atan2((a[1]+b[1])/2-53,(a[0]+b[0])/2-48),distance=spread*(.65+(i%4)*.18);
   const piece=fragment(`polygon(${center[0]}% ${center[1]}%,${a[0]}% ${a[1]}%,${b[0]}% ${b[1]}%)`);
   animate(piece,[{opacity:0,transform:'translate3d(0,0,0) scale(1)',offset:0},{opacity:1,transform:'translate3d(0,0,0) scale(1)',offset:.001},{opacity:1,filter:'brightness(1.8) sepia(.25)',offset:.12},{opacity:0,transform:`translate3d(${Math.cos(angle)*distance}px,${Math.sin(angle)*distance+120}px,${70+i*10}px) rotateX(${i%2?160:-150}deg) rotateZ(${(i%2?1:-1)*(80+i*8)}deg) scale(.45)`,filter:'brightness(.15) sepia(1)',offset:1}],{delay:charge,duration:duration-charge,easing:'cubic-bezier(.12,.65,.25,1)'});
  }
  const sparks=innerWidth<600?24:42;
  for(let i=0;i<sparks;i++){
   const spark=document.createElement('i');spark.className='finale-ember';layer.append(spark);const angle=i*2.39996,dist=spread*(.4+(i%7)/7);
   animate(spark,[{opacity:0,transform:'translate(-50%,-50%) scale(0)'},{opacity:1,offset:.08},{opacity:0,transform:`translate(${Math.cos(angle)*dist}px,${Math.sin(angle)*dist+80}px) rotate(${i*27}deg) scale(.2)`}],{delay:charge+(i%5)*18,duration:900+(i%6)*90,easing:'cubic-bezier(.1,.6,.3,1)'});
  }
  animate(layer.querySelector('.finale-darkness'),[{opacity:0},{opacity:.86,offset:.16},{opacity:.68,offset:.72},{opacity:0}],{duration});
  for(const [i,wave] of [...layer.querySelectorAll('.finale-shockwave')].entries())animate(wave,[{opacity:0,transform:'translate(-50%,-50%) scale(.04)'},{opacity:.8,offset:.1},{opacity:0,transform:`translate(-50%,-50%) scale(${i?1.4:1})`}],{delay:charge+i*110,duration:850+i*200,easing:'cubic-bezier(.1,.7,.25,1)'});
  animate(layer.querySelector('.finale-radial'),[{opacity:0,transform:'translate(-50%,-50%) scale(.2)'},{opacity:.95,offset:.15},{opacity:0,transform:'translate(-50%,-50%) scale(1.3) rotate(35deg)'}],{delay:charge,duration:1050});
  animate(layer.querySelector('.finale-corona'),[{opacity:0,transform:'translate(-50%,-50%) scale(.1)'},{opacity:1,offset:.12},{opacity:0,transform:'translate(-50%,-50%) scale(1.8)'}],{delay:charge,duration:600});
  const arena=document.querySelector('.arena');if(arena)animate(arena,[{transform:'translate(0)'},{transform:'translate(-9px,5px)',offset:.12},{transform:'translate(7px,-4px)',offset:.26},{transform:'translate(-5px,3px)',offset:.42},{transform:'translate(3px,-2px)',offset:.65},{transform:'translate(0)'}],{delay:charge,duration:520});
  animate(layer.querySelector('.finale-caption'),[{opacity:0,transform:'translateY(12px)'},{opacity:1,offset:.2},{opacity:1,offset:.75},{opacity:0,transform:'translateY(-5px)'}],{delay:duration*.45,duration:duration*.55});
  await new Promise(r=>setTimeout(r,duration));
 }finally{animations.forEach(a=>a.cancel());layer.remove();portrait.style.visibility=oldVisibility;}
}
