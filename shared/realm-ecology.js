import {RuleError} from './engine.js';
import {gainRpg} from './realm-rpg.js';
import {dominionLog} from './realm-dominion.js';
import {regionThreatLevel} from './realm-enemies.js';
const check=(v,m)=>{if(!v)throw new RuleError(m);};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function ensureEcology(w,regions,now){
 if(w.ecology)return;
 w.ecology={nextAt:now+60000,nextBossAt:now+480000,cycle:0,regions:Object.fromEntries(regions.map(n=>[n.id,{security:50,abundance:70,kills:0,gathers:0,prosperity:50}])),encounters:[]};
 const sites=regions.filter(n=>n.kind==='dungeon').filter((_,i)=>i%2===0).slice(0,3);
 for(const [i,n]of sites.entries())w.actors.push({id:`rift-${n.id}`,kind:'rift',node:n.id,name:['Catacumbas da Fome','Laboratório da Geada','Fornalha dos Condenados'][i],x:clamp(n.x-7,2,298),y:clamp(n.y+7,2,98),hp:1,maxHp:1,level:regionThreatLevel(n),cardId:'warden',state:'Expedição pública · três ondas'});
}
export function recordEcology(w,actor,p,damage=0){
 const e=w.ecology;if(!e)return;const region=e.regions[actor.node];
 if(region&&!actor.hp)region.kills++;
 if(actor.encounterId){const event=e.encounters.find(e=>e.id===actor.encounterId);if(event&&p)event.participants[p.realm.publicId]=(event.participants[p.realm.publicId]||0)+damage;}
}
function wave(w,e,now){
 e.actorIds=[];e.phase='combat';
 const count=e.stage===3?1:3;
 for(let i=0;i<count;i++){const angle=i*2.1,hp=e.stage===3?180+e.level*45:30+e.level*12+e.stage*10;
  const a={id:`${e.id}-${e.stage}-${i}`,encounterId:e.id,kind:'hostile',name:e.stage===3?`Regente · ${e.name}`:`Guardião ${e.stage} · ${e.name}`,node:e.node,x:clamp(e.x+Math.cos(angle)*2,1,299),y:clamp(e.y+Math.sin(angle)*3,1,99),hp,maxHp:hp,attack:4+e.level+e.stage,level:e.level+e.stage,cardId:e.stage===3?'ravager':i%2?'warden':'thrall',attackType:i%2?'magic':'physical',phase:i,state:'Defendendo a fenda',attackAt:now+1500,respawnAt:0};a.homeX=a.x;a.homeY=a.y;w.actors.push(a);e.actorIds.push(a.id);
 }
 dominionLog(w,`${e.name}: onda ${e.stage}/3.`,now,'invasion');
}
export function ecologyInteract(w,p,a,now){
 if(a.kind==='rift'){
  const existing=w.ecology.encounters.find(e=>e.riftId===a.id&&e.expiresAt>now);
  check(!existing,'Esta expedição já está em curso ou aguardando renovação.');check(p.realm.provisions>=2,'São necessárias 2 provisões.');p.realm.provisions-=2;
  const e={id:`rift-run-${++w.serial}`,riftId:a.id,name:a.name,node:a.node,x:a.x,y:a.y,level:a.level,stage:1,phase:'combat',participants:{},claims:[],expiresAt:now+600000};w.ecology.encounters.push(e);wave(w,e,now);return {message:'Expedição iniciada: vença três ondas no mundo. Outros viajantes podem ajudar.'};
 }
 const event=w.ecology.encounters.find(e=>e.id===a.encounterId);
 check(event?.phase==='complete'&&event.expiresAt>now,'Espólio indisponível.');check((event.participants[p.realm.publicId]||0)>=20,'Cause pelo menos 20 de dano para receber o saque.');check(!event.claims.includes(p.realm.publicId),'Saque já recebido.');event.claims.push(p.realm.publicId);
 p.coins+=60+event.level*10;p.realm.materials.essence+=5;p.realm.materials.ore+=5;gainRpg(p,120+event.level*30,'dungeons');return {message:'Expedição concluída: Marcas, 5 essências, 5 minérios e experiência de personagem.'};
}
export function advanceEcology(world,w,regions,now){
 ensureEcology(w,regions,now);const eco=w.ecology;
 for(const e of eco.encounters){
  if(e.expiresAt<=now){w.actors=w.actors.filter(a=>a.encounterId!==e.id);continue;}
  if(e.phase==='combat'&&e.actorIds.every(id=>!w.actors.find(a=>a.id===id)?.hp)){
   w.actors=w.actors.filter(a=>a.encounterId!==e.id);
   if(e.stage<3){e.stage++;e.phase='preparing';e.nextWaveAt=now+6000;}
   else {e.phase='complete';e.expiresAt=now+180000;w.actors.push({id:`loot-${e.id}`,encounterId:e.id,kind:'expedition-loot',node:e.node,name:`Espólios · ${e.name}`,x:e.x,y:e.y,hp:1,maxHp:1,cardId:'envoy',state:'Recompensa por participação'});dominionLog(w,`${e.name} foi purificada pelos viajantes.`,now,'victory');}
  }
  if(e.phase==='preparing'&&now>=e.nextWaveAt)wave(w,e,now);
 }
 eco.encounters=eco.encounters.filter(e=>e.expiresAt>now);
 if(now<eco.nextAt)return;eco.nextAt=now+60000;eco.cycle++;
 for(const n of regions){const r=eco.regions[n.id];if(!r)continue;
  const alive=w.actors.filter(a=>a.node===n.id&&a.hp>0),threat=alive.filter(a=>['hostile','invader'].includes(a.kind)).length,guards=alive.filter(a=>a.kind==='patrol').length;
  r.security=clamp(r.security+r.kills*3+guards-threat,0,100);r.abundance=clamp(r.abundance+4-r.gathers*2,10,100);r.prosperity=clamp(r.prosperity+(r.security>60?2:-1),0,100);r.kills=0;r.gathers=0;
  for(const a of w.actors.filter(a=>a.node===n.id&&a.deposit&&!a.hp))if(r.abundance>70)a.respawnAt=Math.min(a.respawnAt,now+5000);
  const settlers=(world.houses||[]).filter(h=>h.settlement?.node===n.id&&h.settlement.hp>0);
  for(const h of settlers)if(r.security<20){h.settlement.morale=Math.max(0,h.settlement.morale-4);}
 }
 if(now>=eco.nextBossAt){eco.nextBossAt=now+480000;const candidates=regions.filter(n=>n.kind!=='sanctuary'),n=candidates[eco.cycle%candidates.length];
  const old=w.actors.filter(a=>a.ecologyBoss);if(old.length>=3){const dead=old.find(a=>!a.hp);if(dead)w.actors=w.actors.filter(a=>a!==dead);else return;}
  const id=`world-boss-${++w.serial}`,level=Math.min(20,regionThreatLevel(n)+3),hp=700+level*120,attack=Math.ceil(12+level*1.45),damageType=eco.cycle%2?'magic':'physical';
  w.actors.push({id,ecologyBoss:true,kind:'raid',node:n.id,name:`Arauto da Fome · ${n.name}`,x:n.x+3,y:n.y-4,homeX:n.x+3,homeY:n.y-4,hp,maxHp:hp,attack,level,cardId:'ravager',attackType:damageType,damageType,aiStyle:damageType==='magic'?'arcanist':'brute',phase:0,attackAt:now+5000,respawnAt:0,contributions:{},claimed:{},state:'Chefe mundial errante'});
  dominionLog(w,`O Arauto da Fome surgiu em ${n.name}. Sua derrota abre saque coletivo.`,now,'invasion');
 }
}
