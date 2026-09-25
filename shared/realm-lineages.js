import {RuleError} from './engine.js';

const check=(value,message)=>{if(!value)throw new RuleError(message);};
const distance=(a,b)=>Math.hypot((a.x-b.x)*1.5,a.y-b.y);
const kind=p=>p.starterFaction==='werewolf'?'hunt':'blood';
const label=p=>kind(p)==='blood'?'sangue':'troféus de caça';
export function ensureLineage(p){
 const r=p.realm;r.lineage||={blood:0,hunt:0,level:0,drains:0,claims:0,trades:0,feastAt:0};
 for(const k of ['blood','hunt','level','drains','claims','trades','feastAt'])r.lineage[k]??=0;
 return r.lineage;
}
export function lineageView(world,p){
 const l=ensureLineage(p),house=(world.houses||[]).find(h=>h.id===p.realm.houseId),city=house?.settlement,token=kind(p);
 return {kind:token,name:token==='blood'?'Linagem do Sangue':'Trilha da Caçada',currency:token==='blood'?'Sangue':'Troféus',amount:l[token],capacity:120+l.level*40,level:l.level,nextCost:l.level<8?20+15*l.level:null,drains:l.drains,claims:l.claims,trades:l.trades,vault:city?.lineageStock?.[token]||0,cityName:city?house.name:null,cityLevel:token==='blood'?city?.bloodRite||0:city?.huntingLodge||0};
}
export function lineageAction(world,w,p,input,now,profiles=[]){
 const s=p.realm.roaming,l=ensureLineage(p),token=kind(p),amount=Number(input.amount)||5;
 if(input.operation==='drain'||input.operation==='claim'){
  check(input.operation===(token==='blood'?'drain':'claim'),'Esta prática pertence à outra linhagem.');
  const a=w.actors.find(a=>a.id===input.targetId);check(a&&['hostile','invader','raid'].includes(a.kind)&&a.hp<=0&&a.respawnAt>now,'A presa já desapareceu.');
  check(distance(s,a)<=4.2,'Aproxime-se da presa.');
  const winner=profiles.find(other=>other.realm?.publicId===a.lastHitBy),sameHouse=!!winner?.realm?.houseId&&winner.realm.houseId===p.realm.houseId;
  check(a.lastHitBy===p.realm.publicId||sameHouse||a.kind==='raid'&&(a.contributions?.[p.realm.publicId]||0)>=20,'Esta presa pertence a outro caçador.');
  a.lineageClaims||={};check(!a.lineageClaims[p.realm.publicId],'Você já aproveitou esta presa.');
  const gained=a.kind==='raid'?22:Math.max(3,Math.min(16,3+Math.floor((a.level||1)/2)));
  check(l[token]+gained<=120+l.level*40,'Seu reservatório está cheio. Guarde a essência na cidade.');
  a.lineageClaims[p.realm.publicId]=now;l[token]+=gained;
  if(token==='blood'){l.drains++;s.hp=Math.min(s.maxHp,s.hp+Math.max(3,Math.floor(gained/2)));}
  else{l.claims++;s.energy=Math.min(s.maxEnergy,s.energy+Math.max(4,Math.floor(gained/2)));}
  return {message:token==='blood'?`Vítima drenada: +${gained} sangue e vitalidade recuperada.`:`Caça concluída: +${gained} troféus e vigor restaurado.`};
 }
 if(input.operation==='feast'){
  check(l[token]>=6,`São necessários 6 ${label(p)}.`);check(now-l.feastAt>=10000,'A linhagem ainda absorve a última essência.');
  l[token]-=6;l.feastAt=now;
  if(token==='blood'){s.hp=Math.min(s.maxHp,s.hp+28+l.level*3);p.rpg.mana=Math.min(p.rpg.mana+12+l.level*2,50+p.rpg.level*4);}
  else{s.hp=Math.min(s.maxHp,s.hp+16+l.level*2);s.energy=Math.min(s.maxEnergy,s.energy+30+l.level*3);}
  return {message:token==='blood'?'Banquete de sangue: vida e mana restauradas.':'Banquete da caça: vida e vigor restaurados.'};
 }
 if(['buy','sell'].includes(input.operation)){
  const merchant=w.actors.find(a=>a.id===input.targetId&&a.kind==='merchant'&&a.hp>0);check(merchant&&distance(s,merchant)<=4.2,'Aproxime-se de um mercador para negociar.');
  check(Number.isSafeInteger(amount)&&amount>=1&&amount<=30,'Negocie entre 1 e 30 unidades.');
  const price=token==='blood'?5:4,capacity=120+l.level*40;
  if(input.operation==='buy'){check((p.coins||0)>=price*amount,'Marcas insuficientes.');check(l[token]+amount<=capacity,'Reservatório cheio.');p.coins-=price*amount;l[token]+=amount;}
  else{check(l[token]>=amount,`Não há ${label(p)} suficiente.`);l[token]-=amount;p.coins=(p.coins||0)+Math.max(1,price-2)*amount;}
  l.trades++;return {message:`${input.operation==='buy'?'Compra':'Venda'} de ${amount} ${label(p)} concluída.`};
 }
 const house=(world.houses||[]).find(h=>h.id===p.realm.houseId),city=house?.settlement;
 check(city&&distance(s,city)<=4.2,'Aproxime-se da cidade de sua Casa.');city.lineageStock||={blood:0,hunt:0};city.lineageStock.blood||=0;city.lineageStock.hunt||=0;
 if(['deposit','withdraw'].includes(input.operation)){
  check(Number.isSafeInteger(amount)&&amount>=1&&amount<=50,'Transfira entre 1 e 50 unidades.');
  if(input.operation==='deposit'){check(l[token]>=amount,`Não há ${label(p)} suficiente.`);check(city.lineageStock[token]+amount<=500+(city.level||1)*100,'Armazém cheio.');l[token]-=amount;city.lineageStock[token]+=amount;}
  else{check(city.lineageStock[token]>=amount,'Armazém vazio.');check(l[token]+amount<=120+l.level*40,'Reservatório pessoal cheio.');city.lineageStock[token]-=amount;l[token]+=amount;}
  return {message:`${amount} ${label(p)} ${input.operation==='deposit'?'guardados na cidade':'retirados da cidade'}.`};
 }
 if(input.operation==='evolve'){
  check(l.level<8,'Sua linhagem já atingiu o ápice.');const cost=20+15*l.level;
  check(l[token]+city.lineageStock[token]>=cost,`A evolução exige ${cost} ${label(p)}.`);
  const personal=Math.min(l[token],cost);l[token]-=personal;city.lineageStock[token]-=cost-personal;l.level++;
  if(token==='blood')city.bloodRite=Math.max(city.bloodRite||0,l.level);else city.huntingLodge=Math.max(city.huntingLodge||0,l.level);
  city.maxHp=(city.maxHp||600)+35;city.hp=Math.min(city.maxHp,(city.hp||0)+35);
  return {message:`${token==='blood'?'Rito de sangue':'Trilha da matilha'} nível ${l.level}: reservatório, combate e cidade evoluíram.`};
 }
 throw new RuleError('Ritual de linhagem desconhecido.');
}
