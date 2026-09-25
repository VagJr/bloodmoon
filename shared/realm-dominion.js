import {RuleError} from './engine.js';
import {realmDistance as distance} from './realm-collision.js';
export const CITY_BUILDINGS={
 warehouse:{name:'Armazém',art:'supply-crates',hp:240,timber:15,ore:10,text:'Cada grau protege 10% do estoque e amplia a capacidade.'},
 forge:{name:'Oficina',art:'blacksmith',hp:280,timber:15,ore:20,text:'Cada grau reforça os reparos e a resistência da muralha.'},
 watchtower:{name:'Torre de vigia',art:'watchtower',hp:320,timber:20,ore:20,text:'Guarnição reduz o dano de cerco; pode ser destruída primeiro.'},
 farm:{name:'Celeiro',art:'farm',hp:180,timber:20,ore:5,text:'Produz alimento para população e guarnição.'},
 market:{name:'Entreposto',art:'moon-caravan',hp:200,timber:20,ore:10,text:'Abre rotas de caravanas e rende receita ao tesouro.'},
 shrine:{name:'Santuário',art:'stone-well',hp:220,timber:10,ore:15,text:'Recupera moral e reduz a pressão das criaturas.'}
};
const check=(v,m)=>{if(!v)throw new RuleError(m);};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export const atWar=(world,a,b,now)=>!!a&&!!b&&a!==b&&(world.wars||[]).some(w=>w.status==='active'&&w.endsAt>now&&((w.attacker===a&&w.defender===b)||(w.attacker===b&&w.defender===a)));
export function dominionLog(w,text,now,kind='politics'){
 w.events||=[];w.serial||=0;w.events.unshift({id:`dominion-${++w.serial}`,text,at:now,kind});w.events=w.events.slice(0,35);
}
export function ensureDominion(world,w,regions,now){
 w.plots||=regions.filter(n=>n.kind!=='sanctuary').flatMap(n=>[-1,1].map((side,i)=>({id:`land-${n.id}-${i}`,node:n.id,name:`Terreno ${i?'oriental':'ocidental'} · ${n.name}`,x:clamp(n.x+side*8,3,297),y:clamp(n.y+8,3,97),houseId:null})));
 for(const h of world.houses||[]){const s=h.settlement;if(!s)continue;
  if(!s.plotId){const plot=w.plots.find(p=>!p.houseId&&p.node===s.node)||w.plots.find(p=>!p.houseId);if(plot){plot.houseId=h.id;plot.x=s.x;plot.y=s.y;s.plotId=plot.id;}}
  s.buildings||={};s.districts||=Object.keys(CITY_BUILDINGS).map((kind,index)=>{const spec=CITY_BUILDINGS[kind],level=s.buildings[kind]||0,angle=index*Math.PI/3;return {id:`${h.id}:${kind}`,kind,level,hp:spec.hp*level,maxHp:spec.hp*level,x:clamp(s.x+Math.cos(angle)*1.9,1,299),y:clamp(s.y+Math.sin(angle)*2.6,1,99)};});
  s.food??=30;s.population??=10;s.morale??=65;s.influence??=0;s.tax??=5;s.policy??='balanced';s.history||=[];
  for(const d of s.districts)s.buildings[d.kind]=d.hp>0?d.level:0;
  const guardId='garrison-'+h.id,guard=w.actors.find(a=>a.id===guardId);if(s.hp>0&&s.buildings.watchtower&&!guard)w.actors.push({id:guardId,guardHouse:h.id,kind:'patrol',node:s.node,name:'Guarnição · '+h.name,cardId:'warden',x:s.x,y:s.y+1,homeX:s.x,homeY:s.y,hp:100+s.buildings.watchtower*30,maxHp:100+s.buildings.watchtower*30,attack:7+s.buildings.watchtower*2,phase:0,attackAt:now,respawnAt:0,state:'Defendendo a cidade'});
  if(guard&&(!s.hp||!s.buildings.watchtower))w.actors=w.actors.filter(a=>a!==guard);
  if(s.hp&&s.buildings.market&&!w.actors.some(a=>a.id==='trade-caravan-'+h.id)){const haven=regions.find(n=>n.kind==='sanctuary');if(haven)w.actors.push({id:'trade-caravan-'+h.id,tradeHouse:h.id,kind:'caravan',node:s.node,name:'Caravana · '+h.name,cardId:'mooncaller',x:s.x,y:s.y,homeX:s.x,homeY:s.y,hp:120,maxHp:120,route:[s.node,haven.id],routeIndex:1,phase:0,attackAt:0,respawnAt:0,state:'Transportando mercadorias'});}

 }
 const validPlots=new Set(w.plots.filter(p=>!p.houseId).map(p=>p.id));w.actors=w.actors.filter(a=>a.kind!=='land'||validPlots.has(a.id));
 for(const plot of w.plots.filter(p=>!p.houseId)){let a=w.actors.find(a=>a.id===plot.id);if(!a){a={id:plot.id,kind:'land',cardId:'envoy',hp:1,maxHp:1,state:'Terreno livre',...plot};w.actors.push(a);}}
 w.warPairs=(world.wars||[]).filter(war=>war.status==='active'&&war.endsAt>now).map(war=>[war.attacker,war.defender]);
 w.cityBlocks=(world.houses||[]).flatMap(h=>h.settlement?.districts?.filter(d=>d.hp>0).map(d=>({id:d.id,x:d.x,y:d.y,radius:.55,hp:d.hp,kind:'city-building'}))||[]);
}
export function claimLand(world,w,p,input,now){
 const house=world.houses.find(h=>h.id===p.realm.houseId),plot=w.plots.find(x=>x.id===input.plotId);
 check(house?.leader===p.realm.publicId,'Somente o fundador escolhe o terreno.');check(!house.settlement,'Sua Casa já possui uma cidade.');check(plot&&!plot.houseId,'Terreno já ocupado.');check(distance(p.realm.roaming,plot)<=4.2,'Aproxime-se do terreno.');
 const m=p.realm.materials;check(m.timber>=25&&m.ore>=15,'Construção: 25 madeiras e 15 minérios.');m.timber-=25;m.ore-=15;plot.houseId=house.id;
 house.settlement={plotId:plot.id,node:plot.node,x:plot.x,y:plot.y,level:1,hp:600,maxHp:600,stock:{timber:0,ore:0,essence:0},buildings:{},protectedUntil:now+300000};house.requiresPlot=false;
 ensureDominion(world,w,[],now);dominionLog(w,`${house.name} ergueu sua cidade em ${plot.name}.`,now);
 return {message:'Cidade fundada. Construa os bairros e abasteça sua população.'};
}
export function districtAction(world,w,p,input,now){
 const h=world.houses.find(h=>h.id===input.houseId),s=h?.settlement,d=s?.districts.find(d=>d.id===input.districtId),own=h?.id===p.realm.houseId;
 check(d,'Bairro indisponível.');check(distance(p.realm.roaming,d)<=4.2,'Aproxime-se do bairro.');const spec=CITY_BUILDINGS[d.kind],m=p.realm.materials;
 if(input.operation==='build'||input.operation==='repair'){
  check(own&&s.hp>0,'Reconstrua a sede antes de gerenciar os bairros.');
  const repair=input.operation==='repair';check(repair?d.level>0&&d.hp<d.maxHp:d.level<3,'Bairro no limite ou sem reparos.');
  const timber=repair?5:spec.timber*(d.level+1),ore=repair?5:spec.ore*(d.level+1);check(m.timber>=timber&&m.ore>=ore,'Materiais insuficientes.');m.timber-=timber;m.ore-=ore;
  if(repair)d.hp=Math.min(d.maxHp,d.hp+100+(s.buildings.forge||0)*40);else {d.level++;d.maxHp=spec.hp*d.level;d.hp=d.maxHp;}
 }else if(input.operation==='siege'){
  check(atWar(world,p.realm.houseId,h.id,now),'Declare guerra a esta Casa.');check(now>=s.protectedUntil&&s.hp>0&&d.hp>0,'Bairro protegido ou destruído.');const r=p.realm.roaming;check(now>=r.attackAt&&r.energy>=15,'Aguarde o golpe e recupere vigor.');r.attackAt=now+1500;r.lastCombatAt=now;r.energy-=15;d.hp=Math.max(0,d.hp-35);s.lastRaidAt=now;s.morale=Math.max(0,s.morale-1);if(!d.hp)dominionLog(w,`${p.name} destruiu ${spec.name} de ${h.name}.`,now,'siege');
 }else throw new RuleError('Ordem de bairro inválida.');
 ensureDominion(world,w,[],now);return {message:`${spec.name}: ${d.hp}/${d.maxHp} vida · grau ${d.level}.`};
}
export function dominionAction(world,w,p,input,now){
 const h=world.houses.find(h=>h.id===input.houseId),s=h?.settlement;check(s&&distance(p.realm.roaming,s)<=4.2,'Aproxime-se da cidade.');
 if(input.operation==='capture'){
  check(atWar(world,p.realm.houseId,h.id,now)&&s.hp===0&&s.conqueror===p.realm.houseId,'Derrube esta cidade em guerra para ocupar o território.');
  check(now>=(s.captureAt||Infinity),'Mantenha a conquista por 60 segundos antes de ocupar.');check(s.occupiedBy!==p.realm.houseId,'Este território já está ocupado.');
  s.occupiedBy=p.realm.houseId;s.influence=0;world.territories||={};const territory=world.territories[s.node]||={owner:null,influence:{},protectedUntil:0};territory.owner=p.realm.houseId;territory.protectedUntil=now+300000;
  dominionLog(w,`${p.name} ocupou ${h.name}; o controle de ${s.node} mudou.`,now,'siege');
 }else{
  check(h.id===p.realm.houseId&&h.leader===p.realm.publicId,'Somente o fundador governa esta cidade.');
  if(input.operation==='tax'){check([0,5,10,15].includes(input.value),'Tributo inválido.');s.tax=input.value;}
  else if(input.operation==='policy'){check(['balanced','military','commerce','harvest'].includes(input.value),'Política inválida.');s.policy=input.value;}
  else throw new RuleError('Ordem de governo inválida.');
  dominionLog(w,`${h.name} alterou seu governo: tributo ${s.tax}%, política ${s.policy}.`,now);
 }
 return {message:'Governo e influência atualizados.'};
}
// Bounded minute simulation. No unbounded offline production or replay loops.
export function advanceDominion(world,w,regions,now){
 if(now<(w.dominionAt||0))return;w.dominionAt=now+60000;
 for(const h of world.houses||[]){const s=h.settlement;if(!s||s.hp<=0)continue;
  const b=s.buildings,threat=w.actors.filter(a=>a.node===s.node&&a.hp>0&&['hostile','invader'].includes(a.kind)).length;
  const consumption=Math.max(1,Math.ceil(s.population/10));s.food=clamp(s.food+(b.farm||0)*4-consumption,0,200);const fed=s.food>0;
  s.morale=clamp(s.morale+(fed?2:-6)+(b.shrine||0)-Math.floor(s.tax/5)-(threat>4?4:0),0,100);
  s.population=clamp(s.population+(s.morale>65?1:s.morale<25?-1:0),1,s.level*30);
  const secure=threat<4&&fed,capacity=s.level*150+(b.warehouse||0)*100;
  if(secure&&Object.values(s.stock).reduce((a,b)=>a+b,0)<capacity){const resource=regions.find(n=>n.id===s.node)?.resource||'timber';s.stock[resource]++;}
  const income=secure?Math.floor(s.population*s.tax/100)+(b.market||0)*(s.policy==='commerce'?2:1):0;h.treasury=(h.treasury||0)+income;
  s.influence=clamp(s.influence+(secure?2+(s.policy==='military'?2:0):-3),0,1000);
  world.territories||={};const t=world.territories[s.node]||={owner:null,influence:{},protectedUntil:0};t.influence[h.id]=s.influence;
  if(!t.owner&&s.influence>=100){t.owner=h.id;dominionLog(w,`${h.name} assumiu o controle de ${s.node} por influência.`,now);}
  s.history.unshift({at:now,income,food:s.food,morale:s.morale,threat});s.history=s.history.slice(0,12);
 }
}
