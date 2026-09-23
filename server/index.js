import http from 'node:http';
import { randomBytes, randomUUID, randomInt } from 'node:crypto';
import { readFile, mkdir, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectMongoStore } from './mongo-store.js';
import { createGame, replaceOpeningDeck, applyAction, botAction, publicView, RuleError } from '../shared/engine.js';
import { CARDS, DECKS } from '../shared/cards.js';
import { ECONOMY, CONTRACTS, grantStarter, validateDeck, countCards, cardLimit, makeItem } from '../shared/progression.js';
import { createWorld, enterRealms, realmView, realmAction, prepareEncounter, settleEncounter, REGIONS } from '../shared/realms.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rooms = new Map();
const profiles = new Map();
const itemLocks = new Map();
const dataDir=process.env.DATA_DIR || path.join(root,'data');
const profileFile = path.join(dataDir, 'state.json');
let world=createWorld();
if(process.env.NODE_ENV==='production'&&!process.env.MONGO_URI)throw new Error('MONGO_URI é obrigatória em produção; configure o segredo no provedor de hospedagem.');
const mongoStore=process.env.MONGO_URI?await connectMongoStore():null;
if(mongoStore){
  const saved=await mongoStore.load();
  for(const p of saved.profiles)profiles.set(p.id,p);
  for(const r of saved.rooms)rooms.set(r.id,r);
  world=saved.world||world;
}else{
  try {
    const saved=JSON.parse(await readFile(profileFile,'utf8'));
    for(const p of saved.profiles)profiles.set(p.id,p);
    for(const r of saved.rooms||[])rooms.set(r.id,r);
    world=saved.world||world;
  }catch(e){if(e.code!=='ENOENT')throw e;try{for(const p of JSON.parse(await readFile(path.join(dataDir,'profiles.json'),'utf8')))profiles.set(p.id,p);}catch(legacy){if(legacy.code!=='ENOENT')throw legacy;}}
}
for(const r of rooms.values())if(r.game.phase!=='finished')for(const ids of r.lockedItems||[])for(const id of ids)itemLocks.set(id,r.id);
let saving = Promise.resolve();
function persist() {
  saving = saving.catch(() => {}).then(async () => {
    if(mongoStore){
      await mongoStore.save({profiles:[...profiles.values()],rooms:[...rooms.values()],world});
      return;
    }
    const snapshot = JSON.stringify({schema:2,profiles:[...profiles.values()],rooms:[...rooms.values()],world}, null, 2);
    await mkdir(path.dirname(profileFile), { recursive: true });
    await writeFile(`${profileFile}.tmp`, snapshot);
    await rename(`${profileFile}.tmp`,profileFile);
  });
  return saving;
}
if(mongoStore)await persist();
function json(res, status, data) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(data)); }
async function body(req) {
  let data = '';
  for await (const chunk of req) { data += chunk; if (Buffer.byteLength(data) > 8192) throw new RuleError('Requisição grande demais.'); }
  try { return JSON.parse(data || '{}'); } catch { throw new RuleError('JSON inválido.'); }
}
function identity(req) { return profiles.get(req.headers.authorization?.replace(/^Bearer /, '')); }
function view(room, id) {
  const seat=room.seats.indexOf(id),reward=room.rewards?.[seat];
  return { roomId: room.id, mode: room.mode, encounter:room.encounter||null, battlefield:room.battlefield||'court-board', riskMode:room.riskMode||'covenant', rewards:reward?{...reward,items:reward.items?.length||0}: {}, waiting: room.seats.length < 2, ...publicView(room.game, seat) };
}
async function prepareProfile(profile,faction='vampire') {
  let changed=grantStarter(profile,faction,randomUUID);
  const now=Date.now();for(const item of profile.items||[])if(item.listingId&&item.listedAt+ECONOMY.marketListingHours*3600000<=now){item.listingId=null;item.price=null;item.listedAt=null;changed=true;}
  if(changed)await persist();
  return profile;
}
function activeDeck(profile,faction) {
  const id=profile.activeDecks?.[faction],deck=profile.decks?.find(d=>d.id===id&&d.faction===faction);
  return deck||null;
}
function validateOwnedDeck(cards,faction,profile) {
  try{return validateDeck(cards,faction,profile.collection,profile.items);}catch(e){throw new RuleError(e.message);}
}
function reserveDeck(profile,cards,roomId) {
  const reserved=[];
  try{
    const refs=cards.map(cardId=>{
      if(CARDS[cardId].type!=='equipment')return cardId;
      const item=profile.items.find(i=>i.cardId===cardId&&i.durability>0&&!i.listingId&&!itemLocks.has(i.id));
      if(!item)throw new RuleError(`Não há item disponível de ${CARDS[cardId].name}. Cancele um anúncio ou repare um item.`);
      itemLocks.set(item.id,roomId);reserved.push(item.id);
      return {cardId,itemId:item.id,itemBound:!!item.bound};
    });
    return {cards:refs,itemIds:reserved};
  }catch(e){for(const id of reserved)itemLocks.delete(id);throw e;}
}
function unlockRoom(room) { for(const ids of room.lockedItems||[])for(const id of ids)itemLocks.delete(id); }
function pruneRooms(now=Date.now()) {
  for(const [id,room] of rooms){
    const age=now-room.createdAt,expired=room.game.phase==='finished'?age>24*60*60*1000:room.seats.length<2?age>30*60*1000:age>12*60*60*1000;
    if(expired){unlockRoom(room);for(const profile of profiles.values())if(profile.realm?.activeRoom===id){profile.realm.activeRoom=null;profile.realm.expedition=null;profile.realm.version++;}rooms.delete(id);}
  }
}
function gearFor(profile,id) { return profile?.items?.find(i=>i.id===id); }
function breakItem(profile,item) {
  profile.items=profile.items.filter(i=>i.id!==item.id);
  const scrap=ECONOMY.breakScrap[item.rarity]||4;
  profile.scrap=(profile.scrap||0)+scrap;
  return scrap;
}
function recordItemBreak(room,seat,cardId,scrap) {
  room.game.events.push({id:room.game.nextEvent++,type:'item-break',seat,target:'hero',amount:scrap,label:`${CARDS[cardId].name} · QUEBRADO · +${scrap} SUCATA`});
}
function wearItem(room,ownerSeat,itemId,wear=1,killerSeat=null) {
  const ownerId=room.seats[ownerSeat],owner=profiles.get(ownerId),item=gearFor(owner,itemId);if(!owner||!item)return null;
  if(killerSeat!==null){
    const killer=profiles.get(room.seats[killerSeat]);
    if(killer&&killer.id!==owner.id&&!item.bound){
      owner.items=owner.items.filter(i=>i.id!==item.id);item.durability-=wear;
      if(item.durability<=0){const scrap=ECONOMY.breakScrap[item.rarity]||4;owner.scrap=(owner.scrap||0)+scrap;return {broken:true,scrap};}
      killer.items.push({...item,listingId:null,price:null,listedAt:null,source:'spoils'});return {transferred:true};
    }
  }
  item.durability-=wear;
  if(item.durability<=0){const scrap=breakItem(owner,item);return {broken:true,scrap};}
  return {worn:true};
}
function settleGear(room) {
  const handled=new Set();
  for(const event of [...(room.gearEvents||[]),...room.game.events.filter(e=>e.type==='item-lost'&&e.itemId)]){
    if(handled.has(event.itemId))continue;
    const result=wearItem(room,event.seat,event.itemId,event.wear,event.transfer?event.killerSeat:null);handled.add(event.itemId);
    if(result?.transferred)room.game.events.push({id:room.game.nextEvent++,type:'item-loot',seat:event.killerSeat,target:'hero',label:`${CARDS[event.cardId].name} · SAQUEADO`});
    else if(result?.broken)recordItemBreak(room,event.seat,event.cardId,result.scrap);
  }
  for(let seat=0;seat<room.seats.length;seat++){
    const p=room.game.players[seat];
    for(const unit of Object.values(p.lanes).flat())for(const gear of unit.gearItems||[]){const id=gear.itemId;if(!id||handled.has(id))continue;handled.add(id);const result=wearItem(room,seat,id,1,null);if(result?.broken)recordItemBreak(room,seat,gear.cardId,result.scrap);}
  }
  if(room.mode==='duel'&&room.riskMode==='blood-oath'&&room.game.winner>=0){
    const loser=1-room.game.winner,lp=profiles.get(room.seats[loser]),winner=profiles.get(room.seats[room.game.winner]);
    const heroItem=room.game.players[loser].heroGear?.find(i=>i.itemId&&!handled.has(i.itemId));
    if(heroItem&&lp&&winner){const result=wearItem(room,loser,heroItem.itemId,1,room.game.winner);handled.add(heroItem.itemId);if(result?.transferred)room.game.events.push({id:room.game.nextEvent++,type:'item-loot',seat:room.game.winner,target:'hero',label:`${CARDS[heroItem.cardId].name} · SAQUEADO`});else if(result?.broken)recordItemBreak(room,loser,heroItem.cardId,result.scrap);}
  }
  for(let seat=0;seat<room.seats.length;seat++)for(const gear of room.game.players[seat].heroGear||[])if(gear.itemId&&!handled.has(gear.itemId)){handled.add(gear.itemId);const result=wearItem(room,seat,gear.itemId,1,null);if(result?.broken)recordItemBreak(room,seat,gear.cardId,result.scrap);}
  unlockRoom(room);
}
async function reward(room) {
  if (room.game.phase !== 'finished' || room.rewarded) return;
  room.rewarded = true;
  settleGear(room);
  room.seats.forEach((id, seat) => {
    const p = profiles.get(id); if (!p) return;
    const won=room.game.winner===seat,player=room.game.players[seat],oldLevel=p.level||1;
    const broken=room.game.events.filter(e=>e.type==='item-break'&&e.seat===seat),looted=room.game.events.filter(e=>e.type==='item-loot'&&e.seat===seat);
    room.rewards||={};room.rewards[seat]={xp:0,coins:0,dust:0,scrap:0,items:[],broken:broken.map(e=>e.label),looted:looted.map(e=>e.label)};
    if(room.encounter&&seat===0){const expedition=settleEncounter(world,p,room.encounter,won,player.conceded);room.rewards[seat].realm=expedition;if(expedition.loot){const pool=Object.values(CARDS).filter(c=>c.type==='equipment'&&c.rarity===(room.encounter.stages===3?'rare':'common')),card=pool[randomInt(pool.length)],item=makeItem(card.id,randomUUID,'realm');p.items.push(item);room.rewards[seat].items.push(item.id);}}
    if(player.conceded)return;
    p.matches++;if(won)p.wins++;
    p.xp += won ? 100 : 50;p.level = 1 + Math.floor(p.xp / 300);
    const coins=room.mode==='duel'?(won?ECONOMY.rewards.duelWin:ECONOMY.rewards.duelLoss):room.mode==='dungeon'?(won?ECONOMY.rewards.dungeonWin:ECONOMY.rewards.dungeonLoss):(won?ECONOMY.rewards.practiceWin:ECONOMY.rewards.practiceLoss);
    const levelCoins=(p.level-oldLevel)*ECONOMY.rewards.levelCoins;
    p.coins=(p.coins||0)+coins+levelCoins;
    const levelDust=(p.level-oldLevel)*ECONOMY.rewards.levelDust;
    p.dust=(p.dust||0)+levelDust;
    const scrap=room.mode==='duel'?(won?3:1):room.mode==='dungeon'?(won?5:2):(won?2:1);p.scrap=(p.scrap||0)+scrap;
    room.rewards[seat]={...room.rewards[seat],xp:won?100:50,coins:coins+levelCoins+(room.rewards[seat].realm?.coins||0),dust:levelDust,scrap:scrap+broken.reduce((n,e)=>n+(e.amount||0),0),broken:broken.map(e=>e.label),looted:looted.map(e=>e.label)};
    if(room.mode==='dungeon'&&won){
      const roll=randomInt(100),rarity=roll<5?'epic':roll<24?'rare':roll<58?'uncommon':'common',pool=Object.values(CARDS).filter(c=>c.type==='equipment'&&c.rarity===rarity),card=pool[randomInt(pool.length)];
      if(card){const item=makeItem(card.id,randomUUID,'dungeon');p.items.push(item);room.rewards[seat].items.push(item.id);}
    }
    p.contracts||={matches:0,kills:0,wins:0};p.contracts.matches=(p.contracts.matches||0)+1;p.contracts.kills=(p.contracts.kills||0)+(player.kills||0);if(won)p.contracts.wins=(p.contracts.wins||0)+1;
    for(const contract of CONTRACTS){while(p.contracts[contract.id]>=contract.goal){p.contracts[contract.id]-=contract.goal;const bonusCoins=contract.reward.coins||0,bonusDust=contract.reward.dust||0;p.coins+=bonusCoins;p.dust+=bonusDust;room.rewards[seat].coins+=bonusCoins;room.rewards[seat].dust+=bonusDust;}}
    p.trophies ||= [];
    if(room.mode === 'dungeon' && won && !p.trophies.includes('crown-of-the-buried')) p.trophies.push('crown-of-the-buried');
  });
  await persist();
}
function runBot(room) {
  let actions = 0;
  while (room.mode !== 'duel' && room.game.phase === 'playing' && room.game.turn === 1) {
    if (++actions > 100) throw new Error('Limite de ações do rival excedido.');
    room.game = applyAction(room.game, 1, botAction(room.game));
  }
}
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.png':'image/png', '.webp':'image/webp' };
let requestQueue=Promise.resolve();
const server = http.createServer(async (req,res) => {
  let release;
  if(req.url.startsWith('/api/')){const previous=requestQueue;requestQueue=new Promise(resolve=>{release=resolve;});await previous;}
  try {
      const url = new URL(req.url, 'http://localhost');
      pruneRooms();
    if (req.method === 'GET' && url.pathname === '/api/health') return json(res,200,{ ok: true, version: '0.4.0', edition:'edition-one', storage:mongoStore?'mongodb-atlas':'local-file' });
    if (req.method === 'POST' && url.pathname === '/api/profile') {
      const input = await body(req);
      const name = typeof input.name === 'string' ? input.name.trim().slice(0,24) : 'Viajante';
      const profile = { id: randomUUID(), name: name || 'Viajante', xp: 0, level: 1, wins: 0, matches: 0, trophies:[] };
      grantStarter(profile,input.faction==='werewolf'?'werewolf':'vampire',randomUUID);
      profiles.set(profile.id,profile); await persist(); return json(res,201,profile);
    }
    if (url.pathname.startsWith('/api/')) {
      const profile = identity(req);
      if (!profile) return json(res,401,{ error: 'Crie um perfil local para entrar.' });
      await prepareProfile(profile,profile.starterFaction||'vampire');
      if(url.pathname==='/api/realms'&&req.method==='GET'){
        if(enterRealms(profile,randomUUID))await persist();
        return json(res,200,realmView(world,profile,profiles));
      }
      if(url.pathname==='/api/realms/actions'&&req.method==='POST'){
        const input=await body(req);enterRealms(profile,randomUUID);realmAction(world,profile,input,randomUUID);await persist();return json(res,200,realmView(world,profile,profiles));
      }
      if(url.pathname==='/api/realms/encounter'&&req.method==='POST'){
        const input=await body(req);enterRealms(profile,randomUUID);
        if(input.version!==profile.realm.version)throw new RuleError('Seu mapa mudou. Atualize e tente novamente.');
        const encounter=prepareEncounter(world,profile),faction=profile.starterFaction,deck=activeDeck(profile,faction);
        if(!deck)throw new RuleError('Equipe um deck válido da sua linhagem no Arsenal.');
        validateOwnedDeck(deck.cards,faction,profile);
        const id=randomBytes(5).toString('hex').toUpperCase(),reserved=reserveDeck(profile,deck.cards,id);
        const boss=encounter.stages===3&&encounter.stage===2;
        const game=createGame(faction,Math.random,boss?'dungeon':'practice',{[faction]:reserved.cards});
        game.players[1].health=game.players[1].maxHealth=boss?36:22+encounter.difficulty*2+encounter.stage*2;
        const room={id,mode:'realm',encounter,battlefield:encounter.board,riskMode:'covenant',game,seats:[profile.id,'bot'],rewarded:false,createdAt:Date.now(),lockedItems:[reserved.itemIds],gearEvents:[]};
        rooms.set(id,room);profile.realm.activeRoom=id;profile.realm.provisions-=2;profile.realm.version++;await persist();return json(res,201,view(room,profile.id));
      }
      if (req.method === 'GET' && url.pathname === '/api/profile') return json(res,200,profile);
      if (req.method === 'POST' && url.pathname === '/api/boosters/open') {
        if(profile.coins<ECONOMY.boosterCost)throw new RuleError('Marcas insuficientes. Conclua caçadas ou contratos para ganhar mais.');
        profile.coins-=ECONOMY.boosterCost;
        const pulls=[],slots=[...ECONOMY.boosterSlots];slots.splice(2,0,...Array(ECONOMY.boosterGearPerPack).fill('gear'));
        for(const slot of slots){
          let rarity=slot;
          if(slot==='gear'){
            const roll=randomInt(100);let edge=0;rarity=Object.entries(ECONOMY.boosterGearRarityOdds).find(([,weight])=>(edge+=weight,roll<edge))?.[0]||'common';
          }else if(slot==='premium'){const roll=randomInt(100);rarity=roll<ECONOMY.premiumOdds.rare?'rare':roll<ECONOMY.premiumOdds.rare+ECONOMY.premiumOdds.epic?'epic':'legendary';}
          let pool=Object.values(CARDS).filter(c=>slot==='gear'?c.type==='equipment'&&c.rarity===rarity:c.type!=='equipment'&&c.rarity===rarity);
          if(!pool.length)pool=Object.values(CARDS).filter(c=>c.rarity==='common');
          const card=pool[randomInt(pool.length)];
          if(card.type==='equipment'){const item=makeItem(card.id,randomUUID,'booster');profile.items.push(item);pulls.push({id:card.id,rarity:card.rarity,duplicate:false,item:true});}
          else{const owned=profile.collection[card.id]||0,limit=cardLimit(card);if(owned<limit)profile.collection[card.id]=owned+1;else profile.dust+=ECONOMY.duplicateDust[card.rarity]||0;pulls.push({id:card.id,rarity:card.rarity,duplicate:owned>=limit});}
        }
        await persist();return json(res,200,{profile,pulls,set:'Crônicas de Véspera'});
      }
      if (req.method === 'POST' && url.pathname === '/api/cards/craft') {
        const input=await body(req),card=CARDS[input.cardId],amount=Number(input.amount||1);
        if(!card||!Number.isInteger(amount)||amount<1||amount>2)throw new RuleError('Pedido de criação inválido.');
        if(card.type==='equipment'){
          const unitCost=ECONOMY.craftGear[card.rarity];if(!unitCost)throw new RuleError('Este equipamento não pode ser criado.');
          const cost={coins:unitCost.coins*amount,scrap:unitCost.scrap*amount};if(profile.coins<cost.coins||profile.scrap<cost.scrap)throw new RuleError(`Criar ${amount} × ${card.name} custa ${cost.coins} Marcas e ${cost.scrap} Sucata.`);
          profile.coins-=cost.coins;profile.scrap-=cost.scrap;const items=[];for(let i=0;i<amount;i++){const item=makeItem(card.id,randomUUID,'crafted');profile.items.push(item);items.push(item);}
          await persist();return json(res,200,{profile,crafted:{id:card.id,amount,items,cost}});
        }
        const cost=ECONOMY.craftDust[card.rarity]*amount,owned=profile.collection[card.id]||0;
        if(owned+amount>cardLimit(card))throw new RuleError(`Limite de ${cardLimit(card)} cópia(s) desta carta.`);
        if(profile.dust<cost)throw new RuleError(`São necessários ${cost} fragmentos para criar esta carta.`);
        profile.dust-=cost;profile.collection[card.id]=owned+amount;await persist();return json(res,200,{profile,crafted:{id:card.id,amount,cost}});
      }
      if (req.method === 'POST' && url.pathname === '/api/decks') {
        const input=await body(req);validateOwnedDeck(input.cards,input.faction,profile);
        const deck={id:randomUUID(),name:String(input.name||'Meu deck').trim().slice(0,28)||'Meu deck',faction:input.faction,cards:[...input.cards],starter:false};
        profile.decks.push(deck);await persist();return json(res,201,{profile,deck});
      }
      const deckRoute=url.pathname.match(/^\/api\/decks\/([\da-f-]+)(?:\/(activate))?$/i);
      if(deckRoute){
        const deck=profile.decks.find(d=>d.id===deckRoute[1]);if(!deck)throw new RuleError('Deck não encontrado.');
        if(req.method==='POST'&&deckRoute[2]==='activate'){validateOwnedDeck(deck.cards,deck.faction,profile);profile.activeDecks[deck.faction]=deck.id;await persist();return json(res,200,{profile,deck});}
        if(req.method==='PUT'&&!deckRoute[2]){const input=await body(req);validateOwnedDeck(input.cards,deck.faction,profile);deck.cards=[...input.cards];if(input.name)deck.name=String(input.name).trim().slice(0,28);await persist();return json(res,200,{profile,deck});}
      }
      if(req.method==='POST'&&url.pathname==='/api/items/repair'){
        const input=await body(req),item=gearFor(profile,input.itemId);if(!item||item.listingId||itemLocks.has(item.id))throw new RuleError('Este item não pode ser reparado agora.');
        const missing=item.maxDurability-item.durability,cost=(ECONOMY.repairCost[item.rarity]||12)*missing;if(missing<=0)throw new RuleError('Este equipamento já está íntegro.');
        if(profile.coins<cost)throw new RuleError(`O reparo custa ${cost} Marcas.`);profile.coins-=cost;item.durability=item.maxDurability;await persist();return json(res,200,{profile,repaired:item.id,cost});
      }
      if(req.method==='GET'&&url.pathname==='/api/market'){
        const now=Date.now(),offers=[];
        for(const seller of profiles.values())for(const item of seller.items||[])if(item.listingId&&item.listedAt+ECONOMY.marketListingHours*3600000>now)offers.push({listingId:item.listingId,cardId:item.cardId,rarity:item.rarity,durability:item.durability,maxDurability:item.maxDurability,price:item.price,mine:seller.id===profile.id,sellerName:seller.name,listedAt:item.listedAt});
        return json(res,200,{offers:offers.sort((a,b)=>a.price-b.price),profile,inventory:(profile.items||[]).map(item=>({...item,locked:itemLocks.has(item.id)}))});
      }
      if(req.method==='POST'&&url.pathname==='/api/market/list'){
        const input=await body(req),item=gearFor(profile,input.itemId),price=Number(input.price);
        if(!item||item.bound||item.listingId||itemLocks.has(item.id))throw new RuleError('Este item está vinculado, reservado ou já anunciado.');
        if(!Number.isInteger(price)||price<ECONOMY.marketMinPrice||price>ECONOMY.marketMaxPrice)throw new RuleError(`O preço precisa ficar entre ${ECONOMY.marketMinPrice} e ${ECONOMY.marketMaxPrice} Marcas.`);
        const fee=Math.max(1,Math.floor(price*ECONOMY.marketListingFeePercent/100));if(profile.coins<fee)throw new RuleError(`A taxa de anúncio é ${fee} Marcas.`);
        profile.coins-=fee;item.listingId=randomUUID();item.price=price;item.listedAt=Date.now();await persist();return json(res,201,{profile,item,fee});
      }
      const marketAction=url.pathname.match(/^\/api\/market\/([\da-f-]+)\/(buy|cancel)$/i);
      if(marketAction){
        const listingId=marketAction[1],action=marketAction[2];let seller,item;
        for(const candidate of profiles.values()){const found=(candidate.items||[]).find(i=>i.listingId===listingId);if(found){seller=candidate;item=found;break;}}
        if(!seller||!item)throw new RuleError('Anúncio não encontrado.');
        if(action==='cancel'&&req.method==='POST'){
          if(seller.id!==profile.id)throw new RuleError('Só o vendedor pode retirar este anúncio.');item.listingId=null;item.price=null;item.listedAt=null;await persist();return json(res,200,{profile,item});
        }
        if(action==='buy'&&req.method==='POST'){
          if(seller.id===profile.id)throw new RuleError('Você não pode comprar seu próprio anúncio.');if(item.listedAt+ECONOMY.marketListingHours*3600000<=Date.now())throw new RuleError('Este anúncio expirou.');
          if(profile.coins<item.price)throw new RuleError('Marcas insuficientes para esta compra.');
          const price=item.price,tax=Math.floor(price*ECONOMY.marketTaxPercent/100);profile.coins-=price;seller.coins=(seller.coins||0)+price-tax;seller.items=seller.items.filter(i=>i.id!==item.id);profile.items.push({...item,listingId:null,price:null,listedAt:null});
            await persist();return json(res,200,{profile,item:{...item,listingId:null,price:null,listedAt:null},tax});
        }
      }
      if (req.method === 'POST' && url.pathname === '/api/rooms') {
        const input = await body(req);
        if (!['practice','duel','dungeon'].includes(input.mode)) throw new RuleError('Modo inválido.');
        if (rooms.size >= 500) throw new RuleError('Limite de salas atingido. Reinicie o servidor de desenvolvimento.');
        const deck=profile.decks.find(d=>d.id===(input.deckId||profile.activeDecks[input.faction]));
        if(!deck)throw new RuleError('Equipe um deck válido dessa facção antes de iniciar.');
        validateOwnedDeck(deck.cards,input.faction,profile);
        if(deck&&deck.faction!==input.faction)throw new RuleError('Escolha um deck da facção selecionada.');
        const id=randomBytes(5).toString('hex').toUpperCase(),reserved=deck?reserveDeck(profile,deck.cards,id):{cards:null,itemIds:[]};
        const deckLists=deck?{[input.faction]:reserved.cards}:{};
        const game=createGame(input.faction,Math.random,input.mode,deckLists),riskMode=input.mode==='duel'&&input.riskMode==='blood-oath'?'blood-oath':'covenant';game.riskMode=riskMode;
        const room = { id, mode: input.mode, riskMode, battlefield:['court-board','forest-board','crypt-board','siege-board'].includes(input.battlefield)?input.battlefield:input.mode==='dungeon'?'crypt-board':input.faction==='werewolf'?'forest-board':'court-board', game, seats: [profile.id], rewarded: false, createdAt:Date.now(),lockedItems:[reserved.itemIds],gearEvents:[] };
        if (input.mode !== 'duel') room.seats.push('bot');
        rooms.set(room.id,room); await persist();return json(res,201,view(room,profile.id));
      }
      const match = url.pathname.match(/^\/api\/rooms\/([A-F0-9]{10})(?:\/(join|actions))?$/);
      if (match) {
        const room = rooms.get(match[1]);
        if (!room) return json(res,404,{ error: 'Sala não encontrada ou expirada.' });
        if (req.method === 'POST' && match[2] === 'join') {
          if (!room.seats.includes(profile.id)) {
            if (room.seats.length >= 2) throw new RuleError('Sala completa.');
            const input=await body(req);if(room.riskMode==='blood-oath'&&input.acceptRisk!==true)throw new RuleError('Este duelo tem Juramento de Sangue. Confirme o risco antes de entrar.');
            const seat=room.seats.length,faction=room.game.players[seat].faction,deck=activeDeck(profile,faction);
            if(!deck)throw new RuleError('Equipe um deck da facção adversária para entrar neste duelo.');
            validateOwnedDeck(deck.cards,faction,profile);
            const reserved=reserveDeck(profile,deck.cards,room.id);room.game=replaceOpeningDeck(room.game,seat,reserved.cards);room.lockedItems[seat]=reserved.itemIds;
            room.seats.push(profile.id);
            await persist();
          }
          return json(res,200,view(room,profile.id));
        }
        const seat = room.seats.indexOf(profile.id);
        if (seat < 0) return json(res,403,{ error: 'Você não participa desta sala.' });
        if (req.method === 'GET' && !match[2]) return json(res,200,view(room,profile.id));
        if (req.method === 'POST' && match[2] === 'actions') {
          const input = await body(req);
          if (room.seats.length < 2) throw new RuleError('Aguarde o segundo jogador.');
          if (input.version !== room.game.version) return json(res,409,{ error: 'O estado mudou. Atualize antes de jogar.' });
          const firstEvent=room.game.nextEvent;room.game = applyAction(room.game,seat,input.action); runBot(room);room.gearEvents.push(...room.game.events.filter(e=>e.id>=firstEvent&&e.type==='item-lost'));await reward(room);await persist();
          return json(res,200,view(room,profile.id));
        }
      }
      return json(res,404,{ error: 'Rota não encontrada.' });
    }
    if (req.method !== 'GET') return json(res,405,{ error: 'Método não permitido.' });
    const requested = url.pathname === '/' ? 'client/index.html' : url.pathname.startsWith('/shared/') ? url.pathname.slice(1) : `client/${url.pathname.slice(1)}`;
    const target = path.resolve(root,requested);
    const allowed = ['client','shared'].some(dir => target.startsWith(path.join(root,dir) + path.sep));
    if (!allowed || !mime[path.extname(target)]) return json(res,404,{ error: 'Arquivo não encontrado.' });
    try {
      const data = await readFile(target);
      res.writeHead(200,{ 'Content-Type': mime[path.extname(target)], 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'self'; style-src 'self'; style-src-attr 'unsafe-inline'; script-src 'self'; img-src 'self'; connect-src 'self'; frame-ancestors 'none'" }); res.end(data);
    } catch (e) { if (e.code !== 'ENOENT') throw e; json(res,404,{ error: 'Arquivo não encontrado.' }); }
  } catch (e) { if (!(e instanceof RuleError)) console.error(e); json(res,e instanceof RuleError ? 400 : 500,{ error: e instanceof RuleError ? e.message : 'Falha interna do servidor.' }); }
  finally { release?.(); }
});
const port=Number(process.env.PORT||4173);
const host=process.env.HOST||(process.env.NODE_ENV==='production'?'0.0.0.0':'127.0.0.1');
server.listen(port,host,() => console.log(`Bloodmoon em http://${host}:${server.address().port} · ${mongoStore?'MongoDB Atlas':'persistência local'}`));

for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>{
  server.close(async()=>{
    try{await saving;await mongoStore?.close();process.exit(0);}
    catch{process.exit(1);}
  });
});
