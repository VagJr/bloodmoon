import {CARDS} from './cards.js';
import {RuleError} from './engine.js';
import {ensureAdventure,dailyState} from './adventure.js';

// Coordinates are percentages of the existing illustrated map. Distances use
// its 3:2 aspect ratio so diagonal movement has the same world speed.
export const WORLD_RULES=Object.freeze({width:6000,height:4000,aspect:1.5,speed:3.3,interactRange:4.2,attackRange:5.2,maxMoveMs:250,tickMs:250,maxCatchupMs:5000,maxDeployments:8,attackCooldown:1300,respawnMs:12000,presenceMs:45000});
export const WORLD_SLOT_KINDS=Object.freeze({construction:'Construção',resource:'Produção',weapon:'Armamento',trap:'Armadilha',frontline:'Linha de frente',influence:'Influência'});
export const WORLD_BLUEPRINTS=Object.freeze({
  camp:{id:'camp',name:'Abrigo da Vigília',kind:'construction',cost:{timber:3,ore:1},health:90,description:'Um abrigo no mundo: recupere vitalidade e vigor, repare suas cartas próximas.'},
  lumbermill:{id:'lumbermill',name:'Serraria das Cinzas',kind:'resource',resource:'timber',cost:{timber:3,ore:2},health:65,description:'Produz 1 madeira a cada 20 segundos; armazena até 20.'},
  mine:{id:'mine',name:'Mina do Juramento',kind:'resource',resource:'ore',cost:{timber:4,ore:2},health:80,description:'Produz 1 minério a cada 20 segundos; armazena até 20.'},
  essencewell:{id:'essencewell',name:'Poço do Véu',kind:'resource',resource:'essence',cost:{timber:3,essence:2},health:55,description:'Produz 1 essência a cada 20 segundos; armazena até 20.'},
  ballista:{id:'ballista',name:'Balista de Obsidiana',kind:'weapon',cost:{timber:4,ore:3},health:70,attack:9,description:'Dispara contra invasores e criaturas hostis dentro de 7 unidades.'},
  thorntrap:{id:'thorntrap',name:'Laço de Espinhos',kind:'trap',cost:{timber:2,essence:1},health:35,attack:18,description:'Fere e imobiliza hostis próximos. Rearma a cada 8 segundos.'},
  banner:{id:'banner',name:'Estandarte de Juramento',kind:'influence',cost:{timber:3,essence:2},health:65,description:'Gera favores. A cada minuto, converta presença em influência da sua Casa.'}
});
const check=(condition,message)=>{if(!condition)throw new RuleError(message);};
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
const distance=(a,b)=>Math.hypot((a.x-b.x)*WORLD_RULES.aspect,a.y-b.y);
const nodeAt=(regions,id)=>regions.find(n=>n.id===id)||regions[0];
const profileList=profiles=>profiles instanceof Map?[...profiles.values()]:Array.isArray(profiles)?profiles:Object.values(profiles||{});
const alive=a=>a.hp>0;
const safe=(a,regions)=>distance(a,nodeAt(regions,'haven'))<5;
const online=(p,now)=>p.realm&&now-(p.realm.seenAt||0)<WORLD_RULES.presenceMs;
const active=(p,now)=>online(p,now)&&!p.realm.activeRoom&&p.realm.roaming?.hp>0;
const owns=(p,id)=>CARDS[id]?.type==='equipment'?(p.items||[]).some(i=>i.cardId===id&&i.durability>0&&!i.listingId):(p.collection?.[id]||0)>0;
function freeGear(w,p,id){const available=(p.items||[]).filter(i=>i.cardId===id&&i.durability>0&&!i.listingId).length;const used=w.slots.filter(s=>s.occupant?.owner===p.realm.publicId).reduce((n,s)=>n+Number(s.occupant.cardId===id)+(s.occupant.equipment||[]).filter(c=>c===id).length,0)+(p.realm.roaming.equipment||[]).filter(c=>c===id).length;return available>used;}
function log(w,text,now,kind='world'){w.events.unshift({id:`event-${++w.serial}`,text,at:now,kind});w.events=w.events.slice(0,35);}
function xp(r,amount){r.xp=(r.xp||0)+amount;r.level=1+Math.floor(r.xp/120);}
function debit(p,cost){for(const [key,value]of Object.entries(cost))check((key==='coins'?p.coins:p.realm.materials[key])>=value,`Recursos insuficientes: ${value} ${key==='coins'?'Marcas':({timber:'madeiras',ore:'minérios',essence:'essências'}[key]||key)}.`);for(const [key,value]of Object.entries(cost)){if(key==='coins')p.coins-=value;else p.realm.materials[key]-=value;}}
function place(n,dx,dy){return {x:clamp(n.x+dx,2,98),y:clamp(n.y+dy,2,98)};}
function addActor(w,n,kind,index,extra={}){
  const angle=index*2.4,offset=kind==='hostile'?7:2.6;
  const pos=place(n,Math.cos(angle)*offset/WORLD_RULES.aspect,Math.sin(angle)*offset);
  const a={id:`${n.id}-${kind}-${index}`,node:n.id,kind,name:kind,faction:'neutral',...pos,homeX:pos.x,homeY:pos.y,hp:30,maxHp:30,attack:4,state:'patrulhando',phase:index*1.6,attackAt:0,respawnAt:0,...extra};
  a.homeX=a.x;a.homeY=a.y;w.actors.push(a);return a;
}
export function ensureRealmWorld(world,regions,now=Date.now()){
  if(world.realmWorld?.schema===1){addSharedRaids(world.realmWorld,regions,now);return world.realmWorld;}
  const w={schema:1,version:1,serial:0,lastTick:now,nextInvasionAt:now+90000,actors:[],slots:[],events:[],invasions:[],presence:[]};
  const kinds=Object.keys(WORLD_SLOT_KINDS);
  regions.forEach((n,i)=>{
    kinds.forEach((kind,k)=>{const angle=k*Math.PI/3;w.slots.push({id:`${n.id}:${kind}`,node:n.id,kind,...place(n,Math.cos(angle)*3.9,Math.sin(angle)*5.9),occupant:null});});
    if(n.id==='haven'){
      addActor(w,n,'quartermaster',0,{name:'Iria · Guardiã do Porto',cardId:'envoy',faction:'vampire'});
      addActor(w,n,'envoy',1,{name:'Toren · Juramento da Lua',cardId:'elder',faction:'werewolf'});
      addActor(w,n,'merchant',2,{name:'Nessa · Mercado das Cinzas',cardId:'duchess',faction:'vampire'});
      ['timber','ore','essence'].forEach((resource,j)=>addActor(w,n,'resource',j,{name:{timber:'Madeira caída',ore:'Veio de ferro',essence:'Cristais do Véu'}[resource],resource,...place(n,2+j*1.1,-1-j*1.2),hp:1,maxHp:1}));
      for(let j=0;j<3;j++)addActor(w,n,'hostile',j+2,{name:'Errante das Cinzas',cardId:'thrall',hp:22,maxHp:22,attack:3,level:1});
    }else{
      addActor(w,n,'resource',0,{name:{timber:'Madeira ancestral',ore:'Minério negro',essence:'Essência lunar'}[n.resource],resource:n.resource,hp:1,maxHp:1});
      for(let j=0;j<2;j++)addActor(w,n,'hostile',j+1,{name:j?'Fera do Véu':'Saqueador Sem Nome',cardId:j?'ravager':'warden',hp:24+n.level*10,maxHp:24+n.level*10,attack:3+n.level,level:n.level});
      addActor(w,n,'patrol',3,{name:i%2?'Vigia da Corte':'Sentinela da Alcateia',faction:i%2?'vampire':'werewolf',cardId:i%2?'duelist':'fang',hp:70,maxHp:70,attack:7});
      if(n.kind==='dungeon')addActor(w,n,'portal',4,{name:n.name,arenaKind:'dungeon',cardId:'warden',hp:1,maxHp:1,...place(n,0,0)});
      else if(['fortress','capital'].includes(n.kind))addActor(w,n,'boss',4,{name:`Guardião · ${n.name}`,arenaKind:'boss',cardId:n.id==='peak'?'alpha':'warden',hp:180+n.level*40,maxHp:180+n.level*40,...place(n,0,0)});
      else if(i%3===0)addActor(w,n,'champion',4,{name:i%2?'Desafiante Carmesim':'Campeã da Lua',faction:i%2?'vampire':'werewolf',arenaKind:'duel',cardId:i%2?'duelist':'fang',hp:90,maxHp:90});
    }
  });
  const haven=nodeAt(regions,'haven');
  addActor(w,haven,'patrol',5,{name:'Vigília Carmesim',faction:'vampire',cardId:'duelist',hp:85,maxHp:85,attack:6});
  addActor(w,haven,'patrol',6,{name:'Vigília da Lua',faction:'werewolf',cardId:'fang',hp:85,maxHp:85,attack:6});
  addActor(w,haven,'caravan',7,{name:'Caravana das Duas Luas',faction:'neutral',cardId:'mooncaller',hp:140,maxHp:140,route:['haven','quarry','bridge','lake','moonwood','haven'],routeIndex:1});
  log(w,'As duas linhagens mantêm vigílias. Caravanas e criaturas já percorrem Véspera.',now,'arrival');
  addSharedRaids(w,regions,now);world.realmWorld=w;return w;
}
function addSharedRaids(w,regions,now){
 if(w.contentVersion>=3)return;
 for(const n of regions.filter(n=>n.kind==='dungeon')){
   const position=place(n,4,-6),existing=w.actors.find(a=>a.id===`${n.id}-raid`);
   if(existing){existing.homeX=position.x;existing.homeY=position.y;}
   else addActor(w,n,'raid',8,{id:`${n.id}-raid`,name:`Colosso do Véu · ${n.name}`,cardId:'ravager',...position,hp:360,maxHp:360,attack:7,level:n.level,contributions:{},claimed:{},respawnAt:0});
 }
 const haven=nodeAt(regions,'haven');
 for(const a of w.actors.filter(a=>a.kind==='resource'&&a.node==='haven')){const j=['timber','ore','essence'].indexOf(a.resource),position=place(haven,2+j*1.1,-1-j*1.2);a.homeX=position.x;a.homeY=position.y;}
 w.contentVersion=3;
}
export function ensureWorldPlayer(profile,regions,now=Date.now()){
  check(profile.realm,'Entre em Reinos primeiro.');
  const r=profile.realm;
  if(!r.roaming){const n=nodeAt(regions,r.location);r.roaming={x:n.x,y:n.y,hp:100,maxHp:100,energy:100,maxEnergy:100,moveSeq:0,moveAt:now-250,attackAt:0,commandAt:0,lastCombatAt:0,downUntil:0,targetId:null,targetUntil:0,equipment:[],reputation:{vampire:0,werewolf:0},quest:{id:'watch',kills:0,gathers:0,claimed:0},encounters:{},interactions:{},respawns:0};}
  return r.roaming;
}
function go(a,to,amount){const d=distance(a,to);if(d<=amount){a.x=to.x;a.y=to.y;}else if(d>0){a.x+=(to.x-a.x)*amount/d;a.y+=(to.y-a.y)*amount/d;}}
function ownerProfile(profiles,id){return profiles.find(p=>p.realm?.publicId===id);}
function enemyOf(a){return a.kind==='hostile'||a.kind==='invader'||a.kind==='raid';}
function diePlayer(w,p,now,regions){
  const r=p.realm,s=r.roaming;if(s.downUntil)return;
  s.hp=0;s.downUntil=now+WORLD_RULES.respawnMs;s.targetId=null;s.respawns++;
  const coins=Math.min(20,Math.floor((p.coins||0)*.05)),materials={};p.coins-=coins;
  for(const key of ['timber','ore','essence']){materials[key]=Math.min(5,Math.floor((r.materials[key]||0)*.1));r.materials[key]-=materials[key];}
  w.actors=w.actors.filter(a=>a.kind!=='satchel'||a.owner!==r.publicId);
  w.actors.push({id:`satchel-${++w.serial}`,kind:'satchel',name:`Espólio de ${p.name}`,owner:r.publicId,x:s.x,y:s.y,node:r.location,hp:1,maxHp:1,coins,materials,expiresAt:now+300000,state:'recuperável'});
  log(w,`${p.name} caiu. A Vigília abre um retorno ao Porto; seu espólio espera por cinco minutos.`,now,'defeat');r.version++;
}
function rewardKill(w,a,p,now){
  if(!p?.realm||p.realm.activeRoom)return;
  if(a.kind==='raid'){log(w,`${a.name} foi vencido. Os participantes podem recolher seu saque.`,now,'victory');return;}
  const r=p.realm,s=r.roaming,amount=a.kind==='invader'?10:5+Math.min(5,a.level||1);
  p.coins=(p.coins||0)+amount;r.materials[a.resource||'essence']=(r.materials[a.resource||'essence']||0)+1;xp(r,8+(a.level||1)*2);s.quest.kills++;
  s.reputation[p.starterFaction]=(s.reputation[p.starterFaction]||0)+1;r.version++;
  if(a.invasionId){const inv=w.invasions.find(v=>v.id===a.invasionId);if(inv){inv.killed++;inv.contributors[r.publicId]=(inv.contributors[r.publicId]||0)+1;}}
  log(w,`${p.name} venceu ${a.name}: +${amount} Marcas e +1 essência.`,now,'combat');
}
function hitActor(w,a,damage,p,now){
  if(!alive(a))return;
  if(a.kind==='raid'&&p){a.contributions||={};a.contributions[p.realm.publicId]=(a.contributions[p.realm.publicId]||0)+Math.min(damage,a.hp);}
  a.hp=Math.max(0,a.hp-damage);a.state='em combate';
  if(p){a.aggro=p.realm.publicId;a.lastHitBy=p.realm.publicId;a.aggroUntil=now+15000;p.realm.roaming.lastCombatAt=now;}
  if(!a.hp){a.state='derrotado';a.respawnAt=now+(['invader','raid'].includes(a.kind)?300000:45000);rewardKill(w,a,p,now);}
}
function attackDamage(p){return 8+(p.realm.level||1)+p.realm.roaming.equipment.reduce((sum,id)=>sum+(owns(p,id)?CARDS[id]?.attack||0:0),0)*2;}
function syncEquipmentHealth(p){const s=p.realm.roaming,maximum=100+s.equipment.reduce((sum,id)=>sum+(owns(p,id)?CARDS[id]?.health||0:0),0)*5;s.hp=Math.max(0,Math.min(maximum,s.hp+Math.max(0,maximum-s.maxHp)));s.maxHp=maximum;}
function npcStep(world,w,profiles,regions,now,seconds){
  const present=profiles.filter(p=>active(p,now)),hostiles=w.actors.filter(a=>enemyOf(a)&&alive(a)),guards=w.actors.filter(a=>a.kind==='patrol'&&alive(a));
  for(const a of w.actors){
    if(!alive(a)){if(a.respawnAt&&a.respawnAt<=now&&a.kind!=='invader'){a.hp=a.maxHp;a.x=a.homeX;a.y=a.homeY;a.aggro=null;a.state='patrulhando';if(a.kind==='raid'){a.contributions={};a.claimed={};}}continue;}
    if(a.kind==='resource'||a.arenaKind||['merchant','envoy','quartermaster','satchel'].includes(a.kind))continue;
    if(a.kind==='caravan'){
      const threats=hostiles.filter(h=>distance(h,a)<5);if(threats.length){a.state='sob ataque';for(const h of threats){if(h.attackAt<=now){a.hp=Math.max(0,a.hp-h.attack);h.attackAt=now+2200;}}if(!a.hp){a.respawnAt=now+60000;log(w,'A caravana foi interceptada. A Vigília preparará uma nova rota.',now,'economy');}}
      else {const dest=nodeAt(regions,a.route[a.routeIndex]);go(a,dest,seconds*.8);a.state='em viagem';if(distance(a,dest)<1){a.node=dest.id;a.routeIndex=(a.routeIndex+1)%a.route.length;log(w,`A Caravana das Duas Luas entregou suprimentos em ${dest.name}.`,now,'economy');}}
      continue;
    }
    let target=null,targetProfile=null;
    if(enemyOf(a)){
      const provoked=present.find(p=>p.realm.publicId===a.aggro&&now<a.aggroUntil&&distance(a,p.realm.roaming)<10&&!safe(p.realm.roaming,regions));
      targetProfile=provoked||present.filter(p=>!safe(p.realm.roaming,regions)&&distance(a,p.realm.roaming)<4.8).sort((p,q)=>distance(a,p.realm.roaming)-distance(a,q.realm.roaming))[0];
      target=targetProfile?.realm.roaming||guards.filter(g=>distance(g,a)<4.5).sort((g,h)=>distance(a,g)-distance(a,h))[0];
      if(!target){const slot=w.slots.find(s=>s.occupant&&s.node===a.node&&distance(a,s)<(a.kind==='invader'?14:3));if(slot){target=slot;target.occupant._targeted=true;}}
    }else if(a.kind==='patrol')target=hostiles.filter(h=>h.kind!=='raid'&&alive(h)&&distance(h,a)<7).sort((g,h)=>distance(a,g)-distance(a,h))[0];
    if(target){
      a.state='em combate';
      if(distance(a,target)>2){if(!(a.rootUntil>now))go(a,target,seconds*(enemyOf(a)?1.15:1.4));}
      else if(a.attackAt<=now){
        a.attackAt=now+2000;
        if(targetProfile){target.hp=Math.max(0,target.hp-a.attack);target.lastCombatAt=now;if(!target.hp)diePlayer(w,targetProfile,now,regions);}
        else if(target.occupant){target.occupant.hp=Math.max(0,target.occupant.hp-a.attack);if(!target.occupant.hp){log(w,`${a.name} destruiu ${target.occupant.name} em ${nodeAt(regions,target.node).name}.`,now,'siege');target.occupant=null;}}
        else {target.hp=Math.max(0,target.hp-a.attack);if(!target.hp){target.state='derrotado';target.respawnAt=now+45000;const p=ownerProfile(profiles,target.lastHitBy);if(p&&active(p,now))rewardKill(w,target,p,now);}}
      }
    }else{
      a.state='patrulhando';const t=now/22000+a.phase,rad=enemyOf(a)?2.1:4;
      const dest={x:clamp(a.homeX+Math.cos(t)*rad/WORLD_RULES.aspect,1,99),y:clamp(a.homeY+Math.sin(t)*rad,1,99)};
      if(!(a.rootUntil>now))go(a,dest,seconds*.6);
    }
  }
}
function structuresStep(w,profiles,regions,now){
  for(const slot of w.slots){
    const o=slot.occupant;if(!o)continue;
    if(o.expiresAt<=now){slot.occupant=null;continue;}
    if(o.productionAt&&o.productionAt<=now){const ticks=Math.floor((now-o.productionAt)/20000)+1;o.stock=Math.min(20,o.stock+ticks);o.productionAt+=ticks*20000;}
    if(o.attack>0&&o.attackAt<=now){const range=slot.kind==='trap'?2.8:slot.kind==='weapon'?7:5;
      const target=w.actors.filter(a=>enemyOf(a)&&alive(a)&&distance(a,slot)<range).sort((a,b)=>distance(a,slot)-distance(b,slot))[0];
      if(target){const owner=ownerProfile(profiles,o.owner);hitActor(w,target,o.attack,owner&&active(owner,now)?owner:null,now);o.attackAt=now+(slot.kind==='trap'?8000:2000);if(slot.kind==='trap')target.rootUntil=now+4000;}
    }
  }
}
function startInvasion(w,regions,now){
  const candidates=regions.filter(n=>n.kind==='fortress'||n.kind==='mine'),n=candidates[Math.floor(now/90000)%candidates.length];
  const event={id:`invasion-${++w.serial}`,node:n.id,name:`Cerco dos Sem Nome · ${n.name}`,startsAt:now,endsAt:now+120000,total:4,killed:0,contributors:{},status:'active'};
  for(let i=0;i<4;i++){const a=addActor(w,n,'invader',i,{name:'Invasor Sem Nome',id:`${event.id}-${i}`,cardId:'warden',hp:48+n.level*8,maxHp:48+n.level*8,attack:6,level:n.level,invasionId:event.id});a.homeX=n.x;a.homeY=n.y;}
  w.invasions.unshift(event);w.invasions=w.invasions.slice(0,6);w.nextInvasionAt=now+180000;
  log(w,`Sinos de guerra: ${n.name} sofre uma invasão. Defenda os postos e conquiste favores.`,now,'invasion');
}
export function advanceRealmWorld(world,profiles,regions,now=Date.now()){
  const existed=!!world.realmWorld,w=ensureRealmWorld(world,regions,now),all=profileList(profiles);
  if(now-w.lastTick<WORLD_RULES.tickMs)return !existed;
  const elapsed=Math.min(WORLD_RULES.maxCatchupMs,now-w.lastTick),start=now-elapsed;
  for(const p of all)if(p.realm&&!p.realm.activeRoom)ensureWorldPlayer(p,regions,now);
  for(let at=start+Math.min(WORLD_RULES.tickMs,elapsed);at<=now;at+=WORLD_RULES.tickMs){
    for(const p of all.filter(p=>active(p,at))){const s=p.realm.roaming;
      syncEquipmentHealth(p);s.energy=clamp(s.energy+1,0,s.maxEnergy);
      if(safe(s,regions))s.hp=Math.min(s.maxHp,s.hp+.8);
      if(s.targetId&&s.targetUntil>at&&s.attackAt<=at){const target=w.actors.find(a=>a.id===s.targetId&&enemyOf(a)&&alive(a));if(target&&distance(s,target)<=WORLD_RULES.attackRange&&!safe(s,regions)){s.attackAt=at+WORLD_RULES.attackCooldown;hitActor(w,target,attackDamage(p),p,at);}else if(!target)s.targetId=null;}
    }
    npcStep(world,w,all,regions,at,WORLD_RULES.tickMs/1000);structuresStep(w,all,regions,at);
  }
  if(now>=w.nextInvasionAt)startInvasion(w,regions,now);
  for(const inv of w.invasions.filter(i=>i.status==='active')){
    if(w.actors.filter(a=>a.invasionId===inv.id&&alive(a)).length===0){inv.status='defended';log(w,`${inv.name}: a Vigília venceu. As estruturas sobreviveram.`,now,'victory');}
    else if(now>=inv.endsAt){inv.status='ended';w.actors=w.actors.filter(a=>a.invasionId!==inv.id);log(w,`${inv.name}: os invasores recuaram com os espólios.`,now,'siege');}
  }
  const validInvasions=new Set(w.invasions.filter(i=>i.status==='active').map(i=>i.id));
  w.actors=w.actors.filter(a=>a.kind==='satchel'?a.expiresAt>now:a.kind==='invader'?validInvasions.has(a.invasionId):true);
  w.lastTick=now;w.version++;return true;
}
function publicActor(a,p,now){return {id:a.id,name:a.name,kind:a.kind,faction:a.faction||'neutral',x:a.x,y:a.y,hp:a.hp,maxHp:a.maxHp,node:a.node,state:a.state,cardId:a.cardId,resource:a.resource,arenaKind:a.arenaKind,respawnAt:a.respawnAt||0,owner:a.owner||null,contribution:a.contributions?.[p.realm.publicId]||0,claimed:!!a.claimed?.[p.realm.publicId],interactable:alive(a)&&(!a.owner||a.owner===p.realm.publicId),cooldown:Math.max(0,(p.realm.roaming.encounters[a.id]||0)-now)};}
export function realmWorldView(world,profile,profiles,regions,now=Date.now()){
  const w=ensureRealmWorld(world,regions,now),s=ensureWorldPlayer(profile,regions,now);
  const {encounters,interactions,...player}=s;
  return {version:w.version,serverTime:now,rules:WORLD_RULES,blueprints:WORLD_BLUEPRINTS,slotKinds:WORLD_SLOT_KINDS,player:{...structuredClone(player),publicId:profile.realm.publicId,location:profile.realm.location},wallet:{coins:profile.coins,materials:{...profile.realm.materials},provisions:profile.realm.provisions,xp:profile.realm.xp,level:profile.realm.level,version:profile.realm.version},
    cards:Object.keys(CARDS).filter(id=>owns(profile,id)),
    actors:w.actors.map(a=>publicActor(a,profile,now)),slots:w.slots.map(slot=>{const o=slot.occupant;return {id:slot.id,node:slot.node,kind:slot.kind,x:slot.x,y:slot.y,occupant:o?{owner:o.owner,name:o.name,houseId:o.houseId,faction:o.faction,cardId:o.cardId,blueprintId:o.blueprintId,hp:o.hp,maxHp:o.maxHp,attack:o.attack,stock:o.stock,resource:o.resource,equipment:[...o.equipment],expiresAt:o.expiresAt}:null};}),
    players:profileList(profiles).filter(p=>online(p,now)&&p.realm.roaming).map(p=>({id:p.realm.publicId,name:p.name,avatar:p.realm.avatar,faction:p.starterFaction,houseId:p.realm.houseId,x:p.realm.roaming.x,y:p.realm.roaming.y,hp:p.realm.roaming.hp,maxHp:p.realm.roaming.maxHp,busy:!!p.realm.activeRoom,level:p.realm.level})),
    events:w.events.slice(0,12),invasions:w.invasions.map(({contributors,...inv})=>({...inv,contribution:contributors[profile.realm.publicId]||0})),cycle:{phase:['névoa','crepúsculo','lua rubra','vigília'][Math.floor(now/180000)%4],nextAt:(Math.floor(now/180000)+1)*180000}};
}
function nearbySlot(w,s,id){const slot=w.slots.find(t=>t.id===id);check(slot,'Posição de carta desconhecida.');check(distance(s,slot)<=WORLD_RULES.interactRange,'Aproxime-se da posição para comandar esta carta.');return slot;}
function combatReady(p,now){const s=p.realm.roaming;check(s.hp>0&&!s.downUntil,'Você caiu. Aguarde a Vigília e use Retornar ao Porto.');check(!p.realm.activeRoom,'Conclua a batalha de Arena para agir no mundo.');return s;}
function energy(s,amount){check(s.energy>=amount,`São necessários ${amount} pontos de vigor.`);s.energy-=amount;}
function influence(world,w,p,slot,now){
  const r=p.realm,o=slot.occupant;check(r.houseId,'Jure lealdade a uma Casa para exercer influência.');check(now-(o.influenceAt||0)>=60000,'O estandarte reúne novos favores a cada minuto.');
  const t=world.territories?.[slot.node];check(t,'Este território não possui um trono disputável.');
  const own=t.owner===r.houseId,legal=!t.owner||own||(world.wars||[]).some(war=>war.status==='active'&&war.endsAt>now&&war.attacker!==war.defender&&[war.attacker,war.defender].includes(r.houseId)&&[war.attacker,war.defender].includes(t.owner));
  check(legal,'Uma Casa rival governa aqui. Declare guerra antes de disputar seu território.');check(own||!t.protectedUntil||now>=t.protectedUntil,'A trégua protege este território.');
  energy(r.roaming,20);o.influenceAt=now;
  if(own){const house=world.houses.find(h=>h.id===r.houseId);if(house)house.treasury+=8;return 'Tributo entregue: +8 Marcas ao tesouro da Casa.';}
  t.influence[r.houseId]=(t.influence[r.houseId]||0)+1;
  const defender=world.houses.find(h=>h.id===t.owner),needed=defender?.policy==='bastion'?4:3;
  if(t.influence[r.houseId]>=needed){t.owner=r.houseId;t.influence={};t.protectedUntil=now+600000;world.version++;log(w,`${p.name} ergueu o estandarte de sua Casa em ${nodeAt([...(w._regions||[])],slot.node)?.name||slot.node}.`,now,'politics');return 'Território conquistado. Sua Casa recebe uma trégua de dez minutos.';}
  world.version++;return `Influência da Casa: ${t.influence[r.houseId]}/${needed}.`;
}
function deploy(world,w,p,input,regions,now){
  const r=p.realm,s=r.roaming,slot=nearbySlot(w,s,input.slotId),id=input.cardId||input.blueprintId,blueprint=WORLD_BLUEPRINTS[id],card=CARDS[id],existing=slot.occupant;
  if(card?.type==='equipment'&&existing){
    check(owns(p,id),'Este equipamento precisa estar íntegro e fora do mercado.');check(existing.owner===r.publicId,'Equipe apenas suas próprias cartas.');check(existing.equipment.length<2,'Esta carta já tem dois equipamentos.');check(!existing.equipment.includes(id),'Este equipamento já está aplicado.');check(freeGear(w,p,id),'Todas as cópias desta relíquia estão destacadas.');
    energy(s,10);existing.equipment.push(id);existing.attack+=(card.attack||0)*2;existing.hp+=(card.health||0)*5;existing.maxHp+=(card.health||0)*5;return {message:`${card.name} equipado em ${existing.name}.`};
  }
  check(!existing,'Esta posição está ocupada.');check(w.slots.filter(t=>t.occupant?.owner===r.publicId).length<WORLD_RULES.maxDeployments,'Limite de oito cartas em campo. Recolha uma posição para abrir espaço.');
  let cost,health,attack,name,resource;
  if(blueprint){check(slot.kind===blueprint.kind,'Esta planta exige uma posição compatível.');if(blueprint.resource)check(nodeAt(regions,slot.node).resource===blueprint.resource,'O recurso desta região não corresponde à construção.');cost=blueprint.cost;health=blueprint.health;attack=blueprint.attack||0;name=blueprint.name;resource=blueprint.resource;}
  else {
    check(card&&owns(p,id),'Escolha uma carta disponível da sua coleção.');check(card.type==='unit'||card.type==='equipment','Rituais são usados selecionando um alvo.');
    check(card.type==='unit'?['frontline','influence'].includes(slot.kind):slot.kind==='weapon','Tipo de carta incompatível com esta posição.');
    const deployed=w.slots.filter(t=>t.occupant?.owner===r.publicId&&t.occupant.cardId===id).length;
    const count=card.type==='equipment'?(p.items||[]).filter(i=>i.cardId===id&&i.durability>0&&!i.listingId).length:p.collection[id];check(deployed<count&&(card.type!=='equipment'||freeGear(w,p,id)),'Todas as cópias desta carta já estão em campo.');
    cost={timber:2,ore:1};health=30+(card.health||0)*8;attack=(card.attack||1)*3;name=card.name;
  }
  check(s.energy>=15,'São necessários 15 pontos de vigor.');debit(p,cost);energy(s,15);
  slot.occupant={owner:r.publicId,name,houseId:r.houseId,faction:p.starterFaction,cardId:card?.id||null,blueprintId:blueprint?.id||null,hp:health,maxHp:health,attack,stock:0,resource,equipment:[],builtAt:now,expiresAt:now+604800000,attackAt:now+1000,productionAt:resource?now+20000:0,influenceAt:now-60000};
  log(w,`${p.name} posicionou ${name} em ${nodeAt(regions,slot.node).name}.`,now,'build');return {message:`${name} em campo.`};
}
function interact(world,w,p,input,regions,now){
  const r=p.realm,s=r.roaming,slot=w.slots.find(t=>t.id===input.targetId);
  if(slot){nearbySlot(w,s,slot.id);const o=slot.occupant;check(o&&o.owner===r.publicId,'Interaja com uma carta sob seu comando.');
    if(slot.kind==='resource'){check(o.stock>0,'A produção ainda está se preparando.');const amount=o.stock;r.materials[o.resource]+=amount;o.stock=0;s.quest.gathers++;return {message:`Produção recolhida: +${amount} ${o.resource}.`};}
    if(slot.kind==='influence')return {message:influence(world,w,p,slot,now)};
    if(o.blueprintId==='camp'){check(now-s.lastCombatAt>=6000,'Afaste-se do combate antes de descansar.');check(now-(o.restAt||0)>=20000,'O abrigo estará pronto novamente em instantes.');s.hp=Math.min(s.maxHp,s.hp+40);s.energy=Math.min(s.maxEnergy,s.energy+35);o.restAt=now;return {message:'O abrigo restaurou 40 de vitalidade e 35 de vigor.'};}
    throw new RuleError('Esta carta defende a posição automaticamente. Use reparar ou recolher.');
  }
  const a=w.actors.find(a=>a.id===input.targetId);check(a&&(alive(a)||a.kind==='raid'),'Este alvo não está disponível.');check(distance(s,a)<=WORLD_RULES.interactRange,'Aproxime-se para interagir.');
  if(a.kind==='raid'){check(!a.hp,'Vença o colosso antes de recolher seu saque.');check((a.contributions?.[r.publicId]||0)>=20,'Cause pelo menos 20 de dano para participar do saque.');check(!a.claimed[r.publicId],'Você já recebeu o saque desta vigília.');a.claimed[r.publicId]=true;p.coins+=60;r.materials.ore+=6;r.materials.essence+=4;xp(r,60);return {message:'Raid vencida: +60 Marcas, +60 XP, +6 minérios e +4 essências.'};}
  if(a.kind==='resource'){energy(s,5);r.materials[a.resource]+=3;s.quest.gathers++;ensureAdventure(r);r.adventure.stats.gathers++;dailyState(r,now).gathers++;xp(r,5);a.hp=0;a.respawnAt=now+30000;s.reputation[p.starterFaction]=(s.reputation[p.starterFaction]||0)+1;return {message:`Coleta: +3 ${a.resource==='timber'?'madeiras':a.resource==='ore'?'minérios':'essências'}.`};}
  if(a.kind==='satchel'){check(a.owner===r.publicId,'Este espólio pertence a outro viajante.');p.coins+=a.coins;for(const [k,v]of Object.entries(a.materials))r.materials[k]+=v;w.actors=w.actors.filter(t=>t!==a);return {message:'Seu espólio foi recuperado.'};}
  if(a.kind==='quartermaster'){check(now-(s.interactions[a.id]||0)>=20000,'Iria está preparando novos suprimentos.');s.hp=s.maxHp;s.energy=s.maxEnergy;s.interactions[a.id]=now;r.provisions=Math.max(r.provisions,8);return {message:'Iria restaurou sua vitalidade e vigor. A Vigília garante pelo menos 8 provisões.'};}
  if(a.kind==='merchant'){const resource=input.resource||nodeAt(regions,r.location).resource;check(['timber','ore','essence'].includes(resource),'Recurso desconhecido.');debit(p,{[resource]:2});p.coins+=8;return {message:'Negócio concluído: 2 recursos vendidos por 8 Marcas.'};}
  if(a.kind==='envoy'){
    const q=s.quest;if(q.kills<3||q.gathers<2)return {message:`Contrato da Vigília: vença 3 criaturas (${q.kills}/3) e faça 2 coletas (${q.gathers}/2). Recompensa: 50 Marcas, 30 XP e 5 favores de cada linhagem.`};
    p.coins+=50;xp(r,30);q.kills-=3;q.gathers-=2;q.claimed++;s.reputation.vampire+=5;s.reputation.werewolf+=5;return {message:'Contrato concluído: +50 Marcas, +30 XP e +5 favores de cada linhagem. Um novo contrato está disponível.'};
  }
  if(a.kind==='caravan'){check(now-(s.interactions[a.id]||0)>=60000,'A caravana já recompensou sua escolta nesta passagem.');check(a.state!=='sob ataque','Proteja a caravana dos inimigos antes de receber suprimentos.');s.interactions[a.id]=now;r.materials.timber+=2;r.provisions=Math.min(25,r.provisions+2);return {message:'A caravana agradece a escolta: +2 madeiras e +2 provisões.'};}
  if(a.kind==='patrol'){s.reputation[a.faction]=(s.reputation[a.faction]||0);return {message:a.faction==='vampire'?'A Corte protege estas rotas. Ajude a Vigília e erga seu estandarte.':'A Alcateia sente os invasores. Lute ao nosso lado e defenda os postos.'};}
  check(!a.arenaKind,'Use Desafiar para abrir a mesa de Arena deste encontro.');throw new RuleError('Escolha uma interação válida.');
}
function attack(world,w,p,input,regions,now){
  const s=p.realm.roaming;check(now>=s.attackAt,'Aguarde o próximo golpe.');
  const card=input.cardId?CARDS[input.cardId]:null;
  if(card){check(owns(p,card.id),'Esta carta não está disponível.');check(card.type==='spell','Selecione um ritual para lançar.');}
  if(card&&['heal','sacrifice','pounce','influence'].includes(card.effect)){
    const targetSlot=w.slots.find(t=>t.id===input.targetId),o=targetSlot?.occupant;
    if(card.effect==='influence'){check(targetSlot?.kind==='influence'&&o?.owner===p.realm.publicId,'Selecione seu estandarte ou emissário em uma posição de influência.');nearbySlot(w,s,targetSlot.id);const result=influence(world,w,p,targetSlot,now);s.attackAt=now+4000;return {message:result};}
    if(card.effect==='pounce'){check(o?.owner===p.realm.publicId&&o.attack>0,'Selecione um combatente sob seu comando.');nearbySlot(w,s,targetSlot.id);energy(s,15+card.cost*3);o.attackAt=now;o.hp=Math.min(o.maxHp,o.hp+10);s.attackAt=now+4000;return {message:'Investida preparada. O combatente recebe um novo ataque e recupera 10 de vitalidade.'};}
    check(!input.targetId||input.targetId===p.realm.publicId||input.targetId==='self'||o?.owner===p.realm.publicId,'Selecione seu líder ou uma carta aliada.');if(o)nearbySlot(w,s,targetSlot.id);
    energy(s,10+card.cost*3);const target=o||s;target.hp=Math.min(target.maxHp,target.hp+(card.effect==='sacrifice'?12:25));s.attackAt=now+4000;return {message:`${card.name}: vitalidade restaurada.`};
  }
  const a=w.actors.find(t=>t.id===input.targetId);check(a&&alive(a)&&enemyOf(a),'Selecione uma criatura hostil viva. Chefes e rivais usam a Arena.');check(!safe(s,regions),'O Pacto de Paz impede ataques dentro do Porto.');check(distance(s,a)<=WORLD_RULES.attackRange,'O alvo está fora de alcance.');
  if(card)energy(s,10+card.cost*4);
  const damage=card?(card.effect==='execute'?32:card.effect==='rend'?24:18+(card.effectAmount||0)*2):attackDamage(p);
  s.attackAt=now+(card?3500:WORLD_RULES.attackCooldown);s.targetId=a.id;s.targetUntil=now+20000;hitActor(w,a,damage,p,now);
  return {message:`${card?.name||'Ataque'}: ${damage} de dano.`,damage,targetId:a.id};
}
export function realmWorldAction(world,profile,input,regions,now=Date.now()){
  const w=ensureRealmWorld(world,regions,now),r=profile.realm,s=ensureWorldPlayer(profile,regions,now);check(input&&typeof input.type==='string','Ordem inválida.');
  check(!r.activeRoom,'Conclua a batalha de Arena para agir no mundo.');
  if(input.type==='world-move'){
    combatReady(profile,now);const dx=Number(input.dx),dy=Number(input.dy),ms=Number(input.elapsedMs),seq=Number(input.sequence);
    check(Number.isFinite(dx)&&Number.isFinite(dy)&&Math.abs(dx)<=1&&Math.abs(dy)<=1,'Direção inválida.');check(Number.isFinite(ms)&&ms>0&&ms<=250,'Intervalo de movimento inválido.');check(Number.isSafeInteger(seq)&&seq>s.moveSeq&&seq<=Number.MAX_SAFE_INTEGER-1,'Movimento já recebido ou fora de sequência.');
    const elapsed=Math.min(ms,250,Math.max(0,now-s.moveAt)),length=Math.hypot(dx,dy),factor=length>1?1/length:1,step=WORLD_RULES.speed*elapsed/1000;
    s.x=clamp(s.x+dx*factor*step/WORLD_RULES.aspect,1,99);s.y=clamp(s.y+dy*factor*step,1,99);s.moveAt=now;s.moveSeq=seq;r.seenAt=now;
    const nearest=[...regions].sort((a,b)=>distance(a,s)-distance(b,s))[0];
    if(distance(s,nearest)<8&&nearest.id!==r.location){r.location=nearest.id;r.expedition=null;r.version++;if(!r.visited.includes(nearest.id)){r.visited.push(nearest.id);xp(r,20);}}
    w.version++;return {message:'',x:s.x,y:s.y,sequence:s.moveSeq};
  }
  if(input.type==='world-recover'){
    check(!s.hp||now-s.lastCombatAt>=12000,'Afaste-se do combate por 12 segundos para retornar.');check(!s.downUntil||now>=s.downUntil,'A Vigília ainda prepara seu retorno.');
    const haven=nodeAt(regions,'haven');s.x=haven.x;s.y=haven.y;s.hp=s.maxHp;s.energy=s.maxEnergy;s.downUntil=0;s.targetId=null;s.moveAt=now;r.location=haven.id;r.expedition=null;r.version++;r.seenAt=now;w.version++;return {message:'A Vigília recebeu você no Porto das Cinzas.'};
  }
  combatReady(profile,now);if(input.type==='world-encounter')return prepareWorldEncounter(world,profile,input,regions,now);
  check(now>=s.commandAt,'Aguarde um instante entre ordens.');let result;
  if(input.type==='world-stop'){s.targetId=null;s.targetUntil=0;result={message:'Ataque interrompido.'};}
  else if(input.type==='world-equip'){
    const c=CARDS[input.cardId];check(c?.type==='equipment'&&owns(profile,c.id),'Escolha uma relíquia íntegra do inventário.');check(!s.equipment.includes(c.id),'Esta relíquia já está equipada.');check(freeGear(w,profile,c.id),'Todas as cópias desta relíquia estão destacadas.');energy(s,10);if(s.equipment.length>=2)s.equipment.shift();s.equipment.push(c.id);syncEquipmentHealth(profile);result={message:`${c.name} equipado: +${(c.attack||0)*2} ataque e +${(c.health||0)*5} vitalidade máxima.`};
  }else if(input.type==='world-siege'){
    const slot=nearbySlot(w,s,input.slotId),o=slot.occupant;check(o&&o.owner!==r.publicId&&r.houseId&&o.houseId&&r.houseId!==o.houseId,'Escolha um posto de uma Casa rival.');check((world.wars||[]).some(war=>war.status==='active'&&war.endsAt>now&&[war.attacker,war.defender].includes(r.houseId)&&[war.attacker,war.defender].includes(o.houseId)),'Declare guerra entre as Casas antes de atacar seus postos.');check(!(world.territories[slot.node]?.protectedUntil>now),'Uma trégua protege este território.');check(now>=s.attackAt,'Aguarde o próximo golpe de cerco.');energy(s,15);s.attackAt=now+2000;s.lastCombatAt=now;const guarded=w.slots.some(g=>g.node===slot.node&&g.kind==='frontline'&&g.occupant?.houseId===o.houseId);const damage=guarded?6:12;o.hp=Math.max(0,o.hp-damage);if(!o.hp){slot.occupant=null;log(w,`${profile.name} destruiu ${o.name} em um cerco.`,now,'siege');}result={message:`Cerco: ${damage} de dano${guarded?' · linha de frente rival absorveu parte do golpe':''}.`};
  }else if(input.type==='world-deploy')result=deploy(world,w,profile,input,regions,now);
  else if(input.type==='world-interact')result=interact(world,w,profile,input,regions,now);
  else if(input.type==='world-attack')result=attack(world,w,profile,input,regions,now);
  else if(input.type==='world-recall'||input.type==='world-repair'){
    const slot=nearbySlot(w,s,input.slotId),o=slot.occupant;check(o?.owner===r.publicId,'Esta carta pertence a outro comandante.');
    if(input.type==='world-recall'){slot.occupant=null;result={message:'Carta recolhida. A cópia da coleção permanece com você; materiais de construção não são devolvidos.'};}
    else {check(o.hp<o.maxHp,'Esta carta está íntegra.');debit(profile,{timber:1,ore:1});o.hp=Math.min(o.maxHp,o.hp+40);result={message:'Reparos concluídos: +40 de vitalidade.'};}
  }else throw new RuleError('Ordem de mundo desconhecida.');
  s.commandAt=now+250;r.version++;r.seenAt=now;w.version++;return result;
}
export function prepareWorldEncounter(world,profile,input,regions,now=Date.now()){
  const w=ensureRealmWorld(world,regions,now),s=ensureWorldPlayer(profile,regions,now);combatReady(profile,now);
  const a=w.actors.find(a=>a.id===(input.targetId||input.actorId));check(a&&a.arenaKind&&alive(a),'Selecione um chefe, desafiante ou portal de dungeon.');check(distance(s,a)<=WORLD_RULES.interactRange,'Aproxime-se do encontro para abrir a Arena.');check(now>=(s.encounters[a.id]||0),'Este adversário já foi vencido. Aguarde uma nova vigília.');check(profile.realm.provisions>=2,'Uma batalha de Arena exige duas provisões.');
  const n=nodeAt(regions,a.node),stage=a.arenaKind==='dungeon'&&profile.realm.expedition?.node===n.id?profile.realm.expedition.stage:0;
  check(profile.realm.level>=n.level,`Este encontro exige nível de exploração ${n.level}.`);
  return {arena:true,targetId:a.id,node:n.id,kind:a.arenaKind,difficulty:n.level,board:n.board,title:a.name,stage,stages:a.arenaKind==='dungeon'?3:1,houseId:profile.realm.houseId};
}
export function settleWorldEncounter(world,profile,encounter,won,conceded,regions,now=Date.now(),capturedLanes=[]){
  const w=ensureRealmWorld(world,regions,now),s=ensureWorldPlayer(profile,regions,now),r=profile.realm,n=nodeAt(regions,encounter.node);
  const a=w.actors.find(a=>a.id===encounter.targetId);check(a?.arenaKind,'Este encontro não pertence ao mundo aberto.');
  r.activeRoom=null;r.version++;
  if(!won||conceded){s.hp=Math.max(15,s.hp-25);s.energy=Math.max(0,s.energy-20);r.expedition=null;w.version++;return {coins:0,xp:0,materials:0,message:'Você recuou da Arena com ferimentos. Descanse em um abrigo ou no Porto.'};}
  if((s.encounters[a.id]||0)>now)return {coins:0,xp:0,materials:0,message:'A recompensa desta vigília já foi recebida.'};
  const final=encounter.stage+1>=encounter.stages;r.expedition=final?null:{node:n.id,stage:encounter.stage+1,doctrine:encounter.doctrine||'standard'};
  const reward={coins:final?35+n.level*10:15,xp:25+n.level*10,materials:final?5:2,loot:final,message:final?'Vitória na Arena. Seu feito ecoa pelo mundo.':'Mesa vencida. O próximo guardião da dungeon aguarda.'};
  profile.coins+=reward.coins;xp(r,reward.xp);r.materials[n.resource]+=reward.materials;s.quest.kills++;s.reputation[profile.starterFaction]+=final?5:2;
  if(final)s.encounters[a.id]=now+300000;
  ensureAdventure(r);r.adventure.stats.wins++;dailyState(r,now).wins++;if(final&&encounter.stages>1)r.adventure.stats.dungeons++;for(const lane of new Set(capturedLanes))if(['court','crypt','hunt'].includes(lane))r.adventure.stats.fronts[lane]=(r.adventure.stats.fronts[lane]||0)+1;
  log(w,`${profile.name} venceu ${a.name}${encounter.stages>1?` · mesa ${encounter.stage+1}/3`:''}.`,now,'arena');w.version++;return reward;
}
