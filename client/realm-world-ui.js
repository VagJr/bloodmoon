import {animateTokenDeath,shouldAnimateDeath,corpseFigure,deathEvent,clearTokenDeaths} from '/realm-token-death.js?v=1';
import {touchSpan,pinchCamera} from '/realm-touch-camera.js?v=1';
import {cityPanel,districtMarkers} from '/realm-dominion-ui.js';
import {realmScenery} from '/shared/realm-scenery.js';
import {realmSiteIdentity,realmSiteSlots} from '/shared/realm-site-plan.js';
import {actionHud,mountActionHud,updateActionHud,unmountActionHud} from '/realm-action-ui.js?v=realm-death-touch1';
import {sampleRealmMotion,advanceRealmMotion} from '/shared/realm-motion.js';
import {moveWithCollisions} from '/shared/realm-collision.js';
import {CARDS} from '/shared/cards.js';
import {CARD_ART} from '/shared/art-manifest.js';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const SIZE={width:1500*96,height:100*64};
const KIND={rift:'Expedição pública', 'expedition-loot':'Tesouro de expedição',land:'Terreno de cidade',settlement:'Cidade de Casa',wayshrine:'Marco do Pacto · repouso',resource:'Veio de recursos',hostile:'Criatura hostil',invader:'Invasor',patrol:'Patrulha',merchant:'Mercadora',quartermaster:'Guardiã do Porto',envoy:'Emissário',caravan:'Caravana',boss:'Guardião',portal:'Dungeon',champion:'Desafiante',satchel:'Espólio recuperável',loot:'Espólio da caçada',raid:'Raid · Colosso do Véu'};
const ICON={construction:'⌂',resource:'♧',weapon:'⚒',trap:'⌘',frontline:'⚔',influence:'♜'};
const RESOURCE_ART={coins:'/assets/world/objects/coin-pile.png',timber:'/assets/world/objects/fallen-timber.png',ore:'/assets/world/objects/iron-vein.png',essence:'/assets/world/objects/lunar-essence.png'};
const BUILD_ART={camp:'watch-camp',lumbermill:'ash-sawmill',mine:'oath-mine',essencewell:'veil-well',ballista:'obsidian-ballista',thorntrap:'thorn-snare',banner:'oath-banner'};
function objectArt(a){const id=(a.kind==='land'?'signpost':null)||(a.kind==='settlement'?'fortified-gate':null)||BUILD_ART[a.blueprintId]||({rift:'dungeon-gate','expedition-loot':'supply-crates',wayshrine:'stone-well',satchel:'lost-satchel',caravan:'moon-caravan',portal:'dungeon-gate'})[a.kind];return id?'/assets/world/objects/'+id+'.png':a.kind==='resource'?RESOURCE_ART[a.resource]:null;}
function resourceFigure(a){
 const source=RESOURCE_ART[a.resource]||RESOURCE_ART.essence;
 return `<span class="rw-resource-field rw-resource-${esc(a.resource)}" aria-hidden="true"><i class="rw-resource-ground"></i><i class="rw-resource-aura"></i><img class="rw-resource-echo" src="${source}" alt="" loading="lazy"><img class="rw-resource-core" src="${source}" alt="" loading="lazy"><i class="rw-resource-spark spark-one"></i><i class="rw-resource-spark spark-two"></i><i class="rw-resource-spark spark-three"></i></span>`;
}
function lootFigure(a){const gear=a.loot?.gear,source=(gear&&CARD_ART[gear])||RESOURCE_ART.coins;return `<span class="rw-loot-figure ${gear?'gear':''}" aria-hidden="true"><i class="rw-loot-ground"></i><img class="rw-loot-glow" src="${source}" alt=""><img class="rw-loot-item" src="${source}" alt=""><i class="rw-loot-spark one"></i><i class="rw-loot-spark two"></i><i class="rw-loot-spark three"></i></span>`;}
let cardFilter='unit',showHelp=false,detailsOpen=false;
let ownerId=null,dataRef=null,handlers={},selected=null,selectedBlueprint='camp',selectedTarget=null,slotTarget=null,dungeonTarget=null,camera={x:0,y:0,z:.9},keys=new Set(),touchPointers=new Map(),frame=0,seq=0,lastMove=0,moveBusy=false,controller=null,rootRef=null,drag=null,feedbackTimer=0,atlas=false,actorMotion=new Map(),lastHudPaint=0,lastCullingAt=0,localHarvest=null;
const mapTouches=new Map();let pinch=null,suppressMapClickUntil=0;
let provinceSource=null,provinceCache=[];
const movingActors=new Set(['hostile','invader','raid','patrol','caravan','traveler']);
const metric=(a,b)=>Math.hypot((a.x-b.x)*1.5,a.y-b.y);
const worldCards=()=>{const d=dataRef||{},ids=d.liveWorld?.cards||d.worldCards||[];return ids.filter(id=>!!CARDS[id]);};
const nearest=(w)=>w.actors.filter(a=>a.hp>0).sort((a,b)=>metric(w.player,a)-metric(w.player,b))[0];
function dimensions(){const r=rootRef?.querySelector('.rw-viewport')?.getBoundingClientRect();return {w:r?.width||innerWidth,h:r?.height||innerHeight};}
function provinces(w=dataRef?.liveWorld){const source=w?.continents;if(source===provinceSource&&provinceCache.length)return provinceCache;const maps=source?.length?source:[{id:'vespera',name:'Véspera',offset:0,width:100,image:'/assets/world/vespera-map.png',level:1}];provinceSource=source;provinceCache=maps.map((m,i)=>({...m,width:m.width||((maps[i+1]?.offset||m.offset+100)-m.offset)}));return provinceCache;}
function provinceAt(x,w){const maps=provinces(w);return maps.find(m=>x>=m.offset&&x<m.offset+m.width)||maps.findLast(m=>x>=m.offset)||maps[0];}
function clampCamera(){const {w,h}=dimensions(),min=Math.max(w/SIZE.width,h/SIZE.height,.09);camera.z=Math.max(min,Math.min(1.05,camera.z));camera.x=Math.min(0,Math.max(w-SIZE.width*camera.z,camera.x));camera.y=Math.min(0,Math.max(h-SIZE.height*camera.z,camera.y));}
function focusPlayer(smooth=false){const {w,h}=dimensions(),p=controller?.pose||dataRef.liveWorld.player;camera.x=w/2-p.x*96*camera.z;camera.y=h/2-p.y*SIZE.height/100*camera.z;clampCamera();paintCamera(smooth);}
function paintMapTiles(){
 const ground=rootRef?.querySelector('.rw-map-backdrop');if(!ground||!dataRef)return;
 const {w}=dimensions(),preload=Math.max(8,12/camera.z),left=(-camera.x)/(96*camera.z)-preload,right=(w-camera.x)/(96*camera.z)+preload;
 const maps=provinces(),visible=maps.filter(m=>m.offset<right&&m.offset+m.width>left),active=new Set(visible.map(m=>m.id));
 for(const tile of [...ground.children])if(!active.has(tile.dataset.province))tile.remove();
 for(const m of visible){
  let tile=[...ground.children].find(el=>el.dataset.province===m.id);
  if(!tile){tile=document.createElement('div');tile.className='rw-map-tile';tile.dataset.province=m.id;tile.style.zIndex=String(maps.indexOf(m));tile.style.backgroundImage=`linear-gradient(0deg,#08141ab0,transparent 13%,transparent 87%,#08141a9c),url('${m.image}')`;ground.append(tile);}
  tile.style.left=(camera.x+m.offset*96*camera.z)+'px';tile.style.top=camera.y+'px';tile.style.width=((m.width+(m.offset+m.width<SIZE.width/96?3:0))*96*camera.z)+'px';tile.style.height=(SIZE.height*camera.z)+'px';
 }
}
function paintCamera(smooth=false){paintMapTiles();const plane=rootRef?.querySelector('.rw-plane');if(plane){plane.style.transition='none';plane.style.transform=`translate(${camera.x}px,${camera.y}px) scale(${camera.z})`;}}
function paintThreatMarkers(){
 const host=rootRef?.querySelector('.rw-threat-markers'),w=dataRef?.liveWorld;if(!host||!w||!controller)return;
 const now=performance.now();if(now-(host._paintAt||0)<80)return;host._paintAt=now;
 const {w:width,h:height}=dimensions(),pose=controller.pose,cx=pose.x*96*camera.z+camera.x,cy=pose.y*64*camera.z+camera.y;
 const sectors=new Map();
 for(const enemy of w.actors||[]){
  if(enemy.hp<=0||!['hostile','invader','raid'].includes(enemy.kind))continue;
  const ex=enemy.x*96*camera.z+camera.x,ey=enemy.y*64*camera.z+camera.y;
  if(ex>=15&&ex<=width-15&&ey>=15&&ey<=height-15)continue;
  const dx=(enemy.x-pose.x)*1.5,dy=enemy.y-pose.y,distance=Math.hypot(dx,dy);
  if(distance>46||distance<.1)continue;
  const angle=Math.atan2(dy,dx),sector=Math.round(angle/(Math.PI/6));
  if(!sectors.has(sector)||sectors.get(sector).distance>distance)sectors.set(sector,{enemy,angle,distance});
 }
 const entries=[...sectors.values()].sort((a,b)=>a.distance-b.distance).slice(0,6);
 const reach=width<700?87:104,margin=reach+12,x=Math.max(margin,Math.min(width-margin,cx)),y=Math.max(margin,Math.min(height-margin,cy));
 const stamp=JSON.stringify(entries.map(({enemy,angle,distance})=>[enemy.id,Math.round(angle*100),Math.round(distance),Math.round(x),Math.round(y)]));
 if(host._stamp===stamp)return;host._stamp=stamp;
 host.innerHTML=entries.map(({enemy,angle,distance})=>`<button data-rw-threat="${esc(enemy.id)}" class="${enemy.kind==='raid'?'boss':''}" style="left:${Math.round(x+Math.cos(angle)*reach)}px;top:${Math.round(y+Math.sin(angle)*reach)}px" aria-label="Selecionar ${esc(enemy.name)} a ${Math.round(distance)} metros" title="${esc(enemy.name)} · ${Math.round(distance)}m"><i style="transform:rotate(${angle*180/Math.PI+90}deg)">▲</i><b>${Math.round(distance)}m</b></button>`).join('');
}
function paintHarvest(){
 const w=dataRef?.liveWorld;if(!rootRef||!w)return;
 const harvest=w.player?.harvest||localHarvest;
 const host=rootRef.querySelector('.rw-harvest-hud'),self=rootRef.querySelector('.rw-self'),prior=rootRef.querySelector('.rw-resource-field.harvesting');
 if(!harvest){host?.remove();self?.querySelector('.rw-harvest-progress')?.remove();prior?.classList.remove('harvesting');return;}
 const actor=w.actors.find(a=>a.id===harvest.targetId),resource=harvest.resource||actor?.resource||'timber';
 const now=harvest===localHarvest?Date.now():w.serverTime+Date.now()-(w._receivedAt||Date.now()),progress=Math.max(0,Math.min(1,(now-harvest.startedAt)/Math.max(1,harvest.endsAt-harvest.startedAt)));
 const label={timber:'CORTANDO MADEIRA',ore:'EXTRAINDO MINÉRIO',essence:'CANALIZANDO ESSÊNCIA'}[resource];
 if(!host){const el=document.createElement('div');el.className='rw-harvest-hud';el.innerHTML='<strong></strong><small>Permaneça no local · dano interrompe</small><i></i>';rootRef.append(el);}
 const shown=rootRef.querySelector('.rw-harvest-hud');shown.querySelector('strong').textContent=label;shown.style.setProperty('--harvest-progress',progress);
 if(self&&!self.querySelector('.rw-harvest-progress'))self.insertAdjacentHTML('beforeend','<span class="rw-harvest-progress"><b></b><i></i></span>');
 const bar=self?.querySelector('.rw-harvest-progress');if(bar){bar.querySelector('b').textContent=label;bar.style.setProperty('--harvest-progress',progress);}
 const target=rootRef.querySelector(`.rw-actor[data-rw-actor="${CSS.escape(harvest.targetId)}"] .rw-resource-field`);
 if(prior&&prior!==target)prior.classList.remove('harvesting');target?.classList.add('harvesting');
}
function cardFace(id,label='Carta'){return `<img src="${esc(CARD_ART[id]||'/assets/world/objects/oath-banner.png')}" alt="${esc(label)}" loading="lazy">`;}
function landmarkFor(n){if(n.kind==='dungeon')return ['snow','forest','marsh'].includes(n.habitat)?'moon-gate':'blood-gate';return ({forest:'moon-flora',marsh:'moon-spring',mountain:'moon-snow',ruins:'blood-candles',city:'blood-eclipse',snow:'moon-snow',volcanic:'blood-embers',astral:'blood-eclipse',citadel:'blood-gate'})[n.habitat]||(n.x<100?'moon-flora':n.x<200?'moon-spring':'blood-embers');}
function frontierIsland(w,n){
 const identity=realmSiteIdentity(n),selectedNode=n.id===w.player.location,near=metric(w.player,n)<18;
 const live=new Map(w.slots.filter(s=>s.node===n.id).map(s=>[s.id,s]));
 const slots=realmSiteSlots(n).map(plan=>live.get(plan.id)||plan);
 const art=name=>`/assets/world/objects/${esc(name)}.png`;
 return `<section class="rw-island frontier rw-site-${esc(identity.accent)} rw-habitat-${esc(n.habitat)} ${selectedNode?'here':''}" style="left:${n.x*96}px;top:${n.y*64}px" aria-label="${esc(n.name)}"><div class="rw-biome"><img src="/assets/world/${esc(n.board)}.png" alt="" loading="lazy"></div><div class="rw-site-foundation" aria-hidden="true"><i class="rw-site-trail"></i><i class="rw-site-crossing"></i><i class="rw-site-court"></i><img class="rw-site-architecture main" src="${art(identity.art)}" alt="" loading="lazy"><img class="rw-site-architecture support" src="${art(identity.secondary)}" alt="" loading="lazy"><img class="rw-site-architecture resource" src="${art(identity.resource)}" alt="" loading="lazy"></div><img class="rw-sheet-landmark" src="/assets/world/sheet-details/${landmarkFor(n)}.webp" alt="" loading="lazy"><div class="rw-place"><i>${esc(n.icon)}</i><span><small>${selectedNode?'SUA POSIÇÃO · ':''}${esc(identity.label)} · NV ${esc(n.level)}</small><b>${esc(n.name)}</b></span><em>${w.territories?.[n.id]?.owner?'♜':''}</em></div><div class="rw-ring"></div>${slots.map(s=>{const o=s.occupant,available=live.has(s.id),x=(s.x-n.x)*96,y=(s.y-n.y)*64;return `<button class="rw-slot ${o?'occupied':''} ${o?.owner===w.player.publicId?'own':''} ${near?'near':''} ${available?'':'rw-slot-distant'}" style="left:calc(50% + ${x}px);top:calc(50% + ${y}px)" ${available?`data-rw-slot="${esc(s.id)}"`:'disabled'} title="${esc(w.slotKinds[s.kind])}: ${o?esc(o.name):available?'espaço de carta':'aproxime-se para interagir'}">${o?`${objectArt(o)?`<img class="rw-structure-art" src="${objectArt(o)}" alt="${esc(o.name)}">`:cardFace(o.cardId,'')}${o.blueprintId?`<i class="rw-build-icon">${ICON[s.kind]||'◇'}</i>`:''}<meter min="0" max="${o.maxHp}" value="${o.hp}"></meter><b>${esc(o.name)}</b>`:`<i>${ICON[s.kind]||'◇'}</i><b>${esc(w.slotKinds[s.kind])}</b>`}</button>`;}).join('')}</section>`;
}
function island(w,n){if(n.provinceId)return frontierIsland(w,n);return legacyIsland(w,n);}
function legacyIsland(w,n){const selectedNode=n.id===w.player.location,near=metric(w.player,n)<18;return `<section class="rw-island ${n.provinceId?'frontier':''} ${selectedNode?'here':''}" style="left:${n.x*96}px;top:${n.y*64}px"><div class="rw-biome"><img src="/assets/world/${esc(n.board)}.png" alt="" loading="lazy"></div><img class="rw-sheet-landmark" src="/assets/world/sheet-details/${landmarkFor(n)}.webp" alt="" loading="lazy"><div class="rw-place"><i>${esc(n.icon)}</i><span><small>${selectedNode?'SUA POSIÇÃO':n.kind==='dungeon'?'TERRA SELADA':'TERRITÓRIO'} · NÍVEL ${n.levelRange?`${n.levelRange.min}–${n.levelRange.max}`:n.level}</small><b>${esc(n.name)}</b></span><em>${w.territories?.[n.id]?.owner?'♜':''}</em></div><div class="rw-ring"></div>${w.slots.filter(s=>s.node===n.id).map((s,i)=>{const o=s.occupant,x=(s.x-n.x)*96,y=(s.y-n.y)*64;return `<button class="rw-slot ${o?'occupied':''} ${o?.owner===w.player.publicId?'own':''} ${near?'near':''}" style="left:calc(50% + ${x}px);top:calc(50% + ${y}px)" data-rw-slot="${esc(s.id)}" title="${esc(w.slotKinds[s.kind])}: ${o?esc(o.name):'espaço de carta'}">${o?`${objectArt(o)?`<img class="rw-structure-art" src="${objectArt(o)}" alt="${esc(o.name)}">`:cardFace(o.cardId,'')}${o.blueprintId?`<i class="rw-build-icon">${ICON[s.kind]||'◇'}</i>`:''}<meter min="0" max="${o.maxHp}" value="${o.hp}"></meter><b>${esc(o.name)}</b>`:`<i>${ICON[s.kind]||'◇'}</i><b>${esc(w.slotKinds[s.kind])}</b>`}</button>`;}).join('')}</section>`;}
function actor(a,w){if(a.hp<=0&&!objectArt(a)&&!['loot','resource'].includes(a.kind))return `<button class="rw-actor rw-corpse ${selectedTarget===a.id?'targeted':''}" data-rw-actor="${esc(a.id)}" style="left:${a.x*96}px;top:${a.y*64}px" aria-label="Restos de ${esc(a.name)} · interações pós-morte" title="Restos de ${esc(a.name)}">${corpseFigure()}</button>`;const self=a.id===w.player.publicId,person=a.kind==='traveler',avatar=a.avatar||'oracle';return `<button class="rw-actor ${esc(a.kind)} ${objectArt(a)?'scenery':''} ${esc(a.faction||'neutral')} ${a.state==='em combate'?'fighting':''} ${a.guarding?'guarding':''} ${a.windup?`windup-${esc(a.windup.style||'raider')}`:''} ${selectedTarget===a.id?'targeted':''} ${a.hp<=0?'down':''}" data-rw-actor="${esc(a.id)}" style="left:${a.x*96}px;top:${a.y*64}px" title="${esc(a.name)} · ${esc(KIND[a.kind]||'Habitante')}">${a.kind==='resource'?resourceFigure(a):a.kind==='loot'?lootFigure(a):objectArt(a)?`<img class="rw-object-art" src="${objectArt(a)}" alt="${esc(a.name)}" loading="lazy">`:person?`<img src="/assets/avatars/${esc(avatar)}.png" alt="">`:cardFace(a.cardId,a.name)}${a.kind==='settlement'?`<span class="rw-city-buildings">${Object.entries(w.settlements?.find(c=>c.houseId===a.houseId)?.buildings||{}).filter(([,level])=>level>0).map(([key,level])=>`<img src="/assets/world/objects/${({warehouse:'supply-crates',forge:'blacksmith',watchtower:'watchtower'})[key]}.png" alt="${key} ${level}">`).join('')}</span>`:''}${person&&a.karma?`<span class="rw-karma-badge" title="${esc(a.karma.title)}"><img src="${esc(a.karma.icon)}" alt=""></span>`:''}<i class="rw-footprint"></i>${a.hp>0&&!['resource','loot','satchel'].includes(a.kind)?`<meter min="0" max="${a.maxHp}" value="${a.hp}"></meter>`:''}<b>${esc(a.kind==='loot'?'ESPÓLIO':a.name.split(' · ')[0])}</b>${a.aiStyle?`<em>NV ${a.level} · ${a.aiStyle.toUpperCase()}</em>`:''}${a.kind==='raid'?'<em>✦ RAID</em>':a.arenaKind?'<em>✦ ARENA</em>':a.kind==='invader'?'<em>⚠ INVASÃO</em>':''}</button>`;}
function scenery(regions){return '<div class="rw-scenery" aria-hidden="true">'+regions.flatMap(n=>realmScenery(n).map(o=>({...o,frontier:!!n.provinceId}))).map(o=>'<img src="/assets/world/objects/'+o.art+'.png" class="'+(o.large?'large ':'')+(o.frontier?'rw-frontier-scenery':'')+'" style="left:'+o.x*96+'px;top:'+o.y*64+'px" alt="" loading="lazy">').join('')+'</div>';}
function statusText(w){const p=w.player,phase=w.cycle?.phase||'vigília';return `<small>VÉSPERA · ${esc(phase.toUpperCase())}</small><strong>${esc(dataRef.regions.find(n=>n.id===dataRef.player.location)?.name||'Terras de Véspera')}</strong><span>◈ ${dataRef.profile.coins} · ◉ ${dataRef.player.provisions} · ♧ ${dataRef.player.materials.timber} · ⬡ ${dataRef.player.materials.ore} · ✧ ${dataRef.player.materials.essence}</span><span>♥ ${Math.ceil(p.hp)}/${p.maxHp}　⚡ ${Math.floor(p.energy)}/${p.maxEnergy}</span>`;}
function resourceBadge(key,value,label){const symbols={coins:'◈',provisions:'◉'},asset=RESOURCE_ART[key];return `<span class="rw-resource" title="${label}">${asset?`<img src="${asset}" alt="">`:`<i>${symbols[key]}</i>`}<b>${value}</b><small>${label}</small></span>`;}
function worldCardText(id){const c=CARDS[id];if(!c)return '';if(c.type==='unit')return `Frente ou influência · ${30+(c.health||0)*8} vida · ${(c.attack||1)*3} ataque · 2 madeira + 1 minério`;if(c.type==='equipment')return `Relíquia · +${(c.attack||0)*2} ataque · +${(c.health||0)*5} vida · 10 vigor`;return ({heal:'Restaura 25 de vida no líder ou em um posto aliado.',sacrifice:'Restaura 12 de vida no líder ou em um posto aliado.',influence:'Converte presença de um estandarte em influência da Casa.',pounce:'Prepara outro ataque e cura 10 de vida de um posto aliado.'})[c.effect]||`Ritual ofensivo · ${c.effect==='execute'?32:c.effect==='rend'?24:18+(c.effectAmount||0)*2} dano · ${10+c.cost*4} vigor`;}
function marketControl(a,disabled){
 const labels={timber:'Madeira',ore:'Minério',essence:'Essência'},market=a.market,player=dataRef.player;
 const lot=market.lot||2,role=({ 'logging-waystation':'Entreposto dos lenhadores','forge-waystation':'Entreposto das forjas',forge:'Mercado da forja','industrial-city':'Câmara das forjas','canal-port':'Comércio das águas','trade-gate':'Portão mercantil','grand-market':'Grande mercado livre',customs:'Entreposto dos contratos',temple:'Trocas da Abadia','wolf-clan':'Trocas da alcateia','healer-outpost':'Suprimentos da Vigília','astral-camp':'Banca dos astrônomos',observatory:'Cartas e cristais','throne-city':'Mercado da Coroa' })[market.role]||'Mercado da Vigília';
 return `<div class="rw-market"><div class="rw-market-head"><small>MERCADO VIVO · ESTOQUE LOCAL</small><b>${role}</b><span>Cada troca movimenta ${lot} unidades. Preços e oferta seguem a região.</span></div>${Object.keys(labels).map(resource=>{const price=market.prices?.[resource]||{},stock=market.stock?.[resource]||0,owned=player.materials?.[resource]||0;return `<div class="rw-market-row"><img src="${RESOURCE_ART[resource]}" alt=""><span><b>${labels[resource]}</b><small>Estoque ${stock} · sua bolsa ${owned}</small></span><button data-rw-trade="${esc(a.id)}" data-rw-operation="buy" data-rw-resource="${resource}" ${disabled||stock<lot||price.buy==null||dataRef.profile.coins<price.buy*lot?'disabled':''} title="Comprar ${lot} unidades">COMPRAR<em>◈ ${price.buy==null?'—':price.buy*lot}</em></button><button data-rw-trade="${esc(a.id)}" data-rw-operation="sell" data-rw-resource="${resource}" ${disabled||owned<lot||price.sell==null?'disabled':''} title="Vender ${lot} unidades">VENDER<em>◈ ${price.sell==null?'—':price.sell*lot}</em></button></div>`;}).join('')}</div>`;
}
function targetControl(w,a,cards){
 const p=w.player,d=metric(p,a),near=d<=w.rules.interactRange,disabled=!near?'disabled':'';
 const object=objectArt(a),kind=KIND[a.kind]||'Viajante',enemy=a.warEnemy||['hostile','invader','raid'].includes(a.kind),dead=a.hp<=0;
 let action='';
 if(a.kind==='land')action='<p>Terreno exclusivo de cidade. Construção: 25 madeiras e 15 minérios.</p><button class="rw-primary" data-rw-land="'+esc(a.id)+'" '+disabled+'>FUNDAR SEDE NESTE TERRENO</button>';
 else if(a.kind==='loot')action=`<p>${a.loot?.protected?'Reservado aos combatentes por 90 segundos. Depois, pode ser recolhido por qualquer viajante.':a.loot?.eligible?`${a.loot.coins} Marcas${a.loot.gear?` · ${esc(CARDS[a.loot.gear]?.name||'Relíquia')}`:''}${a.loot.scrap?` · ${a.loot.scrap} sucata`:''}`:'Esta parte do espólio já foi coletada.'}</p><button class="rw-primary" data-rw-interact="${esc(a.id)}" ${disabled||!a.loot?.eligible?'disabled':''}>✦ RECOLHER ESPÓLIO FÍSICO<small>${a.loot?.gear?'RELÍQUIA · ':''}SAQUE PROTEGIDO, DEPOIS PÚBLICO</small></button>`;
 else if(a.kind==='settlement')action=cityPanel(w,a);
 else if(a.arenaKind)action=a.kind==='portal'?`<button class="rw-primary" data-rw-dungeon-enter="${esc(a.id)}" ${disabled}>☾ EXPLORAR INTERIOR COMPARTILHADO<small>MAPA INTERNO · SOLO, COOP E CAÇA LIVRE</small></button><button class="rw-secondary" data-rw-arena="${esc(a.id)}" ${disabled||a.cooldown>0?'disabled':''}>MESA TÁTICA CLÁSSICA</button>`:`<button class="rw-primary" data-rw-arena="${esc(a.id)}" ${disabled||a.cooldown>0?'disabled':''}>⚔ DESAFIAR NA ARENA<small>${a.cooldown>0?`NOVA VIGÍLIA EM ${Math.ceil(a.cooldown/1000)}s`:'MESA COMPLETA · 2 PROVISÕES'}</small></button>`;
 else if(a.kind==='traveler'&&a.warEnemy)action='<p>Casa inimiga em guerra. Golpes, feitiços e projéteis de combate em tempo real podem atingir este viajante; barreiras, aparos e colisões continuam ativos.</p>';
 else if(a.kind==='traveler')action=`<button class="rw-primary" data-rw-pvp="${esc(a.id)}" ${disabled||a.busy?'disabled':''}>⚔ PROPOR DUELO<small>PACTO · EXIGE ACEITE DO VIAJANTE</small></button>`;
 else if(a.kind==='raid'&&dead)action=`<p>${a.contribution} de dano causado · mínimo de 20 para saque.</p><button class="rw-primary" data-rw-interact="${esc(a.id)}" ${!near||a.claimed||a.contribution<20?'disabled':''}>${a.claimed?'SAQUE RECEBIDO':'RECOLHER SAQUE DA RAID'}<small>60 MARCAS · 60 XP · MINÉRIO E ESSÊNCIA</small></button>`;
 else if(enemy)action=`${a.kind==='raid'?'<p>Colosso compartilhado. Ataque com outros viajantes e suas defesas. Cada participante conquista seu próprio saque.</p>':''}<button class="rw-primary" data-rw-attack="${esc(a.id)}" ${dead||d>w.rules.attackRange?'disabled':''}>⚔ ${dead?'DERROTADO':'ATACAR'}<small>${dead?`RETORNO EM ${Math.max(0,Math.ceil((a.respawnAt-w.serverTime)/1000))}s`:'ATAQUE CONTÍNUO · SEM CUSTO DE CARTA'}</small></button>${(selected&&CARDS[selected]?.type==='spell'?[selected]:cards.filter(id=>CARDS[id]?.type==='spell').slice(0,3)).filter(id=>!['heal','sacrifice','pounce','influence'].includes(CARDS[id].effect)).map(id=>`<button class="rw-secondary" data-rw-spell="${esc(a.id)}" data-rw-card="${esc(id)}" ${dead||d>w.rules.attackRange?'disabled':''}>✦ ${esc(CARDS[id].name)}<small>${esc(worldCardText(id))}</small></button>`).join('')}`;
 else if(a.kind==='merchant'&&a.market)action=marketControl(a,disabled);
 else if(a.kind==='wayshrine')action=`<p>Marco seguro entre postos. Reúne seu vigor para continuar a travessia.</p><button class="rw-primary" data-rw-interact="${esc(a.id)}" ${disabled}>✧ FIRMAR PACTO DE REPOUSO<small>1 ESSÊNCIA · +30 VIDA · +30 VIGOR · +25 MANA</small></button>`;
 else {const label={rift:'INICIAR EXPEDIÇÃO · 2 PROVISÕES','expedition-loot':'RECOLHER RECOMPENSA',resource:`COLETAR ${a.resource==='timber'?'MADEIRA':a.resource==='ore'?'MINÉRIO':'ESSÊNCIA'}`,quartermaster:'DESCANSAR & REABASTECER',envoy:a.role==='chronicler'?'OUVIR CRÔNICA DA PROVÍNCIA':'CONTRATO DA VIGÍLIA',merchant:'VENDER RECURSOS',patrol:'FALAR COM A PATRULHA',satchel:'RECUPERAR ESPÓLIO',caravan:'RECEBER SUPRIMENTOS'}[a.kind]||'INTERAGIR';action=`<button class="rw-primary" data-rw-interact="${esc(a.id)}" ${disabled||dead?'disabled':''}>${dead?'RECURSO ESGOTADO':label}<small>${dead?`RENOVA EM ${Math.max(0,Math.ceil((a.respawnAt-w.serverTime)/1000))}s`:a.kind==='resource'?'+3 RECURSOS · 5 VIGOR':a.kind==='merchant'?'2 RECURSOS POR 8 MARCAS':a.role==='chronicler'?'PRIMEIRO RELATO · 30 XP + 10 MARCAS':'AÇÃO DO MUNDO'}</small></button>`;}
 if(enemy&&dead&&!a.lineageClaimed&&a.respawnAt>w.serverTime){const vampire=w.lineage?.kind==='blood';action+=`<button class="rw-primary rw-lineage-harvest" data-rw-lineage="${vampire?'drain':'claim'}" data-rw-lineage-target="${esc(a.id)}" ${disabled}>${vampire?'◆ SUGAR SANGUE DA PRESA':'✦ REIVINDICAR CAÇA'}<small>${vampire?'RECUPERA VIDA · ABASTECE O RITO':'RECUPERA VIGOR · FORTALECE A MATILHA'}</small></button>`;}
 if(enemy&&dead&&!a.professionClaimed&&a.lastHitBy===p.publicId&&a.respawnAt>w.serverTime){const vampire=w.profession?.kind==='domitor';if(!vampire||a.kind!=='raid')action+=`<button class="rw-secondary rw-profession-action" data-rw-profession="${vampire?'convert':'dress'}" data-rw-profession-target="${esc(a.id)}" ${disabled}>${vampire?'☾ FIRMAR PACTO DE SERVO':'◇ PREPARAR CARNE E PELES'}<small>${vampire?'EXIGE CIDADE, 12 SANGUE E 2 ESSÊNCIAS':'PROFISSÃO DE CAÇA · MERCADO E PROVISÕES'}</small></button>`;}
 return `<div class="rw-target-art ${object?'object':''}">${object?`<img src="${object}" alt="${esc(a.name)}">`:a.kind==='traveler'?`<img src="/assets/avatars/${esc(a.avatar||'oracle')}.png" alt="">`:cardFace(a.cardId,a.name)}<span>${esc(kind)}</span></div><h2>${esc(a.name)}</h2>${enemy&&!dead?`<div class="rw-target-health"><i style="width:${100*a.hp/a.maxHp}%"></i><span>${Math.ceil(a.hp)} / ${a.maxHp}</span></div>`:''}<div class="rw-target-meta"><span>${esc(a.state||kind)}</span><b>${Math.round(d*10)/10}m</b></div>${!near?'<p class="rw-distance">Aproxime-se com WASD ou as setas.</p>':''}${action}<button class="rw-secondary rw-camera-action" data-rw-center="${esc(a.id)}">◎ LOCALIZAR NO MAPA</button>`;
}
function frontierRegionControl(w,n){
 const m=provinces(w).find(m=>m.id===n.provinceId),resources={timber:'Madeira',ore:'Minério',essence:'Essência'},threats={hunter:'Caçadores',raider:'Saqueadores',arcanist:'Conjuradores',brute:'Colossos',sentinel:'Sentinelas'},habitats={forest:'Floresta',marsh:'Pântano',mountain:'Serra',ruins:'Ruínas',city:'Cidade',snow:'Terras geladas',volcanic:'Ermo vulcânico',astral:'Cratera astral',citadel:'Cidadela'},fields=n.resourceFields||[],zones=n.spawnZones||[],paths=(n.links||[]).map(id=>dataRef.regions.find(r=>r.id===id)).filter(Boolean);
 return `<div class="rw-region-art rw-frontier-region-art" style="background-image:url('${esc(m?.thumbnail||(m?.image?.replace(/\.webp$/,'-thumb.webp'))||('/assets/world/'+n.board+'.png'))}')"><small>${esc(m?.name||'FRONTEIRA')} · ${esc(habitats[n.habitat]||'Território')} · NV ${n.level}</small><h2>${esc(n.name)}</h2></div><div class="rw-region-stats"><span>◆ ${esc(n.kind==='sanctuary'?'PORTO SEGURO':n.kind==='dungeon'?'EXPEDIÇÃO':n.kind==='capital'?'CENTRO DE PODER':'FRONTEIRA VIVA')}</span><span>${dataRef.territories?.[n.id]?.owner?'DOMÍNIO DE CASA':'TERRA LIVRE'}</span></div><p class="rw-site-description">${esc(n.description||m?.lore||'Terras sob a Vigília das duas luas.')}</p><div class="rw-site-intel"><small>FONTES E PRODUÇÃO</small><div>${fields.map(f=>`<span class="rw-site-resource"><img src="${RESOURCE_ART[f.resource]||RESOURCE_ART.essence}" alt="">${esc(resources[f.resource]||f.resource)} <b>${'◆'.repeat(Math.max(1,Math.min(3,f.richness||1)))}</b></span>`).join('')||'<span>Comércio, abrigo e serviços locais</span>'}</div></div><div class="rw-site-intel rw-site-threat"><small>${n.kind==='dungeon'?'EXPEDIÇÃO E GUARDIÕES':'HABITAT E AMEAÇAS'}</small><div>${zones.map(z=>`<span>${esc(threats[z.style]||'Criaturas')} · perigo ${esc(z.tier||1)}</span>`).join('')||'<span>Rota sob vigília local</span>'}</div></div>${paths.length?`<div class="rw-site-paths"><small>ESTRADAS E PASSAGENS</small>${paths.map(r=>`<button data-rw-locate="${esc(r.id)}" title="Observar ${esc(r.name)}">${esc(r.icon)} ${esc(r.name)}<span>›</span></button>`).join('')}</div>`:''}${n.market?'<p class="rw-site-commerce">⚖ Comerciantes locais reajustam estoques e preços com as caravanas.</p>':''}<button class="rw-secondary" data-realm-tab="house">♜ CASAS, GUERRAS & INFLUÊNCIA</button>`;
}
function regionControl(w,n){const q=w.player.quest||{},resource=({timber:'Madeira',ore:'Minério',essence:'Essência'})[n.resource];return n.provinceId?frontierRegionControl(w,n):`<div class="rw-region-art" style="background-image:url('/assets/world/${esc(n.board)}.png')"><small>${n.id==='haven'?'SANTUÁRIO':esc(n.kind==='dungeon'?'DUNGEON':'TERRITÓRIO')} · NÍVEL ${n.levelRange?`${n.levelRange.min}–${n.levelRange.max}`:n.level}</small><h2>${esc(n.name)}</h2></div><div class="rw-region-stats"><span>◆ VOCÊ ESTÁ AQUI</span><span>${dataRef.territories?.[n.id]?.owner?'DOMÍNIO DE UMA CASA':'TERRA LIVRE'}</span></div><div class="rw-region-resource">${resourceBadge(n.resource,'',resource)}<span>Recurso da região<small>Explore, recolha e construa.</small></span></div><div class="rw-quest"><small>✧ CONTRATO DA VIGÍLIA</small><b>Guardiões das duas linhagens</b><span>⚔ Criaturas vencidas <em>${Math.min(3,q.kills||0)}/3</em></span><span>♧ Coletas realizadas <em>${Math.min(2,q.gathers||0)}/2</em></span><div class="rw-quest-progress"><i style="width:${Math.min(100,((Math.min(3,q.kills||0)+Math.min(2,q.gathers||0))/5)*100)}%"></i></div><small>50 MARCAS · 30 XP · FAVORES</small></div><button class="rw-secondary" data-realm-tab="house">♜ CASAS, GUERRAS & INFLUÊNCIA</button>`;}
function deathOverlay(w){
 const p=w.player;if(p.hp>0)return '';
 const left=Math.max(0,(p.downUntil||w.serverTime)-w.serverTime),seconds=Math.ceil(left/1000),costCoins=25,costEssence=1;
 const canPay=(dataRef.profile.coins||0)>=costCoins&&(dataRef.player.materials?.essence||0)>=costEssence;
 const progress=Math.max(0,Math.min(100,100-left/(w.rules?.respawnMs||12000)*100));
 return `<section class="rw-death" role="dialog" aria-modal="true" aria-label="Retorno após a queda"><div class="rw-death-card"><div class="rw-death-sigil"><i>☾</i><b>†</b><span></span></div><div class="rw-death-copy"><small>VIGÍLIA DAS DUAS LUAS · ${seconds?`${seconds}S PARA O RETORNO`:'RETORNO LIBERADO'}</small><h2>O sangue ainda chama.</h2><p>A Vigília guarda seu espólio e guia seu espírito de volta ao Porto das Cinzas. Você pode aguardar ou firmar um pacto de sangue agora.</p></div><div class="rw-death-meter"><i style="width:${progress}%"></i></div><div class="rw-death-actions">${seconds?`<button class="rw-primary rw-revive-now" data-rw-recover ${canPay?'':'disabled'}>✦ FIRMAR PACTO · ${costCoins} MARCAS + ${costEssence} ESSÊNCIA<small>${canPay?'Retorno imediato · 55% vida · 70% vigor':'Recursos insuficientes · ou aguarde sem custo'}</small></button>`:'<button class="rw-primary rw-revive-now" data-rw-recover>☾ RETORNAR AO PORTO SEM CUSTO<small>35% vida · 60% vigor · 30% mana</small></button>'}<button class="rw-secondary rw-death-leave" data-realm-exit>VOLTAR AO REFÚGIO<small>Jogue Arena e outros modos enquanto a Vigília prepara seu retorno.</small></button></div><small class="rw-death-foot">Aguarde ${seconds?`${seconds}s para ressurgir`: 'um instante para despertar'} sem custo · Sua bolsa pode ser recuperada no mapa</small></div></section>`;
}
function radar(w,p,n){
 const m=provinceAt(p.x,w),inside=x=>x>=m.offset&&x<m.offset+m.width,percent=x=>Math.max(0,Math.min(100,(x-m.offset)/m.width*100)),sites=dataRef.regions.filter(r=>inside(r.x));
 return `<aside class="rw-radar"><div class="rw-radar-head"><i></i>${w.players.length} VIAJANTE${w.players.length===1?'':'S'}<button data-rw-atlas aria-expanded="${atlas}">${atlas?'FECHAR':'ATLAS'}</button></div><div class="rw-mini" style="background-image:url('${esc(m.image)}')">${sites.map(r=>`<button class="rw-mini-node ${r.id===n.id?'current':''}" data-rw-locate="${esc(r.id)}" title="${esc(r.name)}" aria-label="Localizar ${esc(r.name)}" style="left:${percent(r.x)}%;top:${r.y}%">${esc(r.icon)}</button>`).join('')}<i style="left:${percent(p.x)}%;top:${p.y}%"></i>${w.players.filter(x=>x.id!==p.publicId&&inside(x.x)).map(x=>`<b style="left:${percent(x.x)}%;top:${x.y}%" title="${esc(x.name)}">◇</b>`).join('')}${w.invasions.filter(i=>i.status==='active').map(i=>{const r=dataRef.regions.find(r=>r.id===i.node);return r&&inside(r.x)?`<em style="left:${percent(r.x)}%;top:${r.y}%">⚠</em>`:''}).join('')}<span class="rw-mini-caption">${esc(m.name)} · NV ${esc(m.level)}</span></div></aside>`;
}
function atlasPanel(w){
 if(!atlas)return '';
 const maps=provinces(w),current=provinceAt(w.player.x,w);
 return `<section class="rw-atlas-overlay" role="region" aria-label="Atlas das terras de Véspera"><header><small>CRÔNICAS DE VÉSPERA · CARTOGRAFIA</small><button data-rw-atlas aria-label="Fechar atlas">×</button><h2>Treze terras, duas luas</h2><p>Explore caminhos, fontes de recursos, cidades e territórios de guerra. O atlas move a câmera; a jornada acontece no mundo.</p></header><div class="rw-atlas-scroll"><div class="rw-atlas-grid">${maps.map((m,i)=>{const sites=dataRef.regions.filter(r=>r.x>=m.offset&&r.x<m.offset+m.width),min=Math.min(m.level||1,...sites.map(r=>r.level||1)),max=Math.max(m.level||1,...sites.map(r=>r.level||1));return `<article class="rw-atlas-province ${m.id===current.id?'current':''}"><button class="rw-atlas-art" data-rw-province="${esc(m.id)}" aria-label="Explorar ${esc(m.name)}"><img src="${esc(m.thumbnail||(m.image?.includes('/maps/')?m.image.replace(/\.webp$/,'-thumb.webp'):m.image))}" alt="" loading="lazy" decoding="async"><span class="rw-atlas-number">${String(i+1).padStart(2,'0')} / ${String(maps.length).padStart(2,'0')}</span><span class="rw-atlas-label"><small>${m.id===current.id?'VOCÊ ESTÁ AQUI':'PROVÍNCIA · NÍVEL '+min+(max>min?'–'+max:'')}</small><b>${esc(m.name)}</b></span></button><div class="rw-atlas-sites">${sites.map(r=>`<button data-rw-locate="${esc(r.id)}" title="Localizar ${esc(r.name)}"><span>${esc(r.icon)}</span>${esc(r.name)}</button>`).join('')||'<small>Terras ainda sem postos conhecidos</small>'}</div></article>`;}).join('')}</div></div></section>`;
}
function hud(w){
 const p=w.player,n=dataRef.regions.find(n=>n.id===p.location)||dataRef.regions[0],cards=worldCards(),hand=cards.filter(id=>CARDS[id].type===cardFilter),near=w.actors.filter(a=>metric(a,p)<10&&(a.hp>0||a.kind==='raid'&&a.contribution>=20&&!a.claimed)).sort((a,b)=>metric(a,p)-metric(b,p)).slice(0,4);
 const pick=w.actors.find(a=>a.id===selectedTarget)||w.players.filter(a=>a.id!==p.publicId).map(a=>({...a,kind:'traveler'})).find(a=>a.id===selectedTarget),blue=w.blueprints[selectedBlueprint],event=w.events[0],selectedInfo=selected?worldCardText(selected):blue?.description;
 return `<header class="rw-top"><button class="rw-brand" data-realm-exit>BLOOD<span>MOON</span><small>⌃ REFÚGIO</small></button><div class="rw-heading"><small>REINOS DE VÉSPERA</small><h1>${esc(n.name)}</h1></div><div class="rw-wallet">${resourceBadge('coins',dataRef.profile.coins,'Marcas')}${resourceBadge('provisions',dataRef.player.provisions,'Provisões')}${resourceBadge('timber',dataRef.player.materials.timber,'Madeira')}${resourceBadge('ore',dataRef.player.materials.ore,'Minério')}${resourceBadge('essence',dataRef.player.materials.essence,'Essência')}</div></header>
 ${deathOverlay(w)}<div class="rw-mobile-vitals"><span>♥ ${Math.ceil(p.hp)}/${p.maxHp}<i style="width:${100*p.hp/p.maxHp}%"></i></span><span>⚡ ${Math.floor(p.energy)}/${p.maxEnergy}<i style="width:${100*p.energy/p.maxEnergy}%"></i></span></div><nav class="rw-camera-tools" aria-label="Controles do mapa"><button data-rw-zoom="out" title="Afastar câmera">−</button><button data-rw-home title="Centralizar viajante (Home)">◎</button><button data-rw-zoom="in" title="Aproximar câmera">+</button><button data-rw-help aria-label="Ajuda do mundo">?</button></nav>
 <aside class="rw-left"><div class="rw-crest" title="Nível de personagem ${w.rpg?.level??dataRef.player.level} · nível de exploração ${w.wallet?.level??dataRef.player.level}"><img src="/assets/avatars/${esc(dataRef.player.avatar||'vesper')}.png" alt="Retrato do viajante"><b aria-label="Nível de personagem ${w.rpg?.level??dataRef.player.level}">${w.rpg?.level??dataRef.player.level}</b></div><strong>${esc(dataRef.profile.name)}</strong><small class="rw-level-context">EXPLORAÇÃO ${w.wallet?.level??dataRef.player.level}</small><div class="rw-life"><i style="width:${100*p.hp/p.maxHp}%"></i></div><span>♥ ${Math.ceil(p.hp)} / ${p.maxHp}</span><div class="rw-life vigor"><i style="width:${100*p.energy/p.maxEnergy}%"></i></div><span>⚡ ${Math.floor(p.energy)} / ${p.maxEnergy}</span><nav><button data-realm-tab="camp">⌂ <span>Domínio</span></button><button data-realm-tab="house">♜ <span>Casas</span></button><button data-realm-tab="journey">✧ <span>Crônica</span></button><button data-modal="market">⚖ <span>Mercado</span></button><button data-rw-filter="equipment">⚔ <span>Equipar</span></button></nav><div class="rw-cycle"><i>☽</i><small>${esc((w.cycle?.phase||'névoa').toUpperCase())}<b>Vigília das duas luas</b></small></div></aside>
 ${radar(w,p,n)}${atlasPanel(w)}
 <aside class="rw-journal"><small>✧ CRÔNICA VIVA</small><p>${esc(event?.text||'As duas linhagens velam pelas estradas.')}</p>${w.invasions.filter(i=>i.status==='active').map(i=>`<button data-rw-invasion="${esc(i.node)}">⚠ ${esc(i.name)}<small>${Math.max(0,Math.ceil((i.endsAt-w.serverTime)/1000))}s</small></button>`).join('')}</aside>
 <aside class="rw-nearby"><small>AO ALCANCE DO OLHAR</small>${near.map(a=>`<button data-rw-focus="${esc(a.id)}" title="${esc(a.name)}">${objectArt(a)?`<img src="${objectArt(a)}" alt="">`:cardFace(a.cardId,'')}<span>${esc(a.name.split(' · ')[0])}<small>${esc(KIND[a.kind]||'Habitante')} · ${Math.round(metric(a,p))}m</small></span></button>`).join('')}</aside>
 <section class="rw-inspector ${!pick&&!slotTarget?'idle':''} ${detailsOpen?'expanded':''}"><div class="rw-inspector-title"><small>${showHelp?'GUIA DA VIGÍLIA':pick?esc(KIND[pick.kind]||'Viajante'):slotTarget?'POSIÇÃO DE CARTA':'SEU TERRITÓRIO'}</small><button class="rw-detail-toggle" data-rw-detail aria-label="Alternar detalhes" aria-expanded="${detailsOpen}">${detailsOpen?'⌄':'⌃'}</button><button data-rw-clear aria-label="Limpar alvo">×</button></div>${showHelp?'<div class="rw-guide"><h2>Seu juramento. Seu domínio.</h2><p><kbd>WASD</kbd> / <kbd>↑ ↓ ← →</kbd> para caminhar. Arraste o terreno para olhar; use a roda para aproximar.</p><p><kbd>E</kbd> interage com o alvo próximo. <kbd>Espaço</kbd> ataca. <kbd>Home</kbd> retorna a câmera ao viajante.</p><p>Posicione cartas nos seis tipos de espaço. Tropas, armadilhas e balistas defendem sua região. Produção e estandartes sustentam sua Casa.</p><p>Chefes e dungeons abrem a Arena. Colossos são raids compartilhadas no mapa. Duelos entre viajantes exigem consentimento.</p><p>Se cair, a Vigília devolve você ao Porto após 12s com 35% de vida. Pacto imediato custa 25 Marcas + 1 essência; criaturas vencidas restauram até 8% da vida e vitórias na Arena recuperam até 25% ou despertam você com 40%. Seu espólio permanece por cinco minutos.</p></div>':pick?targetControl(w,pick,cards):slotTarget?slotControl(w,slotTarget,selectedBlueprint,cards):regionControl(w,n)}${(w.challenges||[]).map(c=>`<button class="rw-primary rw-challenge" data-rw-pvp="${esc(c.playerId)}">ACEITAR DUELO · ${esc(c.name)}<small>PACTO · ARENA COMPLETA</small></button>`).join('')}${w.activeRoom?'<button class="rw-primary" data-realm-resume>⚔ RETOMAR ARENA</button>':''}${selected&&CARDS[selected]?.type==='equipment'?'<button class="rw-primary" data-rw-equip>EQUIPAR NO VIAJANTE<small>10 VIGOR · ATÉ DUAS RELÍQUIAS</small></button>':''}${selected&&CARDS[selected]?.type==='spell'&&['heal','sacrifice'].includes(CARDS[selected]?.effect)?'<button class="rw-primary" data-rw-heal>✦ RESTAURAR VIAJANTE</button>':''}${p.targetId?'<button class="rw-secondary" data-rw-stop>CESSAR ATAQUE</button>':''}<button class="rw-secondary rw-return" data-rw-recover ${p.downUntil>w.serverTime?'disabled':''}>☾ ${!p.hp?'RESSURGIR NO PORTO':'RETORNAR AO PORTO'}<small>${p.downUntil>w.serverTime?`VIGÍLIA · ${Math.ceil((p.downUntil-w.serverTime)/1000)}s`:'FORA DE COMBATE · SEM CUSTO'}</small></button></section>
 <footer class="rw-hotbar"><div class="rw-action-status"><small>${selected?'CARTA SELECIONADA':'PROJETO SELECIONADO'}</small><b>${esc(selected?CARDS[selected]?.name:blue?.name)}</b><span>${esc(selectedInfo)}</span><div class="rw-hotkeys"><kbd>WASD</kbd> MOVER <kbd>E</kbd> INTERAGIR</div></div><div class="rw-hand"><div class="rw-hand-tabs">${[['unit','Aliados'],['spell','Rituais'],['equipment','Relíquias']].map(([type,label])=>`<button data-rw-filter="${type}" class="${cardFilter===type?'active':''}" aria-pressed="${cardFilter===type}">${label}</button>`).join('')}<span>${hand.length}</span></div><div class="rw-hand-row"><button class="rw-hand-arrow" data-rw-scroll="-1" aria-label="Cartas anteriores">‹</button><div class="rw-cards">${hand.map(id=>`<button class="rw-card ${selected===id?'chosen':''}" data-rw-select="${esc(id)}" title="${esc(CARDS[id].name)} · ${esc(worldCardText(id))}" aria-pressed="${selected===id}">${cardFace(id,CARDS[id].name)}<small>${esc(CARDS[id].name)}</small><i>${CARDS[id].type==='equipment'?'⚒':CARDS[id].type==='spell'?'✦':CARDS[id].cost}</i></button>`).join('')||'<small>Nenhuma carta disponível.</small>'}</div><button class="rw-hand-arrow" data-rw-scroll="1" aria-label="Próximas cartas">›</button></div></div><div class="rw-projects"><small>CONSTRUIR & DEFENDER</small>${Object.values(w.blueprints).map(b=>`<button class="${!selected&&selectedBlueprint===b.id?'selected':''}" data-rw-blueprint="${b.id}" title="${esc(b.name)} · ${esc(b.description)}" aria-label="Selecionar ${esc(b.name)}">${objectArt({blueprintId:b.id})?`<img src="${objectArt({blueprintId:b.id})}" alt="">`:ICON[b.kind]}<span>${esc(b.name)}</span></button>`).join('')}</div></footer><div class="rw-feedback" role="status" aria-live="polite"></div>`;
}

function slotControl(w,slot,blueprintId,cards){const s=w.slots.find(x=>x.id===slot);if(!s)return '<p>Posição indisponível.</p>';const o=s.occupant,own=o?.owner===w.player.publicId,ritual=selected&&CARDS[selected]?.type==='spell'?`<button class="rw-primary" data-rw-spell="${esc(slot)}" data-rw-card="${esc(selected)}">✦ ${esc(CARDS[selected].name)}<small>${esc(worldCardText(selected))}</small></button>`:'';if(own&&o.resource)return `${ritual}<h2>${esc(o.name)}</h2><p>${o.stock||0} recursos aguardam recolhimento.</p><button class="rw-primary" data-rw-interact="${esc(slot)}">RECOLHER PRODUÇÃO</button><button class="rw-secondary" data-rw-repair="${esc(slot)}">REPARAR · 1 madeira + 1 minério</button><button class="rw-secondary" data-rw-recall="${esc(slot)}">RECOLHER CARTA</button>`;if(own)return `${ritual}${selected&&CARDS[selected]?.type==='equipment'?`<button class="rw-primary" data-rw-place="${esc(slot)}" data-rw-card="${esc(selected)}">EQUIPAR ${esc(CARDS[selected].name)} · 10 VIGOR</button>`:''}${o.blueprintId==='camp'?`<button class="rw-primary" data-rw-interact="${esc(slot)}">DESCANSAR · +40 VIDA / +35 VIGOR</button>`:''}<h2>${esc(o.name)}</h2><p>${esc(o.blueprintId?w.blueprints[o.blueprintId]?.description||'Estrutura sob sua vigília':CARDS[o.cardId]?.text||'Combatente em defesa')} · ${Math.ceil(o.hp)}/${o.maxHp} vida</p>${s.kind==='influence'?'<button class="rw-primary" data-rw-interact="'+esc(slot)+'">♜ EXERCER INFLUÊNCIA</button>':''}<button class="rw-secondary" data-rw-repair="${esc(slot)}">REPARAR · 1 madeira + 1 minério</button><button class="rw-secondary" data-rw-recall="${esc(slot)}">RECOLHER CARTA</button>`;if(o)return `<h2>${esc(o.name)}</h2><p>Posto de outra Casa · ${o.hp}/${o.maxHp} vida.</p><button class="rw-primary" data-rw-siege="${esc(slot)}">CERCAR POSTO · 15 VIGOR<small>Exige guerra declarada e território sem trégua.</small></button>`;return `<h2>${esc(w.slotKinds[s.kind])}</h2><p>${esc(s.kind==='resource'?`Projeto: ${w.blueprints[blueprintId]?.name||''}. Produz materiais locais.`:s.kind==='influence'?'Um aliado da frente influência ou um estandarte influencia o território.':'Escolha uma carta compatível com este espaço.')}</p><p class="rw-cost">${esc(Object.entries(w.blueprints[blueprintId]?.cost||{}).map(([k,v])=>`${v} ${({timber:'madeira',ore:'minério',essence:'essência'}[k]||k)}`).join(' · '))}</p>${Object.values(w.blueprints).filter(b=>b.kind===s.kind&&(!b.resource||dataRef.regions.find(n=>n.id===s.node)?.resource===b.resource)).map(b=>`<button class="rw-secondary" data-rw-build="${b.id}">⌂ ${esc(b.name)} <small>${esc(Object.entries(b.cost).map(([k,v])=>v+' '+({timber:'madeira',ore:'minério',essence:'essência'})[k]).join(' · '))} · ${esc(b.description)}</small></button>`).join('')}${cards.filter(id=>CARDS[id]?.type==='unit'?['frontline','influence'].includes(s.kind):CARDS[id]?.type==='equipment'&&s.kind==='weapon').map(id=>`<button class="rw-secondary" data-rw-place="${esc(slot)}" data-rw-card="${esc(id)}">${CARDS[id].type==='unit'?'⚔':'⚒'} ${esc(CARDS[id].name)} <small>${esc(CARDS[id].text)} · 2 madeira + 1 minério</small></button>`).join('')}`;}
function morph(current,next){
 if(current.nodeType!==next.nodeType||current.nodeName!==next.nodeName){current.replaceWith(next);return;}
 if(current.nodeType===3){if(current.nodeValue!==next.nodeValue)current.nodeValue=next.nodeValue;return;}
 if(current.nodeType!==1)return;
 for(const a of [...current.attributes])if(!next.hasAttribute(a.name))current.removeAttribute(a.name);
 for(const a of [...next.attributes])if(current.getAttribute(a.name)!==a.value)current.setAttribute(a.name,a.value);
 const before=[...current.childNodes],after=[...next.childNodes];for(let i=0;i<after.length;i++){if(before[i])morph(before[i],after[i]);else current.append(after[i]);}for(let i=after.length;i<before.length;i++)before[i].remove();
}
function visiblePoint(p,margin=250){const {w,h}=dimensions(),x=p.x*96*camera.z+camera.x,y=p.y*64*camera.z+camera.y;return x>-margin&&x<w+margin&&y>-margin&&y<h+margin;}
function patchHTML(host,html){const t=document.createElement('template');t.innerHTML=html;if(host.firstElementChild)morph(host.firstElementChild,t.content.firstElementChild);else host.append(t.content);}
function paintWorld(){
 if(!rootRef||!dataRef?.liveWorld)return;const w=dataRef.liveWorld,plane=rootRef.querySelector('.rw-plane');if(!plane)return;
 if(!plane.children.length)plane.innerHTML='<div class="rw-terrain-layer"></div><div class="rw-live-layer"></div>';
 const regions=w.regions||dataRef.regions,terrain=plane.querySelector('.rw-terrain-layer'),layer=plane.querySelector('.rw-live-layer'),visibleRegions=regions.filter(n=>visiblePoint(n,650*camera.z));
 const oldRegions=new Map([...terrain.children].map(e=>[e.dataset.region,e]));for(const n of visibleRegions){let el=oldRegions.get(n.id);oldRegions.delete(n.id);const stamp=JSON.stringify([w.player.location,metric(w.player,n)<18,w.slots.filter(slot=>slot.node===n.id)]);if(!el){el=document.createElement('div');el.dataset.region=n.id;el.innerHTML=island(w,n)+scenery([n]);terrain.append(el);}else if(el._stamp!==stamp){const t=document.createElement('template');t.innerHTML=island(w,n);morph(el.firstElementChild,t.content.firstElementChild);}el._stamp=stamp;}for(const el of oldRegions.values())el.remove();
 const people=w.players.filter(p=>p.id!==w.player.publicId).map(p=>({...p,kind:'traveler'})),entities=[...w.actors,...people].filter(a=>(a.kind!=='resource'||a.hp>0)&&visiblePoint(a,140));
 const existing=new Map([...layer.querySelectorAll('[data-rw-actor]')].map(e=>[e.dataset.rwActor,e]));
 const sampleAt=performance.now(),smoothActors=!matchMedia('(prefers-reduced-motion: reduce)').matches;
 for(const a of entities){
  let el=existing.get(a.id);existing.delete(a.id);
  if(el&&shouldAnimateDeath(el._wasAlive,a.hp))animateTokenDeath(el,a,w,camera.z);
  const moving=a.hp>0&&movingActors.has(a.kind)&&smoothActors,visibleState={...a};
  delete visibleState.cooldown;delete visibleState.contribution;delete visibleState.claimed;
  if(moving){delete visibleState.x;delete visibleState.y;}
  const stamp=JSON.stringify([visibleState,selectedTarget===a.id,a.kind==='settlement'?w.settlements?.find(city=>city.houseId===a.houseId)?.buildings:null]);
  if(!el||el._visualStamp!==stamp){
   const t=document.createElement('template');t.innerHTML=actor(a,w);
   if(el)morph(el,t.content.firstElementChild);else{layer.append(t.content);el=layer.lastElementChild;}
   el._visualStamp=stamp;
  }
  el._wasAlive=a.hp>0;
  if(moving){
   const motion=sampleRealmMotion(actorMotion.get(a.id),a,w.serverTime,sampleAt);
   actorMotion.set(a.id,motion);motion.element=el;
   el.style.transition='none';el.style.left=motion.x*96+'px';el.style.top=motion.y*64+'px';
  }else actorMotion.delete(a.id);
 }
 for(const el of existing.values()){const id=el.dataset.rwActor;if(el._wasAlive&&['kill','pk-kill','defeat'].includes(deathEvent(w,id).kind))animateTokenDeath(el,{id},w,camera.z);actorMotion.delete(id);el.remove();}
 let districts=plane.querySelector('.rw-city-layer');if(!districts){districts=document.createElement('div');districts.className='rw-city-layer';plane.append(districts);}const cityStamp=JSON.stringify(w.settlements);if(districts._stamp!==cityStamp){districts.innerHTML=districtMarkers(w);districts._stamp=cityStamp;}
 let self=layer.querySelector('.rw-self');if(!self){self=document.createElement('div');self.className='rw-self';self.innerHTML=`<img src="/assets/avatars/${esc(dataRef.player.avatar||'vesper')}.png" alt="${esc(dataRef.profile.name)}"><i></i><span class="rw-karma-badge" title="${esc(w.karma?.title||'Karma inicial')}"><img src="${esc(w.karma?.icon||('/assets/world/sheet-details/'+(dataRef.profile?.starterFaction==='werewolf'?'werewolf':'vampire')+'-white.webp'))}" alt=""></span><span class="rw-karma-combo" aria-hidden="true"></span><b>${esc(dataRef.profile.name)}</b><span>VOCÊ</span>`;layer.append(self);}const badge=self.querySelector('.rw-karma-badge');if(badge){badge.title=w.karma?.title||'';const icon=w.karma?.icon||'/assets/world/sheet-details/'+(dataRef.profile?.starterFaction==='werewolf'?'werewolf':'vampire')+'-white.webp';if(badge.querySelector('img').getAttribute('src')!==icon)badge.querySelector('img').src=icon;}self.dataset.karmaFamily=w.karma?.rankFamily||'white';self.dataset.karmaTier=String(w.karma?.rankTier||0);self.dataset.comboTier=String(w.karma?.comboTier||0);const combo=self.querySelector('.rw-karma-combo');if(combo)combo.textContent=(w.karma?.comboCount||0)>=3?`×${w.karma.comboCount}`:'';const p=controller?.pose||w.player;self.style.left=p.x*96+'px';self.style.top=p.y*64+'px';
 if(shouldAnimateDeath(self._wasAlive,w.player.hp))animateTokenDeath(self,w.player,w,camera.z);self._wasAlive=w.player.hp>0;self.dataset.life=w.player.hp>0?'alive':'dead';if(!self.querySelector('.rw-corpse-mark'))self.insertAdjacentHTML('beforeend',corpseFigure());
 paintCamera();paintThreatMarkers();paintHarvest();
}
function paintHud(){
 const host=rootRef?.querySelector('.rw-hud');if(!host)return;
 const temp=document.createElement('template');temp.innerHTML=hud(dataRef.liveWorld);
 const nextClasses=new Set([...temp.content.children].map(el=>el.classList[0]));
 for(const next of [...temp.content.children]){const cls=next.classList[0],current=[...host.children].find(el=>el.classList.contains(cls));if(cls==='rw-feedback')continue;if(current)morph(current,next);else host.append(next);}
 if(!nextClasses.has('rw-death'))host.querySelector('.rw-death')?.remove();
 if(!nextClasses.has('rw-atlas-overlay'))host.querySelector('.rw-atlas-overlay')?.remove();
 updateActionHud({...dataRef.liveWorld,gear:worldCards().filter(id=>CARDS[id].type==='equipment').map(id=>({...CARDS[id],cardId:id,art:CARD_ART[id],equipped:dataRef.liveWorld.player.equipment.includes(id)}))});
}
function paintDungeon(){
 const d=dataRef?.liveWorld?.dungeon;if(!rootRef)return;
 rootRef.classList.toggle('in-dungeon',!!d);
 let shell=rootRef.querySelector('.rw-dungeon');if(!d){shell?.remove();if(controller)controller.dungeonPose=null;return;}
 if(!shell){shell=document.createElement('section');shell.className='rw-dungeon';shell.innerHTML=`<div class="rw-dungeon-map"><div class="rw-dungeon-actors"></div><div class="rw-dungeon-self"><img alt=""><i></i><b>VOCÊ</b></div></div><header><small>EXPEDIÇÃO COMPARTILHADA · PvE / PvP</small><h2></h2><div class="rw-dungeon-vitals"><i></i><span></span></div><button data-rw-dungeon-exit>SAIR PELA PORTA</button></header><aside class="rw-dungeon-events"></aside><div class="rw-dungeon-controls"><div class="rw-dungeon-pad"><button data-rw-dir="w">▲</button><button data-rw-dir="a">◀</button><button data-rw-dir="s">▼</button><button data-rw-dir="d">▶</button></div><div class="rw-dungeon-skills"><button data-rw-dungeon-ability="guard">⬡<span>GUARDA</span></button><button data-rw-dungeon-ability="dodge">➶<span>ESQUIVA</span></button><button data-rw-dungeon-ability="bolt">✦<span>MAGIA</span></button><button data-rw-dungeon-ability="strike">⚔<span>ATACAR</span></button></div></div>`;rootRef.append(shell);}
 if(!controller.dungeonPose||controller.dungeonId!==d.id){controller.dungeonPose={x:d.player.x,y:d.player.y};controller.dungeonId=d.id;controller.dungeonAccum=0;dungeonTarget=null;}
 else if(Math.hypot(controller.dungeonPose.x-d.player.x,controller.dungeonPose.y-d.player.y)>3){controller.dungeonPose.x+=(d.player.x-controller.dungeonPose.x)*.28;controller.dungeonPose.y+=(d.player.y-controller.dungeonPose.y)*.28;}
 const map=shell.querySelector('.rw-dungeon-map');if(map._image!==d.image){map.style.backgroundImage=`linear-gradient(0deg,#03090ec9,#03090e22 24%,#03090e12 74%,#03090e9c),url('${d.image}')`;map._image=d.image;}
 shell.style.setProperty('--dungeon-tint',d.tint);shell.querySelector('h2').textContent=d.name;
 shell.querySelector('.rw-dungeon-vitals span').textContent=`${Math.ceil(d.player.hp)} / ${d.player.maxHp} VIDA · ${d.hazard}`;
 shell.querySelector('.rw-dungeon-vitals i').style.width=Math.max(0,100*d.player.hp/d.player.maxHp)+'%';
 const art='/assets/world/objects/',token=card=>CARD_ART[card]||'/assets/avatars/mordrath.png';
 const stamp=JSON.stringify([d.enemies,d.players,d.sigils,d.chests,d.hazards,d.serverTime>0?Math.floor(d.serverTime/1000):0,dungeonTarget]);
 const actors=shell.querySelector('.rw-dungeon-actors');if(actors._stamp!==stamp){actors._stamp=stamp;actors.innerHTML=`${d.hazards.map((h,i)=>`<i class="rw-dungeon-hazard" style="left:${h.x}%;top:${h.y}%" title="${esc(d.hazard)}"></i>`).join('')}${d.sigils.map(s=>`<button class="rw-dungeon-sigil ${s.active?'active':''}" data-rw-dungeon-interact="${s.id}" style="left:${s.x}%;top:${s.y}%" title="${s.active?'Selo ativo':'Ativar selo'}">${s.active?'✦':'◇'}<small>SELO</small></button>`).join('')}${d.chests.map(c=>`<button class="rw-dungeon-chest ${c.claimed?'claimed':''}" data-rw-dungeon-interact="${c.id}" style="left:${c.x}%;top:${c.y}%" title="${c.claimed?'Tesouro recolhido':'Abrir tesouro'}"><img src="${art}supply-crates.png" alt=""><small>${c.secret?'SEGREDO':c.boss?'COFRE':'BAÚ'}</small></button>`).join('')}${d.enemies.filter(e=>e.hp>0).map(e=>`<button class="rw-dungeon-enemy ${e.boss?'boss':''} ${dungeonTarget===e.id?'selected':''} ${e.windup?'warning':''}" data-rw-dungeon-target="${esc(e.id)}" style="left:${e.x}%;top:${e.y}%" title="${esc(e.name)}"><img src="${token(e.boss?'ravager':'warden')}" alt=""><b>${esc(e.name)}</b><i style="width:${100*e.hp/e.maxHp}%"></i></button>`).join('')}${d.players.filter(p=>p.id!==dataRef.player.publicId).map(p=>`<button class="rw-dungeon-ally ${dungeonTarget===p.id?'selected':''}" data-rw-dungeon-target="${esc(p.id)}" style="left:${p.x}%;top:${p.y}%" title="${esc(p.name)}"><img src="/assets/avatars/${esc(p.avatar||'vesper')}.png" alt=""><b>${esc(p.name)}</b></button>`).join('')}`;}
 const self=shell.querySelector('.rw-dungeon-self'),selfImage=self.querySelector('img'),selfArt=`/assets/avatars/${esc(dataRef.player.avatar||'vesper')}.png`;if(selfImage.getAttribute('src')!==selfArt)selfImage.src=selfArt;self.style.left=controller.dungeonPose.x+'%';self.style.top=controller.dungeonPose.y+'%';
 const mapWidth=map.offsetWidth,viewWidth=shell.clientWidth;if(mapWidth>viewWidth)map.style.left=Math.max(viewWidth-mapWidth,Math.min(0,viewWidth*.5-controller.dungeonPose.x/100*mapWidth))+'px';
 const log=shell.querySelector('.rw-dungeon-events'),eventStamp=d.events.map(e=>e.id).join('|');if(log._stamp!==eventStamp){log._stamp=eventStamp;log.innerHTML=d.events.slice(0,4).map(e=>`<p class="${esc(e.kind)}">${esc(e.text)}</p>`).join('');}
}

function normalizeData(d){const w=d.liveWorld;w.player.publicId=d.player.publicId;w.player.location=w.player.location||d.player.location;w.territories=d.territories;return d;}
function paint(forceHud=false){
 if(dataRef?.liveWorld?.dungeon){paintDungeon();return;}
 paintDungeon();paintWorld();
 const now=performance.now();
 if(forceHud||now-lastHudPaint>=500){lastHudPaint=now;paintHud();}
 else updateActionHud({...dataRef.liveWorld,gear:worldCards().filter(id=>CARDS[id].type==='equipment').map(id=>({...CARDS[id],cardId:id,art:CARD_ART[id],equipped:dataRef.liveWorld.player.equipment.includes(id)}))});
}
function feedback(s){const el=rootRef?.querySelector('.rw-feedback');if(!el)return;el.textContent=s;el.classList.add('show');clearTimeout(feedbackTimer);feedbackTimer=setTimeout(()=>el.classList.remove('show'),3300);}
async function send(input){
 const session=controller,callbacks=handlers;if(!session)return;
 const defensive=input.type==='world-ability'&&['guard','parry','reflect','dash'].includes(input.ability);
 if(session.commandBusy&&!defensive)return;
 if(!defensive)session.commandBusy=true;
 if(input.type==='world-interact'){
  const actor=dataRef.liveWorld?.actors?.find(a=>a.id===input.targetId);
  if(actor?.kind==='resource'){localHarvest={targetId:actor.id,resource:actor.resource,startedAt:Date.now(),endsAt:Date.now()+(dataRef.liveWorld.rules.harvestMs?.[actor.resource]||1500)};feedback('Coletando '+(actor.resource==='timber'?'madeira':actor.resource==='ore'?'minério':'essência')+'...');paintHarvest();}
 }
 try{
  const d=await callbacks.sendAction(input);if(controller!==session)return;
  if(d){localHarvest=null;dataRef=normalizeData(d);if(d.liveWorld){const player=d.liveWorld.player,displaced=player.displacement!==session.displacement;if(displaced){if(input.type==='world-ability'&&input.ability==='dash')beginDashTravel(session,player,findDashEvent(d.liveWorld,player));else{session.pose={x:player.x,y:player.y};session.dashTravel=null;session.accumulatedMs=0;session.queuedMove=null;clearKeys();if(input.type==='world-recover')focusPlayer();}session.displacement=player.displacement;}paint(true);}}
  const message=d?._worldResult?.message||d?.liveWorld?.lastResult?.message;if(message)feedback(message);
  return d;
 }catch(e){localHarvest=null;paintHarvest();feedback(e.message||'A ordem não foi aceita.');return null;}
 finally{if(!defensive)session.commandBusy=false;}
}
function findDashEvent(world,player){
 return (world?.combatEvents||[]).filter(event=>event.kind==='dash'&&event.source===player?.publicId&&Math.hypot((event.x-player.x)*1.5,event.y-player.y)<.08).sort((a,b)=>b.at-a.at)[0]||null;
}
function beginDashTravel(session,player,event){
 const from={...session.pose},to={x:player.x,y:player.y};
 if(Math.hypot(to.x-from.x,to.y-from.y)<.015){session.pose=to;session.dashTravel=null;return false;}
 const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 session.dashTravel={from,to,startedAt:performance.now(),duration:reduced?180:Math.max(260,Math.min(440,event?.duration||380))};
 session.pose=from;session.settlePose=null;session.deferredCorrection=null;session.accumulatedMs=0;session.queuedMove=null;
 if(controller===session)clearKeys();
 return true;
}
let analog={dx:0,dy:0};
function direction(){if(analog.dx||analog.dy)return analog;return {dx:Number(keys.has('d')||keys.has('arrowright')||keys.has('right'))-Number(keys.has('a')||keys.has('arrowleft')||keys.has('left')),dy:Number(keys.has('s')||keys.has('arrowdown')||keys.has('down'))-Number(keys.has('w')||keys.has('arrowup')||keys.has('up'))};}
function settleMovement(session,player){
 if(!player||session.dashTravel||session.inFlight||session.queuedMove||direction().dx||direction().dy||Number(player.moveSeq)<session.sentSeq)return;
 const dx=player.x-session.pose.x,dy=player.y-session.pose.y;
 // A small server correction at touch release looks like the joystick springing back.
 // Keep the visual token still and absorb that offset during the next movement.
 const pixelError=Math.hypot(dx*96*camera.z,dy*64*camera.z);
 if(session.analogStopped&&pixelError<=64){session.deferredCorrection={x:dx,y:dy};session.settlePose=null;return;}
 session.deferredCorrection=null;
 session.settlePose={x:player.x,y:player.y};
}
function isBlocked(){
 if(!dataRef?.liveWorld||pinch)return true;
 const p=dataRef.liveWorld.player;
 if(dataRef.liveWorld.activeRoom||p.hp<=0||document.hidden)return true;
 if(document.querySelector('dialog[open],.game-modal:not([hidden])'))return true;
 const v=document.querySelector('.install-veil');
 if(v&&!v.hidden&&v.offsetParent!==null&&v.style.display!=='none')return true;
 return false;
}
function dispatchMove(session,dx,dy,elapsedMs,now){
 const sendMs=Math.max(40,Math.min(750,Math.round(elapsedMs)));session.accumulatedMs=0;session.lastSentAt=now;
 if(session.inFlight){
  const queued=session.queuedMove;
  const oldMs=Math.min(queued?.elapsedMs||0,Math.max(0,750-sendMs));
  const total=oldMs+sendMs;
  session.queuedMove={dx:((queued?.dx||0)*oldMs+dx*sendMs)/total,dy:((queued?.dy||0)*oldMs+dy*sendMs)/total,elapsedMs:total};
  return;
 }
 session.inFlight=true;const moveSeq=++seq;session.sentSeq=moveSeq;session.settlePose=null;
 const magnitude=Math.hypot(dx,dy),power=Math.min(1,magnitude),length=Math.max(.001,magnitude);
 handlers.sendAction({type:'world-move',dx:dx/length,dy:dy/length,power:Math.max(.12,power),elapsedMs:sendMs,sequence:moveSeq}).then(data=>{
  if(controller!==session||!data)return;if(!data._movementOnly)updateRealmWorld(rootRef,data);
  settleMovement(session,data.liveWorld?.player);
 }).catch(e=>{
  if(controller===session){
   feedback(e.message||'Movimento não aceito.');
   const p=dataRef?.liveWorld?.player;
   if(p)session.settlePose={x:p.x,y:p.y};
  }
 }).finally(()=>{
  if(controller===session){
   session.inFlight=false;
   if(session.queuedMove){
    const next=session.queuedMove;
    session.queuedMove=null;
    dispatchMove(session,next.dx,next.dy,next.elapsedMs,performance.now());
   }else settleMovement(session,dataRef?.liveWorld?.player);
  }
 });
}
function loop(now){
 if(!rootRef?.isConnected||!controller){unmountRealmWorld();return;}
 const session=controller,d=direction(),blocked=isBlocked()||!!rootRef.querySelector('.ra-sheet:not([hidden])'),dt=Math.min(50,Math.max(0,now-(lastMove||now)));lastMove=now;
 if(dataRef?.liveWorld?.dungeon){
  if((d.dx||d.dy)&&!blocked&&session.dungeonPose){
   const len=Math.max(1,Math.hypot(d.dx,d.dy)),step=11*dt/1000;
   session.dungeonPose.x=Math.max(8,Math.min(91,session.dungeonPose.x+d.dx/len*step/1.65));
   session.dungeonPose.y=Math.max(22,Math.min(79,session.dungeonPose.y+d.dy/len*step));
   session.dungeonAccum=(session.dungeonAccum||0)+dt;
   if(session.dungeonAccum>=125&&!session.dungeonFlight){
    const elapsedMs=Math.min(400,session.dungeonAccum);session.dungeonAccum=0;session.dungeonFlight=true;
    handlers.sendAction({type:'world-dungeon-move',dx:d.dx,dy:d.dy,elapsedMs}).catch(e=>feedback(e.message||'Movimento indisponível.')).finally(()=>{if(controller===session)session.dungeonFlight=false;});
   }
  }else session.dungeonAccum=0;
  paintDungeon();frame=requestAnimationFrame(loop);return;
 }
 for(const motion of actorMotion.values()){
  if(!motion.element?.isConnected)continue;
  const oldX=motion.x,oldY=motion.y;
  advanceRealmMotion(motion,now,dt);
  if(Math.abs(motion.x-oldX)+Math.abs(motion.y-oldY)>.0005){
   motion.element.style.left=motion.x*96+'px';motion.element.style.top=motion.y*64+'px';
  }
 }
 if(session.dashTravel){
  const dash=session.dashTravel,t=Math.max(0,Math.min(1,(now-dash.startedAt)/dash.duration)),ease=t*t*(3-2*t);
  session.pose.x=dash.from.x+(dash.to.x-dash.from.x)*ease;session.pose.y=dash.from.y+(dash.to.y-dash.from.y)*ease;
  const self=rootRef.querySelector('.rw-self');if(self){self.style.left=session.pose.x*96+'px';self.style.top=session.pose.y*64+'px';self.classList.add('rw-dashing');}
  const size=dimensions(),follow=1-Math.exp(-dt/48);camera.x+=(size.w*.5-session.pose.x*96*camera.z-camera.x)*follow;camera.y+=(size.h*.48-session.pose.y*64*camera.z-camera.y)*follow;clampCamera();paintCamera();
  if(t>=1){session.pose={...dash.to};session.dashTravel=null;self?.classList.remove('rw-dashing');}
  frame=requestAnimationFrame(loop);return;
 }
 if((d.dx||d.dy)&&!blocked){
  const len=Math.max(1,Math.hypot(d.dx,d.dy)),rules=dataRef.liveWorld.rules,speed=rules.speed||22,aspect=rules.aspect||1.5;
  const stepX=d.dx/len*speed*(dt/1000)/aspect,stepY=d.dy/len*speed*(dt/1000);
  if(session.deferredCorrection){
   const blend=1-Math.exp(-dt/230);
   let shiftX=session.deferredCorrection.x*blend,shiftY=session.deferredCorrection.y*blend;
   const correctionPixels=Math.hypot(shiftX*96*camera.z,shiftY*64*camera.z);
   const travelPixels=Math.hypot(stepX*96*camera.z,stepY*64*camera.z);
   const scale=correctionPixels?Math.min(1,travelPixels*.35/correctionPixels):1;
   shiftX*=scale;shiftY*=scale;
   session.pose.x+=shiftX;session.pose.y+=shiftY;
   session.deferredCorrection.x-=shiftX;session.deferredCorrection.y-=shiftY;
   if(Math.hypot(session.deferredCorrection.x*96*camera.z,session.deferredCorrection.y*64*camera.z)<.5)session.deferredCorrection=null;
  }
  session.analogStopped=false;
  // Predict against the same nearby solid bodies as the authoritative world.
  // Walking through an obstacle locally used to spring the token backwards
  // whenever the server's collision result arrived.
  const world=dataRef.liveWorld;
  const position=moveWithCollisions({obstacles:world.combat?.obstacles||[],slots:world.slots||[],actors:world.actors||[]},session.pose,{x:session.pose.x+stepX,y:session.pose.y+stepY},{ignoreId:world.player.publicId});
  session.pose.x=position.x;
  session.pose.y=position.y;
  session.accumulatedMs=Math.min(750,session.accumulatedMs+dt);
  session.lastDir={dx:d.dx,dy:d.dy};
  session.settlePose=null;
  if(session.accumulatedMs>=100&&(now-session.lastSentAt)>=120){
   dispatchMove(session,d.dx,d.dy,session.accumulatedMs,now);
  }
  const self=rootRef.querySelector('.rw-self');if(self){self.style.left=session.pose.x*96+'px';self.style.top=session.pose.y*64+'px';self.classList.add('rw-moving');}
  const follow=1-Math.exp(-dt/65),size=dimensions();camera.x+=(size.w*.5-session.pose.x*96*camera.z-camera.x)*follow;camera.y+=(size.h*.48-session.pose.y*64*camera.z-camera.y)*follow;clampCamera();paintCamera();rootRef.style.setProperty('--facing',Math.atan2(d.dy,d.dx)+'rad');
 }else{
  if(session.accumulatedMs>0&&(session.lastDir.dx||session.lastDir.dy)&&!blocked){
   dispatchMove(session,session.lastDir.dx,session.lastDir.dy,session.accumulatedMs,now);
  }
  session.accumulatedMs=0;session.lastDir={dx:0,dy:0};rootRef.querySelector('.rw-self')?.classList.remove('rw-moving');
  if(session.settlePose&&!session.inFlight&&!session.queuedMove&&!mapTouches.size){
   const distance=Math.hypot(session.settlePose.x-session.pose.x,session.settlePose.y-session.pose.y);
   if(distance>0.003){
    const blend=1-Math.exp(-dt/(distance>2?110:180));
    session.pose.x+=(session.settlePose.x-session.pose.x)*blend;
    session.pose.y+=(session.settlePose.y-session.pose.y)*blend;
    const self=rootRef.querySelector('.rw-self');if(self){self.style.left=session.pose.x*96+'px';self.style.top=session.pose.y*64+'px';}
    const size=dimensions(),follow=1-Math.exp(-dt/110);
    camera.x+=(size.w*.5-session.pose.x*96*camera.z-camera.x)*follow;
    camera.y+=(size.h*.48-session.pose.y*64*camera.z-camera.y)*follow;
    clampCamera();paintCamera();
   }else session.settlePose=null;
  }
 }
 paintThreatMarkers();paintHarvest();frame=requestAnimationFrame(loop);
}
function slotIdFromButton(b){return b?.dataset.rwSlot||b?.dataset.rwBuild||b?.dataset.rwPlace&&slotTarget||slotTarget;}
async function click(e){const b=e.target.closest('button');if(!b)return;
 if(b.hasAttribute('data-rw-dungeon-exit'))return send({type:'world-dungeon-exit'});
 if(b.dataset.rwDungeonTarget){dungeonTarget=b.dataset.rwDungeonTarget;paintDungeon();return;}
 if(b.dataset.rwDungeonInteract)return send({type:'world-dungeon-interact',targetId:b.dataset.rwDungeonInteract});
 if(b.dataset.rwDungeonAbility){
  const d=dataRef.liveWorld.dungeon,ability=b.dataset.rwDungeonAbility,pose=controller?.dungeonPose||d?.player;
  if(!d)return;const dir=direction();
  if(ability==='guard')return send({type:'world-dungeon-guard'});
  if(ability==='dodge')return send({type:'world-dungeon-dodge',dx:dir.dx||1,dy:dir.dy});
  const targets=[...d.enemies.filter(e=>e.hp>0),...d.players.filter(p=>p.id!==dataRef.player.publicId&&p.hp>0)],chosen=targets.find(t=>t.id===dungeonTarget)||targets.sort((a,b)=>metric(pose,a)-metric(pose,b))[0];
  if(chosen)return send({type:'world-dungeon-attack',targetId:chosen.id,ability});feedback('Selecione um alvo vivo.');return;
 }
 if(b.dataset.rwThreat){selectedTarget=b.dataset.rwThreat;slotTarget=null;paintHud();return;}
 if(b.hasAttribute('data-rw-detail')){detailsOpen=!detailsOpen;paintHud();return;}
 if(b.dataset.rwFilter){cardFilter=b.dataset.rwFilter;paintHud();return;}
 if(b.dataset.rwScroll){rootRef.querySelector('.rw-cards')?.scrollBy({left:Number(b.dataset.rwScroll)*220,behavior:'smooth'});return;}
 if(b.hasAttribute('data-rw-help')){showHelp=!showHelp;paintHud();return;}
 if(b.hasAttribute('data-rw-home')){atlas=false;camera.z=innerWidth<=720?.6:.9;focusPlayer(true);paintWorld();paintHud();return;}
 if(b.dataset.rwZoom){camera.z*=b.dataset.rwZoom==='in'?1.15:.87;focusPlayer(true);paintWorld();return;}
 if(b.dataset.rwCenter){const a=dataRef.liveWorld.actors.find(a=>a.id===b.dataset.rwCenter)||dataRef.liveWorld.players.find(a=>a.id===b.dataset.rwCenter);if(a){camera.x=dimensions().w/2-a.x*96*camera.z;camera.y=dimensions().h*.45-a.y*64*camera.z;clampCamera();paintWorld();}return;}
 if(b.dataset.rwSelect){selected=selected===b.dataset.rwSelect?null:b.dataset.rwSelect;paintHud();return;}
 if(b.dataset.rwBlueprint){selectedBlueprint=b.dataset.rwBlueprint;selected=null;paintHud();return;}
 if(b.dataset.rwSlot){slotTarget=b.dataset.rwSlot;const s=dataRef.liveWorld.slots.find(x=>x.id===slotTarget);selectedTarget=null;showHelp=false;detailsOpen=false;paintHud();return;}
 if(b.dataset.rwActor){const id=b.dataset.rwActor,a=dataRef.liveWorld.actors.find(x=>x.id===id)||dataRef.liveWorld.players.find(x=>x.id===id);selectedTarget=id;slotTarget=null;showHelp=false;paintHud();return;}
 if(b.dataset.rwLand)return send({type:'world-land',plotId:b.dataset.rwLand});
 if(b.dataset.rwDominion)return send({type:'world-'+b.dataset.rwDominion,operation:b.dataset.operation,houseId:b.dataset.house,resource:b.dataset.resource,districtId:b.dataset.district,value:b.dataset.operation==='tax'?Number(b.dataset.value):b.dataset.value});
 if(b.dataset.rwCity)return send({type:'world-city',houseId:b.dataset.house,resource:b.dataset.resource,operation:b.dataset.rwCity});
 if(b.dataset.rwBuild)return send({type:'world-deploy',slotId:slotTarget,blueprintId:b.dataset.rwBuild});
 if(b.dataset.rwPlace)return send({type:'world-deploy',slotId:b.dataset.rwPlace,cardId:b.dataset.rwCard});
 if(b.dataset.rwAttack)return send({type:'world-attack',targetId:b.dataset.rwAttack});
 if(b.dataset.rwSpell)return send({type:'world-attack',targetId:b.dataset.rwSpell,cardId:b.dataset.rwCard});
 if(b.dataset.rwTrade)return send({type:'world-interact',targetId:b.dataset.rwTrade,operation:b.dataset.rwOperation,resource:b.dataset.rwResource});
 if(b.dataset.rwLineage)return send({type:'world-lineage',operation:b.dataset.rwLineage,targetId:b.dataset.rwLineageTarget});
 if(b.dataset.rwProfession)return send({type:'world-profession',operation:b.dataset.rwProfession,targetId:b.dataset.rwProfessionTarget});
 if(b.dataset.rwInteract)return send({type:'world-interact',targetId:b.dataset.rwInteract});
 if(b.dataset.rwRecall)return send({type:'world-recall',slotId:b.dataset.rwRecall});
 if(b.dataset.rwRepair)return send({type:'world-repair',slotId:b.dataset.rwRepair});
 if(b.dataset.rwDungeonEnter)return send({type:'world-dungeon-enter',targetId:b.dataset.rwDungeonEnter});
 if(b.dataset.rwArena)return handlers.openEncounter(b.dataset.rwArena);
 if(b.dataset.rwPvp)return handlers.openEncounter(b.dataset.rwPvp);
 if(b.hasAttribute('data-rw-equip'))return send({type:'world-equip',cardId:selected});if(b.dataset.rwSiege)return send({type:'world-siege',slotId:b.dataset.rwSiege});if(b.hasAttribute('data-rw-heal'))return send({type:'world-attack',targetId:'self',cardId:selected});if(b.hasAttribute('data-rw-stop'))return send({type:'world-stop'});if(b.hasAttribute('data-rw-recover'))return send({type:'world-recover'});
 if(b.dataset.rwFocus){const a=dataRef.liveWorld.actors.find(x=>x.id===b.dataset.rwFocus)||dataRef.liveWorld.players.find(x=>x.id===b.dataset.rwFocus);if(a){selectedTarget=a.id;slotTarget=null;}paintHud();return;}
 if(b.dataset.rwInvasion)b.dataset.rwLocate=b.dataset.rwInvasion;if(b.dataset.rwLocate){const n=dataRef.regions.find(x=>x.id===b.dataset.rwLocate);if(n){atlas=false;camera.x=dimensions().w/2-n.x*96*camera.z;camera.y=dimensions().h/2-n.y*64*camera.z;clampCamera();paintWorld();paintHud();}return;}
 if(b.dataset.rwProvince){const m=provinces().find(x=>x.id===b.dataset.rwProvince);if(m){const site=dataRef.regions.find(r=>r.x>=m.offset&&r.x<m.offset+m.width);atlas=false;const x=site?.x??m.offset+m.width/2,y=site?.y??50;camera.x=dimensions().w/2-x*96*camera.z;camera.y=dimensions().h/2-y*64*camera.z;clampCamera();paintWorld();paintHud();}return;}
 if(b.hasAttribute('data-rw-atlas')){atlas=!atlas;paintHud();return;}
 if(b.hasAttribute('data-rw-clear')){selectedTarget=null;slotTarget=null;showHelp=false;paintHud();return;}
 if(b.dataset.rwDir)return;
}
function keydown(e){
 if(!rootRef?.isConnected)return;
 if(document.querySelector('dialog[open],.game-modal:not([hidden]),.ra-sheet:not([hidden])'))return;
 const k=e.key.toLowerCase();
 if(['w','a','s','d','arrowup','arrowleft','arrowdown','arrowright'].includes(k)){
  if(['input','textarea','select'].includes(document.activeElement?.tagName?.toLowerCase()))return;
  keys.add(k);e.preventDefault();
 }
 if(k==='home')focusPlayer(true);
 if(dataRef?.liveWorld?.dungeon&&!e.repeat&&!['input','textarea','select'].includes(document.activeElement?.tagName?.toLowerCase())){
  if(k===' '){e.preventDefault();rootRef.querySelector('[data-rw-dungeon-ability="strike"]')?.click();return;}
  if(k==='e'){e.preventDefault();const d=dataRef.liveWorld.dungeon,pose=controller?.dungeonPose||d.player,near=[...d.sigils.filter(s=>!s.active),...d.chests.filter(c=>!c.claimed)].sort((a,b)=>metric(pose,a)-metric(pose,b))[0];if(near)send({type:'world-dungeon-interact',targetId:near.id});return;}
 }
 if(!e.repeat&&['e'].includes(k)&&!['input','textarea','select','button'].includes(document.activeElement?.tagName?.toLowerCase())){
  e.preventDefault();const w=dataRef.liveWorld,a=w.actors.find(a=>a.id===selectedTarget)||nearest(w);
  if(a){if(k===' ')send({type:'world-attack',targetId:a.id});else if(a.arenaKind)handlers.openEncounter(a.id);else send({type:'world-interact',targetId:slotTarget||a.id});}
 }
}
function keyup(e){keys.delete(e.key.toLowerCase());}
function wheel(e){if(!rootRef?.querySelector('.rw-viewport')?.contains(e.target))return;e.preventDefault();const r=rootRef.querySelector('.rw-viewport').getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,old=camera.z;camera.z*=e.deltaY<0?1.13:.88;clampCamera();const ratio=camera.z/old;camera.x=x-(x-camera.x)*ratio;camera.y=y-(y-camera.y)*ratio;clampCamera();paintWorld();}
function cameraPoints(){const r=rootRef.querySelector('.rw-viewport').getBoundingClientRect();return [...mapTouches.values()].slice(0,2).map(p=>({x:p.x-r.left,y:p.y-r.top}));}
function startPinch(){pinch={span:touchSpan(cameraPoints()),camera:{...camera}};drag=null;keys.clear();analog={dx:0,dy:0};suppressMapClickUntil=performance.now()+500;}
function suppressCameraClick(e){if(e.target.closest('.rw-viewport')&&(pinch||performance.now()<suppressMapClickUntil)){e.preventDefault();e.stopImmediatePropagation();}}
function pointerdown(e){
 if(controller)controller.pointerHeld=true;
 const stick=e.target.closest('[data-ra-joystick]');if(stick){e.preventDefault();if(controller.joystickId!=null)return;controller.joystickId=e.pointerId;stick.setPointerCapture(e.pointerId);moveStick(e,stick);return;}
 const dir=e.target.closest('[data-rw-dir]');
 if(dir){e.preventDefault();const d=dir.dataset.rwDir;keys.add(d);touchPointers.set(e.pointerId,d);try{dir.setPointerCapture(e.pointerId);}catch{}return;}
 const vp=e.target.closest('.rw-viewport');if(!vp)return;
 if(e.pointerType==='touch'){
  mapTouches.set(e.pointerId,{x:e.clientX,y:e.clientY});
  // Capture on the actual target so an ordinary tap still selects its token.
  try{e.target.setPointerCapture(e.pointerId);}catch{}
  if(mapTouches.size>=2){e.preventDefault();startPinch();return;}
 }else if(e.target.closest('button'))return;
 drag={x:e.clientX,y:e.clientY,cx:camera.x,cy:camera.y,id:e.pointerId,travel:0};
 if(e.pointerType!=='touch')try{vp.setPointerCapture(e.pointerId);}catch{}
}
function moveStick(e,stick){if(!stick)return;const rect=stick.getBoundingClientRect(),x=e.clientX-rect.left-rect.width/2,y=e.clientY-rect.top-rect.height/2,d=Math.hypot(x,y),radius=rect.width*.32,mag=Math.min(1,d/radius);analog=d<6?{dx:0,dy:0}:{dx:x/d*mag,dy:y/d*mag};stick.style.setProperty('--stick-x',analog.dx*radius+'px');stick.style.setProperty('--stick-y',analog.dy*radius+'px');}
function pointermove(e){
 if(controller?.joystickId===e.pointerId){if(!pinch)moveStick(e,rootRef.querySelector('[data-ra-joystick]'));return;}
 if(mapTouches.has(e.pointerId))mapTouches.set(e.pointerId,{x:e.clientX,y:e.clientY});
 if(pinch&&mapTouches.has(e.pointerId)&&mapTouches.size>=2){
  e.preventDefault();const {w,h}=dimensions();Object.assign(camera,pinchCamera(pinch,touchSpan(cameraPoints()),Math.max(w/SIZE.width,h/SIZE.height,.09),1.05));
  clampCamera();paintCamera();suppressMapClickUntil=performance.now()+500;
  if(performance.now()-lastCullingAt>100){paintWorld();lastCullingAt=performance.now();}return;
 }
 if(!drag||drag.id!==e.pointerId)return;drag.travel=Math.hypot(e.clientX-drag.x,e.clientY-drag.y);
 if(drag.travel>5){suppressMapClickUntil=performance.now()+350;camera.x=drag.cx+e.clientX-drag.x;camera.y=drag.cy+e.clientY-drag.y;clampCamera();paintCamera();if(performance.now()-lastCullingAt>100){paintWorld();lastCullingAt=performance.now();}}
}
function pointerup(e){
 if(controller?.joystickId===e.pointerId){controller.joystickId=null;controller.analogStopped=true;analog={dx:0,dy:0};const stick=rootRef.querySelector('[data-ra-joystick]');stick?.style.setProperty('--stick-x','0px');stick?.style.setProperty('--stick-y','0px');}
 if(touchPointers.has(e.pointerId)){const d=touchPointers.get(e.pointerId);touchPointers.delete(e.pointerId);if(![...touchPointers.values()].includes(d))keys.delete(d);}
 if(mapTouches.delete(e.pointerId)&&pinch){
  suppressMapClickUntil=performance.now()+500;
  if(mapTouches.size>=2)startPinch();else{pinch=null;const remaining=[...mapTouches.entries()][0];drag=remaining?{id:remaining[0],x:remaining[1].x,y:remaining[1].y,cx:camera.x,cy:camera.y,travel:0}:null;paintWorld();}
 }
 if(drag?.id===e.pointerId){if(drag.travel>5)paintWorld();drag=null;}
 if(controller)controller.pointerHeld=!!(mapTouches.size||touchPointers.size||controller.joystickId!=null);
}
function bind(){rootRef.addEventListener('click',suppressCameraClick,true);rootRef.addEventListener('click',click);rootRef.addEventListener('wheel',wheel,{passive:false});rootRef.addEventListener('pointerdown',pointerdown);rootRef.addEventListener('pointermove',pointermove);window.addEventListener('pointerup',pointerup);window.addEventListener('pointercancel',pointerup);document.addEventListener('keydown',keydown);document.addEventListener('keyup',keyup);window.addEventListener('blur',clearKeys);window.addEventListener('resize',resize);}
function clearKeys(){mapTouches.clear();pinch=null;analog={dx:0,dy:0};if(controller)controller.joystickId=null;const stick=rootRef?.querySelector('[data-ra-joystick]');stick?.style.setProperty('--stick-x','0px');stick?.style.setProperty('--stick-y','0px');keys.clear();touchPointers.clear();drag=null;if(controller)controller.pointerHeld=false;}
function resize(){clampCamera();paintWorld();}
export function renderRealmWorld(data){dataRef=normalizeData(data);const w=data.liveWorld,p=w.player;if(ownerId!==data.player.publicId){ownerId=data.player.publicId;selected=null;selectedTarget=null;slotTarget=null;seq=p.moveSeq||0;}else seq=Math.max(seq,p.moveSeq||0);return `<main class="rw-world" aria-label="Mundo aberto de Reinos de Véspera"><div class="rw-viewport" tabindex="0" aria-label="Mundo aberto; mova-se com WASD ou setas, arraste para olhar e use o zoom"><div class="rw-map-backdrop"></div><div class="rw-plane"></div><div class="rw-threat-markers" aria-label="Ameaças fora da visão"></div></div><div class="rw-hud">${hud(w)}</div>${actionHud()}</main>`;}
export function mountRealmWorld(root,data,callbacks){const surface=root.querySelector('.rw-world');if(!surface)return;if(rootRef!==surface){unmountRealmWorld();rootRef=surface;handlers=callbacks;controller={lastSentAt:0,accumulatedMs:0,inFlight:false,queuedMove:null,sentSeq:data.liveWorld.player.moveSeq||0,displacement:data.liveWorld.player.displacement||0,settlePose:null,deferredCorrection:null,analogStopped:false,lastDir:{dx:0,dy:0},pose:{x:data.liveWorld.player.x,y:data.liveWorld.player.y}};dataRef=normalizeData(data);camera.z=innerWidth<=720?.6:.9;bind();focusPlayer();paint();mountActionHud(surface,{send,direction,pose:()=>controller.pose,data:()=>dataRef,regions:()=>dataRef.regions,blocked:()=>isBlocked(),target:()=>selectedTarget,select:id=>{selectedTarget=id;slotTarget=null;},avatar:()=>dataRef.player.avatar||'vesper',name:()=>dataRef.profile.name,stopMovement:clearKeys,reconcile:()=>{controller.pose={x:dataRef.liveWorld.player.x,y:dataRef.liveWorld.player.y};controller.deferredCorrection=null;focusPlayer();},viewport:()=>rootRef.querySelector('.rw-viewport').getBoundingClientRect(),zoom:()=>camera.z*1.6,tokenZoom:()=>camera.z,project:p=>({x:p.x*96*camera.z+camera.x,y:p.y*64*camera.z+camera.y}),unproject:(x,y)=>{const rect=rootRef.getBoundingClientRect();return {x:(x-rect.left-camera.x)/(96*camera.z),y:(y-rect.top-camera.y)/(64*camera.z)};},locate:n=>{camera.x=dimensions().w/2-n.x*96*camera.z;camera.y=dimensions().h/2-n.y*64*camera.z;paint();},interact:()=>{const w=dataRef.liveWorld,a=w.actors.filter(a=>!['hostile','invader'].includes(a.kind)&&(a.kind!=='raid'||a.hp<=0)&&(a.hp>0||a.kind==='raid')&&metric(w.player,a)<=w.rules.interactRange).sort((a,b)=>Number(b.id===selectedTarget)-Number(a.id===selectedTarget)||metric(w.player,a)-metric(w.player,b))[0];if(a){if(a.arenaKind)handlers.openEncounter(a.id);else send({type:'world-interact',targetId:slotTarget||a.id});}}},data.liveWorld);frame=requestAnimationFrame(loop);}else{handlers=callbacks;updateRealmWorld(surface,data);}}
export function updateRealmWorld(root,data){
 if(!data?.liveWorld)return;
 const old=Number(dataRef?.liveWorld?.player?.moveSeq)||0,next=Number(data.liveWorld.player.moveSeq)||0;if(next<old)return;
 const displaced=data.liveWorld.player.displacement!==(controller?.displacement??dataRef?.liveWorld?.player?.displacement);
 dataRef=normalizeData(data);let animatedDash=false;
 if(displaced&&controller){
  const dash=findDashEvent(data.liveWorld,data.liveWorld.player);
  if(dash)animatedDash=beginDashTravel(controller,data.liveWorld.player,dash);
  if(!animatedDash){controller.pose={x:data.liveWorld.player.x,y:data.liveWorld.player.y};controller.dashTravel=null;controller.settlePose=null;controller.deferredCorrection=null;controller.accumulatedMs=0;controller.queuedMove=null;clearKeys();}
  controller.displacement=data.liveWorld.player.displacement;controller.analogStopped=false;
 }
 if(controller&&!displaced)settleMovement(controller,data.liveWorld.player);
 if(!rootRef?.isConnected)rootRef=root?.querySelector?.('.rw-world')||root;
 seq=Math.max(seq,next);if(displaced&&!animatedDash)focusPlayer();paint();
}
export function unmountRealmWorld(){clearTokenDeaths();mapTouches.clear();pinch=null;suppressMapClickUntil=0;unmountActionHud();if(frame)cancelAnimationFrame(frame);frame=0;localHarvest=null;actorMotion.clear();keys.clear();touchPointers.clear();clearTimeout(feedbackTimer);if(rootRef){rootRef.removeEventListener('click',suppressCameraClick,true);rootRef.removeEventListener('click',click);rootRef.removeEventListener('wheel',wheel);rootRef.removeEventListener('pointerdown',pointerdown);rootRef.removeEventListener('pointermove',pointermove);window.removeEventListener('pointerup',pointerup);window.removeEventListener('pointercancel',pointerup);}document.removeEventListener('keydown',keydown);document.removeEventListener('keyup',keyup);window.removeEventListener('blur',clearKeys);window.removeEventListener('resize',resize);rootRef=null;dataRef=null;controller=null;handlers={};}
export function isRealmWorldMoving(){const d=direction();return !!(d.dx||d.dy);}
