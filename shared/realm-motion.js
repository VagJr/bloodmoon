const ASPECT=1.5;
const MAX_SPEED=6;

export function sampleRealmMotion(track,position,serverTime,receivedAt){
  const x=Number(position.x),y=Number(position.y);
  if(!Number.isFinite(x)||!Number.isFinite(y))return track;
  if(!track)return {x,y,anchorX:x,anchorY:y,vx:0,vy:0,serverTime,receivedAt,interval:500};
  if(serverTime<=track.serverTime)return track;
  const elapsed=serverTime-track.serverTime,dx=x-track.anchorX,dy=y-track.anchorY;
  const distance=Math.hypot(dx*ASPECT,dy);
  if(distance>6||elapsed>3000){track.x=x;track.y=y;track.vx=0;track.vy=0;}
  else{
    const vx=dx*1000/elapsed,vy=dy*1000/elapsed,speed=Math.hypot(vx*ASPECT,vy);
    const scale=speed>MAX_SPEED?MAX_SPEED/speed:1;
    track.vx=vx*scale;track.vy=vy*scale;
  }
  track.anchorX=x;track.anchorY=y;track.serverTime=serverTime;
  track.receivedAt=receivedAt;track.interval=elapsed;
  return track;
}

export function advanceRealmMotion(track,now,frameMs){
  const limit=Math.min(1700,Math.max(650,track.interval*1.15));
  const age=Math.max(0,Math.min(limit,now-track.receivedAt))/1000;
  let dx=track.vx*age,dy=track.vy*age;
  const distance=Math.hypot(dx*ASPECT,dy);
  if(distance>2.5){const scale=2.5/distance;dx*=scale;dy*=scale;}
  const targetX=track.anchorX+dx,targetY=track.anchorY+dy;
  const easing=1-Math.exp(-Math.min(50,Math.max(0,frameMs))/75);
  track.x+=(targetX-track.x)*easing;
  track.y+=(targetY-track.y)*easing;
  return track;
}
