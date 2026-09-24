import {CARDS} from './cards.js';
const fail=(ok,msg)=>{if(!ok)throw Error(msg);};
export const WORLD_SLOTS={court:'Corte · influência',crypt:'Catacumbas · produção',hunt:'Caçada · defesa'};
export function worldEnergy(r,now=Date.now()){const e=r.tableEnergy||{value:100,at:now};return Math.min(100,e.value+Math.floor(Math.max(0,now-e.at)/30000));}
export function tableView(world,r,now=Date.now()){return {slots:world.tableSlots||{},raids:world.tableRaids||{},energy:worldEnergy(r,now),cooldown:Math.max(0,(r.tableActionAt||0)+10000-now)};}
export function tableAction(world,p,input,node,now=Date.now()){
 const r=p.realm,slot=input.slot,card=CARDS[input.cardId];
 fail(!r.activeRoom,'Termine a batalha antes de comandar a mesa.');
 fail(!r.tableActionAt||now-r.tableActionAt>=10000,'Aguarde 10 segundos entre ordens da mesa.');
 const energy=worldEnergy(r,now);fail(energy>=15,'Vigor insuficiente: recupere 1 a cada 30 segundos.');
 world.tableSlots||={};world.tableRaids||={};const key=node.id+':'+slot,existing=world.tableSlots[key];
 if(input.type==='table-deploy'){
  fail(Object.hasOwn(WORLD_SLOTS,slot),'Escolha uma das três frentes.');
  fail(card?.type==='unit'&&(p.collection?.[card.id]||0)>0,'Destaque um aliado da sua coleção.');
  fail(!existing,'Este espaço está ocupado. Recolha sua carta ou dispute o posto durante uma guerra.');
  fail(Object.values(world.tableSlots).filter(s=>s.owner===r.publicId).length<3,'Limite de três destacamentos por jogador.');
  fail(node.kind!=='sanctuary','O porto permanece uma zona neutra.');
  fail(p.coins>=30&&r.materials.timber>=4&&r.materials.ore>=3,'Destacar exige 30 Marcas, 4 madeiras e 3 minérios.');
  p.coins-=30;r.materials.timber-=4;r.materials.ore-=3;
  world.tableSlots[key]={owner:r.publicId,name:p.name,houseId:r.houseId,cardId:card.id,node:node.id,slot,hp:15,builtAt:now,expiresAt:now+604800000,harvestAt:now};
 }else if(input.type==='table-recall'){
  fail(existing?.owner===r.publicId,'Só o comandante pode recolher esta carta.');delete world.tableSlots[key];
 }else if(input.type==='table-harvest'){
  fail(existing?.owner===r.publicId&&slot==='crypt','Você precisa do seu posto de produção nesta região.');
  const amount=Math.min(6,Math.floor((now-existing.harvestAt)/600000));fail(amount>0,'Produção: 1 recurso a cada 10 minutos, armazém de 6.');
  r.materials[node.resource]+=amount;existing.harvestAt=now;
 }else if(input.type==='table-influence'){
  fail(existing?.owner===r.publicId&&slot==='court'&&r.houseId,'Destaque um emissário da sua Casa na Corte.');
  const t=world.territories[node.id];fail(t&&!t.owner,'A diplomacia prepara a conquista de um território neutro.');
  fail((t.influence[r.houseId]||0)<2,'Influência diplomática máxima. Vença uma expedição para conquistar.');t.influence[r.houseId]=(t.influence[r.houseId]||0)+1;
 }else if(input.type==='table-siege'){
  fail(existing&&existing.owner!==r.publicId&&r.houseId&&existing.houseId,'Escolha um destacamento de uma Casa rival.');
  fail(world.wars.some(w=>w.status==='active'&&w.endsAt>now&&[w.attacker,w.defender].includes(r.houseId)&&[w.attacker,w.defender].includes(existing.houseId)&&existing.houseId!==r.houseId),'Cerco permitido apenas entre Casas em guerra.');
  fail(!world.territories[node.id]?.protectedUntil||world.territories[node.id].protectedUntil<=now,'O território está sob proteção.');
  const guard=world.tableSlots[node.id+':hunt'];existing.hp-=slot!=='hunt'&&guard?.houseId===existing.houseId?3:5;if(existing.hp<=0)delete world.tableSlots[key];
 }else if(input.type==='table-raid'){
  fail(node.kind==='dungeon','Incursões cooperativas existem nos sepulcros.');
  fail(card?.type==='unit'&&(p.collection?.[card.id]||0)>0,'Selecione um aliado da coleção para atacar.');
  let raid=world.tableRaids[node.id];
  if(!raid||now>=raid.endsAt)raid={hp:240,maxHp:240,endsAt:now+21600000,contributors:{},claimed:{}};
  fail(raid.hp>0,'Guardião vencido. Recolha sua recompensa antes da próxima vigília.');
  raid.hp=Math.max(0,raid.hp-12);raid.contributors[r.publicId]=(raid.contributors[r.publicId]||0)+12;world.tableRaids[node.id]=raid;
 }else if(input.type==='table-raid-claim'){
  const raid=world.tableRaids[node.id];fail(raid&&raid.hp===0&&now<raid.endsAt,'A incursão ainda não foi vencida nesta vigília.');
  fail(raid.contributors[r.publicId]>=24&&!raid.claimed[r.publicId],'Contribua com dois ataques. Cada prêmio só pode ser recolhido uma vez.');
  raid.claimed[r.publicId]=true;p.coins+=30;r.materials[node.resource]+=6;
 }else throw Error('Ordem de mesa desconhecida.');
 r.tableEnergy={value:energy-15,at:now};r.tableActionAt=now;world.version++;
 world.events.unshift({text:p.name+' · '+node.name+' · '+input.type.replace('table-',''),at:now});world.events=world.events.slice(0,60);
}
