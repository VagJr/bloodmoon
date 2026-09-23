const reduce=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
export async function tearCombatant(target,speed=1){
 if(!target||reduce())return;
 const box=target.getBoundingClientRect(),arena=document.querySelector('.arena'),bounds=arena?.getBoundingClientRect();if(!bounds)return;
 const pieces=[],cuts=['polygon(0 0,60% 0,44% 35%,58% 53%,32% 75%,39% 100%,0 100%)','polygon(60% 0,100% 0,100% 100%,39% 100%,32% 75%,58% 53%,44% 35%)'];
 for(let i=0;i<2;i++){
  const shard=target.cloneNode(true);shard.removeAttribute('data-unit');shard.classList.add('torn-card-fragment');shard.setAttribute('aria-hidden','true');Object.assign(shard.style,{left:box.left-bounds.left+'px',top:box.top-bounds.top+'px',width:box.width+'px',height:box.height+'px',clipPath:cuts[i]});arena.append(shard);const sign=i===0?-1:1;
  pieces.push(shard.animate([{transform:'translate(0,0) rotate(0)',opacity:1,filter:'brightness(2) sepia(.8) saturate(3)'},{transform:`translate(${sign*20}px,-14px) rotate(${sign*9}deg)`,opacity:1,filter:'brightness(1)',offset:.25},{transform:`translate(${sign*90}px,110px) rotate(${sign*38}deg)`,opacity:0,filter:'brightness(.25)'}],{duration:740/speed,easing:'cubic-bezier(.16,.6,.38,1)',fill:'forwards'}).finished.catch(()=>{}).then(()=>shard.remove()));
 }
 target.style.opacity='0';await Promise.all(pieces);
}
export function savageImpact(root,point,{heavy=false,wolf=false}={}){
 if(!root||reduce())return;
 const arena=root.closest('.arena'),wound=document.createElement('div');
 wound.className=`savage-wound ${wolf?'wolf-claws':'blood-cut'} ${heavy?'heavy':''}`;wound.style.left=point.x+'px';wound.style.top=point.y+'px';
 for(let i=0;i<(wolf?4:3);i++){const cut=document.createElement('i');cut.style.setProperty('--cut',i);wound.append(cut);}root.append(wound);setTimeout(()=>wound.remove(),900);
 const mist=document.createElement('i');mist.className='impact-blood-mist';mist.style.left=point.x+'px';mist.style.top=point.y+'px';root.append(mist);setTimeout(()=>mist.remove(),900);
 const ring=document.createElement('i');ring.className=`impact-pressure-ring ${heavy?'heavy':''}`;ring.style.left=point.x+'px';ring.style.top=point.y+'px';root.append(ring);setTimeout(()=>ring.remove(),760);
 const spray=document.createElement('span');spray.className=`impact-blood-fan ${wolf?'wolf':'vampire'} ${heavy?'heavy':''}`;spray.style.left=point.x+'px';spray.style.top=point.y+'px';
 const count=heavy?24:15;
 for(let i=0;i<count;i++){
  const drop=document.createElement('i'),angle=(-Math.PI*.95)+(Math.PI*.9*i/(count-1))+(Math.random()-.5)*.36,distance=(heavy?58:34)+Math.random()*(heavy?115:78);
  drop.style.setProperty('--blood-x',`${Math.cos(angle)*distance}px`);drop.style.setProperty('--blood-y',`${Math.sin(angle)*distance}px`);
  drop.style.setProperty('--blood-size',`${2+Math.random()*(heavy?8:5)}px`);drop.style.setProperty('--blood-delay',`${Math.random()*95}ms`);spray.append(drop);
 }
 root.append(spray);setTimeout(()=>spray.remove(),880);
 if(heavy&&arena){arena.classList.add('cinematic-impact');arena.classList.add('impact-freeze');setTimeout(()=>arena.classList.remove('impact-freeze'),70);setTimeout(()=>arena.classList.remove('cinematic-impact'),600);try{arena.animate([{transform:'translate(0,0)'},{transform:'translate(-7px,3px) rotate(-.35deg)'},{transform:'translate(8px,-4px) rotate(.4deg)'},{transform:'translate(-4px,2px)'},{transform:'translate(0,0)'}],{duration:420,easing:'steps(5,end)'});}catch{}}
}
