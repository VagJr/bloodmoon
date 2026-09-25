import {ensureDominion,advanceDominion} from './realm-dominion.js';
import {RuleError} from './engine.js';
import {WORLD_MAP_BOUNDS} from './realm-geography.js';
const check=(v,m)=>{if(!v)throw new RuleError(m);};
const distance=(a,b)=>Math.hypot((a.x-b.x)*1.5,a.y-b.y);
const names={timber:'Bosque de coleta',ore:'Afloramento mineral',essence:'Nascente do Véu'};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
// Persisted spawn anchors stay on their biome; depletion never creates new actors.
export function respawnDeposit(w,a,rng=Math.random){
 for(let attempt=0;attempt<16;attempt++){
  const angle=rng()*Math.PI*2,radius=1+rng()*3;
  const x=clamp(a.deposit.x+Math.cos(angle)*radius/1.5,2,WORLD_MAP_BOUNDS.maxX-1),y=clamp(a.deposit.y+Math.sin(angle)*radius,2,98);
  if((w.obstacles||[]).some(o=>distance({x,y},o)<(o.radius||0)+.7))continue;
  a.x=a.homeX=x;a.y=a.homeY=y;return;
 }
}
export function ensureFrontier(world,w,regions,now){
 if(!w.frontierVersion){
  for(const n of regions.filter(n=>n.kind!=='sanctuary'&&!n.provinceId))for(let i=0;i<4;i++){
   const angle=i*Math.PI/2+.6,resource=n.resource||'timber';
   const deposit={x:clamp(n.x+Math.cos(angle)*9,2,WORLD_MAP_BOUNDS.maxX-1),y:clamp(n.y+Math.sin(angle)*11,2,98)};
   const a={id:`deposit-${n.id}-${i}`,node:n.id,kind:'resource',name:names[resource],resource,deposit,x:deposit.x,y:deposit.y,homeX:deposit.x,homeY:deposit.y,hp:1,maxHp:1,state:'Fonte de recursos',respawnAt:0};
   respawnDeposit(w,a);w.actors.push(a);
  }
  w.frontierVersion=1;
 }
 // Province deposits are anchored to authored fields rather than four generic
 // radial spawns. IDs make this migration safe to run on an existing save.
 if((w.frontierVersion||0)<2){
  const existing=new Set(w.actors.map(a=>a.id));
  for(const n of regions.filter(n=>n.provinceId))for(const [i,field] of (n.resourceFields||[]).slice(0,4).entries()){
   const id=`field-${n.id}-${i}`;if(existing.has(id))continue;
   const resource=['timber','ore','essence'].includes(field.resource)?field.resource:n.resource;
   const deposit={x:clamp(field.x,2,WORLD_MAP_BOUNDS.maxX-1),y:clamp(field.y,2,98)};
   const a={id,node:n.id,provinceId:n.provinceId,kind:'resource',name:names[resource],resource,richness:clamp(Number(field.richness)||1,1,3),deposit,x:deposit.x,y:deposit.y,homeX:deposit.x,homeY:deposit.y,hp:1,maxHp:1,state:'Fonte de recursos',respawnAt:0};
   respawnDeposit(w,a);w.actors.push(a);existing.add(id);
  }
  w.frontierVersion=2;
 }
 for(const h of world.houses||[]){
  if(!h.settlement&&h.requiresPlot)continue;
  if(!h.settlement){const index=world.houses.indexOf(h),sites=regions.filter(n=>n.kind!=='sanctuary'),n=sites[index%sites.length]||regions[0];h.settlement={node:n.id,x:clamp(n.x+9+(Math.floor(index/regions.length)%3)*2,2,WORLD_MAP_BOUNDS.maxX-1),y:clamp(n.y+7,2,98),level:1,hp:600,maxHp:600,stock:{timber:0,ore:0,essence:0},protectedUntil:now+300000};}
  const s=h.settlement;s.buildings||={warehouse:0,forge:0,watchtower:0};h.allies||=[];h.allianceOffers||=[];let a=w.actors.find(a=>a.id===`house-${h.id}`);
  if(!a){a={id:`house-${h.id}`,kind:'settlement',houseId:h.id,cardId:'warden',state:'Cidade de Casa'};w.actors.push(a);}
  Object.assign(a,{name:h.name,node:s.node,x:s.x,y:s.y,homeX:s.x,homeY:s.y,hp:s.hp,maxHp:s.maxHp,faction:h.faction,state:s.hp?'Cidade · nível '+s.level:'Ruínas · reconstrução disponível'});
 }
 ensureDominion(world,w,regions,now);
}
export function settlementAction(world,p,input,now){
 const h=(world.houses||[]).find(h=>h.id===input.houseId),s=h?.settlement;
 check(s,'Cidade indisponível.');check(distance(p.realm.roaming,s)<=4.2,'Aproxime-se da cidade.');
 const own=p.realm.houseId===h.id,materials=p.realm.materials;
 const pay=(timber,ore)=>{check(materials.timber>=timber&&materials.ore>=ore,'Materiais insuficientes.');materials.timber-=timber;materials.ore-=ore;};
 const mine=(world.houses||[]).find(h=>h.id===p.realm.houseId);
 if(input.operation==='alliance'){
  check(mine&&mine.id!==h.id&&mine.leader===p.realm.publicId,'Somente fundadores negociam alianças.');
  check(!world.wars.some(w=>w.status==='active'&&w.endsAt>now&&[w.attacker,w.defender].includes(h.id)&&[w.attacker,w.defender].includes(mine.id)),'Encerre a guerra antes de negociar.');
  mine.allies||=[];mine.allianceOffers||=[];h.allies||=[];h.allianceOffers||=[];
  if(mine.allianceOffers.includes(h.id)){if(!mine.allies.includes(h.id))mine.allies.push(h.id);if(!h.allies.includes(mine.id))h.allies.push(mine.id);mine.allianceOffers=mine.allianceOffers.filter(id=>id!==h.id);}
  else if(!h.allianceOffers.includes(mine.id))h.allianceOffers.push(mine.id);
 }else if(input.operation==='trade'){
  check(mine&&(h.allies||[]).includes(mine.id),'É necessária uma aliança aceita pelos dois fundadores.');
  const key=input.resource,offered=key==='timber'?'ore':'timber';check(['timber','ore','essence'].includes(key),'Recurso inválido.');check(s.hp>0&&s.stock[key]>=5&&materials[offered]>=5,'Troca exige 5 unidades de cada recurso.');
  s.stock[key]-=5;materials[key]+=5;materials[offered]-=5;s.stock[offered]+=5;
 }else if(input.operation==='build'){
  check(own&&s.hp>0,'Construa numa cidade aliada ativa.');const key=input.resource;check(['warehouse','forge','watchtower'].includes(key),'Projeto inválido.');s.buildings||={warehouse:0,forge:0,watchtower:0};check(s.buildings[key]<3,'Projeto no grau máximo.');pay(10*(s.buildings[key]+1),10*(s.buildings[key]+1));s.buildings[key]++;
 }else if(input.operation==='deposit'||input.operation==='withdraw'){
  check(own,'Somente membros usam este armazém.');const key=input.resource;check(['timber','ore','essence'].includes(key),'Recurso inválido.');
  const from=input.operation==='deposit'?materials:s.stock,to=input.operation==='deposit'?s.stock:materials;
  check(from[key]>=5,'São necessárias 5 unidades.');check(input.operation!=='deposit'||Object.values(s.stock).reduce((a,b)=>a+b,0)+5<=s.level*150+(s.buildings?.warehouse||0)*100,'Armazém cheio.');from[key]-=5;to[key]+=5;
 }else if(input.operation==='upgrade'){
  check(own&&h.leader===p.realm.publicId,'Somente o fundador amplia a cidade.');check(s.hp>0&&s.level<5,'Reconstrua a cidade ou alcance outro objetivo.');pay(s.level*20,s.level*15);s.level++;s.maxHp+=300;s.hp+=300;
 }else if(input.operation==='repair'){
  check(own&&s.hp<s.maxHp,'Somente membros reparam uma cidade danificada.');pay(5,5);s.hp=Math.min(s.maxHp,s.hp+150+(s.buildings?.forge||0)*50);s.conqueror=null;s.captureAt=null;s.occupiedBy=null;
 }else if(input.operation==='siege'){
  check(!own&&p.realm.houseId,'Você precisa de uma Casa rival.');check(s.hp>0&&now>=s.protectedUntil,'A cidade está protegida ou destruída.');
  check(world.wars.some(w=>w.status==='active'&&w.endsAt>now&&[w.attacker,w.defender].includes(h.id)&&[w.attacker,w.defender].includes(p.realm.houseId)),'Declare guerra antes de sitiar.');
  const traveler=p.realm.roaming;check(now>=traveler.attackAt&&traveler.energy>=15,'Aguarde o ataque e recupere vigor.');traveler.attackAt=now+2000;traveler.lastCombatAt=now;traveler.energy-=15;s.hp=Math.max(0,s.hp-Math.max(10,25-(s.buildings?.watchtower||0)*5));
  if(!s.hp){s.protectedUntil=now+600000;s.conqueror=p.realm.houseId;s.captureAt=now+60000;s.occupiedBy=null;for(const key of Object.keys(s.stock)){const loot=Math.floor(s.stock[key]*Math.max(.1,.3-(s.buildings.warehouse||0)*.05));s.stock[key]-=loot;materials[key]+=loot;}}
 }else throw new RuleError('Ordem de cidade inválida.');
 return {message:input.operation==='siege'?`Cerco: cidade com ${s.hp}/${s.maxHp} vida.`:'Cidade atualizada.'};
}

export function advanceFrontier(world,w,regions,now){
 advanceDominion(world,w,regions,now);
 if(now<(w.frontierAt||0))return;
 w.frontierAt=now+60000;
 w.frontierCycle=(w.frontierCycle||0)+1;
 const sites=regions.filter(n=>n.kind!=='sanctuary'),n=sites[w.frontierCycle%sites.length];
 const aliveGuards=w.actors.filter(a=>a.node===n.id&&a.kind==='patrol'&&a.hp>0).length;
 const threats=w.actors.filter(a=>a.node===n.id&&['hostile','invader'].includes(a.kind)&&a.hp>0).length;
 const prosperity=aliveGuards>0&&threats<3;
 const deposits=w.actors.filter(a=>a.node===n.id&&a.deposit&&!a.hp);
 if(prosperity)for(const a of deposits)a.respawnAt=Math.min(a.respawnAt,now+1000);
 const city=(world.houses||[]).find(h=>h.settlement?.node===n.id&&h.settlement.hp>0);
 if(city){const s=city.settlement;if(prosperity&&Object.values(s.stock).reduce((a,b)=>a+b,0)<s.level*150)s.stock[n.resource]=(s.stock[n.resource]||0)+1;else if(threats>=3){s.hp=Math.max(1,s.hp-20);}}
 const text=prosperity?`${n.name}: a patrulha reabriu as fontes de recursos. As cidades recebem suprimentos.`:`${n.name}: criaturas ameaçam as rotas. Derrote os hostis para recuperar o abastecimento.`;
 w.events.unshift({id:`frontier-${++w.serial}`,text,at:now,kind:prosperity?'economy':'invasion'});w.events=w.events.slice(0,35);
}
