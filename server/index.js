import {gainRpg} from '../shared/realm-rpg.js';
import {realmStream,realmPulse,realmLivePulse,closeRealmStreams} from './realm-stream.js';
import {AVATAR_IDS,ORIGINS} from '../shared/battle-design.js';
import {applyDoctrine} from '../shared/expedition-doctrines.js';
import http from 'node:http';
import { createReadStream } from 'node:fs';
import { randomBytes, randomUUID, randomInt } from 'node:crypto';
import { readFile, stat, mkdir, writeFile, rename } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectMongoStore } from './mongo-store.js';
import { normalizeEmail, hashPassword, verifyPassword, newSession, sessionId, sessionCookie, allowAuthAttempt } from './auth.js';
import {MatchQueue} from './matchmaking.js';
import { createGame, replaceOpeningDeck, applyAction, botAction, publicView, RuleError } from '../shared/engine.js';
import { RIVALS, buildRivalDeck, practiceRival, campaignRival } from '../shared/rivals.js';
import { CARDS, DECKS } from '../shared/cards.js';
import { ECONOMY, CONTRACTS, grantStarter, grantSecondLineage, validateDeck, countCards, cardLimit, makeItem, applyDurabilityWear, deckCollection, reconcileDepletedGear, restoreReplacedGear, accountLevelForXP, xpThresholdForLevel } from '../shared/progression.js';
import {suggestLoadout,reserveSlots} from '../shared/loadout.js';
import {transferVault} from '../shared/vault.js';
import {featureOpen,featureRequirement,JOURNEY_LESSONS,lessonFeature} from '../shared/player-journey.js';
import {placeOrder,cancelOrder,fillOrder} from '../shared/purchase-orders.js';
import { createWorld, enterRealms, realmView, realmAction, prepareEncounter, settleEncounter, expirePolitics, REGIONS } from '../shared/realms.js';
import { ensureRealmWorld, ensureWorldPlayer, advanceRealmWorld, realmWorldView, realmWorldAction, prepareWorldEncounter, settleWorldEncounter, grantArenaAfterglow } from '../shared/realm-world.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const rooms = new Map();
const profiles = new Map();
const accounts=new Map(),sessions=new Map();
const matchQueue=new MatchQueue();
const itemLocks = new Map();
const worldChallenges = new Map();
const worldDirtyProfiles = new Set();
let worldDirty = false, worldLastSaved = Date.now(), worldDirtyVersion = 0, worldFlushPromise = null, worldSaveRetryAt = 0, worldSaveFailures = 0;
const dataDir=process.env.DATA_DIR || path.join(root,'data');
const profileFile = path.join(dataDir, 'state.json');
let world=createWorld();
let worldInitialized = false;
if(process.env.NODE_ENV==='production'&&!process.env.MONGO_URI)throw new Error('MONGO_URI é obrigatória em produção; configure o segredo no provedor de hospedagem.');
const mongoStore=process.env.MONGO_URI?await connectMongoStore():null;
if(mongoStore){
  const saved=await mongoStore.load();
  for(const a of saved.accounts||[])accounts.set(a.id,a);
  for(const s of saved.sessions||[])sessions.set(s.id,s);
  for(const p of saved.profiles)profiles.set(p.id,p);
  for(const r of saved.rooms)rooms.set(r.id,r);
  world=saved.world||world;
  worldInitialized=!!saved.world;
}else{
  try {
    const saved=JSON.parse(await readFile(profileFile,'utf8'));
    for(const a of saved.accounts||[])accounts.set(a.id,a);
    for(const s of saved.sessions||[])sessions.set(s.id,s);
    for(const p of saved.profiles)profiles.set(p.id,p);
    for(const r of saved.rooms||[])rooms.set(r.id,r);
    world=saved.world||world;
  }catch(e){if(e.code!=='ENOENT')throw e;try{for(const p of JSON.parse(await readFile(path.join(dataDir,'profiles.json'),'utf8')))profiles.set(p.id,p);}catch(legacy){if(legacy.code!=='ENOENT')throw legacy;}}
}
for(const r of rooms.values())if(r.game.phase!=='finished')for(const ids of r.lockedItems||[])for(const id of ids)itemLocks.set(id,r.id);
let saving = Promise.resolve();
function persist({ profiles: changedProfiles = [], rooms: changedRooms = [], deleteRooms = [], world: saveWorld = false, accounts:changedAccounts=[],sessions:changedSessions=[],deleteSessions=[] } = {}) {
  saving = saving.catch(() => {}).then(async () => {
    if(mongoStore){
      await mongoStore.save({profiles:changedProfiles,rooms:changedRooms,deleteRooms,world:saveWorld?(saveWorld===true?world:saveWorld):undefined,accounts:changedAccounts,sessions:changedSessions,deleteSessions});
      return;
    }
    const profileSnapshot=new Map([...profiles.values()].map(profile=>[profile.id,profile]));
    for(const profile of changedProfiles)profileSnapshot.set(profile.id,profile);
    const snapshot = JSON.stringify({schema:3,profiles:[...profileSnapshot.values()],rooms:[...rooms.values()],accounts:[...accounts.values()],sessions:[...sessions.values()],world:saveWorld&&saveWorld!==true?saveWorld:world}, null, 2);
    await mkdir(path.dirname(profileFile), { recursive: true });
    await writeFile(`${profileFile}.tmp`, snapshot);
    await rename(`${profileFile}.tmp`,profileFile);
  });
  return saving;
}
if(mongoStore&&!worldInitialized)await persist({world:true});
function json(res, status, data) { res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' }); res.end(JSON.stringify(data)); }
async function body(req) {
  let data = '';
  for await (const chunk of req) { data += chunk; if (Buffer.byteLength(data) > 8192) throw new RuleError('Requisição grande demais.'); }
  try { return JSON.parse(data || '{}'); } catch { throw new RuleError('JSON inválido.'); }
}
function identity(req) {
  const session=sessions.get(sessionId(req));
  if(session&&session.expiresAt>Date.now()){const account=accounts.get(session.accountId);if(account)return profiles.get(account.profileId);}
  const legacy=profiles.get(req.headers.authorization?.replace(/^Bearer /, ''));
  return legacy&&!legacy.accountId?legacy:undefined;
}
function view(room, id) {
  const seat=room.seats.indexOf(id),reward=room.rewards?.[seat];
  const lootCards=(reward?.items||[]).map(itemId=>profiles.get(id)?.items?.find(i=>i.id===itemId)).filter(Boolean).map(({cardId,rarity,durability,maxDurability,source})=>({cardId,rarity,durability,maxDurability,source}));
  return { roomId: room.id, mode: room.mode, encounter:room.encounter||room.worldEncounter||null, opponent:room.opponent||null, battlefield:room.battlefield||'court-board', riskMode:room.riskMode||'covenant', rewards:reward?{...reward,items:reward.items?.length||0,lootCards}: {}, waiting: room.seats.length < 2, ...publicView(room.game, seat) };
}
async function prepareProfile(profile,faction='vampire') {
  let changed=grantStarter(profile,faction,randomUUID);
  if(grantSecondLineage(profile,randomUUID))changed=true;
  if(reconcileDepletedGear(profile))changed=true;
  if((profile.level||1)>10&&profile.xp<xpThresholdForLevel(profile.level)){profile.xp=xpThresholdForLevel(profile.level);changed=true;}
  const now=Date.now();for(const item of profile.items||[])if(item.listingId&&item.listedAt+ECONOMY.marketListingHours*3600000<=now){item.listingId=null;item.price=null;item.listedAt=null;changed=true;}
  if(changed)await persist({profiles:[profile]});
  return profile;
}
function activeDeck(profile,faction) {
  const id=profile.activeDecks?.[faction],deck=profile.decks?.find(d=>d.id===id&&d.faction===faction);
  return deck||null;
}
function activeRoomFor(id){return [...rooms.values()].find(r=>r.game.phase==='playing'&&r.seats.includes(id));}
function requireFreePlayer(id){if(activeRoomFor(id))throw new RuleError('Retome ou conclua sua partida em andamento antes de iniciar outra.');}
function validateOwnedDeck(cards,faction,profile,autoRefills=[]) {
  try{return validateDeck(cards,faction,deckCollection(profile.collection,autoRefills),profile.items);}catch(e){throw new RuleError(e.message);}
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
function readinessFor(profile,faction) {
  const deck=activeDeck(profile,faction),items=profile.items||[],inventory={
    total:items.length,
    available:items.filter(item=>item.durability>0&&!item.listingId&&!itemLocks.has(item.id)).length,
    damaged:items.filter(item=>item.durability<=0).length,
    listed:items.filter(item=>!!item.listingId).length,
    reserved:items.filter(item=>item.durability>0&&!item.listingId&&itemLocks.has(item.id)).length
  };
  let deckError=null;
  if(!deck)deckError='Nenhum deck ativo desta linhagem. Escolha ou monte um deck no Arsenal.';
  else try{validateOwnedDeck(deck.cards,faction,profile,deck.autoRefills);}catch(error){deckError=error.message;}
  const equipment=[];
  if(deck)for(const [cardId,required] of Object.entries(countCards(deck.cards)).filter(([id])=>CARDS[id]?.type==='equipment')){
    const owned=items.filter(item=>item.cardId===cardId),available=owned.filter(item=>item.durability>0&&!item.listingId&&!itemLocks.has(item.id)).length;
    equipment.push({cardId,name:CARDS[cardId].name,required,available,damaged:owned.filter(item=>item.durability<=0).length,listed:owned.filter(item=>!!item.listingId).length,reserved:owned.filter(item=>item.durability>0&&!item.listingId&&itemLocks.has(item.id)).length});
  }
  const missing=equipment.filter(item=>item.available<item.required);
  const active=activeRoomFor(profile.id);
  if(active)deckError='Você tem uma partida em andamento. Retome a mesa antes de iniciar outra; não é necessário repor equipamentos.';
  return {faction,activeRoom:active?{id:active.id,mode:active.mode,round:active.game.round}:null,canStart:!active&&!!deck&&!deckError&&!missing.length,deck:deck?{id:deck.id,name:deck.name,cards:deck.cards.length,autoRefills:deck.autoRefills||[]}:null,deckError,missing,equipment,inventory,rules:{deckSize:20,maxEquipment:6}};
}
function pruneRooms(now=Date.now()) {
  const deleteRooms=[],expiredIds=new Set();
  for(const [id,room] of rooms){
    const age=now-room.createdAt,expired=room.game.phase==='finished'?age>24*60*60*1000:room.seats.length<2?age>30*60*1000:age>12*60*60*1000;
    if(expired){unlockRoom(room);rooms.delete(id);deleteRooms.push(id);expiredIds.add(id);}
  }
  const changedProfiles=[];
  if(expiredIds.size)for(const profile of profiles.values())if(expiredIds.has(profile.realm?.activeRoom)){profile.realm.activeRoom=null;profile.realm.expedition=null;profile.realm.version++;changedProfiles.push(profile);}
  return {profiles:changedProfiles,deleteRooms};
}

const maintenanceTimer=setInterval(async()=>{
  try{
    matchQueue.prune();const expiredSessions=[];for(const [id,session]of sessions)if(session.expiresAt<Date.now()){sessions.delete(id);expiredSessions.push(id);}if(expiredSessions.length)await persist({deleteSessions:expiredSessions});
    const pruned=pruneRooms();
    const worldChanged=expirePolitics(world);
    if(pruned.profiles.length||pruned.deleteRooms.length||worldChanged)await persist({...pruned,world:worldChanged});
  }catch(error){console.error('Falha na manutenção periódica do jogo.',error);}
},60000);
maintenanceTimer.unref();
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
  const wearResult=applyDurabilityWear(item.durability,wear,randomInt(100)/100);
  if(killerSeat!==null){
    const killer=profiles.get(room.seats[killerSeat]);
    if(killer&&killer.id!==owner.id&&!item.bound){
      owner.items=owner.items.filter(i=>i.id!==item.id);
      if(wearResult.broken){const scrap=ECONOMY.breakScrap[item.rarity]||4;owner.scrap=(owner.scrap||0)+scrap;return {broken:true,scrap};}
      item.durability=wearResult.durability;killer.items.push({...item,listingId:null,price:null,listedAt:null,source:'spoils'});return {transferred:true,exhausted:wearResult.exhausted};
    }
  }
  item.durability=wearResult.durability;
  if(wearResult.broken){const scrap=breakItem(owner,item);return {broken:true,scrap};}
  return {worn:true,exhausted:wearResult.exhausted};
}
function settleGear(room) {
  const handled=new Set(),outcomes=room.seats.map(()=>({wornOut:[],substitutions:[]}));
  const noteWear=(seat,cardId,result)=>{if(result?.exhausted)outcomes[seat]?.wornOut.push(CARDS[cardId]?.name||cardId);};
  for(const event of [...(room.gearEvents||[]),...room.game.events.filter(e=>e.type==='item-lost'&&e.itemId)]){
    if(handled.has(event.itemId))continue;
    const result=wearItem(room,event.seat,event.itemId,event.wear,event.transfer?event.killerSeat:null);handled.add(event.itemId);
    noteWear(event.seat,event.cardId,result);
    if(result?.transferred)room.game.events.push({id:room.game.nextEvent++,type:'item-loot',seat:event.killerSeat,target:'hero',label:`${CARDS[event.cardId].name} · SAQUEADO`});
    else if(result?.broken)recordItemBreak(room,event.seat,event.cardId,result.scrap);
  }
  for(let seat=0;seat<room.seats.length;seat++){
    const p=room.game.players[seat];
    for(const unit of Object.values(p.lanes).flat())for(const gear of unit.gearItems||[]){const id=gear.itemId;if(!id||handled.has(id))continue;handled.add(id);const result=wearItem(room,seat,id,1,null);noteWear(seat,gear.cardId,result);if(result?.broken)recordItemBreak(room,seat,gear.cardId,result.scrap);}
  }
  if(room.mode==='duel'&&room.riskMode==='blood-oath'&&room.game.winner>=0){
    const loser=1-room.game.winner,lp=profiles.get(room.seats[loser]),winner=profiles.get(room.seats[room.game.winner]);
    const heroItem=room.game.players[loser].heroGear?.find(i=>i.itemId&&!handled.has(i.itemId));
    if(heroItem&&lp&&winner){const result=wearItem(room,loser,heroItem.itemId,1,room.game.winner);handled.add(heroItem.itemId);noteWear(loser,heroItem.cardId,result);if(result?.transferred)room.game.events.push({id:room.game.nextEvent++,type:'item-loot',seat:room.game.winner,target:'hero',label:`${CARDS[heroItem.cardId].name} · SAQUEADO`});else if(result?.broken)recordItemBreak(room,loser,heroItem.cardId,result.scrap);}
  }
  for(let seat=0;seat<room.seats.length;seat++)for(const gear of room.game.players[seat].heroGear||[])if(gear.itemId&&!handled.has(gear.itemId)){handled.add(gear.itemId);const result=wearItem(room,seat,gear.itemId,1,null);noteWear(seat,gear.cardId,result);if(result?.broken)recordItemBreak(room,seat,gear.cardId,result.scrap);}
  unlockRoom(room);
  for(let seat=0;seat<room.seats.length;seat++){
    const profile=profiles.get(room.seats[seat]);if(!profile)continue;
    const before=new Set((profile.decks||[]).flatMap(deck=>(deck.autoRefills||[]).map(refill=>`${deck.id}:${refill.equipmentId}:${refill.replacementId}`)));
    reconcileDepletedGear(profile);
    for(const deck of profile.decks||[])for(const refill of deck.autoRefills||[]){const key=`${deck.id}:${refill.equipmentId}:${refill.replacementId}`;if(!before.has(key))outcomes[seat].substitutions.push(`${CARDS[refill.equipmentId]?.name||refill.equipmentId} → ${CARDS[refill.replacementId]?.name||refill.replacementId}`);}
  }
  return outcomes;
}
async function reward(room) {
  if (room.game.phase !== 'finished' || room.rewarded) return;
  room.rewarded = true;
  const gearOutcomes=settleGear(room);
  room.seats.forEach((id, seat) => {
    const p = profiles.get(id); if (!p) return;
    const won=room.game.winner===seat,player=room.game.players[seat],oldLevel=p.level||1;
    if(room.matchmade){const opponent=profiles.get(room.seats[1-seat]),expected=1/(1+10**(((room.startRatings?.[1-seat]||opponent?.rating||1000)-(room.startRatings?.[seat]||p.rating||1000))/400));p.rating=Math.max(100,Math.round((p.rating||1000)+24*((room.game.winner===-1?.5:won?1:0)-expected)));}
    const broken=room.game.events.filter(e=>e.type==='item-break'&&e.seat===seat),looted=room.game.events.filter(e=>e.type==='item-loot'&&e.seat===seat);
    room.rewards||={};room.rewards[seat]={xp:0,coins:0,dust:0,scrap:0,items:[],broken:broken.map(e=>e.label),looted:looted.map(e=>e.label),wornOut:gearOutcomes[seat]?.wornOut||[],substitutions:gearOutcomes[seat]?.substitutions||[]};
    if(room.worldEncounter){
      if(room.worldEncounter.kind==='pvp'){
        p.realm.activeRoom=null;p.realm.version++;
        room.rewards[seat].realm={message:won?'Seu estandarte venceu o duelo.':'Você retorna ao mundo após o duelo.',coins:0};
      }else if(seat===0){const expedition=settleWorldEncounter(world,p,room.worldEncounter,won,player.conceded,REGIONS,Date.now(),Object.keys(player.laneClaims||{}).filter(lane=>player.laneClaims[lane]>0));room.rewards[seat].realm=expedition;if(expedition.loot){const pool=Object.values(CARDS).filter(c=>c.type==='equipment'&&c.rarity===(room.worldEncounter.stages===3?'rare':'common'));const item=makeItem(pool[randomInt(pool.length)].id,randomUUID,'realm');p.items.push(item);room.rewards[seat].items.push(item.id);}}
      markWorldDirty(p);
    }
    if(room.encounter&&seat===0){const expedition=settleEncounter(world,p,room.encounter,won,player.conceded,Date.now(),Object.keys(player.laneClaims||{}).filter(lane=>player.laneClaims[lane]>0));room.rewards[seat].realm=expedition;if(expedition.loot){const pool=Object.values(CARDS).filter(c=>c.type==='equipment'&&c.rarity===(room.encounter.stages===3?'rare':'common')),card=pool[randomInt(pool.length)],item=makeItem(card.id,randomUUID,'realm');p.items.push(item);room.rewards[seat].items.push(item.id);}}
    if(player.conceded)return;
    if(won&&p.realm&&!room.encounter&&(!room.worldEncounter||room.worldEncounter.kind==='pvp')){
      const afterglow=grantArenaAfterglow(world,p,REGIONS,Date.now());
      if(afterglow){const previous=room.rewards[seat].realm;room.rewards[seat].realm={...previous,...afterglow,message:[previous?.message,afterglow.message].filter(Boolean).join(' ')};room.realmAfterglow=true;markWorldDirty(p);}
    }
    p.matches++;if(won)p.wins++;gainRpg(p,won?45:15,won?'arena':null);if(won&&room.mode==='duel')gainRpg(p,15,'duels');if(won&&room.mode==='dungeon'&&!room.worldEncounter)gainRpg(p,60,'dungeons');
    p.xp += won ? 100 : 50;p.level = Math.max(oldLevel,accountLevelForXP(p.xp));
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
    for(let level=oldLevel+1;level<=p.level;level++)if(level%5===0){
      const rarity=level%10===0?'rare':'uncommon',pool=Object.values(CARDS).filter(card=>card.type==='equipment'&&card.rarity===rarity),card=pool[randomInt(pool.length)];
      if(card){const item=makeItem(card.id,randomUUID,'level');p.items.push(item);room.rewards[seat].items.push(item.id);room.rewards[seat].levelCache=(room.rewards[seat].levelCache||[]).concat({level,cardId:card.id,rarity});}
    }
    p.contracts||={matches:0,kills:0,wins:0};p.contracts.matches=(p.contracts.matches||0)+1;p.contracts.kills=(p.contracts.kills||0)+(player.kills||0);if(won)p.contracts.wins=(p.contracts.wins||0)+1;
    for(const contract of CONTRACTS){while(p.contracts[contract.id]>=contract.goal){p.contracts[contract.id]-=contract.goal;const bonusCoins=contract.reward.coins||0,bonusDust=contract.reward.dust||0;p.coins+=bonusCoins;p.dust+=bonusDust;room.rewards[seat].coins+=bonusCoins;room.rewards[seat].dust+=bonusDust;if(contract.reward.gear){const pool=Object.values(CARDS).filter(card=>card.type==='equipment'&&card.rarity===contract.reward.gear),card=pool[randomInt(pool.length)];if(card){const item=makeItem(card.id,randomUUID,'contract');p.items.push(item);room.rewards[seat].items.push(item.id);room.rewards[seat].contractGear=(room.rewards[seat].contractGear||[]).concat(card.id);}}}}
    p.trophies ||= [];
    if(room.mode === 'dungeon' && won && !p.trophies.includes('crown-of-the-buried')) p.trophies.push('crown-of-the-buried');
  });
}
function runBot(room) {
  let actions = 0;
  while (room.mode !== 'duel' && room.game.phase === 'playing' && room.game.turn === 1) {
    if (++actions > 100) throw new Error('Limite de ações do rival excedido.');
    room.game = applyAction(room.game, 1, botAction(room.game),{visuals:true});
  }
}
const mime = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.svg': 'image/svg+xml', '.webmanifest':'application/manifest+json; charset=utf-8', '.png':'image/png', '.webp':'image/webp', '.mp3':'audio/mpeg', '.mp4':'video/mp4' };
let requestQueue=Promise.resolve();
async function acquireRequestQueue() {
  let release;
  const previous=requestQueue;
  requestQueue=new Promise(resolve=>{release=resolve;});
  await previous;
  return release;
}
async function exclusiveWorldTask(task) {
  let release;
  const previous=requestQueue;
  requestQueue=new Promise(resolve=>{release=resolve;});
  await previous;
  try{return await task();}finally{release();}
}
function liveWorldFor(profile,now=Date.now()) {
  const snapshot=realmWorldView(world,profile,profiles,REGIONS,now);
  snapshot.activeRoom=profile.realm?.activeRoom||null;
  snapshot.challenges=[...worldChallenges.values()].filter(c=>c.to===profile.id&&c.expiresAt>now).map(c=>({playerId:profiles.get(c.from)?.realm?.publicId,name:profiles.get(c.from)?.name||'Viajante',expiresAt:c.expiresAt}));
  return snapshot;
}
function markWorldDirty(profile) {worldDirty=true;worldDirtyVersion++;if(profile)worldDirtyProfiles.add(profile.id);}
async function flushRealmWorld(force=false) {
  if(!worldDirty||(!force&&Date.now()-worldLastSaved<5000))return;
  if(!force&&Date.now()<worldSaveRetryAt)return;
  if(worldFlushPromise){await worldFlushPromise;if(!worldDirty||(!force&&Date.now()-worldLastSaved<5000))return;}
  const version=worldDirtyVersion;
  const changed=[...worldDirtyProfiles].map(id=>profiles.get(id)).filter(Boolean).map(profile=>structuredClone(profile));
  const save=persist({profiles:changed,world:structuredClone(world)});
  worldFlushPromise=save;
  try{
    await save;
    worldLastSaved=Date.now();
    worldSaveFailures=0;worldSaveRetryAt=0;
    if(worldDirtyVersion===version){worldDirtyProfiles.clear();worldDirty=false;}
  }catch(error){
    worldSaveFailures++;
    worldSaveRetryAt=Date.now()+Math.min(30000,1000*2**Math.min(5,worldSaveFailures-1));
    throw error;
  }finally{if(worldFlushPromise===save)worldFlushPromise=null;}
}
function worldDistance(a,b){return Math.hypot((a.x-b.x)*1.5,a.y-b.y);}
const server = http.createServer(async (req,res) => {
  let release;
  let preloadedWorldAction;
  try {
      const url = new URL(req.url, 'http://localhost');
    if(req.method!=='GET'&&req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)return json(res,403,{error:'Origem da requisição não autorizada.'});
    if(req.url.startsWith('/api/')&&req.method!=='GET'&&url.pathname!=='/api/health'){
      if(url.pathname==='/api/realms/world/action'){
        preloadedWorldAction=await body(req);
        const realtime=['world-move','world-ability','world-attack'].includes(preloadedWorldAction?.type);
        if(!realtime)release=await acquireRequestQueue();
      }else release=await acquireRequestQueue();
    }
    if (req.method === 'GET' && url.pathname === '/api/health') return json(res,200,{ ok: true, version: '0.4.0', edition:'edition-one', storage:mongoStore?'mongodb-atlas':'local-file' });
    if(url.pathname==='/api/auth/session'&&req.method==='GET'){
      const profile=identity(req);return profile?json(res,200,{profile,registered:!!profile.accountId}):json(res,401,{error:'Entre na sua conta para continuar.'});
    }
    if(url.pathname==='/api/auth/logout'&&req.method==='POST'){
      const current=identity(req);if(current)matchQueue.remove(current.id);
      const id=sessionId(req);if(id){sessions.delete(id);await persist({deleteSessions:[id]});}
      res.setHeader('Set-Cookie',sessionCookie('',true));return json(res,200,{ok:true});
    }
    if(['/api/auth/register','/api/auth/login'].includes(url.pathname)&&req.method==='POST'){
      allowAuthAttempt(req.socket.remoteAddress);const input=await body(req),email=normalizeEmail(input.email);
      let account=[...accounts.values()].find(a=>a.email===email),profile;
      if(url.pathname.endsWith('register')){
        if(account)throw new RuleError('Não foi possível criar esta conta. Confira os dados ou entre com sua conta existente.');
        const passwordHash=await hashPassword(input.password);
        const legacy=identity(req);
        const isLegacy=Boolean(input.claimLegacy&&legacy&&!legacy.accountId);
        const name=typeof input.name==='string'&&input.name.trim()?input.name.trim().slice(0,24):'Caçador';
        profile=isLegacy?structuredClone(legacy):{id:randomUUID(),name,xp:0,level:1,wins:0,matches:0,trophies:[]};
        if(!isLegacy){profile.onboardingComplete=false;profile.journey={version:1,lessons:{},createdAt:Date.now()};}
        account={id:randomUUID(),email,passwordHash,profileId:profile.id,createdAt:Date.now()};profile.accountId=account.id;
      }else{
        // A dummy derivation keeps the missing-account path comparable to a bad password.
        const hash=account?.passwordHash||'scrypt:00000000000000000000000000000000:'+ '00'.repeat(64);
        const valid=await verifyPassword(input.password,hash);
        if(!account||!valid)return json(res,401,{error:'E-mail ou senha incorretos.'});
        profile=profiles.get(account.profileId);if(!profile)throw new RuleError('O progresso desta conta não foi encontrado.');
      }
      const session=newSession(account.id);
      // Persist credentials, profile and session atomically before making them visible.
      if(mongoStore)await mongoStore.save({profiles:[profile],accounts:[account],sessions:[session.record]});
      accounts.set(account.id,account);profiles.set(profile.id,profile);sessions.set(session.record.id,session.record);
      if(!mongoStore)await persist();
      res.setHeader('Set-Cookie',sessionCookie(session.token));return json(res,200,{profile,registered:true});
    }
    if (req.method === 'POST' && url.pathname === '/api/profile') {
      if(process.env.NODE_ENV==='production')return json(res,403,{error:'Crie uma conta para salvar seu juramento.'});
      const input = await body(req);
      const name = typeof input.name === 'string' ? input.name.trim().slice(0,24) : 'Viajante';
      const profile = { id: randomUUID(), name: name || 'Viajante', xp: 0, level: 1, wins: 0, matches: 0, trophies:[] };
      grantStarter(profile,input.faction==='werewolf'?'werewolf':'vampire',randomUUID);
      profiles.set(profile.id,profile); await persist({profiles:[profile]}); return json(res,201,profile);
    }
    if (url.pathname.startsWith('/api/')) {
      const profile = identity(req);
      if (!profile) return json(res,401,{ error: 'Crie um perfil local para entrar.' });
      if(profile.onboardingComplete!==false) await prepareProfile(profile,profile.starterFaction||'vampire');
      if (req.method === 'GET' && url.pathname === '/api/profile') return json(res,200,profile);
      if(url.pathname==='/api/onboarding'&&req.method==='POST'){
        const input=await body(req),name=String(input.name||profile.name||'Viajante').trim();
        if(name.length<2||name.length>24)throw new RuleError('O nome do personagem deve ter entre 2 e 24 caracteres.');
        if(!['vampire','werewolf'].includes(input.faction))throw new RuleError('Escolha seu primeiro deck.');
        if(profile.onboardingComplete===false){
          grantStarter(profile,input.faction,randomUUID);grantSecondLineage(profile,randomUUID);
          profile.name=name;profile.character={avatar:AVATAR_IDS.includes(input.avatar)?input.avatar:'vesper',origin:Object.hasOwn(ORIGINS,input.origin)?input.origin:'exile'};profile.selectedFaction=input.faction;profile.onboardingComplete=true;
          await persist({profiles:[profile]});
        }
        return json(res,200,{profile});
      }
      if(profile.onboardingComplete===false)throw new RuleError('Conclua a apresentação do seu personagem para começar.');
      if(url.pathname==='/api/journey/lesson'&&req.method==='POST'){
        const input=await body(req),lesson=input.id==='combat'?{steps:Array(9)}:Object.hasOwn(JOURNEY_LESSONS,input.id)?JOURNEY_LESSONS[input.id]:null;
        if(!lesson||!Number.isInteger(input.step)||input.step<0||input.step>lesson.steps.length)throw new RuleError('Etapa de orientação inválida.');
        const feature=lessonFeature(input.id);if(feature&&!featureOpen(profile,feature))return json(res,403,{error:featureRequirement(profile,feature)});
        profile.journey||={version:0,lessons:{}};profile.journey.lessons||={};
        profile.journey.lessons[input.id]={step:input.step,complete:input.step===lesson.steps.length,updatedAt:Date.now()};
        await persist({profiles:[profile]});return json(res,200,{journey:profile.journey});
      }
      const gate=url.pathname.startsWith('/api/realms')?'realms':url.pathname==='/api/matchmaking'&&req.method==='POST'?'duel':url.pathname==='/api/boosters/open'?'boosters':url.pathname==='/api/cards/craft'?'forge':url.pathname==='/api/decks'&&req.method==='POST'?'decks':url.pathname==='/api/vault/transfer'?'vault':url.pathname.startsWith('/api/market')&&req.method==='POST'?'market':null;
      if(gate&&!featureOpen(profile,gate))return json(res,403,{error:featureRequirement(profile,gate),feature:gate});
      if(url.pathname==='/api/character'&&req.method==='POST'){
        const input=await body(req),name=String(input.name||'').trim();
        if(name.length<2||name.length>24||!AVATAR_IDS.includes(input.avatar)||!Object.hasOwn(ORIGINS,input.origin))throw new RuleError('Escolha nome, retrato e origem válidos.');
        profile.name=name;profile.character={avatar:input.avatar,origin:input.origin};
        if(profile.realm){profile.realm.avatar=input.avatar;profile.realm.version++;}
        await persist({profiles:[profile]});return json(res,200,{profile});
      }
      if(url.pathname==='/api/decks/loadout'&&req.method==='POST'){
        const input=await body(req),deck=profile.decks.find(d=>d.id===input.deckId);
        if(!deck)throw new RuleError('Deck não encontrado.');
        if(deck.faction!==profile.starterFaction&&!featureOpen(profile,'lineage'))throw new RuleError(featureRequirement(profile,'lineage'));
        if([...rooms.values()].some(r=>r.game.phase==='playing'&&r.seats.includes(profile.id)))throw new RuleError('Conclua a partida antes de alterar equipamentos.');
        if(input.auto){
          if(JSON.stringify(input.expectedCards)!==JSON.stringify(deck.cards))throw new RuleError('Seu deck mudou. Reabra a preparação para conferir a nova sugestão.');
          const plan=suggestLoadout({...profile,items:profile.items.map(i=>({...i,locked:itemLocks.has(i.id)}))},deck);
          if(!plan.ready)throw new RuleError(plan.error);
          if(JSON.stringify(input.expectedResult)!==JSON.stringify(plan.cards))throw new RuleError('As peças disponíveis mudaram. Confira a sugestão novamente.');
          deck.cards=plan.cards;deck.autoRefills=plan.autoRefills;profile.activeDecks[deck.faction]=deck.id;profile.selectedFaction=deck.faction;matchQueue.remove(profile.id);
          await persist({profiles:[profile]});return json(res,200,{profile,deck,changes:plan.changes});
        }
        const index=Number(input.index),card=CARDS[input.cardId];
        if(!Number.isInteger(index)||index<0||index>=deck.cards.length||card?.type!=='equipment')throw new RuleError('Escolha uma posição e equipamento válidos.');
        if(input.expectedCardId!==deck.cards[index])throw new RuleError('Seu deck foi atualizado. Reabra Equipamento Rápido e selecione a posição novamente.');
        const available=profile.items.filter(i=>i.cardId===card.id&&i.durability>0&&!i.listingId&&!itemLocks.has(i.id)).length;
        const draft=[...deck.cards],removed=draft[index];draft[index]=card.id;
        if((countCards(draft)[card.id]||0)>available)throw new RuleError('Todas as peças desta relíquia estão em uso, anunciadas ou danificadas.');
        const reservedSlot=reserveSlots(deck).get(index),refills=structuredClone(deck.autoRefills||[]),replacement=reservedSlot?(deck.autoRefills||[]).indexOf(reservedSlot):-1;
        if(replacement>=0)refills.splice(replacement,1);
        validateOwnedDeck(draft,deck.faction,profile,refills);
        deck.cards=draft;deck.autoRefills=refills;matchQueue.remove(profile.id);
        await persist({profiles:[profile]});return json(res,200,{profile,deck});
      }
      if(url.pathname==='/api/market/orders'&&req.method==='GET')return json(res,200,{orders:(world.purchaseOrders||[]).map(o=>({id:o.id,cardId:o.cardId,price:o.price,createdAt:o.createdAt,mine:o.buyerId===profile.id,buyerName:profiles.get(o.buyerId)?.name||'Viajante'}))});
      if(url.pathname==='/api/market/orders'&&req.method==='POST'){
        const input=await body(req);try{placeOrder(world,profile,input,randomUUID());}catch(error){throw new RuleError(error.message);}
        await persist({profiles:[profile],world:true});return json(res,200,{profile});
      }
      const orderRoute=url.pathname.match(/^\/api\/market\/orders\/([\da-f-]+)\/(cancel|fill)$/i);
      if(orderRoute&&req.method==='POST'){
        const input=await body(req),order=(world.purchaseOrders||[]).find(o=>o.id===orderRoute[1]),buyer=order&&profiles.get(order.buyerId);if(!buyer)throw new RuleError('Encomenda não encontrada.');
        let receipt;try{if(orderRoute[2]==='cancel')cancelOrder(world,profile,order.id);else receipt=fillOrder(world,profile,buyer,{orderId:order.id,itemId:input.itemId},itemLocks);}catch(error){throw new RuleError(error.message);}
        reconcileDepletedGear(profile);if(buyer!==profile)reconcileDepletedGear(buyer);
        await persist({profiles:buyer===profile?[profile]:[profile,buyer],world:true});return json(res,200,{profile,receipt});
      }
      if(url.pathname==='/api/vault/transfer'&&req.method==='POST'){
        const input=await body(req);try{transferVault(profile,input);}catch(error){throw new RuleError(error.message);}
        await persist({profiles:[profile]});return json(res,200,{profile,vault:profile.vault});
      }
      if(url.pathname==='/api/decks/select'&&req.method==='POST'){
        const input=await body(req);if(!activeDeck(profile,input.faction))throw new RuleError('Ative um deck válido no Arsenal.');
        if(input.faction!==profile.starterFaction&&!featureOpen(profile,'lineage'))throw new RuleError(featureRequirement(profile,'lineage'));
        if(profile.realm?.activeRoom||[...rooms.values()].some(r=>r.game.phase==='playing'&&r.seats.includes(profile.id)))throw new RuleError('Conclua sua partida antes de trocar o deck.');
        matchQueue.remove(profile.id);profile.selectedFaction=input.faction;await persist({profiles:[profile]});return json(res,200,{profile});
      }
      if(url.pathname==='/api/matchmaking'&&req.method==='DELETE'){matchQueue.remove(profile.id);const matched=[...rooms.values()].find(r=>r.matchmade&&r.game.phase==='playing'&&r.seats.includes(profile.id));return json(res,200,matched?{state:'matched',roomId:matched.id}:{state:'cancelled'});}
      if(url.pathname==='/api/matchmaking'&&req.method==='POST'){
        const input=await body(req),faction=input.faction||profile.selectedFaction||profile.starterFaction;
        const existing=[...rooms.values()].find(r=>r.matchmade&&r.game.phase==='playing'&&r.seats.includes(profile.id));
        if(existing){matchQueue.remove(profile.id);return json(res,200,{state:'matched',roomId:existing.id});}
        requireFreePlayer(profile.id);
        if(!['vampire','werewolf'].includes(faction))throw new RuleError('Escolha uma linhagem válida.');
        const ready=readinessFor(profile,faction);if(!ready.canStart){matchQueue.remove(profile.id);throw new RuleError(ready.deckError||'Prepare seus equipamentos antes de buscar um adversário.');}
        const {entry,candidates}=matchQueue.join(profile,faction);
        for(const ticket of candidates){
          const rival=profiles.get(ticket.id);if(!rival){matchQueue.remove(ticket.id);continue;}
          await prepareProfile(rival,ticket.faction);
          const current=activeRoomFor(profile.id);if(current){matchQueue.remove(profile.id);if(current.matchmade)return json(res,200,{state:'matched',roomId:current.id});throw new RuleError('Conclua sua partida em andamento.');}
          if(activeRoomFor(rival.id)){matchQueue.remove(rival.id);continue;}
          if(!readinessFor(rival,ticket.faction).canStart){matchQueue.remove(rival.id);continue;}
          if(rooms.size>=500)throw new RuleError('Todas as mesas estão ocupadas. Tente novamente em instantes.');
          const id=randomBytes(5).toString('hex').toUpperCase();let one,two;
          try{one=reserveDeck(rival,activeDeck(rival,ticket.faction).cards,id);two=reserveDeck(profile,activeDeck(profile,faction).cards,id);
            let game=createGame(ticket.faction,Math.random,'duel',{[ticket.faction]:one.cards});game=replaceOpeningDeck(game,1,two.cards);game.players[1].faction=faction;
            const matched={id,mode:'duel',matchmade:true,startRatings:[rival.rating||1000,profile.rating||1000],riskMode:'covenant',battlefield:'court-board',game,seats:[rival.id,profile.id],rewarded:false,createdAt:Date.now(),lockedItems:[one.itemIds,two.itemIds],gearEvents:[]};
            rooms.set(id,matched);try{await persist({rooms:[matched]});}catch(error){rooms.delete(id);throw error;}
            matchQueue.remove(rival.id);matchQueue.remove(profile.id);return json(res,200,{state:'matched',roomId:id});
          }catch(error){for(const itemId of [...(one?.itemIds||[]),...(two?.itemIds||[])])itemLocks.delete(itemId);throw error;}
        }
        return json(res,200,{state:'searching',joinedAt:entry.joinedAt,rating:entry.rating,queued:matchQueue.entries.size});
      }
      if(url.pathname==='/api/readiness'&&req.method==='GET'){
        const requested=url.searchParams.get('faction'),faction=['vampire','werewolf'].includes(requested)?requested:(profile.selectedFaction||profile.starterFaction||'vampire');
        return json(res,200,readinessFor(profile,faction));
      }
      if(url.pathname==='/api/realms/events'&&req.method==='GET'){
        enterRealms(profile,randomUUID);ensureRealmWorld(world,REGIONS);

const worldTickMs = Number(
  process.env.WORLD_TICK_MS ||
  (process.env.NODE_ENV === 'production' ? 500 : 250)
);

console.log(
  `World tick configurado para ${worldTickMs}ms (${process.env.NODE_ENV || 'development'})`
);ensureWorldPlayer(profile,REGIONS);markWorldDirty(profile);
        return realmStream(profile,req,res,{snapshot:()=>liveWorldFor(profile),authorized:()=>{if(identity(req)?.id!==profile.id)return false;profile.realm.seenAt=Date.now();return true;}});
      }
      if(url.pathname==='/api/realms/world'&&req.method==='GET'){
        enterRealms(profile,randomUUID);ensureRealmWorld(world,REGIONS);

const worldTickMs = Number(
  process.env.WORLD_TICK_MS ||
  (process.env.NODE_ENV === 'production' ? 500 : 250)
);

console.log(
  `World tick configurado para ${worldTickMs}ms (${process.env.NODE_ENV || 'development'})`
);ensureWorldPlayer(profile,REGIONS);profile.realm.seenAt=Date.now();markWorldDirty(profile);
        return json(res,200,{liveWorld:liveWorldFor(profile)});
      }
      if(url.pathname==='/api/realms/world/action'&&req.method==='POST'){
        const input=preloadedWorldAction;enterRealms(profile,randomUUID);ensureRealmWorld(world,REGIONS);

const worldTickMs = Number(
  process.env.WORLD_TICK_MS ||
  (process.env.NODE_ENV === 'production' ? 500 : 250)
);

console.log(
  `World tick configurado para ${worldTickMs}ms (${process.env.NODE_ENV || 'development'})`
);ensureWorldPlayer(profile,REGIONS);
        if(!input||typeof input!=='object'||Array.isArray(input))throw new RuleError('Ação de mundo inválida.');
        requireFreePlayer(profile.id);
        const result=realmWorldAction(world,profile,input,REGIONS,Date.now());markWorldDirty(profile);
        const moving=input.type==='world-move'||input.type==='world-ability';
        if(input.type==='world-attack')void flushRealmWorld().catch(error=>console.error('Falha ao salvar uma ação de combate dos Reinos.',error));
        else if(!moving)await flushRealmWorld(true);
        return json(res,200,{liveWorld:liveWorldFor(profile),result,...(!moving?{profile}:{})});
      }
      if(url.pathname==='/api/realms/world/encounter'&&req.method==='POST'){
        const input=await body(req);enterRealms(profile,randomUUID);ensureRealmWorld(world,REGIONS);

const worldTickMs = Number(
  process.env.WORLD_TICK_MS ||
  (process.env.NODE_ENV === 'production' ? 500 : 250)
);

console.log(
  `World tick configurado para ${worldTickMs}ms (${process.env.NODE_ENV || 'development'})`
);ensureWorldPlayer(profile,REGIONS);
        if(!input||typeof input!=='object'||Array.isArray(input))throw new RuleError('Encontro de mundo inválido.');
        requireFreePlayer(profile.id);
        if(rooms.size>=500)throw new RuleError('Todas as mesas estão ocupadas. Tente novamente em instantes.');
        const now=Date.now(),faction=profile.selectedFaction||profile.starterFaction,deck=activeDeck(profile,faction);
        if(!deck)throw new RuleError('Equipe um deck válido da sua linhagem no Arsenal.');
        validateOwnedDeck(deck.cards,faction,profile,deck.autoRefills);
        if(input.playerId){
          const opponent=[...profiles.values()].find(p=>p.realm?.publicId===input.playerId);
          if(!opponent||opponent.id===profile.id||!opponent.realm.roaming)throw new RuleError('Escolha outro viajante no mapa.');
          requireFreePlayer(opponent.id);
          const here=profile.realm.roaming,there=opponent.realm.roaming;
          if(here.hp<=0||there.hp<=0||here.downUntil>now||there.downUntil>now)throw new RuleError('Ambos precisam estar recuperados para duelar.');
          if(worldDistance(here,there)>4.2)throw new RuleError('Aproxime-se do viajante para propor um duelo.');
          if(now-(opponent.realm.seenAt||0)>60000)throw new RuleError('Esse viajante não está presente no mundo.');
          const challengeKey=`${opponent.id}:${profile.id}`,invitation=worldChallenges.get(challengeKey);
          if(!invitation||invitation.expiresAt<=now){
            for(const [key,c]of worldChallenges)if(c.expiresAt<=now)worldChallenges.delete(key);
            if([...worldChallenges.values()].some(c=>c.from===profile.id&&now-c.createdAt<3000))throw new RuleError('Aguarde um instante antes de enviar outro desafio.');
            for(const [key,c]of worldChallenges)if(c.from===profile.id)worldChallenges.delete(key);
            worldChallenges.set(`${profile.id}:${opponent.id}`,{from:profile.id,to:opponent.id,createdAt:now,expiresAt:now+30000});
            realmLivePulse(id=>{const p=profiles.get(id);return p?.realm?liveWorldFor(p):null;});
            return json(res,202,{challenge:{playerId:opponent.realm.publicId,name:opponent.name,expiresAt:now+30000},liveWorld:liveWorldFor(profile)});
          }
          const otherFaction=opponent.selectedFaction||opponent.starterFaction,otherDeck=activeDeck(opponent,otherFaction);
          if(!otherDeck)throw new RuleError('O desafiante precisa preparar seu deck.');
          validateOwnedDeck(otherDeck.cards,otherFaction,opponent,otherDeck.autoRefills);
          const id=randomBytes(5).toString('hex').toUpperCase();let one,two;
          const previousRooms=[opponent.realm.activeRoom,profile.realm.activeRoom];
          try{
            one=reserveDeck(opponent,otherDeck.cards,id);two=reserveDeck(profile,deck.cards,id);
            let game=createGame(otherFaction,Math.random,'duel',{[otherFaction]:one.cards});game=replaceOpeningDeck(game,1,two.cards);game.players[1].faction=faction;
            const room={id,mode:'duel',worldEncounter:{kind:'pvp',title:'Duelo de estandartes',node:profile.realm.location},riskMode:'covenant',battlefield:'siege-board',game,seats:[opponent.id,profile.id],rewarded:false,createdAt:now,lockedItems:[one.itemIds,two.itemIds],gearEvents:[]};
            rooms.set(id,room);opponent.realm.activeRoom=id;profile.realm.activeRoom=id;opponent.realm.version++;profile.realm.version++;
            await persist({profiles:[profile,opponent],rooms:[room],world:true});
            worldChallenges.delete(challengeKey);matchQueue.remove(profile.id);matchQueue.remove(opponent.id);
            realmLivePulse(pid=>{const p=profiles.get(pid);return p?.realm?liveWorldFor(p):null;});
            return json(res,201,view(room,profile.id));
          }catch(error){
            rooms.delete(id);opponent.realm.activeRoom=previousRooms[0];profile.realm.activeRoom=previousRooms[1];
            for(const itemId of [...(one?.itemIds||[]),...(two?.itemIds||[])])itemLocks.delete(itemId);
            throw error;
          }
        }
        const encounter=prepareWorldEncounter(world,profile,input,REGIONS,now),id=randomBytes(5).toString('hex').toUpperCase();
        let reserved;const previousRoom=profile.realm.activeRoom,previousProvisions=profile.realm.provisions;
        try{
          reserved=reserveDeck(profile,deck.cards,id);
          const rival=campaignRival(faction,encounter.node,encounter.stage||0),boss=encounter.kind==='boss'||(encounter.stages===3&&encounter.stage===2);
          const game=createGame(faction,Math.random,boss?'dungeon':'practice',{[faction]:reserved.cards},{...rival,deck:buildRivalDeck(rival.id)});
          game.players[1].health=game.players[1].maxHealth=boss?36:22+(encounter.difficulty||1)*2+(encounter.stage||0)*2;
          applyDoctrine(game,profile.realm.doctrine||'standard');
          const room={id,mode:'realm',worldEncounter:encounter,opponent:{id:rival.id,name:encounter.title||rival.name,title:rival.title,style:rival.style,avatar:rival.avatar},battlefield:encounter.board||'crypt-board',riskMode:'covenant',game,seats:[profile.id,'bot'],rewarded:false,createdAt:now,lockedItems:[reserved.itemIds],gearEvents:[]};
          rooms.set(id,room);profile.realm.activeRoom=id;profile.realm.provisions-=2;profile.realm.version++;matchQueue.remove(profile.id);
          await persist({profiles:[profile],rooms:[room],world:true});return json(res,201,view(room,profile.id));
        }catch(error){rooms.delete(id);profile.realm.activeRoom=previousRoom;profile.realm.provisions=previousProvisions;for(const itemId of reserved?.itemIds||[])itemLocks.delete(itemId);throw error;}
      }
      if(url.pathname==='/api/realms'&&req.method==='GET'){
        if(enterRealms(profile,randomUUID))await persist({profiles:[profile]});
        const state=realmView(world,profile,profiles,Date.now(),false);state.liveWorld=liveWorldFor(profile);
        return json(res,200,state);
      }
      if(url.pathname==='/api/realms/actions'&&req.method==='POST'){
        const input=await body(req),worldVersion=world.version;
        if(['found','join','propose','war','donate','vote','table-siege','table-influence'].includes(input.type)&&!featureOpen(profile,'politics'))throw new RuleError(featureRequirement(profile,'politics'));
        enterRealms(profile,randomUUID);realmAction(world,profile,input,randomUUID);await persist({profiles:[profile],world:world.version!==worldVersion});realmPulse();
        const state=realmView(world,profile,profiles);state.liveWorld=liveWorldFor(profile);return json(res,200,state);
      }
      if(url.pathname==='/api/realms/encounter'&&req.method==='POST'){
        const input=await body(req);enterRealms(profile,randomUUID);
        requireFreePlayer(profile.id);matchQueue.remove(profile.id);
        if(input.version!==profile.realm.version)throw new RuleError('Seu mapa mudou. Atualize e tente novamente.');
        const encounter=prepareEncounter(world,profile),faction=profile.selectedFaction||profile.starterFaction,deck=activeDeck(profile,faction);
        encounter.doctrine=profile.realm.expedition?.doctrine||profile.realm.doctrine||'standard';
        if(!deck)throw new RuleError('Equipe um deck válido da sua linhagem no Arsenal.');
        validateOwnedDeck(deck.cards,faction,profile,deck.autoRefills);
        const id=randomBytes(5).toString('hex').toUpperCase(),reserved=reserveDeck(profile,deck.cards,id);
        const rival=campaignRival(faction,encounter.node,encounter.stage),boss=encounter.stages===3&&encounter.stage===2;
        encounter.rivalId=rival.id;encounter.rivalName=rival.name;encounter.rivalStyle=rival.style;
        const game=createGame(faction,Math.random,boss?'dungeon':'practice',{[faction]:reserved.cards},{...rival,deck:buildRivalDeck(rival.id)});
        game.players[1].health=game.players[1].maxHealth=boss?36:22+encounter.difficulty*2+encounter.stage*2;
        applyDoctrine(game,encounter.doctrine);
        const room={id,mode:'realm',encounter,opponent:{id:rival.id,name:rival.name,title:rival.title,style:rival.style,avatar:rival.avatar},battlefield:encounter.board,riskMode:'covenant',game,seats:[profile.id,'bot'],rewarded:false,createdAt:Date.now(),lockedItems:[reserved.itemIds],gearEvents:[]};
        rooms.set(id,room);profile.realm.activeRoom=id;profile.realm.provisions-=2;profile.realm.version++;await persist({profiles:[profile],rooms:[room]});return json(res,201,view(room,profile.id));
      }
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
        await persist({profiles:[profile]});return json(res,200,{profile,pulls,set:'Crônicas de Véspera'});
      }
      if (req.method === 'POST' && url.pathname === '/api/cards/craft') {
        const input=await body(req),card=CARDS[input.cardId],amount=Number(input.amount||1);
        if(!card||!Number.isInteger(amount)||amount<1||amount>2)throw new RuleError('Pedido de criação inválido.');
        if(card.type==='equipment'){
          const unitCost=ECONOMY.craftGear[card.rarity];if(!unitCost)throw new RuleError('Este equipamento não pode ser criado.');
          const cost={coins:unitCost.coins*amount,scrap:unitCost.scrap*amount};if(profile.coins<cost.coins||profile.scrap<cost.scrap)throw new RuleError(`Criar ${amount} × ${card.name} custa ${cost.coins} Marcas e ${cost.scrap} Sucata.`);
          profile.coins-=cost.coins;profile.scrap-=cost.scrap;const items=[];for(let i=0;i<amount;i++){const item=makeItem(card.id,randomUUID,'crafted');profile.items.push(item);items.push(item);}
          await persist({profiles:[profile]});return json(res,200,{profile,crafted:{id:card.id,amount,items,cost}});
        }
        const cost=ECONOMY.craftDust[card.rarity]*amount,owned=profile.collection[card.id]||0;
        if(owned+amount>cardLimit(card))throw new RuleError(`Limite de ${cardLimit(card)} cópia(s) desta carta.`);
        if(profile.dust<cost)throw new RuleError(`São necessários ${cost} fragmentos para criar esta carta.`);
        profile.dust-=cost;profile.collection[card.id]=owned+amount;await persist({profiles:[profile]});return json(res,200,{profile,crafted:{id:card.id,amount,cost}});
      }
      if (req.method === 'POST' && url.pathname === '/api/decks') {
        const input=await body(req);validateOwnedDeck(input.cards,input.faction,profile);
        const deck={id:randomUUID(),name:String(input.name||'Meu deck').trim().slice(0,28)||'Meu deck',faction:input.faction,cards:[...input.cards],starter:false,boxSkin:input.faction==='werewolf'?'werewolf-iron':'vampire-crimson'};
        profile.decks.push(deck);await persist({profiles:[profile]});return json(res,201,{profile,deck});
      }
      const deckBoxRoute=url.pathname.match(/^\/api\/decks\/([\da-f-]+)\/box$/i);
      if(deckBoxRoute&&req.method==='POST'){
        if(!featureOpen(profile,'decks'))throw new RuleError(featureRequirement(profile,'decks'));
        const deck=profile.decks.find(d=>d.id===deckBoxRoute[1]);if(!deck)throw new RuleError('Deck não encontrado.');
        const input=await body(req),skins=deck.faction==='werewolf'?['werewolf-iron','werewolf-ash']:['vampire-crimson','vampire-obsidian'];
        if(!skins.includes(input.skin))throw new RuleError('Escolha uma ilustração válida para esta linhagem.');
        deck.boxSkin=input.skin;await persist({profiles:[profile]});return json(res,200,{profile,deck});
      }
      const deckRoute=url.pathname.match(/^\/api\/decks\/([\da-f-]+)(?:\/(activate))?$/i);
      if(deckRoute){
        if(!featureOpen(profile,'decks'))throw new RuleError(featureRequirement(profile,'decks'));
        const deck=profile.decks.find(d=>d.id===deckRoute[1]);if(!deck)throw new RuleError('Deck não encontrado.');
        if(deck.faction!==profile.starterFaction&&!featureOpen(profile,'lineage'))throw new RuleError(featureRequirement(profile,'lineage'));
        if(req.method==='POST'&&deckRoute[2]==='activate'){validateOwnedDeck(deck.cards,deck.faction,profile,deck.autoRefills);profile.activeDecks[deck.faction]=deck.id;profile.selectedFaction=deck.faction;await persist({profiles:[profile]});return json(res,200,{profile,deck});}
        if(req.method==='PUT'&&!deckRoute[2]){const input=await body(req);validateOwnedDeck(input.cards,deck.faction,profile,deck.autoRefills);deck.cards=[...input.cards];const borrowedNeeded={};for(const [id,count] of Object.entries(countCards(deck.cards)))borrowedNeeded[id]=Math.max(0,count-(profile.collection?.[id]||0));deck.autoRefills=(deck.autoRefills||[]).filter(refill=>{if((borrowedNeeded[refill.replacementId]||0)<=0)return false;borrowedNeeded[refill.replacementId]--;return true;});if(input.name)deck.name=String(input.name).trim().slice(0,28);await persist({profiles:[profile]});return json(res,200,{profile,deck});}
      }
      if(req.method==='POST'&&url.pathname==='/api/items/repair'){
        const input=await body(req),item=gearFor(profile,input.itemId);if(!item||item.listingId||itemLocks.has(item.id))throw new RuleError('Este item não pode ser reparado agora.');
        const missing=item.maxDurability-item.durability,cost=(ECONOMY.repairCost[item.rarity]||12)*missing;if(missing<=0)throw new RuleError('Este equipamento já está íntegro.');
        if(profile.coins<cost)throw new RuleError(`O reparo custa ${cost} Marcas.`);profile.coins-=cost;item.durability=item.maxDurability;restoreReplacedGear(profile,item.cardId);await persist({profiles:[profile]});return json(res,200,{profile,repaired:item.id,cost});
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
        profile.coins-=fee;item.listingId=randomUUID();item.price=price;item.listedAt=Date.now();await persist({profiles:[profile]});return json(res,201,{profile,item,fee});
      }
      const marketAction=url.pathname.match(/^\/api\/market\/([\da-f-]+)\/(buy|cancel)$/i);
      if(marketAction){
        const listingId=marketAction[1],action=marketAction[2];let seller,item;
        for(const candidate of profiles.values()){const found=(candidate.items||[]).find(i=>i.listingId===listingId);if(found){seller=candidate;item=found;break;}}
        if(!seller||!item)throw new RuleError('Anúncio não encontrado.');
        if(action==='cancel'&&req.method==='POST'){
          if(seller.id!==profile.id)throw new RuleError('Só o vendedor pode retirar este anúncio.');item.listingId=null;item.price=null;item.listedAt=null;await persist({profiles:[profile]});return json(res,200,{profile,item});
        }
        if(action==='buy'&&req.method==='POST'){
          if(seller.id===profile.id)throw new RuleError('Você não pode comprar seu próprio anúncio.');if(item.listedAt+ECONOMY.marketListingHours*3600000<=Date.now())throw new RuleError('Este anúncio expirou.');
          if(profile.coins<item.price)throw new RuleError('Marcas insuficientes para esta compra.');
          const price=item.price,tax=Math.floor(price*ECONOMY.marketTaxPercent/100);profile.coins-=price;seller.coins=(seller.coins||0)+price-tax;seller.items=seller.items.filter(i=>i.id!==item.id);profile.items.push({...item,listingId:null,price:null,listedAt:null});
            await persist({profiles:[profile,seller]});return json(res,200,{profile,item:{...item,listingId:null,price:null,listedAt:null},tax});
        }
      }
      if (req.method === 'POST' && url.pathname === '/api/rooms') {
        const input = await body(req);
        if (!['practice','duel','dungeon'].includes(input.mode)) throw new RuleError('Modo inválido.');
        if(input.mode==='dungeon'&&!featureOpen(profile,'dungeon'))throw new RuleError(featureRequirement(profile,'dungeon'));
        if(input.faction!==profile.starterFaction&&!featureOpen(profile,'lineage'))throw new RuleError(featureRequirement(profile,'lineage'));
        if(input.mode==='duel')throw new RuleError('Duelo online entra pela busca de adversário.');
        requireFreePlayer(profile.id);matchQueue.remove(profile.id);
        if (rooms.size >= 500) throw new RuleError('Limite de salas atingido. Reinicie o servidor de desenvolvimento.');
        const deck=profile.decks.find(d=>d.id===(input.deckId||profile.activeDecks[input.faction]));
        if(!deck)throw new RuleError('Equipe um deck válido dessa facção antes de iniciar.');
        validateOwnedDeck(deck.cards,input.faction,profile,deck.autoRefills);
        if(deck&&deck.faction!==input.faction)throw new RuleError('Escolha um deck da facção selecionada.');
        const id=randomBytes(5).toString('hex').toUpperCase(),reserved=deck?reserveDeck(profile,deck.cards,id):{cards:null,itemIds:[]};
        const deckLists=deck?{[input.faction]:reserved.cards}:{};
        const template=input.mode==='dungeon'?RIVALS.mordrath:practiceRival(input.faction,profile.matches||0),rival={...template,deck:buildRivalDeck(template.id)};
        const game=createGame(input.faction,Math.random,input.mode,deckLists,rival),riskMode=input.mode==='duel'&&input.riskMode==='blood-oath'?'blood-oath':'covenant';game.riskMode=riskMode;
        const room = { id, mode: input.mode, opponent:{id:rival.id,name:rival.name,title:rival.title,style:rival.style,avatar:rival.avatar}, riskMode, battlefield:['court-board','forest-board','crypt-board','siege-board'].includes(input.battlefield)?input.battlefield:input.mode==='dungeon'?'crypt-board':input.faction==='werewolf'?'forest-board':'court-board', game, seats: [profile.id], rewarded: false, createdAt:Date.now(),lockedItems:[reserved.itemIds],gearEvents:[] };
        if (input.mode !== 'duel') room.seats.push('bot');
        rooms.set(room.id,room); await persist({rooms:[room]});return json(res,201,view(room,profile.id));
      }
      const match = url.pathname.match(/^\/api\/rooms\/([A-F0-9]{10})(?:\/(join|actions))?$/);
      if (match) {
        const room = rooms.get(match[1]);
        if (!room) return json(res,404,{ error: 'Sala não encontrada ou expirada.' });
        if (req.method === 'POST' && match[2] === 'join') {
          return json(res,410,{error:'Convites foram substituídos pela busca automática de adversário.'});
        }
        const seat = room.seats.indexOf(profile.id);
        if (seat < 0) return json(res,403,{ error: 'Você não participa desta sala.' });
        if (req.method === 'GET' && !match[2]) return json(res,200,view(room,profile.id));
        if (req.method === 'POST' && match[2] === 'actions') {
          const input = await body(req);
          if (room.seats.length < 2) throw new RuleError('Aguarde o segundo jogador.');
          if (input.version !== room.game.version) return json(res,409,{ error: 'O estado mudou. Atualize antes de jogar.' });
          const firstEvent=room.game.nextEvent;room.game = applyAction(room.game,seat,input.action,{visuals:true}); runBot(room);room.gearEvents.push(...room.game.events.filter(e=>e.id>=firstEvent&&e.type==='item-lost'));
          const rewarding=room.game.phase==='finished'&&!room.rewarded;await reward(room);
          const changedProfiles=rewarding?room.seats.map(id=>profiles.get(id)).filter(Boolean):[];
          await persist({rooms:[room],profiles:changedProfiles,world:rewarding&&!!(room.encounter||room.worldEncounter||room.realmAfterglow)});
          return json(res,200,view(room,profile.id));
        }
      }
      return json(res,404,{ error: 'Rota não encontrada.' });
    }
    if (!['GET','HEAD'].includes(req.method)) return json(res,405,{ error: 'Método não permitido.' });
    const musicAsset=/^\/music\/(ambient_idle|battle|battle2|song1)\.mp3$/.exec(url.pathname);
    const requested = musicAsset ? `${musicAsset[1]}.mp3` : url.pathname === '/' ? 'client/landing.html' : ['/play','/play/'].includes(url.pathname) ? 'client/index.html' : url.pathname.startsWith('/shared/') ? url.pathname.slice(1) : `client/${url.pathname.slice(1)}`;
    const target = path.resolve(root,requested);
    const allowed = !!musicAsset || ['client','shared'].some(dir => target.startsWith(path.join(root,dir) + path.sep));
    if (!allowed || !mime[path.extname(target)]) return json(res,404,{ error: 'Arquivo não encontrado.' });
    try {
      const info=await stat(target),ext=path.extname(target),etag=`W/"${info.size.toString(16)}-${Math.trunc(info.mtimeMs).toString(16)}"`;
      const cacheControl=['.png','.webp','.mp3','.mp4'].includes(ext)?'public, max-age=86400':'no-cache';
      const headers={ 'Content-Type': mime[ext], 'Content-Length': info.size, 'X-Content-Type-Options': 'nosniff', 'Content-Security-Policy': "default-src 'self'; style-src 'self'; style-src-attr 'unsafe-inline'; script-src 'self'; img-src 'self'; connect-src 'self'; frame-ancestors 'none'", 'Cache-Control':cacheControl, 'ETag':etag, 'Last-Modified':info.mtime.toUTCString() };
      const since=req.headers['if-modified-since'];
      const matchTag=req.headers['if-none-match']?.split(',').some(value=>value.trim()==='*'||value.trim()===etag);
      if(matchTag||(!req.headers['if-none-match']&&since&&Math.floor(info.mtimeMs/1000)<=Math.floor(Date.parse(since)/1000))){res.writeHead(304,headers);return res.end();}
      if(['.mp3','.mp4'].includes(ext))headers['Accept-Ranges']='bytes';
      let range;
      if(req.headers.range&&['.mp3','.mp4'].includes(ext)){
        const match=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
        const start=match?.[1]?Number(match[1]):Math.max(0,info.size-Number(match?.[2]||0)),end=match?.[1]&&match[2]?Math.min(info.size-1,Number(match[2])):info.size-1;
        if(!match||start>end||start>=info.size){res.writeHead(416,{'Content-Range':`bytes */${info.size}`});return res.end();}
        range={start,end};headers['Content-Range']=`bytes ${start}-${end}/${info.size}`;headers['Content-Length']=end-start+1;
      }
      res.writeHead(range?206:200,headers);
      if(req.method==='HEAD')return res.end();
      const stream=createReadStream(target,range);
      res.on('close',()=>stream.destroy());
      stream.on('error',error=>{if(!res.headersSent)json(res,500,{error:'Falha ao carregar o arquivo.'});else res.destroy(error);});
      stream.pipe(res);
    } catch (e) { if (e.code !== 'ENOENT') throw e; json(res,404,{ error: 'Arquivo não encontrado.' }); }
  } catch (e) { if (!(e instanceof RuleError)) console.error(e); json(res,e instanceof RuleError ? 400 : 500,{ error: e instanceof RuleError ? e.message : 'Falha interna do servidor.' }); }
  finally { release?.(); }
});
const port = Number(process.env.PORT || 4173);
const host = process.env.HOST || (process.env.NODE_ENV === 'production' ? '0.0.0.0' : '127.0.0.1');
ensureRealmWorld(world,REGIONS);

const worldTickMs = Number(
  process.env.WORLD_TICK_MS ||
  (process.env.NODE_ENV === 'production' ? 500 : 250)
);

console.log(
  `World tick configurado para ${worldTickMs}ms (${process.env.NODE_ENV || 'development'})`
);
let worldTickPending = false;

/*
 * IMPORTANTE:
 *
 * A simulacao global de Vespera e pesada demais para a CPU
 * do Render Free e pode bloquear completamente o event loop,
 * inclusive /api/health.
 *
 * Em desenvolvimento ela continua ligada.
 *
 * Em producao pode ser reativada explicitamente com:
 *
 * WORLD_SIMULATION_ENABLED=true
 */
const worldSimulationEnabled =
  process.env.WORLD_SIMULATION_ENABLED !== 'false';

let worldTimer = null;

if (worldSimulationEnabled) {

  worldTimer = setInterval(() => {

    if (worldTickPending) return;

    worldTickPending = true;

    exclusiveWorldTask(async () => {

      const now = Date.now();

      for (const [key, challenge] of worldChallenges) {
        if (challenge.expiresAt <= now) {
          worldChallenges.delete(key);
        }
      }

      if (advanceRealmWorld(world, profiles, REGIONS, now)) {

        markWorldDirty();

        for (const profile of profiles.values()) {
          if (profile.realm?.roaming) {
            worldDirtyProfiles.add(profile.id);
          }
        }
      }

      realmLivePulse(id => {

        const profile = profiles.get(id);

        return profile?.realm
          ? liveWorldFor(profile, now)
          : null;
      });

    })
    .catch(error => {
      console.error(
        'Falha ao atualizar o mundo dos Reinos.',
        error
      );
    })
    .finally(() => {

      worldTickPending = false;

      void flushRealmWorld().catch(error => {
        console.error(
          'Falha ao salvar o mundo dos Reinos.',
          error
        );
      });

    });

  }, worldTickMs);

  worldTimer.unref();

  console.log(
    `Simulacao global ATIVA · tick ${worldTickMs}ms`
  );

} else {

  console.log(
    'Simulacao global DESATIVADA no Render para preservar o event loop HTTP.'
  );

}
server.once('error', error => {
  console.error('Falha fatal ao iniciar servidor HTTP:', error);
  process.exit(1);
});

server.listen(port, host, () => {
  const address = server.address();

  console.log(
    `Bloodmoon HTTP ONLINE em ${address.address}:${address.port} · ${mongoStore ? 'MongoDB Atlas' : 'persistência local'}`
  );
});

for(const signal of ['SIGINT','SIGTERM'])process.once(signal,()=>{
  if(worldTimer)clearInterval(worldTimer);clearInterval(maintenanceTimer);closeRealmStreams();
  server.close(async()=>{
    try{await exclusiveWorldTask(()=>flushRealmWorld(true));await saving;await mongoStore?.close();process.exit(0);}
    catch{process.exit(1);}
  });
});

