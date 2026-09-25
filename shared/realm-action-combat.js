import {RuleError} from './engine.js';
import {ABILITIES,ensureRpg,rpgStats,rollD20,rollDice} from './realm-rpg.js';
import {REALM_ASPECT,realmDistance as distance,realmDirection,combatObstacles,firstObstacleCollision,sweepCircle,sweepCapsule,moveWithCollisions} from './realm-collision.js';
export {moveWithCollisions} from './realm-collision.js';

const hostile=a=>['hostile','invader','raid'].includes(a.kind)&&a.hp>0;
const defenses=new Set(['guard','parry','reflect','dash']);
const profileList=profiles=>profiles instanceof Map?[...profiles.values()]:Array.isArray(profiles)?profiles:Object.values(profiles||{});
const active=(p,now)=>p?.realm?.roaming?.hp>0&&!p.realm.activeRoom&&(!p.realm.seenAt||now-p.realm.seenAt<45000);
const peaceful=(s,regions)=>regions.some(n=>n.kind==='sanctuary'&&distance(s,n)<5);
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
function state(w){w.combatCasts||=[];w.projectiles||=[];w.combatEvents||=[];w.serial||=0;}
export function combatEvent(w,event,now){state(w);const e={...event,id:`combat-${++w.serial}`,at:now};w.combatEvents.push(e);w.combatEvents=w.combatEvents.filter(e=>now-e.at<5000).slice(-100);return e;}

export function cancelActionCombat(w,p,now,reason='cancel'){
  state(w);const r=ensureRpg(p),cast=r.cast;
  w.combatCasts=w.combatCasts.filter(c=>c.source!==p.realm.publicId);r.cast=null;
  if(['defeat','recover','inactive'].includes(reason)){removeBarrier(r);r.evadeUntil=0;r.staggerUntil=0;r.globalAt=0;w.projectiles=w.projectiles.filter(shot=>shot.source!==p.realm.publicId);}
  if(cast)combatEvent(w,{source:p.realm.publicId,ability:cast.ability,kind:'interrupt',x:p.realm.roaming.x,y:p.realm.roaming.y,label:reason==='cancel'?'CANCELADO':'INTERROMPIDO',reason},now);
  return !!cast;
}
function removeBarrier(r){r.barrier=null;r.guardUntil=0;}
function barrierGeometry(p){
  const b=p.rpg?.barrier;if(!b)return null;const s=p.realm.roaming,x=s.x+b.facingX*.72/REALM_ASPECT,y=s.y+b.facingY*.72;
  return {...b,source:p.realm.publicId,x:s.x,y:s.y,radius:1.15,thickness:.13,startX:x-b.facingY*1.15/REALM_ASPECT,startY:y+b.facingX*1.15,endX:x+b.facingY*1.15/REALM_ASPECT,endY:y-b.facingX*1.15};
}
function barrierContact(p,from,to,radius,now,damageType,until=now){
  const b=barrierGeometry(p);if(!b||b.expiresAt<=now||b.hp<=0)return null;
  if((b.kind==='parry'&&damageType!=='physical')||(b.kind==='reflect'&&damageType!=='magic'))return null;
  const incoming=realmDirection(from,to),towards=incoming.x*b.facingX+incoming.y*b.facingY;
  if(towards>=-.08)return null;
  const contact=sweepCapsule(from,to,{x:b.startX,y:b.startY},{x:b.endX,y:b.endY},radius+b.thickness);
  const impactAt=contact?now+(until-now)*contact.t:now;
  return contact&&b.expiresAt>impactAt&&(!b.startedAt||b.startedAt<=impactAt)?{...contact,impactAt,barrier:b}:null;
}
function interruptActor(w,a,p,now,duration=1200){
  if(!a)return;a.windup=null;a.staggerUntil=Math.max(a.staggerUntil||0,now+duration);a.rootUntil=Math.max(a.rootUntil||0,now+duration);a.attackAt=Math.max(a.attackAt||0,now+duration);
  combatEvent(w,{source:p.realm.publicId,targetId:a.id,ability:'parry',x:a.x,y:a.y,kind:'interrupt',duration,label:'ATORDOADO'},now);
}
function absorbBarrier(w,p,contact,damage,damageType,source,now,projectile=null){
  const r=ensureRpg(p),b=r.barrier;if(!b)return {damage,reflected:false};
  const base={source,targetId:p.realm.publicId,ability:b.kind,damageType,x:contact.x,y:contact.y,fromX:projectile?.fromX,fromY:projectile?.fromY,projectileId:projectile?.id,directionX:b.facingX,directionY:b.facingY};
  if(b.kind==='parry'){
    interruptActor(w,w.actors.find(a=>a.id===source),p,now);removeBarrier(r);r.globalAt=now;
    combatEvent(w,{...base,kind:'parry',amount:damage,label:'CONTRA-ATAQUE',duration:650},now);return {damage:0,reflected:false};
  }
  if(b.kind==='reflect'&&projectile){
    const owner=w.actors.find(a=>a.id===source),direction=owner?realmDirection(contact,owner):{x:-projectile.velocityX*REALM_ASPECT/projectile.speed,y:-projectile.velocityY/projectile.speed};
    projectile.source=p.realm.publicId;projectile.targetId=owner?.id||null;projectile.team='player';projectile.reflected=true;projectile.damage=Math.max(1,damage);projectile.ability='reflect';
    projectile.x=contact.x+direction.x*.04/REALM_ASPECT;projectile.y=contact.y+direction.y*.04;projectile.fromX=contact.x;projectile.fromY=contact.y;
    projectile.velocityX=direction.x*projectile.speed/REALM_ASPECT;projectile.velocityY=direction.y*projectile.speed;projectile.lastAt=now;projectile.expiresAt=now+1800;
    removeBarrier(r);r.globalAt=now;interruptActor(w,owner,p,now,700);
    combatEvent(w,{...base,source:p.realm.publicId,targetId:owner?.id,kind:'reflect',amount:damage,label:'REFLETIDO',duration:700},now);return {damage:0,reflected:true};
  }
  const absorbed=Math.min(b.hp,damage);b.hp-=absorbed;
  combatEvent(w,{...base,kind:b.hp>0?'block':'guard-break',amount:absorbed,label:b.hp>0?'BLOQUEIO':'GUARDA QUEBRADA',duration:500},now);
  if(b.hp<=0){removeBarrier(r);r.staggerUntil=now+300;cancelActionCombat(w,p,now,'guard-break');}
  return {damage:Math.max(0,damage-absorbed),reflected:false};
}

export function actionCombat(w,p,input,regions,now,hit,rng=Math.random){
  state(w);const r=ensureRpg(p),s=p.realm.roaming,stats=rpgStats(p),a=ABILITIES[input.ability];const check=(v,m)=>{if(!v)throw new RuleError(m);};
  check(s.hp>0&&!p.realm.activeRoom,'Você precisa estar vivo e no mundo para agir.');
  check(a&&r.level>=a.level,'Esta habilidade ainda não foi aprendida.');check(now>=(r.cooldowns[a.id]||0),'A habilidade está se recuperando.');
  check(now>=(r.staggerUntil||0),'Sua guarda foi quebrada. Recupere o equilíbrio.');
  check(defenses.has(a.id)||now>=(r.globalAt||0),'Conclua o golpe atual.');check(s.energy>=a.energy&&r.mana>=a.mana,'Vigor ou mana insuficiente.');
  const target=w.actors.find(t=>t.id===input.targetId&&hostile(t)),aim={x:Number(input.x),y:Number(input.y)};
  if(!Number.isFinite(aim.x)||!Number.isFinite(aim.y)){aim.x=target?.x??s.x+(r.facingX??1)*2/REALM_ASPECT;aim.y=target?.y??s.y+(r.facingY||0)*2;}
  const targetPoint=target||aim,direction=realmDirection(s,targetPoint,{x:r.facingX??1,y:r.facingY||0});
  if(!defenses.has(a.id)&&a.id!=='mend'){check(!peaceful(s,regions),'O Pacto de Paz protege este santuário.');check(distance(s,targetPoint)<=a.range+1,'O alvo está fora do alcance.');}
  // Validate everything before cancelling or charging an existing action.
  cancelActionCombat(w,p,now,'cancel');removeBarrier(r);r.cooldowns[a.id]=now+a.cooldown;r.globalAt=now+(a.windup||Math.min(180,a.cooldown));s.energy-=a.energy;r.mana-=a.mana;s.targetId=null;s.targetUntil=0;
  r.facingX=direction.x;r.facingY=direction.y;
  const base={ability:a.id,source:p.realm.publicId,x:targetPoint.x,y:targetPoint.y,fromX:s.x,fromY:s.y,damageType:a.damageType,directionX:direction.x,directionY:direction.y};
  if(a.id==='dash'){
    let dx=Number(input.dx),dy=Number(input.dy);if(!Number.isFinite(dx)||!Number.isFinite(dy)||!Math.hypot(dx,dy)){dx=direction.x;dy=direction.y;}const length=Math.hypot(dx,dy)||1;
    const position=moveWithCollisions(w,{...s,id:p.realm.publicId},{x:s.x+dx/length*a.range/REALM_ASPECT,y:s.y+dy/length*a.range},{slide:false});
    s.x=position.x;s.y=position.y;r.evadeStartedAt=now;r.evadeUntil=now+500;s.moveAt=now;s.displacement=(s.displacement||0)+1;r.globalAt=now;
    combatEvent(w,{...base,x:s.x,y:s.y,label:position.blocked?'ESQUIVA · COLISÃO':'ESQUIVA',kind:'dash',blocked:position.blocked,duration:500},now);return {message:'',displaced:true};
  }
  if(['guard','parry','reflect'].includes(a.id)){
    const duration={guard:3000,parry:650,reflect:800}[a.id],durability=a.id==='guard'?28+r.level*3+Math.max(0,stats.modifiers.constitution)*3+(r.path==='sentinel'?18:0):1;
    r.barrier={id:`barrier-${++w.serial}`,kind:a.id,facingX:direction.x,facingY:direction.y,hp:durability,maxHp:durability,startedAt:now,expiresAt:now+duration,perfectUntil:now+(a.id==='guard'?0:duration)};r.guardUntil=now+duration;
    combatEvent(w,{...base,x:s.x,y:s.y,kind:'guard',label:{guard:'BARREIRA',parry:'CONTRAGUARDA',reflect:'ESPELHO DO VÉU'}[a.id],duration,radius:1.15},now);return {message:''};
  }
  if(a.id==='mend'){
    const before=s.hp,amount=rollDice(2,8,rng)+stats.modifiers.wisdom+r.level;s.hp=Math.min(s.maxHp,s.hp+amount);
    combatEvent(w,{...base,x:s.x,y:s.y,kind:'heal',label:`+${s.hp-before}`,amount:s.hp-before},now);return {message:''};
  }
  const cast={id:`cast-${++w.serial}`,source:p.realm.publicId,ability:a.id,x:s.x,y:s.y,aimX:targetPoint.x,aimY:targetPoint.y,targetId:target?.id||null,startedAt:now,endsAt:now+a.windup,radius:a.area||.6,directionX:direction.x,directionY:direction.y};
  w.combatCasts.push(cast);r.cast={...cast};
  combatEvent(w,{...base,kind:'cast',label:a.name,duration:a.windup,radius:a.area||.6,castId:cast.id},now);return {message:'',castId:cast.id};
}

function damageActor(w,p,t,a,now,hit,rng,origin,projectile=null){
  const r=ensureRpg(p),s=p.realm.roaming,stats=rpgStats(p);let roll,saved=false,damage;
  if(projectile?.reflected){damage=projectile.damage;roll={natural:0,total:0,defense:0,critical:false,hit:true,reflected:true};}
  else{
    const defense=10+Math.min(8,t.level||1)+(t.kind==='raid'?2:0),attribute=a.id==='strike'&&r.path==='stalker'?'dexterity':a.attribute;
    roll=rollD20(stats.proficiency+stats.modifiers[attribute]+(r.talents.precision||0),defense,rng,t.rootUntil>now?1:0);
    if(a.save){roll=rollD20(Math.min(5,t.level||1),8+stats.proficiency+stats.modifiers[a.attribute],rng);saved=roll.hit;roll={...roll,save:true,hit:true,critical:false};}
    const count=(a.id==='tempest'?2:1)*(roll.critical?2:1),magical=a.damageType==='magic';
    damage=roll.hit?Math.max(1,rollDice(count,a.dice,rng)+stats.modifiers[attribute]+(magical?(r.talents.channel||0)+(p.campaign?.projects.observatory||0)*2:stats.weapon)+Math.floor(r.level/3)):0;
    if(a.id==='strike'&&roll.hit){r.combo=now-r.comboAt<2200?(r.combo+1)%3:1;r.comboAt=now;if(r.combo===0)damage+=4;}
    if(roll.critical&&r.path==='stalker')damage+=4;if(saved)damage=Math.floor(damage/2);
  }
  if(damage){hit(w,t,damage,p,now);if(a.id==='frost'&&!saved)t.rootUntil=now+2000;if(a.id==='drain')s.hp=Math.min(s.maxHp,s.hp+Math.ceil(damage/2));}
  s.lastCombatAt=now;
  const e=combatEvent(w,{ability:projectile?.reflected?'reflect':a.id,source:p.realm.publicId,targetId:t.id,x:t.x,y:t.y,fromX:origin.x,fromY:origin.y,damageType:a.damageType||'magic',projectileId:projectile?.id,roll,saved,amount:damage,kind:roll.critical?'critical':damage?'hit':'miss',label:roll.critical?`CRÍTICO ${damage}`:saved?`${damage} · RESISTIU`:damage?`${damage}`:'ESQUIVA'},now);
  r.log.unshift({id:e.id,at:now,ability:projectile?.reflected?'Espelho do Véu':a.name,target:t.name,...roll,damage,saved});r.log=r.log.slice(0,8);
}
function launchCast(w,p,cast,now,hit,rng){
  const s=p.realm.roaming,a=ABILITIES[cast.ability],aim={x:cast.aimX,y:cast.aimY},direction=realmDirection(s,aim,{x:cast.directionX,y:cast.directionY});
  if(a.damageType==='physical'){
    const candidates=w.actors.filter(t=>hostile(t)&&distance(s,t)<=a.range+.45).filter(t=>{const dir=realmDirection(s,t);return dir.x*direction.x+dir.y*direction.y>=(a.id==='cleave'?.15:.7);}).sort((a,b)=>distance(s,a)-distance(s,b));
    const victims=candidates.filter(t=>!firstObstacleCollision(w,s,t,.1));
    if(a.id==='strike')victims.splice(1);
    if(!victims.length)combatEvent(w,{source:p.realm.publicId,ability:a.id,kind:'miss',x:aim.x,y:aim.y,fromX:s.x,fromY:s.y,label:'SEM CONTATO',damageType:'physical'},now);
    for(const t of victims.slice(0,5))damageActor(w,p,t,a,now,hit,rng,s);
    return;
  }
  const range=a.area?Math.min(a.range,Math.max(.7,distance(s,aim))):a.range;
  const projectile={id:`projectile-${++w.serial}`,source:p.realm.publicId,targetId:cast.targetId,team:'player',ability:a.id,damageType:a.damageType,x:s.x,y:s.y,fromX:s.x,fromY:s.y,velocityX:direction.x*a.speed/REALM_ASPECT,velocityY:direction.y*a.speed,speed:a.speed,radius:.2,createdAt:now,lastAt:now,expiresAt:now+range/a.speed*1000};
  w.projectiles.push(projectile);combatEvent(w,{...projectile,kind:'launch',duration:range/a.speed*1000,label:''},now);
}
function hitPlayer(w,p,source,damage,roll,now,origin,ability='enemy',damageType='physical'){
  const s=p.realm.roaming,r=ensureRpg(p),evaded=r.evadeUntil>now;if(evaded)damage=0;
  s.hp=Math.max(0,s.hp-damage);s.lastCombatAt=now;
  if(damage&&r.cast){cancelActionCombat(w,p,now,'damage');r.globalAt=now+180;}
  combatEvent(w,{source,targetId:p.realm.publicId,fromX:origin.x,fromY:origin.y,x:s.x,y:s.y,kind:damage?'enemy-hit':'evade',ability,damageType,amount:damage,label:damage?`−${damage}`:evaded?'ESQUIVA':'DEFESA',roll},now);return damage;
}

export function enemyAttack(w,a,p,now,rng=Math.random,area=null){
  state(w);if(!active(p,now)||a.hp<=0||a.staggerUntil>now)return 0;
  const s=p.realm.roaming,r=ensureRpg(p),stats=rpgStats(p),aim=area||s,damageType=area?.damageType||a.attackType||'physical',direction=realmDirection(a,aim);
  if(damageType==='magic'||a.ranged){
    const speed=damageType==='magic'?8:11,range=9;
    const projectile={id:`projectile-${++w.serial}`,source:a.id,targetId:p.realm.publicId,team:'enemy',ability:damageType==='magic'?'enemy-bolt':'enemy',damageType,x:a.x,y:a.y,fromX:a.x,fromY:a.y,velocityX:direction.x*speed/REALM_ASPECT,velocityY:direction.y*speed,speed,radius:.22,damage:a.attack,level:a.level||1,createdAt:now,lastAt:now,expiresAt:now+range/speed*1000};
    w.projectiles.push(projectile);combatEvent(w,{...projectile,kind:'launch',duration:range/speed*1000,label:''},now);return 0;
  }
  const reach=2.8,targetDirection=realmDirection(a,s),contact=distance(a,s)<=reach+.45&&targetDirection.x*direction.x+targetDirection.y*direction.y>=.72;
  const end={x:a.x+direction.x*reach/REALM_ASPECT,y:a.y+direction.y*reach};
  if(!contact||firstObstacleCollision(w,a,s,.08)){
    combatEvent(w,{source:a.id,targetId:p.realm.publicId,ability:'enemy',kind:'miss',damageType,x:end.x,y:end.y,fromX:a.x,fromY:a.y,label:'EVITADO'},now);return 0;
  }
  if(r.evadeUntil>now)return hitPlayer(w,p,a.id,0,null,now,a);
  const barrier=barrierContact(p,a,s,.15,now,damageType);
  if(barrier){const result=absorbBarrier(w,p,barrier,a.attack,damageType,a.id,now);if(!result.damage){s.lastCombatAt=now;return 0;}return hitPlayer(w,p,a.id,result.damage,null,now,a);}
  const roll=rollD20(2+Math.floor((a.level||1)/2),stats.defense,rng),damage=roll.hit?Math.max(1,a.attack+(roll.critical?rollDice(1,6,rng):0)):0;
  return hitPlayer(w,p,a.id,damage,roll,now,a);
}

function explode(w,shot,p,point,now,hit,rng){
  const a=ABILITIES[shot.ability];if(!a?.area)return;
  combatEvent(w,{source:shot.source,ability:a.id,kind:'impact',x:point.x,y:point.y,fromX:shot.fromX,fromY:shot.fromY,radius:a.area,damageType:'magic',projectileId:shot.id,label:''},now);
  for(const target of w.actors.filter(t=>hostile(t)&&distance(point,t)<=a.area).slice(0,8))if(!firstObstacleCollision(w,point,target,.02))damageActor(w,p,target,a,now,hit,rng,point,shot);
}

export function advanceActionCombat(w,profiles,regions,now,hit,rng=Math.random){
  state(w);const all=profileList(profiles),players=all.filter(p=>active(p,now)),byId=new Map(players.map(p=>[p.realm.publicId,p]));
  for(const p of all.filter(p=>p.realm?.roaming)){
    const r=ensureRpg(p);
    if(!active(p,now)){cancelActionCombat(w,p,now,'inactive');removeBarrier(r);r.evadeUntil=0;continue;}
  }
  const pending=[];
  for(const cast of w.combatCasts){
    const p=byId.get(cast.source);if(!p||p.rpg.cast?.id!==cast.id)continue;
    if(cast.endsAt>now){pending.push(cast);continue;}
    p.rpg.cast=null;
    if(!peaceful(p.realm.roaming,regions))launchCast(w,p,cast,cast.endsAt,hit,rng);
  }
  w.combatCasts=pending;
  const remaining=[];
  for(const shot of w.projectiles){
    const owner=shot.team==='player'?byId.get(shot.source):w.actors.find(a=>a.id===shot.source&&hostile(a));
    if(!owner)continue;
    const until=Math.min(now,shot.expiresAt),elapsed=Math.max(0,until-shot.lastAt)/1000;
    if(!elapsed){if(now<shot.expiresAt)remaining.push(shot);continue;}
    const from={x:shot.x,y:shot.y},to={x:shot.x+shot.velocityX*elapsed,y:shot.y+shot.velocityY*elapsed};
    let collision=firstObstacleCollision(w,from,to,shot.radius);
    if(collision)collision.kind='obstacle';
    const victims=shot.team==='player'?w.actors.filter(hostile):players.filter(p=>!peaceful(p.realm.roaming,regions));
    for(const victim of victims){
      const entity=shot.team==='player'?victim:victim.realm.roaming;
      if(shot.team==='enemy'){
        const barrier=barrierContact(victim,from,to,shot.radius,shot.lastAt,shot.damageType,until);
        if(barrier&&(!collision||barrier.t<collision.t))collision={...barrier,kind:'barrier',victim};
      }
      const contact=sweepCircle(from,to,entity,shot.radius+(entity.kind==='raid'?1:.45));
      if(shot.team==='enemy'&&contact){const at=shot.lastAt+(until-shot.lastAt)*contact.t;if(victim.rpg?.evadeUntil>at&&(victim.rpg.evadeStartedAt||0)<=at)continue;}
      if(contact&&(!collision||contact.t<collision.t))collision={...contact,kind:'body',victim};
    }
    shot.lastAt=until;
    if(collision){
      const point={x:collision.x,y:collision.y};shot.x=point.x;shot.y=point.y;
      if(collision.kind==='barrier'){
        const outcome=absorbBarrier(w,collision.victim,collision,shot.damage,shot.damageType,shot.source,collision.impactAt||now,shot);
        if(outcome.reflected){remaining.push(shot);continue;}
        if(outcome.damage)hitPlayer(w,collision.victim,shot.source,outcome.damage,null,now,from,shot.ability,shot.damageType);
      }else if(collision.kind==='body'){
        if(shot.team==='player'){
          if(ABILITIES[shot.ability]?.area)explode(w,shot,owner,point,now,hit,rng);
          else damageActor(w,owner,collision.victim,ABILITIES[shot.ability]||ABILITIES.bolt,now,hit,rng,from,shot);
        }else{
          const roll=rollD20(2+Math.floor(shot.level/2),rpgStats(collision.victim).defense,rng),damage=roll.hit?Math.max(1,shot.damage+(roll.critical?rollDice(1,6,rng):0)):0;
          hitPlayer(w,collision.victim,shot.source,damage,roll,now,from,shot.ability,shot.damageType);
        }
      }else{
        combatEvent(w,{source:shot.source,ability:shot.ability,kind:'collision',damageType:shot.damageType,x:point.x,y:point.y,fromX:from.x,fromY:from.y,projectileId:shot.id,targetId:collision.obstacle.id,label:'IMPACTO'},now);
        if(shot.team==='player')explode(w,shot,owner,point,now,hit,rng);
      }
      continue;
    }
    shot.x=clamp(to.x,0,300);shot.y=clamp(to.y,0,100);
    if(now>=shot.expiresAt||to.x<0||to.x>300||to.y<0||to.y>100){
      if(shot.team==='player')explode(w,shot,owner,shot,now,hit,rng);
      combatEvent(w,{source:shot.source,ability:shot.ability,kind:'expire',x:shot.x,y:shot.y,projectileId:shot.id,label:''},now);continue;
    }
    remaining.push(shot);
  }
  w.projectiles=remaining.slice(-160);
  for(const p of players)if(p.rpg?.barrier?.expiresAt<=now)removeBarrier(p.rpg);
}

export function combatWorldView(w,profiles,now){
  state(w);const players=profileList(profiles).filter(p=>active(p,now));
  return {projectiles:w.projectiles.map(({team,damage,level,lastAt,...shot})=>({...shot,updatedAt:lastAt})),barriers:players.filter(p=>p.rpg?.barrier?.expiresAt>now).map(barrierGeometry),casts:w.combatCasts.map(c=>({...c})),obstacles:combatObstacles(w)};
}
