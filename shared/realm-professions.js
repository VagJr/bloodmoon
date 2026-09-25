import {RuleError} from './engine.js';

const check=(ok,message)=>{if(!ok)throw new RuleError(message);};
const distance=(a,b)=>Math.hypot((a.x-b.x)*1.5,a.y-b.y);
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const profession=p=>p.starterFaction==='werewolf'?'hunter':'domitor';
export const PROFESSION_TASKS=Object.freeze({harvest:'Colher para o domínio',guard:'Guardar a cidade',trade:'Escoltar comércio'});
export function ensureProfession(p){
 const r=p.realm;r.profession||={kind:profession(p),rank:1,xp:0,meat:0,hides:0,servants:[],killsDressed:0,tradeCount:0};
 const s=r.profession;s.kind=profession(p);for(const key of ['rank','xp','meat','hides','killsDressed','tradeCount'])s[key]??=0;s.servants||=[];return s;
}
function gain(s,amount){s.xp+=amount;while(s.rank<10&&s.xp>=s.rank*40){s.xp-=s.rank*40;s.rank++;}}
export function professionView(world,p){
 const s=ensureProfession(p),house=(world.houses||[]).find(h=>h.id===p.realm.houseId),city=house?.settlement;
 return {kind:s.kind,name:s.kind==='domitor'?'Domador do Véu':'Mestre da Caçada',rank:s.rank,xp:s.xp,next:s.rank<10?s.rank*40:null,meat:s.meat,hides:s.hides,killsDressed:s.killsDressed,tradeCount:s.tradeCount,servants:s.servants.map(a=>({id:a.id,name:a.name,task:a.task,loyalty:a.loyalty,readyAt:a.readyAt})),cityName:house?.name||null,cityStock:city?{...city.stock}:null};
}
export function professionAction(world,w,p,input,now){
 const s=ensureProfession(p),roam=p.realm.roaming,kind=s.kind,city=(world.houses||[]).find(h=>h.id===p.realm.houseId)?.settlement;
 if(input.operation==='convert'){
  check(kind==='domitor','A conversão pertence aos vampiros.');check(city&&city.hp>0,'Funde uma Casa e erga sua cidade para receber servos.');
  check(s.servants.length<Math.min(8,2+Math.floor(s.rank/2)),'Seu domínio já tem todos os servos que consegue comandar.');
  const corpse=w.actors.find(a=>a.id===input.targetId);check(corpse&&corpse.hp<=0&&corpse.respawnAt>now&&['hostile','invader'].includes(corpse.kind)&&['thrall','elder','duelist','warden'].includes(corpse.cardId),'Escolha um humanoide hostil recém-derrotado.');
  check(distance(roam,corpse)<=4.2&&corpse.lastHitBy===p.realm.publicId,'A vítima precisa ter sido vencida por você e estar ao alcance.');
  check(!corpse.convertedBy,'Esta vítima já recebeu um destino.');check((p.realm.lineage?.blood||0)>=12&&p.realm.materials.essence>=2,'O pacto exige 12 de sangue e 2 essências.');
  p.realm.lineage.blood-=12;p.realm.materials.essence-=2;corpse.convertedBy=p.realm.publicId;
  const id=`servant-${++w.serial}`,servant={id,name:`Servo de ${p.name}`,task:'harvest',loyalty:100,readyAt:now+30000,createdAt:now};s.servants.push(servant);
  w.actors.push({id,kind:'servant',name:servant.name,node:city.node,x:city.x+1,y:city.y+1,homeX:city.x+1,homeY:city.y+1,hp:45+s.rank*5,maxHp:45+s.rank*5,cardId:'thrall',owner:p.realm.publicId,houseId:p.realm.houseId,level:s.rank,state:'Aguardando ordens'});
  gain(s,18);return {message:`${servant.name} jurou servir seu domínio. Atribua uma tarefa no códice.`};
 }
 if(input.operation==='command'){
  check(kind==='domitor','A ordem pertence aos vampiros.');const servant=s.servants.find(a=>a.id===input.servantId);check(servant,'Servo desconhecido.');check(PROFESSION_TASKS[input.task],'Tarefa desconhecida.');check(city&&city.hp>0,'A cidade precisa estar de pé para comandar o domínio.');
  servant.task=input.task;servant.readyAt=Math.max(servant.readyAt,now+4000);const actor=w.actors.find(a=>a.id===servant.id);if(actor)actor.state=PROFESSION_TASKS[input.task];return {message:`${servant.name}: ${PROFESSION_TASKS[input.task].toLowerCase()}.`};
 }
 if(input.operation==='release'){
  check(kind==='domitor','A ordem pertence aos vampiros.');const index=s.servants.findIndex(a=>a.id===input.servantId);check(index>=0,'Servo desconhecido.');const [servant]=s.servants.splice(index,1);w.actors=w.actors.filter(a=>a.id!==servant.id);return {message:`${servant.name} foi dispensado do domínio.`};
 }
 if(input.operation==='dress'){
  check(kind==='hunter','O preparo da caça pertence aos lobisomens.');const corpse=w.actors.find(a=>a.id===input.targetId);check(corpse&&corpse.hp<=0&&corpse.respawnAt>now&&['hostile','invader','raid'].includes(corpse.kind),'Escolha uma presa recém-abatida.');
  check(distance(roam,corpse)<=4.2&&corpse.lastHitBy===p.realm.publicId,'A presa precisa ter sido abatida por você e estar ao alcance.');corpse.dressedBy||={};check(!corpse.dressedBy[p.realm.publicId],'Esta presa já foi preparada.');
  const amount=corpse.kind==='raid'?10:clamp(Math.ceil((corpse.level||1)/2),1,6);corpse.dressedBy[p.realm.publicId]=now;s.meat+=amount;s.hides+=Math.max(1,Math.floor(amount/2));s.killsDressed++;gain(s,6+amount);
  return {message:`Presa preparada: +${amount} carnes, +${Math.max(1,Math.floor(amount/2))} peles. Profissão evoluiu.`};
 }
 if(input.operation==='preserve'){
  check(kind==='hunter'&&city&&distance(roam,city)<=4.2,'Use o pavilhão de caça da cidade de sua Casa.');check(s.meat>=5&&p.realm.materials.timber>=1,'A cura exige 5 carnes e 1 madeira.');
  s.meat-=5;p.realm.materials.timber--;city.stock||={};const provisions=7+s.rank+(p.rpg?.lifeSkills?.talents?.provisioner||0)*2;city.stock.provisions=(city.stock.provisions||0)+provisions;gain(s,9);return {message:`Cura da matilha: ${provisions} provisões estocadas na cidade.`};
 }
 if(input.operation==='sell'){
  check(kind==='hunter','Este comércio pertence aos lobisomens.');const merchant=w.actors.find(a=>a.id===input.targetId&&a.kind==='merchant'&&a.hp>0);check(merchant&&distance(roam,merchant)<=4.2,'Aproxime-se de um mercador.');
  const count=Math.min(5,s.meat),hides=Math.min(2,s.hides);check(count+hides>0,'Você não tem carne nem peles para vender.');s.meat-=count;s.hides-=hides;
  const earned=count*(3+Math.floor(s.rank/3))+hides*(7+Math.floor(s.rank/2));p.coins=(p.coins||0)+earned;s.tradeCount++;gain(s,4+count+hides);return {message:`Comércio de caça: +${earned} Marcas por ${count} carnes e ${hides} peles.`};
 }
 throw new RuleError('Ordem de profissão desconhecida.');
}
export function advanceProfessions(world,w,profiles,now){
 if(now<(w.professionTickAt||0))return false;w.professionTickAt=now+5000;let changed=false;
 for(const p of profiles){if(!p.realm?.profession?.servants?.length)continue;const s=p.realm.profession,city=(world.houses||[]).find(h=>h.id===p.realm.houseId)?.settlement;if(!city||city.hp<=0)continue;
  for(const servant of [...s.servants]){if(servant.readyAt>now)continue;servant.readyAt=now+30000;if(p.id){w.professionDirtyProfiles||=[];if(!w.professionDirtyProfiles.includes(p.id))w.professionDirtyProfiles.push(p.id);}const actor=w.actors.find(a=>a.id===servant.id);if(actor){actor.node=city.node;actor.x=city.x+1;actor.y=city.y+1;actor.state=PROFESSION_TASKS[servant.task]||'Aguardando ordens';}
   city.lineageStock||={blood:0,hunt:0};if(city.lineageStock.blood>0){city.lineageStock.blood--;servant.loyalty=clamp(servant.loyalty+2,0,100);}else servant.loyalty=clamp(servant.loyalty-4,0,100);
   if(servant.loyalty<=0){s.servants=s.servants.filter(a=>a!==servant);w.actors=w.actors.filter(a=>a.id!==servant.id);changed=true;continue;}
   city.stock||={};if(servant.task==='harvest'){const resource=city.resource&&['timber','ore','essence'].includes(city.resource)?city.resource:'essence';city.stock[resource]=Math.min(500+(city.level||1)*100,(city.stock[resource]||0)+1+Math.floor(s.rank/4));}
   else if(servant.task==='guard'){city.hp=Math.min(city.maxHp||600,(city.hp||0)+4+s.rank);city.morale=clamp((city.morale||50)+1,0,100);}
   else if(servant.task==='trade'){const house=(world.houses||[]).find(h=>h.id===p.realm.houseId);if(house)house.treasury=(house.treasury||0)+3+Math.floor(s.rank/2);}
   gain(s,2);changed=true;
  }
 }
 return changed;
}
