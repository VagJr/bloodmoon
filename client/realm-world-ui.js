import {cityPanel,districtMarkers} from '/realm-dominion-ui.js';
import {realmScenery} from '/shared/realm-scenery.js';
import {actionHud,mountActionHud,updateActionHud,unmountActionHud} from '/realm-action-ui.js?v=difficulty1';
import {sampleRealmMotion,advanceRealmMotion} from '/shared/realm-motion.js';
import {CARDS} from '/shared/cards.js';
import {CARD_ART} from '/shared/art-manifest.js';

const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const SIZE={width:28800,height:6400};
const KIND={rift:'Expedição pública', 'expedition-loot':'Tesouro de expedição',land:'Terreno de cidade',settlement:'Cidade de Casa',wayshrine:'Marco do Pacto · repouso',resource:'Veio de recursos',hostile:'Criatura hostil',invader:'Invasor',patrol:'Patrulha',merchant:'Mercadora',quartermaster:'Guardiã do Porto',envoy:'Emissário',caravan:'Caravana',boss:'Guardião',portal:'Dungeon',champion:'Desafiante',satchel:'Espólio recuperável',raid:'Raid · Colosso do Véu'};
const ICON={construction:'⌂',resource:'♧',weapon:'⚒',trap:'⌘',frontline:'⚔',influence:'♜'};
const RESOURCE_ART={coins:'/assets/world/objects/coin-pile.png',timber:'/assets/world/objects/fallen-timber.png',ore:'/assets/world/objects/iron-vein.png',essence:'/assets/world/objects/lunar-essence.png'};
const BUILD_ART={camp:'watch-camp',lumbermill:'ash-sawmill',mine:'oath-mine',essencewell:'veil-well',ballista:'obsidian-ballista',thorntrap:'thorn-snare',banner:'oath-banner'};
function objectArt(a){const id=(a.kind==='land'?'signpost':null)||(a.kind==='settlement'?'fortified-gate':null)||BUILD_ART[a.blueprintId]||({rift:'dungeon-gate','expedition-loot':'supply-crates',wayshrine:'stone-well',satchel:'lost-satchel',caravan:'moon-caravan',portal:'dungeon-gate'})[a.kind];return id?'/assets/world/objects/'+id+'.png':a.kind==='resource'?RESOURCE_ART[a.resource]:null;}
let cardFilter='unit',showHelp=false,detailsOpen=false;
let ownerId=null,dataRef=null,handlers={},selected=null,selectedBlueprint='camp',selectedTarget=null,slotTarget=null,camera={x:0,y:0,z:.9},keys=new Set(),touchPointers=new Map(),frame=0,seq=0,lastMove=0,moveBusy=false,controller=null,rootRef=null,drag=null,feedbackTimer=0,atlas=false,actorMotion=new Map(),lastHudPaint=0;
const movingActors=new Set(['hostile','invader','raid','patrol','caravan','traveler']);
const metric=(a,b)=>Math.hypot((a.x-b.x)*1.5,a.y-b.y);
const worldCards=()=>{const d=dataRef||{},ids=d.liveWorld?.cards||d.worldCards||[];return ids.filter(id=>!!CARDS[id]);};
const nearest=(w)=>w.actors.filter(a=>a.hp>0).sort((a,b)=>metric(w.player,a)-metric(w.player,b))[0];
function dimensions(){const r=rootRef?.querySelector('.rw-viewport')?.getBoundingClientRect();return {w:r?.width||innerWidth,h:r?.height||innerHeight};}
function clampCamera(){const {w,h}=dimensions(),min=Math.max(w/SIZE.width,h/SIZE.height,.09);camera.z=Math.max(min,Math.min(1.05,camera.z));camera.x=Math.min(0,Math.max(w-SIZE.width*camera.z,camera.x));camera.y=Math.min(0,Math.max(h-SIZE.height*camera.z,camera.y));}
function focusPlayer(smooth=false){const {w,h}=dimensions(),p=controller?.pose||dataRef.liveWorld.player;camera.x=w/2-p.x*96*camera.z;camera.y=h/2-p.y*SIZE.height/100*camera.z;clampCamera();paintCamera(smooth);}
function paintCamera(smooth=false){const ground=rootRef?.querySelector('.rw-map-backdrop');if(ground&&dataRef){const maps=dataRef.liveWorld.continents||[],{w}=dimensions(),center=(-camera.x+w/2)/(96*camera.z),continent=maps.findLast(m=>center>=m.offset)||maps[0];ground.style.backgroundImage=`url('${continent?.image||'/assets/world/vespera-map.png'}')`;ground.style.backgroundSize=`${9600*camera.z}px ${6400*camera.z}px`;ground.style.backgroundPosition=`${camera.x+(continent?.offset||0)*96*camera.z}px ${camera.y}px`;}const plane=rootRef?.querySelector('.rw-plane');if(plane){plane.style.transition='none';plane.style.transform=`translate(${camera.x}px,${camera.y}px) scale(${camera.z})`;}}
function cardFace(id,label='Carta'){return `<img src="${esc(CARD_ART[id]||'/assets/world/objects/oath-banner.png')}" alt="${esc(label)}" loading="lazy">`;}
function island(w,n){const selectedNode=n.id===w.player.location,near=metric(w.player,n)<18;return `<section class="rw-island ${selectedNode?'here':''}" style="left:${n.x*96}px;top:${n.y*64}px"><div class="rw-biome"><img src="/assets/world/${esc(n.board)}.png" alt="" loading="lazy"></div><img class="rw-sheet-landmark" src="/assets/world/sheet-details/${n.kind==='dungeon'?(n.x>=100&&n.x<200?'moon-gate':'blood-gate'):n.x>=100&&n.x<200?'moon-spring':n.x>=200?'blood-embers':'moon-flora'}.webp" alt="" loading="lazy"><div class="rw-place"><i>${esc(n.icon)}</i><span><small>${selectedNode?'SUA POSIÇÃO':n.kind==='dungeon'?'TERRA SELADA':'TERRITÓRIO'} · NÍVEL ${n.levelRange?`${n.levelRange.min}–${n.levelRange.max}`:n.level}</small><b>${esc(n.name)}</b></span><em>${w.territories?.[n.id]?.owner?'♜':''}</em></div><div class="rw-ring"></div>${w.slots.filter(s=>s.node===n.id).map((s,i)=>{const o=s.occupant,x=(s.x-n.x)*96,y=(s.y-n.y)*64;return `<button class="rw-slot ${o?'occupied':''} ${o?.owner===w.player.publicId?'own':''} ${near?'near':''}" style="left:calc(50% + ${x}px);top:calc(50% + ${y}px)" data-rw-slot="${esc(s.id)}" title="${esc(w.slotKinds[s.kind])}: ${o?esc(o.name):'espaço de carta'}">${o?`${objectArt(o)?`<img class="rw-structure-art" src="${objectArt(o)}" alt="${esc(o.name)}">`:cardFace(o.cardId,'')}${o.blueprintId?`<i class="rw-build-icon">${ICON[s.kind]||'◇'}</i>`:''}<meter min="0" max="${o.maxHp}" value="${o.hp}"></meter><b>${esc(o.name)}</b>`:`<i>${ICON[s.kind]||'◇'}</i><b>${esc(w.slotKinds[s.kind])}</b>`}</button>`;}).join('')}</section>`;}
function actor(a,w){const self=a.id===w.player.publicId,person=a.kind==='traveler',avatar=a.avatar||'oracle';return `<button class="rw-actor ${esc(a.kind)} ${objectArt(a)?'scenery':''} ${esc(a.faction||'neutral')} ${a.state==='em combate'?'fighting':''} ${a.guarding?'guarding':''} ${a.windup?`windup-${esc(a.windup.style||'raider')}`:''} ${selectedTarget===a.id?'targeted':''} ${a.hp<=0?'down':''}" data-rw-actor="${esc(a.id)}" style="left:${a.x*96}px;top:${a.y*64}px" title="${esc(a.name)} · ${esc(KIND[a.kind]||'Habitante')}">${objectArt(a)?`<img class="rw-object-art" src="${objectArt(a)}" alt="${esc(a.name)}" loading="lazy">`:person?`<img src="/assets/avatars/${esc(avatar)}.png" alt="">`:cardFace(a.cardId,a.name)}${a.kind==='settlement'?`<span class="rw-city-buildings">${Object.entries(w.settlements?.find(c=>c.houseId===a.houseId)?.buildings||{}).filter(([,level])=>level>0).map(([key,level])=>`<img src="/assets/world/objects/${({warehouse:'supply-crates',forge:'blacksmith',watchtower:'watchtower'})[key]}.png" alt="${key} ${level}">`).join('')}</span>`:''}${person&&a.karma?`<span class="rw-karma-badge" title="${esc(a.karma.title)}"><img src="${esc(a.karma.icon)}" alt=""></span>`:''}<i class="rw-footprint"></i>${a.hp>0&&a.kind!=='resource'?`<meter min="0" max="${a.maxHp}" value="${a.hp}"></meter>`:''}<b>${esc(a.name.split(' · ')[0])}</b>${a.aiStyle?`<em>NV ${a.level} · ${a.aiStyle.toUpperCase()}</em>`:''}${a.kind==='raid'?'<em>✦ RAID</em>':a.arenaKind?'<em>✦ ARENA</em>':a.kind==='invader'?'<em>⚠ INVASÃO</em>':''}</button>`;}
function scenery(regions){return '<div class="rw-scenery" aria-hidden="true">'+regions.flatMap(realmScenery).map(o=>'<img src="/assets/world/objects/'+o.art+'.png" class="'+(o.large?'large':'')+'" style="left:'+o.x*96+'px;top:'+o.y*64+'px" alt="" loading="lazy">').join('')+'</div>';}
function statusText(w){const p=w.player,phase=w.cycle?.phase||'vigília';return `<small>VÉSPERA · ${esc(phase.toUpperCase())}</small><strong>${esc(dataRef.regions.find(n=>n.id===dataRef.player.location)?.name||'Terras de Véspera')}</strong><span>◈ ${dataRef.profile.coins} · ◉ ${dataRef.player.provisions} · ♧ ${dataRef.player.materials.timber} · ⬡ ${dataRef.player.materials.ore} · ✧ ${dataRef.player.materials.essence}</span><span>♥ ${Math.ceil(p.hp)}/${p.maxHp}　⚡ ${Math.floor(p.energy)}/${p.maxEnergy}</span>`;}
function resourceBadge(key,value,label){const symbols={coins:'◈',provisions:'◉'},asset=RESOURCE_ART[key];return `<span class="rw-resource" title="${label}">${asset?`<img src="${asset}" alt="">`:`<i>${symbols[key]}</i>`}<b>${value}</b><small>${label}</small></span>`;}
function worldCardText(id){const c=CARDS[id];if(!c)return '';if(c.type==='unit')return `Frente ou influência · ${30+(c.health||0)*8} vida · ${(c.attack||1)*3} ataque · 2 madeira + 1 minério`;if(c.type==='equipment')return `Relíquia · +${(c.attack||0)*2} ataque · +${(c.health||0)*5} vida · 10 vigor`;return ({heal:'Restaura 25 de vida no líder ou em um posto aliado.',sacrifice:'Restaura 12 de vida no líder ou em um posto aliado.',influence:'Converte presença de um estandarte em influência da Casa.',pounce:'Prepara outro ataque e cura 10 de vida de um posto aliado.'})[c.effect]||`Ritual ofensivo · ${c.effect==='execute'?32:c.effect==='rend'?24:18+(c.effectAmount||0)*2} dano · ${10+c.cost*4} vigor`;}
function targetControl(w,a,cards){
 const p=w.player,d=metric(p,a),near=d<=w.rules.interactRange,disabled=!near?'disabled':'';
 const object=objectArt(a),kind=KIND[a.kind]||'Viajante',enemy=a.warEnemy||['hostile','invader','raid'].includes(a.kind),dead=a.hp<=0;
 let action='';
 if(a.kind==='land')action='<p>Terreno exclusivo de cidade. Construção: 25 madeiras e 15 minérios.</p><button class="rw-primary" data-rw-land="'+esc(a.id)+'" '+disabled+'>FUNDAR SEDE NESTE TERRENO</button>';
 else if(a.kind==='settlement')action=cityPanel(w,a);
 else if(a.arenaKind)action=`<button class="rw-primary" data-rw-arena="${esc(a.id)}" ${disabled||a.cooldown>0?'disabled':''}>⚔ ${a.kind==='portal'?'ADENTRAR DUNGEON':'DESAFIAR NA ARENA'}<small>${a.cooldown>0?`NOVA VIGÍLIA EM ${Math.ceil(a.cooldown/1000)}s`:'MESA COMPLETA · 2 PROVISÕES'}</small></button>`;
 else if(a.kind==='traveler'&&a.warEnemy)action='<p>Casa inimiga em guerra. Golpes, feitiços e projéteis de combate em tempo real podem atingir este viajante; barreiras, aparos e colisões continuam ativos.</p>';
 else if(a.kind==='traveler')action=`<button class="rw-primary" data-rw-pvp="${esc(a.id)}" ${disabled||a.busy?'disabled':''}>⚔ PROPOR DUELO<small>PACTO · EXIGE ACEITE DO VIAJANTE</small></button>`;
 else if(a.kind==='raid'&&dead)action=`<p>${a.contribution} de dano causado · mínimo de 20 para saque.</p><button class="rw-primary" data-rw-interact="${esc(a.id)}" ${!near||a.claimed||a.contribution<20?'disabled':''}>${a.claimed?'SAQUE RECEBIDO':'RECOLHER SAQUE DA RAID'}<small>60 MARCAS · 60 XP · MINÉRIO E ESSÊNCIA</small></button>`;
 else if(enemy)action=`${a.kind==='raid'?'<p>Colosso compartilhado. Ataque com outros viajantes e suas defesas. Cada participante conquista seu próprio saque.</p>':''}<button class="rw-primary" data-rw-attack="${esc(a.id)}" ${dead||d>w.rules.attackRange?'disabled':''}>⚔ ${dead?'DERROTADO':'ATACAR'}<small>${dead?`RETORNO EM ${Math.max(0,Math.ceil((a.respawnAt-w.serverTime)/1000))}s`:'ATAQUE CONTÍNUO · SEM CUSTO DE CARTA'}</small></button>${(selected&&CARDS[selected]?.type==='spell'?[selected]:cards.filter(id=>CARDS[id]?.type==='spell').slice(0,3)).filter(id=>!['heal','sacrifice','pounce','influence'].includes(CARDS[id].effect)).map(id=>`<button class="rw-secondary" data-rw-spell="${esc(a.id)}" data-rw-card="${esc(id)}" ${dead||d>w.rules.attackRange?'disabled':''}>✦ ${esc(CARDS[id].name)}<small>${esc(worldCardText(id))}</small></button>`).join('')}`;
 else {const label={rift:'INICIAR EXPEDIÇÃO · 2 PROVISÕES','expedition-loot':'RECOLHER RECOMPENSA',resource:`COLETAR ${a.resource==='timber'?'MADEIRA':a.resource==='ore'?'MINÉRIO':'ESSÊNCIA'}`,quartermaster:'DESCANSAR & REABASTECER',envoy:'CONTRATO DA VIGÍLIA',merchant:'VENDER RECURSOS',patrol:'FALAR COM A PATRULHA',satchel:'RECUPERAR ESPÓLIO',caravan:'RECEBER SUPRIMENTOS'}[a.kind]||'INTERAGIR';action=`<button class="rw-primary" data-rw-interact="${esc(a.id)}" ${disabled||dead?'disabled':''}>${dead?'RECURSO ESGOTADO':label}<small>${dead?`RENOVA EM ${Math.max(0,Math.ceil((a.respawnAt-w.serverTime)/1000))}s`:a.kind==='resource'?'+3 RECURSOS · 5 VIGOR':a.kind==='merchant'?'2 RECURSOS POR 8 MARCAS':'AÇÃO DO MUNDO'}</small></button>`;}
 return `<div class="rw-target-art ${object?'object':''}">${object?`<img src="${object}" alt="${esc(a.name)}">`:a.kind==='traveler'?`<img src="/assets/avatars/${esc(a.avatar||'oracle')}.png" alt="">`:cardFace(a.cardId,a.name)}<span>${esc(kind)}</span></div><h2>${esc(a.name)}</h2>${enemy&&!dead?`<div class="rw-target-health"><i style="width:${100*a.hp/a.maxHp}%"></i><span>${Math.ceil(a.hp)} / ${a.maxHp}</span></div>`:''}<div class="rw-target-meta"><span>${esc(a.state||kind)}</span><b>${Math.round(d*10)/10}m</b></div>${!near?'<p class="rw-distance">Aproxime-se com WASD ou as setas.</p>':''}${action}<button class="rw-secondary rw-camera-action" data-rw-center="${esc(a.id)}">◎ LOCALIZAR NO MAPA</button>`;
}
function regionControl(w,n){const q=w.player.quest||{},resource=({timber:'Madeira',ore:'Minério',essence:'Essência'})[n.resource];return `<div class="rw-region-art" style="background-image:url('/assets/world/${esc(n.board)}.png')"><small>${n.id==='haven'?'SANTUÁRIO':esc(n.kind==='dungeon'?'DUNGEON':'TERRITÓRIO')} · NÍVEL ${n.levelRange?`${n.levelRange.min}–${n.levelRange.max}`:n.level}</small><h2>${esc(n.name)}</h2></div><div class="rw-region-stats"><span>◆ VOCÊ ESTÁ AQUI</span><span>${dataRef.territories?.[n.id]?.owner?'DOMÍNIO DE UMA CASA':'TERRA LIVRE'}</span></div><div class="rw-region-resource">${resourceBadge(n.resource,'',resource)}<span>Recurso da região<small>Explore, recolha e construa.</small></span></div><div class="rw-quest"><small>✧ CONTRATO DA VIGÍLIA</small><b>Guardiões das duas linhagens</b><span>⚔ Criaturas vencidas <em>${Math.min(3,q.kills||0)}/3</em></span><span>♧ Coletas realizadas <em>${Math.min(2,q.gathers||0)}/2</em></span><div class="rw-quest-progress"><i style="width:${Math.min(100,((Math.min(3,q.kills||0)+Math.min(2,q.gathers||0))/5)*100)}%"></i></div><small>50 MARCAS · 30 XP · FAVORES</small></div><button class="rw-secondary" data-realm-tab="house">♜ CASAS, GUERRAS & INFLUÊNCIA</button>`;}
function deathOverlay(w){
 const p=w.player;if(p.hp>0)return '';
 const left=Math.max(0,(p.downUntil||w.serverTime)-w.serverTime),seconds=Math.ceil(left/1000),costCoins=25,costEssence=1;
 const canPay=(dataRef.profile.coins||0)>=costCoins&&(dataRef.player.materials?.essence||0)>=costEssence;
 const progress=Math.max(0,Math.min(100,100-left/(w.rules?.respawnMs||12000)*100));
 return `<section class="rw-death" role="dialog" aria-modal="true" aria-label="Retorno após a queda"><div class="rw-death-card"><div class="rw-death-sigil"><i>☾</i><b>†</b><span></span></div><div class="rw-death-copy"><small>VIGÍLIA DAS DUAS LUAS · ${seconds?`${seconds}S PARA O RETORNO`:'RETORNO LIBERADO'}</small><h2>O sangue ainda chama.</h2><p>A Vigília guarda seu espólio e guia seu espírito de volta ao Porto das Cinzas. Você pode aguardar ou firmar um pacto de sangue agora.</p></div><div class="rw-death-meter"><i style="width:${progress}%"></i></div><div class="rw-death-actions">${seconds?`<button class="rw-primary rw-revive-now" data-rw-recover ${canPay?'':'disabled'}>✦ FIRMAR PACTO · ${costCoins} MARCAS + ${costEssence} ESSÊNCIA<small>${canPay?'Retorno imediato · 55% vida · 70% vigor':'Recursos insuficientes · ou aguarde sem custo'}</small></button>`:'<button class="rw-primary rw-revive-now" data-rw-recover>☾ RETORNAR AO PORTO SEM CUSTO<small>35% vida · 60% vigor · 30% mana</small></button>'}<button class="rw-secondary rw-death-leave" data-realm-exit>VOLTAR AO REFÚGIO<small>Jogue Arena e outros modos enquanto a Vigília prepara seu retorno.</small></button></div><small class="rw-death-foot">Aguarde ${seconds?`${seconds}s para ressurgir`: 'um instante para despertar'} sem custo · Sua bolsa pode ser recuperada no mapa</small></div></section>`;
}
function hud(w){
 const p=w.player,n=dataRef.regions.find(n=>n.id===p.location)||dataRef.regions[0],cards=worldCards(),hand=cards.filter(id=>CARDS[id].type===cardFilter),near=w.actors.filter(a=>metric(a,p)<10&&(a.hp>0||a.kind==='raid'&&a.contribution>=20&&!a.claimed)).sort((a,b)=>metric(a,p)-metric(b,p)).slice(0,4);
 const pick=w.actors.find(a=>a.id===selectedTarget)||w.players.filter(a=>a.id!==p.publicId).map(a=>({...a,kind:'traveler'})).find(a=>a.id===selectedTarget),blue=w.blueprints[selectedBlueprint],event=w.events[0],selectedInfo=selected?worldCardText(selected):blue?.description;
 return `<header class="rw-top"><button class="rw-brand" data-realm-exit>BLOOD<span>MOON</span><small>⌃ REFÚGIO</small></button><div class="rw-heading"><small>REINOS DE VÉSPERA</small><h1>${esc(n.name)}</h1></div><div class="rw-wallet">${resourceBadge('coins',dataRef.profile.coins,'Marcas')}${resourceBadge('provisions',dataRef.player.provisions,'Provisões')}${resourceBadge('timber',dataRef.player.materials.timber,'Madeira')}${resourceBadge('ore',dataRef.player.materials.ore,'Minério')}${resourceBadge('essence',dataRef.player.materials.essence,'Essência')}</div></header>
 ${deathOverlay(w)}<div class="rw-mobile-vitals"><span>♥ ${Math.ceil(p.hp)}/${p.maxHp}<i style="width:${100*p.hp/p.maxHp}%"></i></span><span>⚡ ${Math.floor(p.energy)}/${p.maxEnergy}<i style="width:${100*p.energy/p.maxEnergy}%"></i></span></div><nav class="rw-camera-tools" aria-label="Controles do mapa"><button data-rw-zoom="out" title="Afastar câmera">−</button><button data-rw-home title="Centralizar viajante (Home)">◎</button><button data-rw-zoom="in" title="Aproximar câmera">+</button><button data-rw-help aria-label="Ajuda do mundo">?</button></nav>
 <aside class="rw-left"><div class="rw-crest" title="Nível de personagem ${w.rpg?.level??dataRef.player.level} · nível de exploração ${w.wallet?.level??dataRef.player.level}"><img src="/assets/avatars/${esc(dataRef.player.avatar||'vesper')}.png" alt="Retrato do viajante"><b aria-label="Nível de personagem ${w.rpg?.level??dataRef.player.level}">${w.rpg?.level??dataRef.player.level}</b></div><strong>${esc(dataRef.profile.name)}</strong><small class="rw-level-context">EXPLORAÇÃO ${w.wallet?.level??dataRef.player.level}</small><div class="rw-life"><i style="width:${100*p.hp/p.maxHp}%"></i></div><span>♥ ${Math.ceil(p.hp)} / ${p.maxHp}</span><div class="rw-life vigor"><i style="width:${100*p.energy/p.maxEnergy}%"></i></div><span>⚡ ${Math.floor(p.energy)} / ${p.maxEnergy}</span><nav><button data-realm-tab="camp">⌂ <span>Domínio</span></button><button data-realm-tab="house">♜ <span>Casas</span></button><button data-realm-tab="journey">✧ <span>Crônica</span></button><button data-modal="market">⚖ <span>Mercado</span></button><button data-rw-filter="equipment">⚔ <span>Equipar</span></button></nav><div class="rw-cycle"><i>☽</i><small>${esc((w.cycle?.phase||'névoa').toUpperCase())}<b>Vigília das duas luas</b></small></div></aside>
 <aside class="rw-radar"><div class="rw-radar-head"><i></i>${w.players.length} VIAJANTE${w.players.length===1?'':'S'}<button data-rw-atlas>${atlas?'VOLTAR':'ATLAS'}</button></div><div class="rw-mini" style="background-image:url('${w.continents?.[Math.min(2,Math.floor(p.x/100))]?.image||'/assets/world/vespera-map.png'}')">${dataRef.regions.filter(r=>Math.floor(r.x/100)===Math.floor(p.x/100)).map(r=>`<button class="rw-mini-node ${r.id===n.id?'current':''}" data-rw-locate="${r.id}" title="${esc(r.name)}" aria-label="Localizar ${esc(r.name)}" style="left:${r.x%100}%;top:${r.y}%">${esc(r.icon)}</button>`).join('')}<i style="left:${p.x%100}%;top:${p.y}%"></i>${w.players.filter(x=>x.id!==p.publicId&&Math.floor(x.x/100)===Math.floor(p.x/100)).map(x=>`<b style="left:${x.x%100}%;top:${x.y}%" title="${esc(x.name)}">◇</b>`).join('')}${w.invasions.filter(i=>i.status==='active').map(i=>{const r=dataRef.regions.find(r=>r.id===i.node);return r&&Math.floor(r.x/100)===Math.floor(p.x/100)?`<em style="left:${r.x%100}%;top:${r.y}%">⚠</em>`:''}).join('')}</div>${atlas?`<div class="rw-region-list">${dataRef.regions.map(r=>`<button data-rw-locate="${r.id}">${esc(r.icon)} ${esc(r.name)}<small>NÍVEL ${r.levelRange?`${r.levelRange.min}–${r.levelRange.max}`:r.level}</small></button>`).join('')}</div>`:''}</aside>
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
  const moving=movingActors.has(a.kind)&&smoothActors,visibleState={...a};
  delete visibleState.cooldown;delete visibleState.contribution;delete visibleState.claimed;
  if(moving){delete visibleState.x;delete visibleState.y;}
  const stamp=JSON.stringify([visibleState,selectedTarget===a.id,a.kind==='settlement'?w.settlements?.find(city=>city.houseId===a.houseId)?.buildings:null]);
  if(!el||el._visualStamp!==stamp){
   const t=document.createElement('template');t.innerHTML=actor(a,w);
   if(el)morph(el,t.content.firstElementChild);else{layer.append(t.content);el=layer.lastElementChild;}
   el._visualStamp=stamp;
  }
  if(moving){
   const motion=sampleRealmMotion(actorMotion.get(a.id),a,w.serverTime,sampleAt);
   actorMotion.set(a.id,motion);motion.element=el;
   el.style.transition='none';el.style.left=motion.x*96+'px';el.style.top=motion.y*64+'px';
  }else actorMotion.delete(a.id);
 }
 for(const el of existing.values()){actorMotion.delete(el.dataset.rwActor);el.remove();}
 let districts=plane.querySelector('.rw-city-layer');if(!districts){districts=document.createElement('div');districts.className='rw-city-layer';plane.append(districts);}const cityStamp=JSON.stringify(w.settlements);if(districts._stamp!==cityStamp){districts.innerHTML=districtMarkers(w);districts._stamp=cityStamp;}
 let self=layer.querySelector('.rw-self');if(!self){self=document.createElement('div');self.className='rw-self';self.innerHTML=`<img src="/assets/avatars/${esc(dataRef.player.avatar||'vesper')}.png" alt="${esc(dataRef.profile.name)}"><i></i><span class="rw-karma-badge" title="${esc(w.karma?.title||'Karma inicial')}"><img src="${esc(w.karma?.icon||('/assets/world/sheet-details/'+(dataRef.profile?.starterFaction==='werewolf'?'werewolf':'vampire')+'-white.webp'))}" alt=""></span><b>${esc(dataRef.profile.name)}</b><span>VOCÊ</span>`;layer.append(self);}const badge=self.querySelector('.rw-karma-badge');if(badge){badge.title=w.karma?.title||'';badge.querySelector('img').src=w.karma?.icon||'/assets/world/sheet-details/'+(dataRef.profile?.starterFaction==='werewolf'?'werewolf':'vampire')+'-white.webp';}const p=controller?.pose||w.player;self.style.left=p.x*96+'px';self.style.top=p.y*64+'px';
 paintCamera();
}
function paintHud(){
 const host=rootRef?.querySelector('.rw-hud');if(!host)return;
 const temp=document.createElement('template');temp.innerHTML=hud(dataRef.liveWorld);
 const nextClasses=new Set([...temp.content.children].map(el=>el.classList[0]));
 for(const next of [...temp.content.children]){const cls=next.classList[0],current=[...host.children].find(el=>el.classList.contains(cls));if(cls==='rw-feedback')continue;if(current)morph(current,next);else host.append(next);}
 if(!nextClasses.has('rw-death'))host.querySelector('.rw-death')?.remove();
 updateActionHud({...dataRef.liveWorld,gear:worldCards().filter(id=>CARDS[id].type==='equipment').map(id=>({...CARDS[id],cardId:id,art:CARD_ART[id],equipped:dataRef.liveWorld.player.equipment.includes(id)}))});
}

function normalizeData(d){const w=d.liveWorld;w.player.publicId=d.player.publicId;w.player.location=w.player.location||d.player.location;w.territories=d.territories;return d;}
function paint(forceHud=false){
 paintWorld();
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
 try{
  const d=await callbacks.sendAction(input);if(controller!==session)return;
  if(d){dataRef=normalizeData(d);if(d.liveWorld){if(['world-recover','world-ability'].includes(input.type)&&d.liveWorld.player.displacement!==session.displacement){session.displacement=d.liveWorld.player.displacement;session.pose={x:d.liveWorld.player.x,y:d.liveWorld.player.y};session.accumulatedMs=0;session.queuedMove=null;if(input.type==='world-recover')focusPlayer();}paint(true);}}
  const message=d?._worldResult?.message||d?.liveWorld?.lastResult?.message;if(message)feedback(message);
  return d;
 }catch(e){feedback(e.message||'A ordem não foi aceita.');return null;}
 finally{if(!defensive)session.commandBusy=false;}
}
let analog={dx:0,dy:0};
function direction(){if(analog.dx||analog.dy)return analog;return {dx:Number(keys.has('d')||keys.has('arrowright')||keys.has('right'))-Number(keys.has('a')||keys.has('arrowleft')||keys.has('left')),dy:Number(keys.has('s')||keys.has('arrowdown')||keys.has('down'))-Number(keys.has('w')||keys.has('arrowup')||keys.has('up'))};}
function isBlocked(){
 if(!dataRef?.liveWorld)return true;
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
  const sp=data.liveWorld?.player;
  if(sp){
   const cur=direction();
   if(!cur.dx&&!cur.dy&&!session.queuedMove&&Number(sp.moveSeq)>=session.sentSeq)
    session.settlePose={x:sp.x,y:sp.y};
  }
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
   }else if(!direction().dx&&!direction().dy){
    const p=dataRef?.liveWorld?.player;
    if(p&&Number(p.moveSeq)>=session.sentSeq)session.settlePose={x:p.x,y:p.y};
   }
  }
 });
}
function loop(now){
 if(!rootRef?.isConnected||!controller){unmountRealmWorld();return;}
 const session=controller,d=direction(),blocked=isBlocked()||!!rootRef.querySelector('.ra-sheet:not([hidden])'),dt=Math.min(50,Math.max(0,now-(lastMove||now)));lastMove=now;
 for(const motion of actorMotion.values()){
  if(!motion.element?.isConnected)continue;
  const oldX=motion.x,oldY=motion.y;
  advanceRealmMotion(motion,now,dt);
  if(Math.abs(motion.x-oldX)+Math.abs(motion.y-oldY)>.0005){
   motion.element.style.left=motion.x*96+'px';motion.element.style.top=motion.y*64+'px';
  }
 }
 if((d.dx||d.dy)&&!blocked){
  const len=Math.max(1,Math.hypot(d.dx,d.dy)),rules=dataRef.liveWorld.rules,speed=rules.speed||22,aspect=rules.aspect||1.5;
  session.pose.x=Math.max(1,Math.min(299,session.pose.x+(d.dx/len*speed*(dt/1000))/aspect));
  session.pose.y=Math.max(1,Math.min(99,session.pose.y+(d.dy/len*speed*(dt/1000))));
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
  if(session.settlePose&&!session.inFlight&&!session.queuedMove){
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
 frame=requestAnimationFrame(loop);
}
function slotIdFromButton(b){return b?.dataset.rwSlot||b?.dataset.rwBuild||b?.dataset.rwPlace&&slotTarget||slotTarget;}
async function click(e){const b=e.target.closest('button');if(!b)return;
 if(b.hasAttribute('data-rw-detail')){detailsOpen=!detailsOpen;paintHud();return;}
 if(b.dataset.rwFilter){cardFilter=b.dataset.rwFilter;paintHud();return;}
 if(b.dataset.rwScroll){rootRef.querySelector('.rw-cards')?.scrollBy({left:Number(b.dataset.rwScroll)*220,behavior:'smooth'});return;}
 if(b.hasAttribute('data-rw-help')){showHelp=!showHelp;paintHud();return;}
 if(b.hasAttribute('data-rw-home')){atlas=false;camera.z=innerWidth<=720?.6:.9;focusPlayer(true);paintHud();return;}
 if(b.dataset.rwZoom){camera.z*=b.dataset.rwZoom==='in'?1.15:.87;focusPlayer(true);return;}
 if(b.dataset.rwCenter){const a=dataRef.liveWorld.actors.find(a=>a.id===b.dataset.rwCenter)||dataRef.liveWorld.players.find(a=>a.id===b.dataset.rwCenter);if(a){camera.x=dimensions().w/2-a.x*96*camera.z;camera.y=dimensions().h*.45-a.y*64*camera.z;clampCamera();paintCamera(true);}return;}
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
 if(b.dataset.rwInteract)return send({type:'world-interact',targetId:b.dataset.rwInteract});
 if(b.dataset.rwRecall)return send({type:'world-recall',slotId:b.dataset.rwRecall});
 if(b.dataset.rwRepair)return send({type:'world-repair',slotId:b.dataset.rwRepair});
 if(b.dataset.rwArena)return handlers.openEncounter(b.dataset.rwArena);
 if(b.dataset.rwPvp)return handlers.openEncounter(b.dataset.rwPvp);
 if(b.hasAttribute('data-rw-equip'))return send({type:'world-equip',cardId:selected});if(b.dataset.rwSiege)return send({type:'world-siege',slotId:b.dataset.rwSiege});if(b.hasAttribute('data-rw-heal'))return send({type:'world-attack',targetId:'self',cardId:selected});if(b.hasAttribute('data-rw-stop'))return send({type:'world-stop'});if(b.hasAttribute('data-rw-recover'))return send({type:'world-recover'});
 if(b.dataset.rwFocus){const a=dataRef.liveWorld.actors.find(x=>x.id===b.dataset.rwFocus)||dataRef.liveWorld.players.find(x=>x.id===b.dataset.rwFocus);if(a){selectedTarget=a.id;slotTarget=null;}paintHud();return;}
 if(b.dataset.rwInvasion)b.dataset.rwLocate=b.dataset.rwInvasion;if(b.dataset.rwLocate){const n=dataRef.regions.find(x=>x.id===b.dataset.rwLocate);if(n){camera.x=dimensions().w/2-n.x*96*camera.z;camera.y=dimensions().h/2-n.y*64*camera.z;clampCamera();paintCamera(true);}return;}
 if(b.hasAttribute('data-rw-atlas')){atlas=!atlas;camera.z=atlas?Math.max(dimensions().w/SIZE.width,dimensions().h/SIZE.height):.9;focusPlayer();paintHud();return;}
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
 if(!e.repeat&&['e'].includes(k)&&!['input','textarea','select','button'].includes(document.activeElement?.tagName?.toLowerCase())){
  e.preventDefault();const w=dataRef.liveWorld,a=w.actors.find(a=>a.id===selectedTarget)||nearest(w);
  if(a){if(k===' ')send({type:'world-attack',targetId:a.id});else if(a.arenaKind)handlers.openEncounter(a.id);else send({type:'world-interact',targetId:slotTarget||a.id});}
 }
}
function keyup(e){keys.delete(e.key.toLowerCase());}
function wheel(e){if(!rootRef?.querySelector('.rw-viewport')?.contains(e.target))return;e.preventDefault();const r=rootRef.querySelector('.rw-viewport').getBoundingClientRect(),x=e.clientX-r.left,y=e.clientY-r.top,ratio=e.deltaY<0?1.13:.88;camera.z*=ratio;camera.x=x-(x-camera.x)*ratio;camera.y=y-(y-camera.y)*ratio;clampCamera();paintCamera();}
function pointerdown(e){
 if(controller)controller.pointerHeld=true;
 const stick=e.target.closest('[data-ra-joystick]');if(stick){e.preventDefault();if(controller.joystickId!=null)return;controller.joystickId=e.pointerId;stick.setPointerCapture(e.pointerId);moveStick(e,stick);return;}
 const dir=e.target.closest('[data-rw-dir]');
 if(dir){
  e.preventDefault();const d=dir.dataset.rwDir;
  keys.add(d);touchPointers.set(e.pointerId,d);
  try{dir.setPointerCapture(e.pointerId);}catch{}
  drag={direction:d,id:e.pointerId};
  return;
 }
 const vp=e.target.closest('.rw-viewport');if(!vp||e.target.closest('button'))return;
 drag={x:e.clientX,y:e.clientY,cx:camera.x,cy:camera.y,id:e.pointerId,travel:0};
 try{vp.setPointerCapture(e.pointerId);}catch{}
}
function moveStick(e,stick){const rect=stick.getBoundingClientRect(),x=e.clientX-rect.left-rect.width/2,y=e.clientY-rect.top-rect.height/2,d=Math.hypot(x,y),radius=rect.width*.32,mag=Math.min(1,d/radius);analog=d<6?{dx:0,dy:0}:{dx:x/d*mag,dy:y/d*mag};stick.style.setProperty('--stick-x',analog.dx*radius+'px');stick.style.setProperty('--stick-y',analog.dy*radius+'px');}
function pointermove(e){if(controller?.joystickId===e.pointerId){moveStick(e,rootRef.querySelector('[data-ra-joystick]'));return;}if(!drag||drag.direction)return;drag.travel=Math.hypot(e.clientX-drag.x,e.clientY-drag.y);if(drag.travel>5){camera.x=drag.cx+e.clientX-drag.x;camera.y=drag.cy+e.clientY-drag.y;clampCamera();paintCamera();}}
function pointerup(e){if(controller?.joystickId===e.pointerId){controller.joystickId=null;analog={dx:0,dy:0};const stick=rootRef.querySelector('[data-ra-joystick]');stick?.style.setProperty('--stick-x','0px');stick?.style.setProperty('--stick-y','0px');}
 if(controller)controller.pointerHeld=false;
 if(touchPointers.has(e.pointerId)){
  const d=touchPointers.get(e.pointerId);touchPointers.delete(e.pointerId);
  if(![...touchPointers.values()].includes(d))keys.delete(d);
 }
 if(drag?.direction)keys.delete(drag.direction);
 if(drag?.id===e.pointerId)drag=null;
}
function bind(){rootRef.addEventListener('click',click);rootRef.addEventListener('wheel',wheel,{passive:false});rootRef.addEventListener('pointerdown',pointerdown);rootRef.addEventListener('pointermove',pointermove);window.addEventListener('pointerup',pointerup);window.addEventListener('pointercancel',pointerup);document.addEventListener('keydown',keydown);document.addEventListener('keyup',keyup);window.addEventListener('blur',clearKeys);window.addEventListener('resize',resize);}
function clearKeys(){analog={dx:0,dy:0};if(controller)controller.joystickId=null;const stick=rootRef?.querySelector('[data-ra-joystick]');stick?.style.setProperty('--stick-x','0px');stick?.style.setProperty('--stick-y','0px');keys.clear();touchPointers.clear();drag=null;if(controller)controller.pointerHeld=false;}
function resize(){clampCamera();paintCamera();}
export function renderRealmWorld(data){dataRef=normalizeData(data);const w=data.liveWorld,p=w.player;if(ownerId!==data.player.publicId){ownerId=data.player.publicId;selected=null;selectedTarget=null;slotTarget=null;seq=p.moveSeq||0;}else seq=Math.max(seq,p.moveSeq||0);return `<main class="rw-world" aria-label="Mundo aberto de Reinos de Véspera"><div class="rw-viewport" tabindex="0" aria-label="Mundo aberto; mova-se com WASD ou setas, arraste para olhar e use o zoom"><div class="rw-map-backdrop"></div><div class="rw-plane"></div></div><div class="rw-hud">${hud(w)}</div>${actionHud()}</main>`;}
export function mountRealmWorld(root,data,callbacks){const surface=root.querySelector('.rw-world');if(!surface)return;if(rootRef!==surface){unmountRealmWorld();rootRef=surface;handlers=callbacks;controller={lastSentAt:0,accumulatedMs:0,inFlight:false,queuedMove:null,sentSeq:data.liveWorld.player.moveSeq||0,settlePose:null,lastDir:{dx:0,dy:0},pose:{x:data.liveWorld.player.x,y:data.liveWorld.player.y}};dataRef=normalizeData(data);camera.z=innerWidth<=720?.6:.9;bind();paint();focusPlayer();mountActionHud(surface,{send,direction,pose:()=>controller.pose,data:()=>dataRef,regions:()=>dataRef.regions,blocked:()=>isBlocked(),target:()=>selectedTarget,select:id=>{selectedTarget=id;slotTarget=null;},avatar:()=>dataRef.player.avatar||'vesper',name:()=>dataRef.profile.name,stopMovement:clearKeys,reconcile:()=>{controller.pose={x:dataRef.liveWorld.player.x,y:dataRef.liveWorld.player.y};focusPlayer();},viewport:()=>rootRef.querySelector('.rw-viewport').getBoundingClientRect(),zoom:()=>camera.z*1.6,project:p=>({x:p.x*96*camera.z+camera.x,y:p.y*64*camera.z+camera.y}),unproject:(x,y)=>{const rect=rootRef.getBoundingClientRect();return {x:(x-rect.left-camera.x)/(96*camera.z),y:(y-rect.top-camera.y)/(64*camera.z)};},locate:n=>{camera.x=dimensions().w/2-n.x*96*camera.z;camera.y=dimensions().h/2-n.y*64*camera.z;paint();},interact:()=>{const w=dataRef.liveWorld,a=w.actors.filter(a=>!['hostile','invader'].includes(a.kind)&&(a.kind!=='raid'||a.hp<=0)&&(a.hp>0||a.kind==='raid')&&metric(w.player,a)<=w.rules.interactRange).sort((a,b)=>Number(b.id===selectedTarget)-Number(a.id===selectedTarget)||metric(w.player,a)-metric(w.player,b))[0];if(a){if(a.arenaKind)handlers.openEncounter(a.id);else send({type:'world-interact',targetId:slotTarget||a.id});}}},data.liveWorld);frame=requestAnimationFrame(loop);}else{handlers=callbacks;updateRealmWorld(surface,data);}}
export function updateRealmWorld(root,data){if(!data?.liveWorld)return;const old=Number(dataRef?.liveWorld?.player?.moveSeq)||0,next=Number(data.liveWorld.player.moveSeq)||0;if(next<old)return;const displaced=data.liveWorld.player.displacement!==dataRef?.liveWorld?.player?.displacement;dataRef=normalizeData(data);if(displaced&&controller){controller.pose={x:data.liveWorld.player.x,y:data.liveWorld.player.y};controller.settlePose=null;controller.accumulatedMs=0;controller.queuedMove=null;clearKeys();}const cur=direction();if(controller&&!displaced&&!controller.inFlight&&!controller.queuedMove&&!cur.dx&&!cur.dy&&next>=controller.sentSeq)controller.settlePose={x:data.liveWorld.player.x,y:data.liveWorld.player.y};if(!rootRef?.isConnected)rootRef=root?.querySelector?.('.rw-world')||root;seq=Math.max(seq,next);if(displaced)focusPlayer(true);paint();}
export function unmountRealmWorld(){unmountActionHud();if(frame)cancelAnimationFrame(frame);frame=0;actorMotion.clear();keys.clear();touchPointers.clear();clearTimeout(feedbackTimer);if(rootRef){rootRef.removeEventListener('click',click);rootRef.removeEventListener('wheel',wheel);rootRef.removeEventListener('pointerdown',pointerdown);rootRef.removeEventListener('pointermove',pointermove);window.removeEventListener('pointerup',pointerup);window.removeEventListener('pointercancel',pointerup);}document.removeEventListener('keydown',keydown);document.removeEventListener('keyup',keyup);window.removeEventListener('blur',clearKeys);window.removeEventListener('resize',resize);rootRef=null;dataRef=null;controller=null;handlers={};}
export function isRealmWorldMoving(){const d=direction();return !!(d.dx||d.dy);}
