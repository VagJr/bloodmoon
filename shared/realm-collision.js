// All collision radii and velocities use the map's metric space (x * 1.5, y).
// Keeping this independent of rendering makes server ticks and replays identical.
export const REALM_ASPECT=1.5;
export const realmDistance=(a,b)=>Math.hypot((a.x-b.x)*REALM_ASPECT,a.y-b.y);
export function realmDirection(from,to,fallback={x:1,y:0}){
  const x=(to.x-from.x)*REALM_ASPECT,y=to.y-from.y,length=Math.hypot(x,y);
  return length>.00001?{x:x/length,y:y/length}:fallback;
}
const pointAt=(from,to,t)=>({x:from.x+(to.x-from.x)*t,y:from.y+(to.y-from.y)*t});

export function sweepCircle(from,to,center,radius,{escapeOverlap=false}={}){
  const x=(from.x-center.x)*REALM_ASPECT,y=from.y-center.y,dx=(to.x-from.x)*REALM_ASPECT,dy=to.y-from.y;
  const c=x*x+y*y-radius*radius,dot=x*dx+y*dy,a=dx*dx+dy*dy;
  if(c<=0){if(escapeOverlap&&dot>=0)return null;const length=Math.hypot(x,y)||1;return {t:0,x:from.x,y:from.y,normal:{x:x/length,y:y/length}};}
  if(a<1e-12||dot>=0)return null;
  const discriminant=dot*dot-a*c;if(discriminant<0)return null;
  const t=(-dot-Math.sqrt(discriminant))/a;if(t<0||t>1)return null;
  const point=pointAt(from,to,t);return {...point,t,normal:{x:(point.x-center.x)*REALM_ASPECT/radius,y:(point.y-center.y)/radius}};
}

function sweepMetricBox(from,to,minX,minY,maxX,maxY,escapeOverlap=false){
  const dx=to.x-from.x,dy=to.y-from.y,inside=from.x>minX&&from.x<maxX&&from.y>minY&&from.y<maxY;
  if(inside&&escapeOverlap){
    const distances=[from.x-minX,maxX-from.x,from.y-minY,maxY-from.y],side=distances.indexOf(Math.min(...distances));
    if([dx<0,dx>0,dy<0,dy>0][side])return null;
  }
  let enter=0,leave=1,normal={x:0,y:0};
  for(const [start,delta,min,max,axis] of [[from.x,dx,minX,maxX,'x'],[from.y,dy,minY,maxY,'y']]){
    if(Math.abs(delta)<1e-12){if(start<min||start>max)return null;continue;}
    let first=(min-start)/delta,last=(max-start)/delta,sign=-1;if(first>last){[first,last]=[last,first];sign=1;}
    if(first>enter){enter=first;normal={x:0,y:0,[axis]:sign};}leave=Math.min(leave,last);if(enter>leave)return null;
  }
  return enter>=0&&enter<=1?{t:enter,normal}:null;
}

export function sweepBox(from,to,box,radius=0,{escapeOverlap=false}={}){
  const halfWidth=box.width*REALM_ASPECT/2+radius,halfHeight=box.height/2+radius;
  const collision=sweepMetricBox({x:from.x*REALM_ASPECT,y:from.y},{x:to.x*REALM_ASPECT,y:to.y},box.x*REALM_ASPECT-halfWidth,box.y-halfHeight,box.x*REALM_ASPECT+halfWidth,box.y+halfHeight,escapeOverlap);
  return collision?{...collision,...pointAt(from,to,collision.t)}:null;
}

// A barrier is a finite segment with a rounded thickness, never an infinite wall.
export function sweepCapsule(from,to,start,end,radius){
  const vx=(end.x-start.x)*REALM_ASPECT,vy=end.y-start.y,length=Math.hypot(vx,vy);
  if(length<1e-8)return sweepCircle(from,to,start,radius);
  const ux=vx/length,uy=vy/length;
  const local=point=>{const x=(point.x-start.x)*REALM_ASPECT,y=point.y-start.y;return {x:x*ux+y*uy,y:-x*uy+y*ux};};
  const strip=sweepMetricBox(local(from),local(to),0,-radius,length,radius);
  const hits=[sweepCircle(from,to,start,radius),sweepCircle(from,to,end,radius)];
  if(strip)hits.push({...strip,...pointAt(from,to,strip.t),normal:{x:strip.normal.x*ux-strip.normal.y*uy,y:strip.normal.x*uy+strip.normal.y*ux}});
  return hits.filter(Boolean).sort((a,b)=>a.t-b.t)[0]||null;
}

export function combatObstacles(w){
  const staticObstacles=(w.obstacles||[]).filter(o=>o.solid!==false&&(o.hp===undefined||o.hp>0)).map(o=>({...o,kind:o.kind||'obstacle'}));
  const structures=(w.slots||[]).filter(slot=>slot.occupant?.hp>0&&['construction','resource','weapon','frontline'].includes(slot.kind)).map(slot=>({id:slot.id,kind:'structure',x:slot.x,y:slot.y,radius:slot.kind==='construction'?.95:.6}));
  return [...staticObstacles,...structures];
}

export function firstObstacleCollision(w,from,to,radius=0,options={}){
  let nearest=null;
  for(const obstacle of combatObstacles(w)){
    if(obstacle.id===options.ignoreId)continue;
    const collision=obstacle.width&&obstacle.height?sweepBox(from,to,obstacle,radius,options):sweepCircle(from,to,obstacle,(obstacle.radius||.7)+radius,options);
    if(collision&&(!nearest||collision.t<nearest.t))nearest={...collision,obstacle};
  }
  return nearest;
}

export function moveWithCollisions(w,entity,destination,{radius=.45,ignoreId=entity.id,actors=true,profiles=[],slide=true}={}){
  let position={x:entity.x,y:entity.y},goal={x:Math.max(1,Math.min(299,destination.x)),y:Math.max(1,Math.min(99,destination.y))},blocked=false,normal=null;
  const bodies=actors?(w.actors||[]).filter(a=>a.id!==ignoreId&&a.hp>0&&['hostile','invader','raid','patrol','caravan'].includes(a.kind)).map(a=>({...a,radius:a.kind==='raid'?1:.45})):[];
  for(const p of profiles)if(p.realm?.publicId!==ignoreId&&!p.realm?.activeRoom&&p.realm?.roaming?.hp>0)bodies.push({...p.realm.roaming,radius:.45});
  for(let pass=0;pass<(slide?2:1);pass++){
    let collision=firstObstacleCollision(w,position,goal,radius,{escapeOverlap:true,ignoreId});
    for(const body of bodies){const contact=sweepCircle(position,goal,body,radius+body.radius,{escapeOverlap:true});if(contact&&(!collision||contact.t<collision.t))collision=contact;}
    if(!collision){position=goal;break;}
    blocked=true;normal=collision.normal;const t=Math.max(0,collision.t-.001),contact=pointAt(position,goal,t);
    const rest={x:(goal.x-contact.x)*REALM_ASPECT,y:goal.y-contact.y},inward=Math.min(0,rest.x*normal.x+rest.y*normal.y);
    position=contact;goal={x:contact.x+(rest.x-inward*normal.x)/REALM_ASPECT,y:contact.y+rest.y-inward*normal.y};
  }
  return {...position,blocked,normal};
}
