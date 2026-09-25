import {RuleError} from './engine.js';
import {ABILITIES,ensureRpg,rpgStats,rollD20,rollDice} from './realm-rpg.js';
const distance=(a,b)=>Math.hypot((a.x-b.x)*1.5,a.y-b.y);
const hostile=a=>['hostile','invader','raid'].includes(a.kind)&&a.hp>0;
export function combatEvent(w,event,now){w.combatEvents||=[];const e={id:`combat-${++w.serial}`,at:now,...event};w.combatEvents.push(e);w.combatEvents=w.combatEvents.filter(e=>now-e.at<5000).slice(-50);return e;}
export function actionCombat(w,p,input,regions,now,hit,rng=Math.random){
 const r=ensureRpg(p),s=p.realm.roaming,stats=rpgStats(p),a=ABILITIES[input.ability];const check=(v,m)=>{if(!v)throw new RuleError(m);};
 check(a&&r.level>=a.level,'Esta habilidade ainda não foi aprendida.');check(now>=(r.cooldowns[a.id]||0),'A habilidade está se recuperando.');check(now>=(r.globalAt||0),'Conclua o golpe atual.');check(s.energy>=a.energy&&r.mana>=a.mana,'Vigor ou mana insuficiente.');
 const target=w.actors.find(t=>t.id===input.targetId&&hostile(t)),aim={x:Number(input.x),y:Number(input.y)};if(!Number.isFinite(aim.x)||!Number.isFinite(aim.y)){aim.x=target?.x??s.x+2;aim.y=target?.y??s.y;}
 const targetPoint=target||aim,near=distance(s,targetPoint);if(!['guard','dash','mend'].includes(a.id)){check(!regions.some(n=>n.kind==='sanctuary'&&distance(s,n)<5),'O Pacto de Paz protege este santuário.');check(near<=a.range+1,'O alvo está fora do alcance.');}
 r.cooldowns[a.id]=now+a.cooldown;r.globalAt=now+Math.min(350,a.cooldown);s.energy-=a.energy;r.mana-=a.mana;s.targetId=null;s.targetUntil=0;
 const origin={x:s.x,y:s.y},base={ability:a.id,source:p.realm.publicId,x:targetPoint.x,y:targetPoint.y,fromX:s.x,fromY:s.y};
 if(a.id==='dash'){let dx=Number(input.dx),dy=Number(input.dy);if(!Number.isFinite(dx)||!Number.isFinite(dy)||!Math.hypot(dx,dy)){dx=(aim.x-s.x)*1.5;dy=aim.y-s.y;}const length=Math.hypot(dx,dy)||1;s.x=Math.max(1,Math.min(299,s.x+dx/length*a.range/1.5));s.y=Math.max(1,Math.min(99,s.y+dy/length*a.range));r.evadeUntil=now+500;s.moveAt=now;s.displacement=(s.displacement||0)+1;combatEvent(w,{...base,x:s.x,y:s.y,label:'ESQUIVA',kind:'dash'},now);return {message:'',displaced:true};}
 if(a.id==='guard'){r.guardUntil=now+3000;combatEvent(w,{...base,...origin,kind:'guard',label:'GUARDA +5'},now);return {message:''};}
 if(a.id==='mend'){const amount=rollDice(2,8,rng)+stats.modifiers.wisdom+r.level;s.hp=Math.min(s.maxHp,s.hp+amount);combatEvent(w,{...base,...origin,kind:'heal',label:`+${amount}`,amount},now);return {message:''};}
 const victims=a.area?w.actors.filter(t=>hostile(t)&&distance(s,t)<=a.range+(a.id==='cleave'?0:a.area)&&distance(targetPoint,t)<=a.area).filter(t=>a.id!=='cleave'||((t.x-s.x)*(targetPoint.x-s.x)*2.25+(t.y-s.y)*(targetPoint.y-s.y))>=0).slice(0,5):target?[target]:[];
 if(!victims.length)combatEvent(w,{...base,kind:'miss',label:'SEM ALVO'},now);
 for(const t of victims){const defense=10+Math.min(8,t.level||1)+(t.kind==='raid'?2:0),bonus=stats.proficiency+stats.modifiers[a.id==='strike'&&r.path==='stalker'?'dexterity':a.attribute]+(r.talents.precision||0),advantage=t.rootUntil>now?1:0;
   let roll=rollD20(bonus,defense,rng,advantage),saved=false;
   if(a.save){roll=rollD20(Math.min(5,t.level||1),8+stats.proficiency+stats.modifiers[a.attribute],rng);saved=roll.hit;roll={...roll,save:true,hit:true,critical:false};}
   const count=(a.id==='tempest'?2:1)*(roll.critical?2:1),magical=!['strike','cleave'].includes(a.id);let damage=roll.hit?Math.max(1,rollDice(count,a.dice,rng)+stats.modifiers[a.attribute]+(magical?(r.talents.channel||0)+(p.campaign?.projects.observatory||0)*2:stats.weapon)+Math.floor(r.level/3)):0;
   if(a.id==='strike'&&roll.hit){r.combo=now-r.comboAt<2200?(r.combo+1)%3:1;r.comboAt=now;if(r.combo===0)damage+=4;}
   if(roll.critical&&r.path==='stalker')damage+=4;if(saved)damage=Math.floor(damage/2);
   if(damage){hit(w,t,damage,p,now);if(a.id==='frost'&&!saved)t.rootUntil=now+2000;if(a.id==='drain')s.hp=Math.min(s.maxHp,s.hp+Math.ceil(damage/2));}
   s.lastCombatAt=now;
   const e=combatEvent(w,{...base,targetId:t.id,x:t.x,y:t.y,roll,saved,amount:damage,kind:roll.critical?'critical':damage?'hit':'miss',label:roll.critical?`CRÍTICO ${damage}`:saved?`${damage} · RESISTIU`:damage?`${damage}`:'ESQUIVA'},now);
   r.log.unshift({id:e.id,at:now,ability:a.name,target:t.name,...roll,damage,saved});r.log=r.log.slice(0,8);
 }
 return {message:''};
}
export function enemyAttack(w,a,p,now,rng=Math.random){const s=p.realm.roaming,r=ensureRpg(p),stats=rpgStats(p),guard=r.guardUntil>now,roll=rollD20(2+Math.floor((a.level||1)/2),stats.defense+(guard?5:0),rng),evaded=r.evadeUntil>now;let damage=!evaded&&roll.hit?Math.max(1,a.attack+(roll.critical?rollDice(1,6,rng):0)):0;if(guard)damage=Math.ceil(damage*(r.path==='sentinel'?.35:.5));s.hp=Math.max(0,s.hp-damage);s.lastCombatAt=now;combatEvent(w,{source:a.id,targetId:p.realm.publicId,fromX:a.x,fromY:a.y,x:s.x,y:s.y,kind:damage?'enemy-hit':'evade',ability:'enemy',amount:damage,label:damage?`−${damage}`:evaded?'ESQUIVA':'DEFESA',roll},now);return damage;}
