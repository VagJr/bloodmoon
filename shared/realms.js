import { RuleError } from './engine.js';
import { CARDS } from './cards.js';
import { makeItem } from './progression.js';
import { CHAPTERS,TALENTS,ensureAdventure,dailyState,chapterProgress,talentPoints,adventureJournal } from './adventure.js';

export const REGIONS = [
  {id:'haven',name:'Porto das Cinzas',kind:'sanctuary',x:48,y:48,level:1,board:'court-board',resource:'timber',links:['rosekeep','moonwood','quarry'],description:'O último porto neutro de Véspera. Casas rivais dividem a taverna, a forja e seus segredos.',icon:'⌂'},
  {id:'rosekeep',name:'Bastião das Rosas',kind:'fortress',x:25,y:28,level:1,board:'court-board',resource:'essence',links:['haven','crown','marsh'],description:'Torres rubras vigiam os caminhos da Corte. Quem controla seus portões controla o oeste.',icon:'♜'},
  {id:'moonwood',name:'Bosque da Lua Oca',kind:'wilds',x:70,y:27,level:1,board:'forest-board',resource:'timber',links:['haven','peak','lake'],description:'Uivos atravessam a névoa. Caravanas desaparecem onde as raízes abraçam a estrada.',icon:'☾'},
  {id:'quarry',name:'Pedreira dos Juramentos',kind:'mine',x:42,y:68,level:1,board:'siege-board',resource:'ore',links:['haven','marsh','crypt','bridge'],description:'Ferro negro, pedreiros sem nome e uma dívida antiga alimentam as forjas do reino.',icon:'⚒'},
  {id:'crown',name:'Coroa de Espinhos',kind:'capital',x:18,y:13,level:2,board:'court-board',resource:'essence',links:['rosekeep'],description:'Uma corte sem soberano, onde cada cadeira vazia é uma declaração de guerra.',icon:'♛'},
  {id:'marsh',name:'Pântano Carmesim',kind:'wilds',x:20,y:62,level:1,board:'forest-board',resource:'essence',links:['rosekeep','quarry'],description:'Velhas relíquias afundam sob águas cor de vinho. As feridas da terra ainda respiram.',icon:'♦'},
  {id:'peak',name:'Pico do Primeiro Uivo',kind:'fortress',x:84,y:15,level:2,board:'forest-board',resource:'ore',links:['moonwood','lake'],description:'A fortaleza ancestral das alcateias foi esculpida no osso da montanha.',icon:'♜'},
  {id:'lake',name:'Lago do Véu Partido',kind:'wilds',x:85,y:43,level:1,board:'forest-board',resource:'essence',links:['moonwood','peak','bridge'],description:'Reflexos de luas esquecidas prometem poder aos que enfrentam seus guardiões.',icon:'◈'},
  {id:'crypt',name:'Sepulcro de Mordrath',kind:'dungeon',x:48,y:88,level:2,board:'crypt-board',resource:'ore',links:['quarry','bridge'],description:'Uma expedição em três mesas. Venza os guardiões, abra a tumba e desafie o Rei Sepultado.',icon:'☠'},
  {id:'bridge',name:'Ponte das Viúvas',kind:'fortress',x:67,y:63,level:1,board:'siege-board',resource:'ore',links:['quarry','lake','crypt','citadel'],description:'A travessia entre dois reinos. Sob as correntes, os nomes dos mortos ecoam.',icon:'♜'},
  {id:'citadel',name:'Cidadela do Eclipse',kind:'capital',x:84,y:78,level:3,board:'siege-board',resource:'essence',links:['bridge','abyss'],description:'A última mesa da conquista. Seu estandarte será visto em toda Véspera.',icon:'♛'},
  {id:'observatory',name:'Observatório do Véu',kind:'wilds',x:52,y:12,level:3,board:'court-board',resource:'essence',links:['moonwood','crown'],description:'Astrolábios leem constelações que deixaram de existir. Aqui, toda estrela tem uma dívida.',icon:'✧'},
  {id:'abbey',name:'Abadia Sem Rosto',kind:'dungeon',x:9,y:44,level:4,board:'crypt-board',resource:'essence',links:['marsh','crown'],description:'Três vigílias entre vitrais partidos. Os monges guardam os nomes de seus futuros visitantes.',icon:'☠'},
  {id:'ashroad',name:'Estrada dos Exilados',kind:'wilds',x:67,y:88,level:3,board:'siege-board',resource:'timber',links:['crypt','bridge','abyss'],description:'Caravanas de ambas as linhagens cruzam cinzas que ainda guardam calor.',icon:'◇'},
  {id:'abyss',name:'Coração do Abismo',kind:'dungeon',x:94,y:59,level:5,board:'crypt-board',resource:'ore',links:['citadel','ashroad','lake'],description:'A última fronteira. Uma fome sem rosto aguarda além das três portas do eclipse.',icon:'☠'}
];
for(const node of REGIONS)for(const id of [...node.links]){const other=REGIONS.find(n=>n.id===id);if(other&&!other.links.includes(node.id))other.links.push(node.id);}
export const AVATARS=['vesper','kael','mordrath','raven','thorn','oracle'];
export const POLICIES={expedition:{name:'Expedição',description:'+1 madeira, minério ou essência nas vitórias de expedição.'},commerce:{name:'Comércio',description:'+5 Marcas na primeira vitória remunerada em cada região a cada cinco minutos.'},bastion:{name:'Bastião',description:'Fortalezas exigem uma vitória adicional de invasores para serem tomadas.'}};
export const MATERIALS={timber:'Madeira',ore:'Minério',essence:'Essência'};
const check=(ok,message)=>{if(!ok)throw new RuleError(message);};
const region=id=>REGIONS.find(n=>n.id===id);
export function createWorld(){return {version:1,houses:[],territories:Object.fromEntries(REGIONS.filter(n=>['capital','fortress'].includes(n.kind)).map(n=>[n.id,{owner:null,influence:{},protectedUntil:0}])),wars:[],events:[]};}
export function enterRealms(profile,createId,now=Date.now()){
  if(profile.realm)return ensureAdventure(profile.realm);
  profile.realm={publicId:createId(),version:1,location:'haven',avatar:profile.starterFaction==='werewolf'?'kael':'vesper',xp:0,level:1,provisions:20,materials:{timber:0,ore:0,essence:0},holdings:{camp:1,forge:0,library:0},visited:['haven'],gathered:{},claims:{},houseId:null,activeRoom:null,expedition:null,seenAt:now};
  ensureAdventure(profile.realm);return true;
}
function journal(world,text,now){world.events.unshift({text,at:now});world.events=world.events.slice(0,60);world.version++;}
function houseOf(world,profile){return world.houses.find(h=>h.id===profile.realm.houseId);}
function debit(profile,coins,materials={}){check(profile.coins>=coins,`São necessárias ${coins} Marcas.`);for(const [k,v]of Object.entries(materials))check(profile.realm.materials[k]>=v,`Faltam ${MATERIALS[k]}: são necessários ${v}.`);profile.coins-=coins;for(const [k,v]of Object.entries(materials))profile.realm.materials[k]-=v;}
function gainXP(r,amount){r.xp+=amount;r.level=1+Math.floor(r.xp/120);}
export function expirePolitics(world,now=Date.now()){
  let changed=false;
  for(const war of world.wars)if(war.status==='active'&&war.endsAt<=now){war.status='ended';journal(world,'O prazo de uma guerra terminou. As fronteiras conquistadas permanecem.',now);changed=true;}
  for(const h of world.houses)if(h.proposal&&h.proposal.endsAt<=now){h.proposal=null;journal(world,`A votação de ${h.name} encerrou sem quórum.`,now);changed=true;}
  return changed;
}
export function realmView(world,profile,profiles,now=Date.now(),includeProfile=true){
  const r=profile.realm;r.seenAt=now;
  const people=[],byPublicId=new Map();
  for(const p of profiles.values())if(p.realm){
    byPublicId.set(p.realm.publicId,p);
    if(now-p.realm.seenAt<45000)people.push({id:p.realm.publicId,name:p.name,avatar:p.realm.avatar,location:p.realm.location,level:p.realm.level,faction:p.starterFaction,houseId:p.realm.houseId,busy:!!p.realm.activeRoom});
  }
  const profileView=includeProfile?profile:{id:profile.id,name:profile.name,starterFaction:profile.starterFaction,level:profile.level||1,xp:profile.xp||0,coins:profile.coins||0,dust:profile.dust||0,scrap:profile.scrap||0};
  return {version:world.version,serverTime:now,player:structuredClone(r),regions:REGIONS,territories:world.territories,houses:world.houses.map(h=>({...h,members:h.members.map(id=>({id,name:byPublicId.get(id)?.name||'Viajante'}))})),wars:world.wars.slice(-30),events:world.events.slice(0,12),online:people,profile:profileView};
}
export function realmAction(world,profile,input,createId,now=Date.now()){
  expirePolitics(world,now);
  const r=profile.realm;check(r,'Entre em Reinos primeiro.');check(input.version===r.version,'Sua aventura mudou. Atualize o mapa e tente novamente.');
  const here=region(r.location),house=houseOf(world,profile),action=input.type;
  ensureAdventure(r);const adventure=r.adventure;
  check(!r.activeRoom||action==='avatar','Conclua ou abandone o combate antes de agir no mundo.');
  if(action==='travel'){
    const destination=region(input.destination);check(destination&&here.links.includes(destination.id),'Viaje por uma rota conectada.');check(r.level>=destination.level,`Esta região exige nível de exploração ${destination.level}.`);check(r.provisions>0,'Reabasteça suas provisões no acampamento.');
    r.provisions--;r.location=destination.id;r.expedition=null;if(!r.visited.includes(destination.id)){r.visited.push(destination.id);gainXP(r,20);}
  }else if(action==='retreat'){r.location='haven';r.expedition=null;}
  else if(action==='gather'){
    check(here.kind!=='sanctuary','Explore uma região para coletar recursos.');check(now-(r.gathered[here.id]||0)>=60000,'Este local ainda se recupera. Aguarde um minuto entre coletas.');check(r.provisions>=1,'Você precisa de uma provisão.');
    r.provisions--;r.gathered[here.id]=now;const amount=2+r.holdings.camp+adventure.talents.scout;r.materials[here.resource]+=amount;gainXP(r,8);adventure.stats.gathers++;dailyState(r,now).gathers++;adventureJournal(r,`Coleta em ${here.name}: +${amount} ${MATERIALS[here.resource]}.`,now);
  }else if(action==='rest'){check(r.provisions<20+r.holdings.camp*5,'Suas provisões estão completas.');debit(profile,10);r.provisions=Math.min(20+r.holdings.camp*5,r.provisions+8+adventure.talents.warden*2);}
  else if(action==='relief'){check(here.id==='haven','O auxílio é oferecido no Porto das Cinzas.');check(!adventure.reliefAt||now-adventure.reliefAt>=3600000,'O porto pode ajudá-lo novamente após uma hora.');check(r.provisions<8,'Guarde o auxílio para quando restarem menos de 8 provisões.');r.provisions=8;adventure.reliefAt=now;adventureJournal(r,'Iria compartilhou os mantimentos do porto. Sua jornada continua.',now);}
  else if(action==='talent'){check(Object.hasOwn(TALENTS,input.talent),'Especialização desconhecida.');check(talentPoints(r)>0,'Alcance outro nível de exploração para ganhar um ponto.');check(adventure.talents[input.talent]<3,'Esta especialização já está no grau máximo.');adventure.talents[input.talent]++;}
  else if(action==='respec'){check(Object.values(adventure.talents).some(n=>n>0),'Nenhum ponto foi distribuído.');debit(profile,40);adventure.talents={scout:0,warden:0,artisan:0};}
  else if(action==='chapter'){
    const progress=chapterProgress(r);check(progress.ready,'Conclua os objetivos deste capítulo primeiro.');const chapter=progress.chapter,choice=chapter.choices.find(c=>c[0]===input.choice);check(choice,'Escolha como encerrar este capítulo.');
    check(!adventure.claimed.includes(chapter.id),'Este capítulo já foi concluído.');const reward=chapter.reward;profile.coins+=reward.coins||0;profile.dust=(profile.dust||0)+(reward.dust||0);profile.scrap=(profile.scrap||0)+(reward.scrap||0);for(const key of Object.keys(MATERIALS))r.materials[key]+=reward[key]||0;
    if(reward.gear){const pool=Object.values(CARDS).filter(c=>c.type==='equipment'&&c.rarity===reward.gear);profile.items||=[];profile.items.push(makeItem(pool[adventure.chapter%pool.length].id,createId,'chronicle'));}
    adventure.claimed.push(chapter.id);adventure.choices[chapter.id]=choice[0];adventure.chapter++;gainXP(r,40);adventureJournal(r,`${chapter.title}: ${choice[1]}. ${choice[2]}`,now);
  }
  else if(action==='daily-claim'){const day=dailyState(r,now);check(!day.claimed&&day.gathers>=3&&day.wins>=2,'A comissão exige 3 coletas e 2 vitórias e só pode ser recebida uma vez por dia.');day.claimed=true;profile.coins+=60;profile.scrap=(profile.scrap||0)+10;gainXP(r,30);adventureJournal(r,'Comissão da Vigília concluída: +60 Marcas e +10 sucatas.',now);}
  else if(action==='forge-gear'){check(r.holdings.forge>=1,'Construa sua Forja primeiro.');const rarity=r.holdings.forge>=3?'uncommon':'common';debit(profile,rarity==='common'?25:50,{ore:rarity==='common'?6:10,essence:2});const pool=Object.values(CARDS).filter(c=>c.type==='equipment'&&c.rarity===rarity);profile.items||=[];const card=pool[(profile.items.length+adventure.stats.gathers)%pool.length];profile.items.push(makeItem(card.id,createId,'realm-forge'));adventureJournal(r,`Relíquia forjada: ${card.name}. Encontre-a no Relicário.`,now);}
  else if(action==='upgrade'){
    check(['camp','forge','library'].includes(input.building),'Construção desconhecida.');const level=r.holdings[input.building];check(level<5,'A construção já está no nível máximo.');
    debit(profile,20*(level+1),{timber:4*(level+1),ore:3*(level+1)});r.holdings[input.building]++;gainXP(r,25);
  }else if(action==='refine'){check(r.holdings.forge>0,'Construa uma forja primeiro.');debit(profile,5,{ore:3});profile.scrap+=4+r.holdings.forge+adventure.talents.artisan*2;}
  else if(action==='study'){check(r.holdings.library>0,'Construa uma biblioteca primeiro.');debit(profile,5,{essence:3});profile.dust+=6+r.holdings.library*2;}
  else if(action==='avatar'){check(AVATARS.includes(input.avatar),'Avatar desconhecido.');r.avatar=input.avatar;}
  else if(action==='found'){
    check(!house,'Você já pertence a uma Casa.');const name=String(input.name||'').trim();check(name.length>=3&&name.length<=28,'Use um nome entre 3 e 28 caracteres.');check(!world.houses.some(h=>h.name.toLocaleLowerCase()===name.toLocaleLowerCase()),'Já existe uma Casa com esse nome.');check(world.houses.length<200,'O reino atingiu seu limite de Casas.');debit(profile,100);
    const h={id:createId(),name,faction:profile.starterFaction,leader:r.publicId,members:[r.publicId],treasury:0,policy:'expedition',proposal:null,createdAt:now};world.houses.push(h);r.houseId=h.id;journal(world,`${profile.name} fundou ${name}.`,now);
  }else if(action==='join'){
    check(!house,'Você já pertence a uma Casa.');const h=world.houses.find(h=>h.id===input.houseId);check(h&&h.faction===profile.starterFaction,'Escolha uma Casa da sua linhagem.');check(h.members.length<20,'Esta Casa já tem vinte membros.');h.members.push(r.publicId);r.houseId=h.id;journal(world,`${profile.name} jurou lealdade a ${h.name}.`,now);
  }else if(action==='donate'){check(house,'Entre em uma Casa.');const amount=Number(input.amount);check(Number.isInteger(amount)&&amount>=1&&amount<=1000,'Doe entre 1 e 1.000 Marcas.');debit(profile,amount);house.treasury+=amount;world.version++;}
  else if(action==='propose'){
    check(house&&house.leader===r.publicId,'Somente o fundador pode propor uma política.');check(!house.proposal,'Já existe uma proposta aberta.');check(Object.hasOwn(POLICIES,input.policy)&&input.policy!==house.policy,'Escolha outra política.');
    house.proposal={policy:input.policy,eligible:[...house.members],votes:[r.publicId],endsAt:now+600000};world.version++;resolveVote(house,world,now);
  }else if(action==='vote'){
    check(house?.proposal,'Não há uma proposta aberta.');check(house.proposal.eligible.includes(r.publicId),'Você entrou após o início desta votação.');check(!house.proposal.votes.includes(r.publicId),'Seu voto já foi contado.');house.proposal.votes.push(r.publicId);world.version++;resolveVote(house,world,now);
  }else if(action==='war'){
    check(house?.leader===r.publicId,'Somente o fundador pode declarar guerra.');const rival=world.houses.find(h=>h.id===input.houseId);check(rival&&rival.id!==house.id,'Escolha uma Casa rival.');check(Object.values(world.territories).some(t=>t.owner===rival.id),'O rival ainda não possui territórios.');
    check(!world.wars.some(w=>w.status==='active'&&[w.attacker,w.defender].includes(house.id)),'Sua Casa já participa de uma guerra.');check(!world.wars.some(w=>w.status==='active'&&[w.attacker,w.defender].includes(rival.id)),'Essa Casa já participa de uma guerra.');check(house.treasury>=50,'A guerra exige 50 Marcas do tesouro.');house.treasury-=50;
    world.wars.push({id:createId(),attacker:house.id,defender:rival.id,status:'active',startsAt:now,endsAt:now+1800000});journal(world,`${house.name} declarou guerra a ${rival.name}. Trinta minutos de disputa.`,now);
  }else throw new RuleError('Ação de reino desconhecida.');
  r.version++;r.seenAt=now;return r;
}
function resolveVote(house,world,now){const p=house.proposal;if(p.votes.length>=Math.floor(p.eligible.length/2)+1){house.policy=p.policy;house.proposal=null;journal(world,`${house.name} aprovou a política ${POLICIES[p.policy].name}.`,now);}}
export function prepareEncounter(world,profile,now=Date.now()){
  const r=profile.realm,n=region(r.location);check(!r.activeRoom,'Você já tem uma aventura em combate.');check(n.kind!=='sanctuary','O porto é uma zona de paz.');check(r.provisions>=2,'Uma expedição exige duas provisões.');
  const territory=world.territories[n.id],house=houseOf(world,profile);
  // Solo expeditions remain accessible; territorial conquest is checked at settlement.
  const stage=n.kind==='dungeon'?(r.expedition?.node===n.id?r.expedition.stage:0):0;
  return {node:n.id,stage,stages:n.kind==='dungeon'?3:1,board:n.board,title:n.kind==='dungeon'?(n.id==='abbey'?['Claustro das Cinzas','Coro dos Condenados','Altar da Abadessa']:n.id==='abyss'?['Escadaria sem Lua','Coração da Fenda','Trono do Devorador']:['Portão dos Sepultados','Galeria dos Esquecidos','Trono de Mordrath'])[stage]:`Expedição em ${n.name}`,difficulty:n.level,houseId:house?.id||null};
}
export function settleEncounter(world,profile,encounter,won,conceded,now=Date.now(),capturedLanes=[]){
  ensureAdventure(profile.realm);
  const r=profile.realm;r.activeRoom=null;r.version++;const n=region(encounter.node),house=houseOf(world,profile),claims=new Set((Array.isArray(capturedLanes)?capturedLanes:[]).filter(id=>['court','crypt','hunt'].includes(id)));const reward={xp:0,coins:0,materials:0,loot:false,message:''};
  if(!won||conceded){r.expedition=null;reward.message='A expedição recuou. Seus territórios e construções permanecem.';return reward;}
  const final=encounter.stage+1>=encounter.stages;
  r.expedition=final?null:{node:n.id,stage:encounter.stage+1};
  reward.message=final?'Expedição concluída.':'Mesa vencida. A próxima instância está aberta.';
  const key=`${n.id}:${encounter.stage}`,eligible=now-(r.claims[key]||0)>=300000;
  if(eligible){r.claims[key]=now;reward.xp=30+encounter.difficulty*10;gainXP(r,reward.xp);reward.coins=10+(house?.policy==='commerce'?5:0);profile.coins+=reward.coins;reward.materials=2+(house?.policy==='expedition'?1:0);r.materials[n.resource]+=reward.materials;reward.loot=final;r.adventure.stats.wins++;dailyState(r,now).wins++;if(final&&encounter.stages>1)r.adventure.stats.dungeons++;adventureJournal(r,`Vitória em ${n.name} · ${encounter.stage+1}/${encounter.stages}. +${reward.xp} XP de exploração.`,now);
    if(claims.has('crypt')){reward.materials+=2;r.materials[n.resource]+=2;reward.message+=` Catacumbas: +2 ${MATERIALS[n.resource]} para sua reserva.`;}
    if(claims.has('hunt')){reward.coins+=10;profile.coins+=10;reward.message+=' Caçada: +10 Marcas de recompensa para financiar a Casa ou a guerra.';}
    if(claims.has('court')){if(house&&house.id===encounter.houseId){house.treasury+=5;reward.treasury=5;reward.message+=' Corte: +5 Marcas ao tesouro da Casa.';}else{reward.coins+=5;profile.coins+=5;reward.message+=' Corte: +5 Marcas em favores políticos.';}}
  }
  const t=world.territories[n.id];
  if(t&&house&&house.id===encounter.houseId&&eligible){
    if(t.owner!==house.id){
      const legal=!t.owner||world.wars.some(w=>w.status==='active'&&w.endsAt>now&&[w.attacker,w.defender].includes(t.owner)&&[w.attacker,w.defender].includes(house.id));
      if(legal&&t.protectedUntil<=now){t.influence[house.id]=(t.influence[house.id]||0)+1+(claims.has('court')?1:0);const defender=world.houses.find(h=>h.id===t.owner),needed=3+(defender?.policy==='bastion'?1:0);
        if(t.influence[house.id]>=needed){t.owner=house.id;t.influence={};t.protectedUntil=now+600000;journal(world,`${house.name} conquistou ${n.name}. Trégua territorial de dez minutos.`,now);reward.message+=` ${n.name} agora pertence à sua Casa!`;}
        else reward.message+=` Influência territorial: ${t.influence[house.id]}/${needed}.`;
      }
    }else{house.treasury+=5;reward.message+=' +5 Marcas ao tesouro da Casa.';}
  }
  journal(world,`${profile.name} venceu em ${n.name}${encounter.stages>1?` · mesa ${encounter.stage+1}/3`:''}.`,now);return reward;
}
