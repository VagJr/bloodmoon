import {equippedItem} from './realm-equipment.js';
import {RuleError} from './engine.js';
import {CARDS} from './cards.js';
import {ECONOMY,makeItem,applyDurabilityWear} from './progression.js';

const check=(value,message)=>{if(!value)throw new RuleError(message);};
const distance=(a,b)=>Math.hypot((a.x-b.x)*1.5,a.y-b.y);
const gearByRarity=Object.values(CARDS).filter(c=>c.type==='equipment').reduce((pool,card)=>{(pool[card.rarity||'common']||=[]).push(card.id);return pool;},{});
export const REALM_LOOT_TABLE=Object.freeze({
 common:{coins:[3,8],material:[0,2],scrap:[0,1],gearChance:.08,rarities:[['common',95],['uncommon',5]]},
 veteran:{coins:[8,16],material:[1,3],scrap:[0,2],gearChance:.19,rarities:[['common',70],['uncommon',28],['rare',2]]},
 elite:{coins:[15,30],material:[2,5],scrap:[1,3],gearChance:.38,rarities:[['common',35],['uncommon',48],['rare',15],['epic',2]]},
 ascendant:{coins:[22,44],material:[3,6],scrap:[2,4],gearChance:.52,rarities:[['uncommon',42],['rare',48],['epic',10]]},
 raid:{coins:[35,65],material:[3,7],scrap:[2,5],gearChance:.72,rarities:[['uncommon',45],['rare',47],['epic',8]]}
});
const range=(pair,rng)=>pair[0]+Math.floor(rng()*(pair[1]-pair[0]+1));
function rarity(table,rng){const value=rng()*100;let sum=0;for(const [name,weight] of table.rarities){sum+=weight;if(value<sum)return name;}return table.rarities[0][0];}
export function rollRealmLoot(actor,rng=Math.random){
 const rank=actor.kind==='raid'?'raid':actor.level>=17?'ascendant':actor.kind==='invader'||actor.name?.startsWith('ÉLITE')?'elite':actor.name?.startsWith('VETERANO')||actor.level>=9?'veteran':'common',table=REALM_LOOT_TABLE[rank],resource=['timber','ore','essence'].includes(actor.resource)?actor.resource:actor.habitat==='forest'?'timber':['mountain','volcanic'].includes(actor.habitat)?'ore':'essence';
 const grade=rarity(table,rng),candidates=gearByRarity[grade]||gearByRarity.common||[];
 return {coins:range(table.coins,rng),materials:{[resource]:range(table.material,rng)},scrap:range(table.scrap,rng),gear:rng()<table.gearChance&&candidates.length?candidates[Math.floor(rng()*candidates.length)]:null};
}
export function spawnRealmLoot(w,actor,killer,now,rng=Math.random){
 if(!killer?.realm)return null;
 const contributors=Object.entries(actor.damageContributors||{}).filter(([,value])=>value.damage>0&&now-value.at<20000).map(([id])=>id),eligible=[...new Set([killer.realm.publicId,...contributors])].slice(0,8);
 const rewards=Object.fromEntries(eligible.map(id=>[id,rollRealmLoot(actor,rng)]));
 const drop={id:`loot-${++w.serial}`,kind:'loot',name:`Espólio · ${actor.name}`,node:actor.node,sourceId:actor.id,x:actor.x,y:actor.y,homeX:actor.x,homeY:actor.y,hp:1,maxHp:1,level:actor.level||1,rank:actor.kind==='raid'?'raid':actor.name?.startsWith('ÉLITE')?'elite':'common',rewards,claims:{},ownerUntil:now+90000,expiresAt:now+210000,spawnedAt:now,state:eligible.length>1?'Saque partilhado entre combatentes':'Espólio de caçada'};
 w.actors.push(drop);return drop;
}
export function lootView(drop,p,now){
 const id=p.realm.publicId,claimed=Object.values(drop.claims||{}).includes(id),own=!claimed&&drop.rewards?.[id]&&!drop.claims?.[id],free=now>=drop.ownerUntil,remaining=Object.keys(drop.rewards||{}).filter(key=>!drop.claims?.[key]);
 const reward=claimed?null:own?drop.rewards[id]:free&&remaining.length?drop.rewards[remaining[0]]:null;
 return {eligible:!!reward,protected:!claimed&&!own&&!free,claimed,coins:reward?.coins||0,gear:reward?.gear||null,scrap:reward?.scrap||0,materials:reward?.materials||{},expiresAt:drop.expiresAt};
}
export function claimRealmLoot(w,p,drop,now){
 check(drop?.kind==='loot'&&drop.hp>0&&drop.expiresAt>now,'Este espólio desapareceu.');
 check(distance(p.realm.roaming,drop)<=4.2,'Aproxime-se do espólio.');
  const id=p.realm.publicId,remaining=Object.keys(drop.rewards||{}).filter(key=>!drop.claims?.[key]);
  check(!Object.values(drop.claims||{}).includes(id),'Você já recolheu sua parte deste espólio.');
 const claimKey=remaining.includes(id)?id:now>=drop.ownerUntil?remaining[0]:null;
 check(claimKey,'O espólio pertence aos combatentes até o fim da proteção.');
 const reward=drop.rewards[claimKey];drop.claims[claimKey]=id;
 p.coins=(p.coins||0)+reward.coins;p.scrap=(p.scrap||0)+(reward.scrap||0);
 for(const [resource,amount] of Object.entries(reward.materials||{}))p.realm.materials[resource]=(p.realm.materials[resource]||0)+amount;
 if(reward.gear){p.items||=[];p.items.push(makeItem(reward.gear,undefined,'realm-drop'));}
 if(Object.keys(drop.rewards).every(key=>drop.claims[key]))w.actors=w.actors.filter(a=>a!==drop);
 return {message:`Espólio coletado: +${reward.coins} Marcas${reward.gear?`, ${CARDS[reward.gear].name}`:''}${reward.scrap?`, +${reward.scrap} sucata`:''}.`,reward};
}
export function wearRealmGear(p,now){
 const s=p.realm?.roaming;if(!s?.equipment?.length||now-(s.gearWearAt||0)<20000)return null;
 const cardId=s.equipment.find(id=>equippedItem(p,id));if(!cardId)return null;
 const item=equippedItem(p,cardId);if(!item)return null;
 s.gearWearAt=now;const worn=applyDurabilityWear(item.durability,1,Math.random());item.durability=worn.durability;
 if(worn.exhausted){const at=s.equipment.indexOf(cardId);if(at>=0)s.equipment.splice(at,1);if(s.equipmentItems)delete s.equipmentItems[cardId];}
 if(worn.broken){p.items=p.items.filter(i=>i!==item);p.scrap=(p.scrap||0)+(ECONOMY.breakScrap[item.rarity]||4);}
 return {itemId:item.id,cardId,durability:worn.durability,broken:worn.broken};
}
export function dropEquippedGear(p){
 const s=p.realm?.roaming,gear=[];if(!s?.equipment?.length)return gear;
 for(const cardId of [...s.equipment]){
  const pinned=s.equipmentItems?.[cardId];const item=(p.items||[]).find(i=>(!pinned||i.id===pinned)&&i.cardId===cardId&&!i.bound&&!i.listingId&&!i.lockedBy&&i.durability>=0&&!gear.includes(i));
  if(!item)continue;gear.push(item);const at=s.equipment.indexOf(cardId);if(at>=0)s.equipment.splice(at,1);if(s.equipmentItems)delete s.equipmentItems[cardId];
 }
 if(gear.length)p.items=p.items.filter(i=>!gear.includes(i));return gear;
}
