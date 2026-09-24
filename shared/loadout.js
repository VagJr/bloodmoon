import {CARDS} from './cards.js';
import {countCards,deckCollection,validateDeck,reconcileDepletedGear} from './progression.js';

// Each reserve belongs to one occurrence, not every duplicate of the unit.
export function reserveSlots(deck){
 const slots=new Map(),used=new Set();
 for(const refill of deck.autoRefills||[]){for(let i=deck.cards.length-1;i>=0;i--)if(deck.cards[i]===refill.replacementId&&!used.has(i)){slots.set(i,refill);used.add(i);break;}}
 return slots;
}
export function loadoutStatus(profile,deck){
 if(!deck)return {ready:false,error:'Escolha um deck para esta linhagem.'};
 try{validateDeck(deck.cards,deck.faction,deckCollection(profile.collection,deck.autoRefills),(profile.items||[]).filter(i=>!i.locked));return {ready:true,error:null};}catch(e){return {ready:false,error:e.message};}
}
export function suggestLoadout(profile,deck){
 const copy=structuredClone({...profile,decks:[deck],items:(profile.items||[]).filter(i=>!i.locked)});
 reconcileDepletedGear(copy);
 const draft=copy.decks[0],changes=[];
 for(const [index,refill] of reserveSlots(draft)){
  const original=CARDS[refill.equipmentId],counts=countCards(draft.cards);
  const candidates=[...new Set(copy.items.filter(i=>i.durability>0&&!i.listingId).map(i=>i.cardId))].map(id=>CARDS[id]).filter(c=>c?.type==='equipment'&&['neutral',deck.faction].includes(c.faction));
  candidates.sort((a,b)=>Number(b.id===original?.id)-Number(a.id===original?.id)||Number(b.gearEffect===original?.gearEffect)-Number(a.gearEffect===original?.gearEffect)||Math.abs(a.cost-(original?.cost||0))-Math.abs(b.cost-(original?.cost||0))||a.id.localeCompare(b.id));
  for(const card of candidates){
   const available=copy.items.filter(i=>i.cardId===card.id&&i.durability>0&&!i.listingId).length;if((counts[card.id]||0)>=available)continue;
   const trial={...draft,cards:[...draft.cards],autoRefills:draft.autoRefills.filter(r=>r!==refill)};trial.cards[index]=card.id;
   if(!loadoutStatus(copy,trial).ready)continue;
   draft.cards=trial.cards;draft.autoRefills=trial.autoRefills;break;
  }
 }
 for(let i=0;i<deck.cards.length;i++)if(deck.cards[i]!==draft.cards[i])changes.push({index:i,from:deck.cards[i],to:draft.cards[i]});
 return {cards:draft.cards,autoRefills:draft.autoRefills,changes,...loadoutStatus(copy,draft)};
}
