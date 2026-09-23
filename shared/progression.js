import { CARDS, DECKS } from './cards.js';

export const ECONOMY = {
  boosterCost: 100,
  boosterSlots: ['common','common','uncommon','premium'],
  premiumOdds: { rare: 78, epic: 19, legendary: 3 },
  boosterGearRarityOdds: { common:60, uncommon:25, rare:12, epic:3, legendary:0 },
  boosterGearPerPack: 1,
  duplicateDust: { common: 8, uncommon: 16, rare: 40, epic: 100, legendary: 250 },
  craftDust: { common: 40, uncommon: 90, rare: 220, epic: 500, legendary: 1000 },
  copyLimit: { default: 2, legendary: 1 },
  rewards: { duelWin: 45, duelLoss: 25, practiceWin: 20, practiceLoss: 10, dungeonWin: 50, dungeonLoss: 20, levelCoins: 60, levelDust: 10 },
  gearDurability: 3,
  marketTaxPercent: 7,
  marketListingFeePercent: 3,
  marketMinPrice: 5,
  marketMaxPrice: 5000,
  marketListingHours: 72,
  repairCost: { common:12, uncommon:20, rare:36, epic:60, legendary:100 },
  breakScrap: { common:4, uncommon:7, rare:12, epic:20, legendary:35 },
  craftGear: { common:{coins:25,scrap:18}, uncommon:{coins:50,scrap:32}, rare:{coins:100,scrap:60}, epic:{coins:200,scrap:110}, legendary:{coins:350,scrap:180} }
};

export const CONTRACTS = [
  { id:'matches', name:'O juramento continua', goal:3, reward:{coins:60}, label:'Conclua 3 caçadas' },
  { id:'kills', name:'A presa não escapa', goal:5, reward:{coins:50,dust:10}, label:'Abata 5 combatentes rivais' },
  { id:'wins', name:'Nome escrito em sangue', goal:2, reward:{coins:80,dust:15}, label:'Vença 2 caçadas' }
];

export const DECK_RULES = { size:20, minUnits:8, minAffordableUnits:2, maxEquipment:6, maxAverageCost:4.5, maxCopies:2, maxLegendaryCopies:1 };

const defaultId=()=>`gear-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,10)}`;
export function makeItem(cardId,createId=defaultId,source='loot',extra={}) {
  const card=CARDS[cardId];if(card?.type!=='equipment')throw new Error('Este item não pode ser equipado.');
  return {id:createId(),cardId,rarity:card.rarity,durability:ECONOMY.gearDurability,maxDurability:ECONOMY.gearDurability,bound:source==='starter',source,createdAt:Date.now(),...extra};
}
export function ensureInventory(profile,createId=defaultId) {
  let changed=false;profile.collection ||= {};profile.items ||= [];profile.scrap ??= 0;
  for(const card of Object.values(CARDS))if(card.type==='equipment'){
    const legacy=Number(profile.collection[card.id]||0);
    if(legacy>0){for(let i=0;i<legacy;i++)profile.items.push(makeItem(card.id,createId,'legacy'));profile.collection[card.id]=0;changed=true;}
  }
  return changed;
}
export function ownedCardCount(cardId,collection={},items=[]) {
  const card=CARDS[cardId];if(card?.type==='equipment')return items.filter(i=>i.cardId===cardId&&i.durability>0&&!i.listingId).length;
  return collection[cardId]||0;
}

export function cardLimit(card) { return card?.rarity==='legendary'?DECK_RULES.maxLegendaryCopies:DECK_RULES.maxCopies; }
export function countCards(cards) { return cards.reduce((counts,id)=>(counts[id]=(counts[id]||0)+1,counts),{}); }

export function starterDeck(faction) {
  const cards=DECKS[faction];
  if(!cards)throw new Error('Facção inicial inválida.');
  return { name:faction==='vampire'?'Corte Rubra · Juramento Inicial':'Alcateia do Eclipse · Primeiro Uivo', faction, cards:[...cards], starter:true };
}

export function grantStarter(profile,faction='vampire',createId=defaultId) {
  let changed=ensureInventory(profile,createId);
  profile.coins ??= 0; profile.dust ??= 0; profile.collection ||= {}; profile.decks ||= []; profile.activeDecks ||= {};
  profile.contracts ||= {matches:0,kills:0,wins:0};
  if(!profile.starterGranted){
    const deck=starterDeck(faction);deck.id=createId();
    for(const [id,count] of Object.entries(countCards(deck.cards))){if(CARDS[id].type==='equipment'){for(let i=0;i<count;i++)profile.items.push(makeItem(id,createId,'starter'));}else profile.collection[id]=(profile.collection[id]||0)+count;}
    profile.decks.push(deck);profile.activeDecks[faction]=deck.id;profile.coins+=300;profile.starterFaction=faction;profile.starterGranted=true;changed=true;
  }
  return changed;
}

export function validateDeck(cards,faction,collection={},items=[]) {
  if(!Array.isArray(cards)||cards.length!==DECK_RULES.size)throw new Error(`O deck precisa ter exatamente ${DECK_RULES.size} cartas.`);
  if(!['vampire','werewolf'].includes(faction))throw new Error('Facção de deck inválida.');
  const counts=countCards(cards);let units=0,affordableUnits=0,equipment=0,totalCost=0;
  for(const [id,count] of Object.entries(counts)){
    const card=CARDS[id];if(!card)throw new Error(`Carta desconhecida: ${id}.`);
    if(card.faction!=='neutral'&&card.faction!==faction)throw new Error('O deck só pode usar sua facção e relíquias neutras.');
    if(count>cardLimit(card))throw new Error(`${card.name}: limite de ${cardLimit(card)} cópia(s) por deck.`);
    const owned=ownedCardCount(id,collection,items);
    if(count>owned)throw new Error(card.type==='equipment'?`Você só tem ${owned} item(ns) utilizável(is) de ${card.name}.`:`Você possui apenas ${owned} cópia(s) de ${card.name}.`);
    if(card.type==='equipment')equipment+=count;
    if(card.type==='unit'&&card.cost<=2)affordableUnits+=count;
  }
  for(const id of cards){const card=CARDS[id];if(card.type==='unit')units++;totalCost+=card.cost;}
  if(units<DECK_RULES.minUnits)throw new Error(`Inclua pelo menos ${DECK_RULES.minUnits} aliados.`);
  if(affordableUnits<DECK_RULES.minAffordableUnits)throw new Error(`Inclua pelo menos ${DECK_RULES.minAffordableUnits} aliados de custo 2 ou menos para garantir uma abertura jogável.`);
  if(equipment>DECK_RULES.maxEquipment)throw new Error(`O deck pode levar no máximo ${DECK_RULES.maxEquipment} cartas de equipamento.`);
  if(totalCost/cards.length>DECK_RULES.maxAverageCost)throw new Error('A curva média passou de 4,5 recursos. Troque algumas cartas caras por opções leves.');
  return analyzeDeck(cards);
}

export function cardBalance(card) {
  let value=0;
  if(card.type==='unit')value=card.attack*.9+card.health*.62+(card.influence||0)*.42+(card.keyword?1.15:0)+(card.keyword==='guard'?1.3:0)+(card.keyword==='overwhelm'?1.1:0)+(card.synergy?1.1:0);
  else if(card.type==='equipment')value=(card.attack||0)*.9+(card.health||0)*.58+1+({guard:1.25,bleed:1.1,lifesteal:1.25,pierce:1.05,fury:.95,mend:1,focus:1,rally:1}[card.gearEffect]||0);
  else if(card.effect==='damage')value=3.15;
  else if(card.effect==='drain')value=4.15;
  else if(card.effect==='execute')value=5.25;
  else if(card.effect==='rend')value=3.6;
  else if(card.effect==='heal')value=1.2+(card.effectAmount||3)*.34;
  else if(card.effect==='draw')value=1+(card.effectAmount||1)*.8;
  else if(card.effect==='sacrifice')value=3.4;
  else if(card.effect==='influence')value=2+(card.effectAmount||3)*.4;
  else if(card.effect==='pounce'||card.effect==='rally')value=2.2+(card.effectAmount||2)*.6;
  else if(card.effect==='guard')value=2.8;
  const expected=card.type==='unit'?2.7+card.cost*1.22:1.7+card.cost*1.1;
  return expected?Math.round(value/expected*100):100;
}

export function analyzeDeck(cards=[]) {
  const counts={court:0,pack:0,blood:0,ritual:0,bleed:0,moon:0,guard:0,grave:0,hunt:0,sacrifice:0,equipment:0},curve=[0,0,0,0,0,0];let units=0,spells=0,equipment=0,synergyCards=0,totalCost=0,budget=0;
  for(const id of cards){const c=CARDS[id];if(!c)continue;totalCost+=c.cost;budget+=cardBalance(c);curve[Math.min(5,c.cost)]++;if(c.type==='unit')units++;else if(c.type==='spell')spells++;else equipment++;if(c.synergy)synergyCards++;for(const tag of c.tags||[])if(Object.hasOwn(counts,tag))counts[tag]++;}
  const styles={
    'Corte de Sangue':counts.court+counts.blood*.5,
    'Matilha Ferida':counts.pack+counts.bleed*.7,
    'Ritual & Controle':counts.ritual+spells*.35,
    'Sacrifício Carmesim':counts.blood+counts.ritual*.4,
    'Guarda do Ossuário':counts.guard+counts.grave*.8,
    'Caçada Lunar':counts.moon+counts.hunt*.6,
    'Relicário de Guerra':counts.equipment+equipment*.5
  };
  const style=Object.entries(styles).sort((a,b)=>b[1]-a[1])[0]?.[0]||'Sem arquétipo';
  return { count:cards.length,units,spells,equipment,synergyCards,averageCost:cards.length?Number((totalCost/cards.length).toFixed(1)):0,curve,tags:counts,style,balance:cards.length?Math.round(budget/cards.length):0 };
}
