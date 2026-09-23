import fs from 'node:fs';
const file='client/app.js';let s=fs.readFileSync(file,'utf8');
function replace(from,to){if(!s.includes(from))throw Error('Missing anchor: '+from.slice(0,100));s=s.replace(from,to);}
replace("const app=document.querySelector('#app');",`import { CARD_ART } from '/shared/art-manifest.js';
import { renderRealms } from '/realms-ui.js';
const app=document.querySelector('#app');
let worldOpen=false,realmData=null,realmFocus=null,realmTab='map',realmPolling=false,modalHistory=[],cardSearch='',onlyOwned=false,packState='sealed',revealedSlots=new Set();
const rarityNames={common:'COMUM',uncommon:'INCOMUM',rare:'RARA',epic:'ÉPICA',legendary:'LENDÁRIA'};
const effectNames={lifesteal:'DRENAR',bleed:'SANGRAMENTO',guard:'GUARDA',overwhelm:'TRANSBORDO',fury:'FRENESI',pierce:'PERFURAR',mend:'RESTAURAR',focus:'FOCO',rally:'REFORÇO'};
function closeModal(){modal=modalHistory.pop()||null;render();}
function inspectCard(id){if(modal==='decks')deckDraftName=document.querySelector('#deck-name')?.value||deckDraftName;modalHistory.push(modal);modal='card:'+id;render();}
async function openRealms(){await guarded(async()=>{await ensureProfile();realmData=await api('/realms');profile=realmData.profile;worldOpen=true;room=null;modal=null;selected=null;realmFocus=realmData.player.location;});}
async function doRealmAction(type,extra={}){await guarded(async()=>{try{realmData=await api('/realms/actions','POST',{type,version:realmData.player.version,...extra});profile=realmData.profile;if(['travel','retreat'].includes(type)){realmFocus=realmData.player.location;playSound('start');}else playSound('loot');}catch(e){realmData=await api('/realms');throw e;}});}
async function realmEncounter(){await guarded(async()=>{room=await api('/realms/encounter','POST',{version:realmData.player.version});selected=null;modal=null;remember();});}
function searchTools(){return '<div class="arsenal-search"><span>⌕</span><input id="card-search" data-card-search placeholder="Nome, efeito ou sinergia…" value="'+esc(cardSearch)+'" aria-label="Buscar cartas"><button data-owned-filter aria-pressed="'+onlyOwned+'">'+(onlyOwned?'✓ MINHA COLEÇÃO':'TODAS AS CARTAS')+'</button></div>';}
function matchesSearch(c){return (c.name+' '+c.text+' '+(c.tags||[]).join(' ')).normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase().includes(cardSearch.normalize('NFD').replace(/[\\u0300-\\u036f]/g,'').toLowerCase())&&(!onlyOwned||ownedCardCount(c.id,profile?.collection||{},profile?.items||[])>0);}
`);
replace("const art=(id,cls='')=>`<span class=\"art art-${ART[id]??14} ${cls}\" aria-hidden=\"true\"></span>`;",`const art=(id,cls='')=>{const hero={vampire:'vesper',werewolf:'kael',boss:'mordrath'},src=CARD_ART[id]||(hero[id]?'/assets/avatars/'+hero[id]+'.png':null);return src?'<img class="art image-art '+cls+'" src="'+src+'" alt="" aria-hidden="true" loading="lazy" decoding="async">':'<span class="art art-'+(ART[id]??14)+' prototype-art '+cls+'" aria-hidden="true"></span>';};`);
replace('class="game-card ${c.faction} ${active?', 'class="game-card ${c.faction} rarity-${c.rarity} ${active?');
replace("`${c.gearEffect?.toUpperCase()||'RELÍQUIA'} · EQUIPÁVEL`", "`${effectNames[c.gearEffect]||'RELÍQUIA'} · EQUIPÁVEL`");
replace("c.keyword==='overwhelm'?'TRANSBORDO':c.type==='unit'", "c.keyword==='overwhelm'?'TRANSBORDO':c.keyword==='fury'?'FRENESI':c.synergy?'SINERGIA':c.type==='unit'");
replace("app.innerHTML=(room?battle():lobby())+modalHTML();if(!room){", "document.body.classList.toggle('in-realms',worldOpen&&!room);app.innerHTML=(room?battle():worldOpen?renderRealms(realmData,realmFocus,realmTab,busy):lobby())+modalHTML();if(!room&&!worldOpen){");
replace('<button class="duel-button" data-modal="duel">', '<button class="realm-entry" data-open-realms><img src="/assets/world/vespera-map.png" alt=""><span><small>UMA AVENTURA ALÉM DA ARENA</small>REINOS DE VÉSPERA<em>MUNDO PERSISTENTE · EXPLORAR ↗</em></span></button><button class="duel-button" data-modal="duel">');
replace("const pool=Object.values(CARDS).filter(c=>c.faction===f||c.faction==='neutral')", "const pool=Object.values(CARDS).filter(c=>(c.faction===f||c.faction==='neutral')&&matchesSearch(c))");
replace('<div class="deck-editor-columns">','${searchTools()}<div class="deck-editor-columns">');
replace('<span class="mini-art art art-${ART[id]??14}"></span>', '${art(id,"mini-art")}');
replace('<span class="mini-art art art-${ART[c.id]??14}"></span>', '${art(c.id,"mini-art")}');
replace('<div class="collection-filters">','${searchTools()}<div class="collection-filters">');
replace(".filter(c=>filter==='all'||c.faction===filter).map", ".filter(c=>(filter==='all'||c.faction===filter)&&matchesSearch(c)).map");
const packStart=s.indexOf("  if(modal==='boosters')");const packEnd=s.indexOf("  if(modal==='decks')",packStart);
if(packStart<0||packEnd<0)throw Error('booster anchors');
s=s.slice(0,packStart)+`  if(modal==='boosters'){title='O selo da primeira noite';body=\`<div class="booster-stage pack-\${packState}"><div class="pack-pedestal"><div class="pack-aura"></div><img class="official-pack" src="/assets/pack/vespera.png" alt="Booster oficial Bloodmoon, Crônicas de Véspera, Edição I, cinco cartas"><span class="pack-rune">✧</span></div><div class="pack-story"><small>CRÔNICAS DE VÉSPERA · EDIÇÃO I</small><h3>O próximo juramento<br>está em suas mãos.</h3><p>Cinco cartas. Uma nova relíquia.<br>Rompa o selo e descubra o que a noite guardou.</p><div class="pack-contents"><span><b>2</b> COMUNS</span><span><b>1</b> INCOMUM</span><span><b>1</b> RARA+</span><span><b>1</b> ITEM</span></div><button class="hunt-button" data-buy-booster \${busy||profile.coins<ECONOMY.boosterCost?'disabled':''}><small>◈ \${ECONOMY.boosterCost} MARCAS · SALDO \${profile.coins}</small><span>\${packState==='opening'?'ROMPENDO O SELO…':'ABRIR BOOSTER'}</span></button><details class="pack-odds"><summary>Conteúdo e probabilidades</summary><p>Premium: 78% rara, 19% épica, 3% lendária. Equipamento: 60% comum, 25% incomum, 12% raro, 3% épico. Cada equipamento é uma peça persistente com 3 de durabilidade. Duplicatas de cartas acima do limite viram fragmentos.</p></details></div></div>\${packReveal.length&&packState!=='opening'?\`<div class="reveal-toolbar"><h3>RECOMPENSAS DA NOITE</h3><button data-reveal-all>REVELAR TODAS</button></div><div class="pack-reveal">\${packReveal.map((p,i)=>{const c=CARDS[p.id],revealed=revealedSlots.has(i);return \`<article class="booster-pull \${p.rarity} \${revealed?'is-revealed':''}" style="--reveal-delay:\${i*90}ms">\${revealed?card(c.id):\`<button class="sealed-card" data-reveal-slot="\${i}" aria-label="Revelar carta \${i+1}"><i>☾</i><b>BLOODMOON</b><small>TOQUE PARA REVELAR</small></button>\`}<small>\${revealed?rarityNames[p.rarity]+' · '+(p.duplicate?'DUPLICATA':'ADICIONADA'):'DESTINO SELADO'}</small>\${revealed&&p.duplicate?\`<b>+\${ECONOMY.duplicateDust[p.rarity]} FRAGMENTOS</b>\`:''}\${revealed&&p.item?'<b>RELÍQUIA · DURABILIDADE 3</b>':''}</article>\`;}).join('')}</div>\`:''}\`;}
`+s.slice(packEnd);
replace("if(modal.startsWith('card:'))", "if(modal.startsWith('art:')){const id=modal.slice(4),c=CARDS[id];title=c.name;body=`<div class=\"full-art-gallery\">${CARD_ART[id]?`<img src=\"${CARD_ART[id]}\" alt=\"${esc(c.name)}\">`:art(id)}<p>${CARD_ART[id]?'Ilustração original · exibida na resolução disponível':'Arte provisória · ilustração exclusiva prevista no próximo lote'}</p></div>`;}\n  if(modal.startsWith('card:'))");
replace('<p>${c.text}</p><blockquote>${c.flavor}</blockquote>', '<p>${c.text}</p>${c.synergy?\'<p class="inspect-synergy">✧ Sinergia na mesma frente · uma ativação por rodada. Bônus temporários expiram após o confronto.</p>\':\'\'}<blockquote>${c.flavor}</blockquote><button class="gold-button" data-full-art="${c.id}">AMPLIAR ILUSTRAÇÃO ↗</button><p class="art-status">${CARD_ART[c.id]?\'ARTE ORIGINAL\':\'ARTE PROVISÓRIA · ILUSTRAÇÃO EXCLUSIVA PENDENTE\'}</p>');
replace('<div class="modal-backdrop"><section class="game-modal ', '<div class="modal-backdrop ${!room?\'menu-backdrop\':\'\'} menu-${modal.split(\':\')[0]}"><section class="game-modal ');
replace('<p class="overline">BLOODMOON · SANGUE & FÚRIA</p><h2>${title}</h2>${body}', '<div class="window-heading"><p class="overline">BLOODMOON · SANGUE & FÚRIA</p><h2>${title}</h2><span class="window-ornament">◆</span></div>${!room?`<nav class="window-navigation">${[[\'collection\',\'ARSENAL\'],[\'decks\',\'DECKS\'],[\'boosters\',\'BOOSTERS\'],[\'market\',\'RELICÁRIO\'],[\'contracts\',\'CONTRATOS\']].map(([id,label])=>`<button data-modal="${id}" class="${modal===id?\'active\':\'\'}">${label}</button>`).join(\'\')}</nav>`:\'\'}${body}');
replace("if(selected||busy)return;const c=CARDS[el.dataset.preview]", "if(selected||busy||modal?.startsWith('card:')||modal?.startsWith('art:'))return;const c=CARDS[el.dataset.preview]");
replace("${c.gearEffect?.toUpperCase()}", "${effectNames[c.gearEffect]||'RELÍQUIA'}");
replace("if(b.hasAttribute('data-buy-booster')){await guarded(async()=>{const result=await api('/boosters/open','POST',{});profile=result.profile;packReveal=result.pulls;playSound('loot');});return;}",`if(b.hasAttribute('data-buy-booster')){await guarded(async()=>{const result=await api('/boosters/open','POST',{});profile=result.profile;packReveal=result.pulls;revealedSlots.clear();packState='opening';render();playSound('loot');if(!matchMedia('(prefers-reduced-motion: reduce)').matches)await new Promise(resolve=>setTimeout(resolve,1100));packState='revealed';});return;}
  if(b.dataset.revealSlot!==undefined){revealedSlots.add(Number(b.dataset.revealSlot));playSound('loot');render();return;}
  if(b.hasAttribute('data-reveal-all')){packReveal.forEach((_,i)=>revealedSlots.add(i));playSound('loot');render();return;}
  if(b.hasAttribute('data-owned-filter')){onlyOwned=!onlyOwned;render();return;}
  if(b.dataset.fullArt){modalHistory.push(modal);modal='art:'+b.dataset.fullArt;render();return;}
  if(b.hasAttribute('data-open-realms')){await openRealms();return;}
  if(b.hasAttribute('data-realm-exit')){worldOpen=false;render();return;}
  if(b.dataset.realmTab){realmTab=b.dataset.realmTab;render();return;}
  if(b.dataset.realmNode){realmFocus=b.dataset.realmNode;playSound('select');render();return;}
  if(b.dataset.realmTravel){await doRealmAction('travel',{destination:b.dataset.realmTravel});return;}
  if(b.dataset.realmAction){await doRealmAction(b.dataset.realmAction);return;}
  if(b.dataset.realmUpgrade){await doRealmAction('upgrade',{building:b.dataset.realmUpgrade});return;}
  if(b.dataset.realmAvatar){await doRealmAction('avatar',{avatar:b.dataset.realmAvatar});return;}
  if(b.dataset.realmJoin){await doRealmAction('join',{houseId:b.dataset.realmJoin});return;}
  if(b.dataset.realmPolicy){await doRealmAction('propose',{policy:b.dataset.realmPolicy});return;}
  if(b.dataset.realmWar){await doRealmAction('war',{houseId:b.dataset.realmWar});return;}
  if(b.hasAttribute('data-realm-donate')){await doRealmAction('donate',{amount:25});return;}
  if(b.hasAttribute('data-realm-encounter')){await realmEncounter();return;}
  if(b.hasAttribute('data-realm-resume')){await guarded(async()=>{room=await api('/rooms/'+realmData.player.activeRoom);remember();});return;}
  if(b.hasAttribute('data-return-realms')){await openRealms();return;}
  if(b.hasAttribute('data-concede')){modal=null;render();await act({type:'concede'});return;}`);
replace("else if(b.dataset.modal){modal=b.dataset.modal;", "else if(b.dataset.modal){modalHistory=[];modal=b.dataset.modal;");
replace("else if(b.hasAttribute('data-close')){modal=null;render();}", "else if(b.hasAttribute('data-close')){closeModal();}");
replace("else if(b.dataset.inspect){modal=`card:${b.dataset.inspect}`;render();}", "else if(b.dataset.inspect){inspectCard(b.dataset.inspect);}");
replace("if(modal)modal=null;else if(selected)", "if(modal)modal=modalHistory.pop()||null;else if(selected)");
replace('<p>A partida continua disponível em “Retomar última partida”.</p>', '<p>A partida continua disponível em “Retomar última partida”.</p>${room?.encounter?\'<button class="menu-option" data-return-realms>VOLTAR AO MAPA · MANTER AVENTURA</button>\':\'\'}<button class="menu-option" data-concede>ABANDONAR · SEM RECOMPENSAS, COM DESGASTE</button>');
replace("if(e.target.id!=='join-form')return;", "if(e.target.id==='realm-house-form'){e.preventDefault();const name=new FormData(e.target).get('houseName');await doRealmAction('found',{name});return;}if(e.target.id!=='join-form')return;");
replace("if(token){try{profile=await api('/profile');}",`app.addEventListener('input',e=>{if(e.target.hasAttribute('data-card-search')){cardSearch=e.target.value;const cursor=e.target.selectionStart;render();const input=document.querySelector('[data-card-search]');input?.focus();input?.setSelectionRange(cursor,cursor);}});
setInterval(async()=>{if(!worldOpen||room||busy||modal||realmPolling||document.activeElement?.tagName==='INPUT')return;realmPolling=true;try{const next=await api('/realms');const changed=next.version!==realmData?.version||next.player.version!==realmData?.player.version||JSON.stringify(next.online.map(p=>[p.id,p.location,p.busy]))!==JSON.stringify(realmData?.online.map(p=>[p.id,p.location,p.busy]));realmData=next;profile=next.profile;if(changed)render();}catch{}finally{realmPolling=false;}},5000);
if(token){try{profile=await api('/profile');}`);
// Strictly keep the arena's layout and scenic background; only reward navigation is extended.
replace("const win=room.winner===room.seat,reward=room.rewards||{},", "const win=room.winner===room.seat,reward=room.rewards||{},");
replace('<div class="result-panel ${win?\'victory\':\'\'}">', '<div class="result-panel ${win?\'victory\':\'\'}">${room.encounter?`<p class="realm-result">${esc(reward.realm?.message||\'Votre aventure est sauvegardée.\')} ${reward.realm?.xp?`+${reward.realm.xp} XP D’EXPLORATION`:\'\'}</p><button class="gold-button" data-return-realms>CONTINUER L’AVENTURE ↗</button>`:\'\'}');
s=s.replace('Votre aventure est sauvegardée.','Sua aventura foi salva.').replace('XP D’EXPLORATION','XP DE EXPLORAÇÃO').replace('CONTINUER L’AVENTURE','CONTINUAR A AVENTURA');
fs.writeFileSync(file,s);
const html='client/index.html';let h=fs.readFileSync(html,'utf8');h=h.replace('</head>','<link rel="stylesheet" href="/realms.css"><link rel="stylesheet" href="/presentation.css"></head>');fs.writeFileSync(html,h);
console.log('Client integrated.');
