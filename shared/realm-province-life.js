import {RuleError} from './engine.js';
import {WORLD_MAP_BOUNDS} from './realm-geography.js';
import {gainRpg} from './realm-rpg.js';

const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
const check=(valid,message)=>{if(!valid)throw new RuleError(message);};
const GOODS=['timber','ore','essence'];
const BASE_BUY={timber:7,ore:11,essence:15};
const RESOURCE_NAME={timber:'madeiras',ore:'minérios',essence:'essências'};
const HABITANTS={forest:['Maelis','Aeron'],marsh:['Silva','Neria'],mountain:['Draven','Iona'],ruins:['Mora','Erian'],city:['Vesper','Liora'],snow:['Eira','Toren'],volcanic:['Kael','Sera'],astral:['Nyx','Orien'],citadel:['Sable','Valen']};
const pos=(n,dx,dy)=>({x:clamp(n.x+dx,2,WORLD_MAP_BOUNDS.maxX-1),y:clamp(n.y+dy,2,98)});
const person=(n,kind,suffix,name,dx,dy,extra={})=>({id:`province-${n.id}-${suffix}`,node:n.id,provinceId:n.provinceId,kind,name,cardId:extra.cardId||'envoy',faction:extra.faction||'neutral',...pos(n,dx,dy),homeX:pos(n,dx,dy).x,homeY:pos(n,dx,dy).y,hp:extra.hp||65,maxHp:extra.hp||65,attack:extra.attack||5,phase:n.x*.01,attackAt:0,respawnAt:0,state:extra.state||'Em serviço',...extra});

export function provinceMarketPrices(actor,region,ecology){
 const stock=actor.marketStock||{},security=ecology?.security??50;
 return Object.fromEntries(GOODS.map(resource=>{
  const local=region?.resource===resource,available=stock[resource]||0;
  const scarcity=available<8?1.25:available>38?.88:1;
  const risk=security<30?1.18:security>75?.94:1;
  const buy=Math.max(3,Math.round(BASE_BUY[resource]*(local?.88:1.12)*scarcity*risk));
  return [resource,{buy,sell:Math.max(2,Math.floor(buy*.55))}];
 }));
}
export function provinceMarketView(w,actor,region){
 if(!actor.marketStock)return null;
 return {prices:provinceMarketPrices(actor,region,w.ecology?.regions?.[actor.node]),stock:{...actor.marketStock},lot:2,role:actor.role||'mercador',updatedAt:w.provinceLife?.lastAt||0};
}
export function provinceMarketTrade(w,profile,actor,region,input,now){
 const resource=input.resource||region?.resource||'timber',operation=input.operation||'sell';
 check(GOODS.includes(resource),'Recurso desconhecido.');check(['buy','sell'].includes(operation),'Operação de mercado desconhecida.');
 const stock=actor.marketStock,materials=profile.realm.materials,price=provinceMarketPrices(actor,region,w.ecology?.regions?.[actor.node])[resource][operation],total=price*2;
 actor.marketPurse??=100;
 if(operation==='sell'){
  check((materials[resource]||0)>=2,`São necessárias 2 ${RESOURCE_NAME[resource]}.`);
  check(stock[resource]<=98&&actor.marketPurse>=total,'O mercado está sem espaço ou Marcas para esta carga.');
  materials[resource]-=2;stock[resource]+=2;actor.marketPurse-=total;profile.coins=(profile.coins||0)+total;
 }else{
  check(stock[resource]>=2,'O mercado esgotou este recurso.');check((profile.coins||0)>=total,`São necessárias ${total} Marcas.`);
  profile.coins-=total;stock[resource]-=2;actor.marketPurse=Math.min(400,actor.marketPurse+total);materials[resource]=(materials[resource]||0)+2;
 }
 const e=w.ecology?.regions?.[actor.node];if(e)e.prosperity=clamp((e.prosperity||50)+1,0,100);
 return {message:`${operation==='buy'?'Compra':'Venda'} em ${actor.name}: 2 ${RESOURCE_NAME[resource]} por ${total} Marcas.`};
}
export function ensureProvinceLife(w,regions,now){
 const provinces=regions.filter(n=>n.provinceId);
 if(!provinces.length)return;
 if(w.provinceLife?.siteCount===provinces.length)return;
 w.provinceLife||={version:1,nextAt:now+60000,lastAt:now,cycle:0};
 const ids=new Set(w.actors.map(a=>a.id));
 const add=actor=>{if(!ids.has(actor.id)){w.actors.push(actor);ids.add(actor.id);}};
 for(const n of provinces){
  const [first,second]=HABITANTS[n.habitat]||HABITANTS.forest;
  if(n.kind==='sanctuary'){
   add(person(n,'quartermaster','healer',`${first} · Vigília de ${n.name}`,-3,-2,{cardId:'envoy',hp:80,state:'Ampara viajantes'}));
   add(person(n,'patrol','guard',`${second} · Guarda de ${n.name}`,3,1,{cardId:'warden',hp:100,attack:7,state:'Vigia a estrada'}));
  }
  if(n.market){
   const merchant=person(n,'merchant','market',`${first} · Mercado de ${n.name}`,2,-3,{cardId:'duchess',hp:70,role:n.settlementRole||'mercado',marketStock:{timber:24,ore:20,essence:16},marketPurse:160,state:'Compra e vende suprimentos'});
   add(merchant);
  }
  if(n.kind==='sanctuary'||n.kind==='capital'||n.settlementRole==='temple'||n.settlementRole==='observatory'){
   add(person(n,'envoy','chronicler',`${second} · Crônicas de ${n.name}`,-2,3,{cardId:'elder',hp:70,role:'chronicler',state:'Registra rumores e juramentos'}));
  }
 }
 const byProvince=new Map();for(const n of provinces){const list=byProvince.get(n.provinceId)||[];list.push(n);byProvince.set(n.provinceId,list);}
 for(const [provinceId,sites] of byProvince){
  if(sites.length<2)continue;
  const start=sites.find(n=>n.kind==='sanctuary'||n.market)||sites[0];
  add(person(start,'caravan',`caravan-${provinceId}`,`Caravana de ${start.name}`,1,5,{cardId:'mooncaller',hp:155,attack:4,role:'regional-caravan',route:sites.map(n=>n.id),routeIndex:1,marketStock:{timber:12,ore:8,essence:6},state:'Transporta mercadorias'}));
 }
 w.provinceLife.siteCount=provinces.length;
}
export function advanceProvinceLife(w,regions,now){
 ensureProvinceLife(w,regions,now);const life=w.provinceLife;if(!life||now<life.nextAt)return;
 life.nextAt=now+60000;life.lastAt=now;life.cycle++;
 const byId=new Map(regions.map(n=>[n.id,n]));
 for(const a of w.actors){
  if(!a.provinceId)continue;
  const n=byId.get(a.node),eco=w.ecology?.regions?.[a.node];
  if(a.kind==='merchant'&&a.marketStock){
   for(const resource of GOODS){
    const supplied=n?.resource===resource?3:1;
    a.marketStock[resource]=clamp(a.marketStock[resource]+supplied,0,100);
   }
   a.marketPurse=clamp((a.marketPurse||0)+12,0,400);
   a.state=(eco?.unrest||0)>65?'Comércio vigiado por guardas':(eco?.prosperity||0)>65?'Mercado em expansão':'Compra e vende suprimentos';
  }else if(a.kind==='envoy'&&a.role==='chronicler'){
   a.state=(eco?.unrest||0)>65?'Alerta: motim nas estradas':(eco?.security||0)<35?'Registra desaparecimentos':'Registra rumores e juramentos';
  }else if(a.kind==='caravan'&&a.role==='regional-caravan'){
   // Unobserved routes advance at coarse cadence; local movement is animated
   // by the regular NPC step only while players can see the caravan.
   if(a.hp>0&&!a.nearPlayer){const next=byId.get(a.route?.[a.routeIndex]);if(next){Object.assign(a,pos(next,1,5),{node:next.id});a.routeIndex=(a.routeIndex+1)%a.route.length;a.state=`Mercadorias chegaram a ${next.name}`;}}
  }
 }
}
export function provinceChroniclerInteract(w,profile,actor,region,now){
 const roaming=profile.realm.roaming,visits=profile.realm.visitedProvinces||=([]);
 const first=!visits.includes(region.provinceId);if(first){visits.push(region.provinceId);gainRpg(profile,30,'exploration');profile.coins=(profile.coins||0)+10;}
 const eco=w.ecology?.regions?.[actor.node],threat=(eco?.unrest||0)>65?'motins na estrada':(eco?.security||0)<35?'predadores na fronteira':'rotas sob vigília';
 roaming.interactions[actor.id]=now;
 return {message:`${actor.name}: ${region.description} Rumor atual: ${threat}.${first?' Primeira crônica desta terra: +30 XP e +10 Marcas.':''}`};
}
