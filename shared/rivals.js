import { CARDS } from './cards.js';

// Named opponents are authored as deck builders and combat temperaments, not
// cosmetic skins over the same generic bot.
export const RIVALS = {
  greyfang: { id:'greyfang', name:'Dargan Presa-Cinza', title:'Mastim da Fronteira', faction:'werewolf', avatar:'kael', style:'CAÇADOR DE PRESSÃO', voice:'O rastro acaba quando você para de correr.', tags:{pack:4,hunt:4,bleed:2,moon:1}, lane:'hunt', aggression:1.35, heroAggression:1.35, removal:0.65, survival:0.55, threat:1 },
  moonseer: { id:'moonseer', name:'Sibil Arco-Lunar', title:'Oráculo do Uivo Branco', faction:'werewolf', avatar:'oracle', style:'RITUAL DA MATILHA', voice:'A lua já escolheu qual de nós vai sangrar.', tags:{moon:4,ritual:3,pack:2,bleed:1}, lane:'court', aggression:0.85, heroAggression:0.75, removal:1.1, survival:1.15, threat:2 },
  ironmaw: { id:'ironmaw', name:'Brakka Mandíbula de Ferro', title:'Quebra-Cerco do Pico', faction:'werewolf', avatar:'thorn', style:'GUARDA E CONTRA-ATAQUE', voice:'Quebre seus dentes contra o meu escudo.', tags:{guard:3,pack:2,moon:2,hunt:1}, lane:'crypt', aggression:0.8, heroAggression:0.65, removal:0.8, survival:1.45, threat:2 },
  stormcaller: { id:'stormcaller', name:'Eira Tempestade-de-Osso', title:'Condutora da Lua Fria', faction:'werewolf', avatar:'oracle', style:'COMBO LUNAR E SUPREMAS', voice:'Quando eu terminar de cantar, a arena será só silêncio.', tags:{moon:4,ritual:3,pack:2,bleed:1}, lane:'court', aggression:1.02, heroAggression:0.88, removal:1.05, survival:1.12, threat:3 },
  scarmaw: { id:'scarmaw', name:'Varkos Presa-Rachada', title:'Executor da Alcateia Cinzenta', faction:'werewolf', avatar:'kael', style:'MARCA, ABATE E PERSEGUE', voice:'Corra. Eu gosto quando a presa ainda acredita.', tags:{bleed:4,hunt:4,pack:2,removal:2}, lane:'hunt', aggression:1.42, heroAggression:1.3, removal:1.2, survival:0.7, threat:4 },
  redvein: { id:'redvein', name:'Lady Maeven Rubravena', title:'Dama do Dízimo', faction:'vampire', avatar:'vesper', style:'CORTE E SANGRIA', voice:'Toda ferida é uma assinatura. A sua já está no contrato.', tags:{blood:4,coven:3,lifesteal:2,ritual:1}, lane:'crypt', aggression:1.1, heroAggression:1.05, removal:1, survival:1.15, threat:1 },
  rosecouncil: { id:'rosecouncil', name:'Inquisidor Severin Vale', title:'Voz da Câmara Rubra', faction:'vampire', avatar:'raven', style:'CONTROLE POLÍTICO', voice:'A Corte votou. Você já perdeu.', tags:{court:4,coven:3,ritual:3,guard:1}, lane:'court', aggression:0.78, heroAggression:0.62, removal:1.2, survival:1.35, threat:2 },
  duskblade: { id:'duskblade', name:'Nera, a Última Testemunha', title:'Carrasca do Vitral', faction:'vampire', avatar:'vesper', style:'EXECUÇÃO E ELIMINAÇÃO', voice:'Olhe para mim. É a última coisa que verá.', tags:{blood:3,removal:4,blade:2,coven:1}, lane:'hunt', aggression:1.18, heroAggression:1.12, removal:1.5, survival:0.78, threat:2 },
  gravewarden: { id:'gravewarden', name:'Abade Odran', title:'Guardião do Sepulcro', faction:'vampire', avatar:'mordrath', style:'DEFESA DO OSSUÁRIO', voice:'Os mortos não cedem terreno.', tags:{grave:4,guard:3,relic:2,court:1}, lane:'crypt', aggression:0.7, heroAggression:0.55, removal:0.9, survival:1.55, threat:2 },
  bloodseer: { id:'bloodseer', name:'Iria das Sete Feridas', title:'Orácula do Véu', faction:'vampire', avatar:'oracle', style:'RITUAL E DRENAGEM', voice:'O futuro sangra antes de acontecer.', tags:{ritual:4,blood:3,lifesteal:2,coven:1}, lane:'court', aggression:0.86, heroAggression:0.85, removal:1.1, survival:1.2, threat:3 },
  abbess: { id:'abbess', name:'Madre Nhalia', title:'Abadessa Sem Rosto', faction:'vampire', avatar:'raven', style:'CHEFE · CORAL DE CONTROLE', voice:'Dê seu nome ao coro. Seu corpo não fará falta.', tags:{ritual:4,grave:3,coven:2,removal:2}, lane:'crypt', aggression:0.9, heroAggression:0.85, removal:1.4, survival:1.25, threat:4, boss:true },
  mordrath: { id:'mordrath', name:'Mordrath', title:'O Rei Sepultado', faction:'vampire', avatar:'mordrath', style:'CHEFE · REI DA ÚLTIMA NOITE', voice:'A coroa ainda está quente. Venha reclamá-la.', tags:{grave:4,blood:3,guard:2,removal:2}, lane:'crypt', aggression:1.12, heroAggression:1.05, removal:1.25, survival:1.2, threat:5, boss:true },
  hollowmaw: { id:'hollowmaw', name:'O Devorador de Ecos', title:'Fome no Coração do Abismo', faction:'werewolf', avatar:'kael', style:'CHEFE · FRENESI DEVORADOR', voice:'Não sobrou ninguém para lembrar seu nome.', tags:{pack:3,bleed:3,hunt:3,moon:1}, lane:'hunt', aggression:1.5, heroAggression:1.4, removal:0.85, survival:0.8, threat:5, boss:true }
};

const CURVES={unit:[1,2,2,3,3,1,2,3,4,2,3,4],spell:[1,2,2,3,3],equipment:[1,2,3]};
const scoreCard=(card,rival,targetCost)=>{
  const synergy=(card.tags||[]).reduce((score,tag)=>score+(rival.tags[tag]||0),0);
  const curve=Math.abs(card.cost-targetCost);
  const rarity={common:0,uncommon:.08,rare:.14,epic:.2,legendary:.18}[card.rarity]||0;
  const unitValue=card.type==='unit'?(card.attack*.16+card.health*.12+(card.influence||0)*.15+(card.synergy?.trigger ? .05 : 0)):0;
  return synergy+unitValue-curve*.82+rarity;
};
function select(cards,rival,type,amount,curve){
  const pool=cards.filter(card=>card.type===type).sort((a,b)=>scoreCard(b,rival,curve[0])-scoreCard(a,rival,curve[0])||a.cost-b.cost||a.id.localeCompare(b.id));
  const result=[],counts={};
  for(let i=0;i<amount;i++){
    const target=curve[i%curve.length];
    const choice=pool.filter(card=>(counts[card.id]||0)<(card.rarity==='legendary'?1:2)).sort((a,b)=>scoreCard(b,rival,target)-scoreCard(a,rival,target)||a.cost-b.cost||a.id.localeCompare(b.id))[0];
    if(!choice)break;result.push(choice.id);counts[choice.id]=(counts[choice.id]||0)+1;
  }
  return result;
}
export function buildRivalDeck(rivalId){
  const rival=RIVALS[rivalId]||RIVALS.greyfang;
  const pool=Object.values(CARDS).filter(card=>card.faction===rival.faction||card.faction==='neutral');
  const units=select(pool,rival,'unit',12,CURVES.unit),spells=select(pool,rival,'spell',5,CURVES.spell),gear=select(pool,rival,'equipment',3,CURVES.equipment);
  const deck=[...units,...spells,...gear];
  // The starter deck is a safe fallback for future editions with a sparse faction pool.
  const starter=Object.values(CARDS).filter(card=>card.faction===rival.faction||card.faction==='neutral').map(card=>card.id);
  while(deck.length<20){const next=starter.find(id=>deck.filter(card=>card===id).length<(CARDS[id].rarity==='legendary'?1:2));if(!next)break;deck.push(next);}
  return deck.slice(0,20);
}
export function practiceRival(playerFaction,matchCount=0){
  const faction=playerFaction==='vampire'?'werewolf':'vampire';
  const roster=Object.values(RIVALS).filter(r=>r.faction===faction&&!r.boss).sort((a,b)=>a.threat-b.threat||a.id.localeCompare(b.id));
  return roster[Math.max(0,Number(matchCount)||0)%roster.length];
}
const CAMPAIGN_STYLE={haven:'rush',rosekeep:'court',moonwood:'bleed',quarry:'guard',crown:'control',marsh:'blood',peak:'rush',lake:'ritual',bridge:'guard',citadel:'execution',observatory:'ritual',ashroad:'bleed',crypt:['guard','blood','boss'],abbey:['bleed','ritual','boss'],abyss:['rush','control','boss']};
const STYLE_MATCH={vampire:{rush:'duskblade',bleed:'redvein',guard:'gravewarden',blood:'redvein',court:'rosecouncil',control:'rosecouncil',execution:'duskblade',ritual:'bloodseer',boss:'mordrath'},werewolf:{rush:'greyfang',bleed:'greyfang',guard:'ironmaw',blood:'moonseer',court:'ironmaw',control:'moonseer',execution:'greyfang',ritual:'moonseer',boss:'hollowmaw'}};
export function campaignRival(playerFaction,node,stage=0){
  const stages=CAMPAIGN_STYLE[node]||'rush',style=Array.isArray(stages)?stages[Math.min(Math.max(0,stage),stages.length-1)]:stages;
  let id=STYLE_MATCH[playerFaction==='vampire'?'werewolf':'vampire'][style]||'greyfang';
  // The campaign's named crypt monarch remains the chapter finale in Mordrath's own tomb.
  if(node==='crypt'&&stage>=2)id='mordrath';
  if(node==='abbey'&&stage>=2)id='abbess';
  if(node==='abyss'&&stage>=2)id='hollowmaw';
  return RIVALS[id];
}
