import {playSound} from '/effects.js';
const sprite=new Image();sprite.src='/assets/market/bloodmoon-gold-coin.png';
const texture=document.createElement('canvas');texture.width=texture.height=80;let textureReady=false;sprite.addEventListener('load',()=>{texture.getContext('2d').drawImage(sprite,0,0,80,80);textureReady=true;});
const saves=new Map();let active=null;
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
export function vaultCoinCount(balance){return balance>0?Math.min(64,Math.max(1,Math.ceil(Math.sqrt(balance)*1.5))):0;}
function mount(canvas){
 const ctx=canvas.getContext('2d');if(!ctx)return()=>{};
 const key=canvas.dataset.owner,balance=Number(canvas.dataset.balance)||0,saved=saves.get(key);
 let coins=saved?.coins||[],drag=null,pointer=null,frame=0,previous=0,quiet=0,disposed=false,lastClink=0,settling=false;
 const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches;
 const desired=vaultCoinCount(balance),oldBalance=saved?.balance??balance;
 // Every deposit gets a visible new fall, even when the bounded representation stays at its cap.
 if(balance>oldBalance&&coins.length>=desired)coins.splice(0,Math.min(6,coins.length));
 if(coins.length>desired)coins=coins.slice(0,desired);
 while(coins.length<desired){const i=coins.length;coins.push({x:80+Math.random()*320,y:reduced?240-Math.floor(i/14)*25:-20-i*19,vx:(Math.random()-.5)*60,vy:0,r:13,a:Math.random()*6,spin:(Math.random()-.5)*2});}
 saves.set(key,{balance,coins});if(saves.size>3)saves.delete(saves.keys().next().value);
 function size(){const dpr=Math.min(devicePixelRatio||1,2);canvas.width=Math.round(480*dpr);canvas.height=Math.round(300*dpr);ctx.setTransform(dpr,0,0,dpr,0,0);wake();}
 function polygon(points,fill,stroke){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=fill;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}}
 function draw(){
  ctx.clearRect(0,0,480,300);
  const bed=ctx.createLinearGradient(0,80,0,280);bed.addColorStop(0,'#080c12');bed.addColorStop(1,'#343038');
  ctx.shadowColor='#000';ctx.shadowBlur=15;ctx.shadowOffsetY=10;
  polygon([[26,78],[454,78],[424,280],[56,280]],'#332b22','#a98a55');ctx.shadowBlur=0;ctx.shadowOffsetY=0;
  polygon([[44,90],[436,90],[408,264],[72,264]],bed,'#65543a');
  ctx.strokeStyle='#ba965326';ctx.lineWidth=1;
  for(let x=85;x<430;x+=38){ctx.beginPath();ctx.moveTo(x,97);ctx.lineTo(x-8,258);ctx.stroke();}
  ctx.fillStyle='#b79b6444';ctx.textAlign='center';ctx.font='32px Georgia';ctx.fillText('☾',240,180);
  for(const c of coins){
   ctx.save();ctx.translate(c.x,c.y);ctx.rotate(c.a);ctx.shadowColor='#000a';ctx.shadowBlur=3;ctx.shadowOffsetY=3;
   if(textureReady){ctx.drawImage(texture,-c.r,-c.r,c.r*2,c.r*2);}
   else{ctx.fillStyle='#d6b25e';ctx.beginPath();ctx.arc(0,0,c.r,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#f3dc9a';ctx.stroke();}
   ctx.restore();
  }
  polygon([[26,78],[44,90],[72,264],[56,280]],'#6a5232','#c1a16a');
  polygon([[454,78],[436,90],[408,264],[424,280]],'#42382c','#a88753');
  const front=ctx.createLinearGradient(0,264,0,294);front.addColorStop(0,'#b39052');front.addColorStop(.2,'#55412b');front.addColorStop(1,'#1a1718');
  polygon([[56,264],[424,264],[424,290],[56,290]],front,'#c8a66d');
  for(const x of [68,412]){ctx.fillStyle='#efd49c';ctx.beginPath();ctx.arc(x,276,3,0,7);ctx.fill();}
  ctx.fillStyle='#e2c68e';ctx.font='10px Georgia';ctx.fillText('TESOURO DE VÉSPERA',240,282);
 }
 function step(dt){
  let impact=0,motion=0;
  for(const c of coins){
   if(c===drag)continue;c.vy+=620*dt;c.vx*=Math.pow(.99,dt*60);c.x+=c.vx*dt;c.y+=c.vy*dt;c.a+=c.spin*dt;
   const side=44+clamp((c.y-90)/174,0,1)*28;
   if(c.x<side+c.r){c.x=side+c.r;c.vx=Math.abs(c.vx)*.4;}if(c.x>480-side-c.r){c.x=480-side-c.r;c.vx=-Math.abs(c.vx)*.4;}
   if(c.y>264-c.r){impact=Math.max(impact,Math.abs(c.vy));c.y=264-c.r;c.vy=Math.abs(c.vy)<35?0:-Math.abs(c.vy)*.28;c.vx*=.9;c.spin*=.9;}
  }
  for(let pass=0;pass<4;pass++)for(let i=0;i<coins.length;i++)for(let j=i+1;j<coins.length;j++){
   const a=coins[i],b=coins[j],dx=b.x-a.x,dy=b.y-a.y,d=Math.hypot(dx,dy),min=a.r+b.r;if(d>=min)continue;
   const nx=d?dx/d:1,ny=d?dy/d:0,wa=a===drag?0:1,wb=b===drag?0:1,total=wa+wb;if(!total)continue;
   const overlap=min-d;if(wa){a.x-=nx*overlap*wa/total;a.y-=ny*overlap*wa/total;}if(wb){b.x+=nx*overlap*wb/total;b.y+=ny*overlap*wb/total;}
   const relative=(b.vx-a.vx)*nx+(b.vy-a.vy)*ny;
   if(relative<0){const impulse=-(1.15)*relative/total;if(wa){a.vx-=impulse*nx;a.vy-=impulse*ny;}if(wb){b.vx+=impulse*nx;b.vy+=impulse*ny;}impact=Math.max(impact,-relative);}
  }
  for(const c of coins){const side=44+clamp((c.y-90)/174,0,1)*28;c.x=clamp(c.x,side+c.r,480-side-c.r);c.y=Math.min(c.y,264-c.r);motion+=Math.abs(c.vx)+Math.abs(c.vy);}
  if(!settling&&impact>95&&performance.now()-lastClink>180){lastClink=performance.now();playSound('coin-tap');}
  quiet=!drag&&motion<=coins.length*14?quiet+1:0;
 }
 function tick(time){frame=0;if(disposed||document.hidden)return;const dt=Math.min(.032,(time-previous)/1000||.016);previous=time;step(dt/2);step(dt/2);draw();if(drag||quiet<100)frame=requestAnimationFrame(tick);}
 function wake(){quiet=0;previous=performance.now();if(!frame&&!disposed&&!document.hidden)frame=requestAnimationFrame(tick);}
 function point(e){const r=canvas.getBoundingClientRect();return {x:(e.clientX-r.left)*480/r.width,y:(e.clientY-r.top)*300/r.height};}
 canvas.addEventListener('pointerdown',e=>{if(e.button!==0||pointer!==null)return;const p=point(e);drag=[...coins].reverse().find(c=>Math.hypot(c.x-p.x,c.y-p.y)<c.r+10);if(!drag)return;pointer=e.pointerId;canvas.setPointerCapture(pointer);e.preventDefault();drag.vx=drag.vy=0;canvas.classList.add('grabbing');wake();});
 canvas.addEventListener('pointermove',e=>{if(e.pointerId!==pointer||!drag)return;const p=point(e),x=clamp(p.x,65,415),y=clamp(p.y,16,250);drag.vx=clamp((x-drag.x)*12,-350,350);drag.vy=clamp((y-drag.y)*12,-350,350);drag.x=x;drag.y=y;wake();});
 function release(e){if(e.pointerId!==pointer)return;drag=null;pointer=null;canvas.classList.remove('grabbing');wake();}
 canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',release);
 canvas.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();coins.forEach(c=>{c.vy=-100-Math.random()*120;c.vx=(Math.random()-.5)*100;});wake();}});
 const visibility=()=>{if(document.hidden){cancelAnimationFrame(frame);frame=0;drag=null;pointer=null;}else wake();};document.addEventListener('visibilitychange',visibility);
 sprite.addEventListener('load',wake);size();if(reduced){settling=true;for(let n=0;n<180;n++)step(1/60);settling=false;draw();}
 return ()=>{disposed=true;cancelAnimationFrame(frame);sprite.removeEventListener('load',wake);document.removeEventListener('visibilitychange',visibility);};
}
function sync(){const canvas=document.querySelector('[data-vault-physics]');if(active?.canvas===canvas)return;active?.dispose();active=canvas?{canvas,dispose:mount(canvas)}:null;}
new MutationObserver(sync).observe(document.querySelector('#app'),{childList:true,subtree:true});sync();
