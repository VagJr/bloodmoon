import {ORDERS,BATTLE_LEVELS} from './battle-design.js';
import { CARDS, DECKS, LANES, EVENTS, HEROES } from './cards.js';

export class RuleError extends Error {}
const check = (condition, message) => { if (!condition) throw new RuleError(message); };
const emptyLanes = () => Object.fromEntries(LANES.map(l => [l.id, []]));
const refId = value => typeof value==='string'?value:value.cardId;
const visualTraces=new WeakMap(),effectSources=new WeakMap();
function visualState(g){return {round:g.round,turn:g.turn,players:g.players.map(p=>({health:p.health,maxHealth:p.maxHealth,energy:p.energy,rage:p.rage,renown:p.renown,combo:p.combo,passed:p.passed,skillUsed:p.skillUsed,ultimateUsed:p.ultimateUsed,kills:p.kills,battleXP:p.battleXP||0,battleLevel:p.battleLevel||1,ordersUsed:p.ordersUsed||{},laneClaims:p.laneClaims||{},favors:p.favors||0,siege:p.siege||0,supplies:p.supplies||0,tributeActive:!!p.tributeActive,boosts:structuredClone(p.boosts),heroGear:(p.heroGear||[]).map(x=>({cardId:x.cardId})),handCount:p.hand.length,deckCount:p.deck.length,lanes:Object.fromEntries(Object.entries(p.lanes).map(([lane,units])=>[lane,units.map(u=>({...structuredClone(u),gearItems:(u.gearItems||[]).map(x=>({cardId:x.cardId}))}))]))}))};}
function emit(g, type, details = {}) {
  const event={id:g.nextEvent++,type,...(effectSources.get(g)?{cardId:effectSources.get(g)}:{}),...details},previous=visualTraces.get(g);
  if(previous){const current=visualState(g),patch={players:[{},{}]};for(const key of ['round','turn'])if(current[key]!==previous[key])patch[key]=current[key];current.players.forEach((p,i)=>{for(const [key,value]of Object.entries(p))if(JSON.stringify(value)!==JSON.stringify(previous.players[i][key]))patch.players[i][key]=value;});event.visual=patch;visualTraces.set(g,current);}
  g.events.push(event);
}
function shuffle(cards, random) {
  const result = [...cards];
  for (let i=result.length-1;i>0;i--) {const j=Math.floor(random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
  // Two affordable allies ensure the opening is playable, without a mulligan screen.
  const opening=[];
  for(let i=0;i<result.length && opening.length<2;) {const id=refId(result[i]);if(CARDS[id].type==='unit'&&CARDS[id].cost<=2)opening.push(...result.splice(i,1));else i++;}
  return [...opening,...result];
}
const gearHas=(items,effect)=>!!effect&&(items||[]).some(item=>CARDS[item.cardId]?.gearEffect===effect);
function unit(g,id) {const c=CARDS[id];return {uid:`u${g.nextId++}`,cardId:id,attack:c.attack,health:c.health,maxHealth:c.health,influence:c.influence,tempAttack:0,tempInfluence:0,ready:true,level:1,kills:0,bleed:0,equipment:0,gearItems:[],guard:c.keyword==='guard',synergyRound:0};}
function draw(g,p,count=1) {
  for(let i=0;i<count;i++) {const ref=p.deck.shift();if(ref){const id=refId(ref);if(p.hand.length<10)p.hand.push({uid:`c${g.nextId++}`,cardId:id,itemId:typeof ref==='string'?null:ref.itemId||null,itemBound:typeof ref==='string'?false:!!ref.itemBound});}else{p.fatigue++;p.health-=p.fatigue;emit(g,'damage',{seat:g.players.indexOf(p),target:'hero',amount:p.fatigue,label:'FADIGA'});}}
}
export function createGame(faction='vampire',random=Math.random,mode='practice',deckLists={},rival=null) {
  check(Object.hasOwn(DECKS,faction),'Facção inválida.');
  const factions=[faction,rival?.faction||(faction==='vampire'?'werewolf':'vampire')];
  const g={round:1,turn:0,initiative:0,phase:'playing',winner:null,nextId:1,nextEvent:1,version:0,mode,riskMode:'covenant',events:[],log:['A caçada começou.'],players:factions.map((f,index)=>{const p={faction:f,health:24,maxHealth:24,heroGear:[],heroAttackBonus:0,renown:0,energy:3,rage:0,combo:0,skillUsed:false,ultimateUsed:false,kills:0,cardsPlayed:0,claims:0,battleXP:0,battleLevel:1,ordersUsed:{},laneClaims:{court:0,crypt:0,hunt:0},favors:0,siege:0,supplies:0,tributeActive:false,deck:shuffle(index===1&&rival?.deck?rival.deck:deckLists[f]||DECKS[f],random),hand:[],lanes:emptyLanes(),boosts:{court:0,crypt:0,hunt:0},passed:false,fatigue:0};if(index===1&&rival){const {deck,...identity}=rival;p.rival=identity;}return p;})};
  g.players.forEach(p=>draw(g,p,5));
  if(mode==='dungeon') {const boss=g.players[1];boss.boss=true;boss.health=36;boss.maxHealth=36;boss.lanes.crypt.push(unit(g,'warden'));g.log.push('O Rei Sepultado desperta. A cada rodada, sua maldição causa 1 de dano.');}
  return g;
}
export function replaceOpeningDeck(original,seat,cards,random=Math.random) {
  check(original.phase==='playing'&&original.version===0&&original.players.every(p=>!Object.values(p.lanes).flat().length),'O deck inicial já está em uso.');
  check(Array.isArray(cards)&&cards.length===20&&cards.every(ref=>CARDS[refId(ref)]),'Lista inicial inválida.');
  const g=structuredClone(original),p=g.players[seat];check(p,'Jogador inválido.');p.deck=shuffle(cards,random);p.hand=[];p.fatigue=0;draw(g,p,5);return g;
}
export const combatAttack=u=>u.attack+(u.tempAttack||0);
export function power(p,lane) {return p.lanes[lane].reduce((n,u)=>n+(lane==='court'?u.influence+(u.tempInfluence||0):combatAttack(u)),0)+p.boosts[lane];}
export const cardCost=(p,card)=>card.cost+(p.tributeActive?1:0);
function battleExperience(g,seat,amount){
 const p=g.players[seat];p.battleXP=(p.battleXP||0)+amount;
 const next=1+BATTLE_LEVELS.slice(1).filter(x=>p.battleXP>=x).length;
 while((p.battleLevel||1)<next){p.battleLevel=(p.battleLevel||1)+1;
  if(p.battleLevel===2){p.maxHealth+=2;if(p.health>0)p.health+=2;}
  if(p.battleLevel===3)p.supplies=Math.min(6,(p.supplies||0)+2);
  if(p.battleLevel===4){p.favors=Math.min(5,(p.favors||0)+1);p.siege=Math.min(3,(p.siege||0)+1);}
  emit(g,'level',{seat,target:'hero',label:`LÍDER · NÍVEL ${p.battleLevel}`,amount:p.battleLevel});
 }
}
function veteran(g,seat,lane,u,xp){
 if(u.health<=0)return;u.battleXP=(u.battleXP??((u.kills||0)*2))+xp;
 const next=u.battleXP>=6?3:u.battleXP>=2?2:1;
 while((u.level||1)<next){u.level=(u.level||1)+1;u.attack++;u.maxHealth=(u.maxHealth||CARDS[u.cardId].health)+2;u.health+=2;
  emit(g,'level',{seat,target:u.uid,lane,label:`VETERANO · NÍVEL ${u.level}`});}
}
function heal(g,seat,amount,source=null) {const p=g.players[seat];if(p.health<=0)return;const actual=Math.min(amount,(p.maxHealth||24)-p.health);if(actual>0){p.health+=actual;emit(g,'heal',{seat,target:'hero',amount:actual,...(source?{drain:true,source:source.target,sourceSeat:source.seat,lane:source.lane}:{})});}}
function damage(g,seat,target,amount,lane,sourceSeat=null) {
  const p=g.players[seat],isHero=target==='hero',u=isHero?p:p.lanes[lane]?.find(x=>x.uid===target);check(u,'Alvo não encontrado.');
  const guarded=isHero?gearHas(p.heroGear,'guard')&&p.guardRound!==g.round:!!(u.guard||CARDS[u.cardId]?.keyword==='guard'||u.guardUntilRound===g.round)&&u.guardRound!==g.round;
  const blocked=guarded&&amount>0?1:0;if(blocked){amount=Math.max(0,amount-1);if(isHero)p.guardRound=g.round;else u.guardRound=g.round;}
  const actual=Math.min(Math.max(u.health,0),amount);u.health-=amount;if(!isHero&&sourceSeat!==null)u.lastHitBySeat=sourceSeat;emit(g,'damage',{seat,target,amount,lane,blocked,label:blocked?'GUARDA':'DANO'});return actual;
}
function healUnit(g,seat,lane,u,amount){const actual=Math.min(amount,Math.max(0,(u.maxHealth||CARDS[u.cardId].health)-u.health));if(actual>0){u.health+=actual;emit(g,'heal',{seat,target:u.uid,lane,amount:actual});}return actual;}
function gainRage(p,amount=1){p.rage=Math.min(6,p.rage+amount);}
function triggerSynergies(g,seat,lane,trigger,context={}) {
  const p=g.players[seat];
  for(const u of p.lanes[lane]){
    const rule=CARDS[u.cardId].synergy;
    if(u.uid===context.exclude||u.health<=0||rule?.trigger!==trigger||u.synergyRound===g.round)continue;
    if(rule.faction&&rule.faction!==context.faction)continue;
    u.synergyRound=g.round;
    if(rule.stat==='attack')u.tempAttack=(u.tempAttack||0)+rule.amount;
    if(rule.stat==='influence')u.tempInfluence=(u.tempInfluence||0)+rule.amount;
    if(rule.effect==='heal')heal(g,seat,rule.amount);
    if(rule.effect==='draw')draw(g,p,rule.amount);
    if(rule.effect==='rage')gainRage(p,rule.amount);
    emit(g,'synergy',{seat,target:u.uid,lane,label:`SINERGIA · ${CARDS[u.cardId].name}`});
  }
}
function clearDead(g,lane,killerSeat=null,killer=null) {
  for(let seat=0;seat<2;seat++) {
    const p=g.players[seat];
    for(const dead of p.lanes[lane].filter(u=>u.health<=0)) {
      emit(g,'death',{seat,target:dead.uid,lane,label:CARDS[dead.cardId].name});
      const lootIndex=(dead.gearItems||[]).findIndex(item=>!item.bound);
      for(let i=0;i<(dead.gearItems||[]).length;i++){
        const gear=dead.gearItems[i],killerSeat=dead.lastHitBySeat,transfer=g.mode==='duel'&&g.riskMode==='blood-oath'&&Number.isInteger(killerSeat)&&killerSeat!==seat&&!gear.bound&&i===lootIndex;
        emit(g,'item-lost',{seat,target:dead.uid,lane,itemId:gear.itemId,cardId:gear.cardId,killerSeat:transfer?killerSeat:null,transfer,wear:transfer?1:2,label:transfer?'RELÍQUIA SAQUEADA':'EQUIPAMENTO DANIFICADO'});
      }
      triggerSynergies(g,seat,lane,'ally-dies',{exclude:dead.uid});
      const slayer=g.players[1-seat];slayer.kills++;gainRage(slayer,2);gainRage(p,1);battleExperience(g,1-seat,1);
      if(dead.lastHitBySeat===1-seat)triggerSynergies(g,1-seat,lane,'enemy-dies',{faction:CARDS[dead.cardId].faction});
      if(killer&&killerSeat===1-seat&&killer.health>0){veteran(g,killerSeat,lane,killer,2);killer.kills=(killer.kills||0)+1;}
    }
    p.lanes[lane]=p.lanes[lane].filter(u=>u.health>0);
  }
}
function finish(g,roundEnd=false) {
  const [a,b]=g.players;
  if(a.health<=0||b.health<=0){g.phase='finished';g.winner=a.health<=0&&b.health<=0?-1:a.health<=0?1:0;}
  else if(roundEnd&&(a.renown>=12||b.renown>=12||g.round>=8)){g.phase='finished';g.winner=a.renown===b.renown?(a.health===b.health?-1:a.health>b.health?0:1):a.renown>b.renown?0:1;}
  if(g.phase==='finished'){emit(g,'finish',{seat:g.winner,label:g.winner===-1?'EMPATE':'A CAÇADA TERMINOU'});g.log.push(g.winner===-1?'Empate.':`Combatente ${g.winner+1} venceu.`);}
}
function strike(g,seat,action) {
  const p=g.players[seat],enemy=g.players[1-seat],u=p.lanes[action.lane]?.find(x=>x.uid===action.uid);
  check(u,'Combatente não encontrado.');check(u.ready!==false,'Este combatente já atacou nesta rodada.');
  const foe=enemy.lanes[action.lane];
  check(action.target==='hero'?foe.length===0:foe.some(x=>x.uid===action.target),'Ataque um inimigo desta frente antes de atingir o líder.');
  const target=action.target==='hero'?null:foe.find(x=>x.uid===action.target);
  emit(g,'attack',{seat,cardId:u.cardId,source:u.uid,target:action.target,lane:action.lane,label:CARDS[u.cardId].name});
  u.ready=false;gainRage(p);
  const attackValue=combatAttack(u)+(gearHas(u.gearItems,'pierce')?1:0),healthBefore=target?.health||0;
  const dealt=damage(g,1-seat,action.target,attackValue,action.lane,seat);
  if(target){damage(g,seat,u.uid,combatAttack(target),action.lane,1-seat);if((CARDS[u.cardId].keyword==='bleed'||gearHas(u.gearItems,'bleed'))&&target.health>0){target.bleed=(target.bleed||0)+1;emit(g,'status',{seat:1-seat,target:target.uid,lane:action.lane,label:'SANGRAMENTO'});triggerSynergies(g,seat,action.lane,'bleed-applied');}
    if(CARDS[u.cardId].keyword==='overwhelm'&&target.health<=0&&healthBefore<attackValue)damage(g,1-seat,'hero',attackValue-healthBefore,action.lane,seat);
  }
  if(CARDS[u.cardId].keyword==='lifesteal'||gearHas(u.gearItems,'lifesteal'))heal(g,seat,dealt,{target:action.target,seat:1-seat,lane:action.lane});
  if(gearHas(u.gearItems,'mend'))healUnit(g,seat,action.lane,u,1);
  if(CARDS[u.cardId].keyword==='fury'||gearHas(u.gearItems,'fury'))gainRage(p);
  triggerSynergies(g,seat,action.lane,'ally-attacks',{faction:CARDS[u.cardId].faction,target:action.target});
  clearDead(g,action.lane,seat,u);
  g.log.push(`${CARDS[u.cardId].name} ataca: ${u.attack} de dano.`);
}
function resolve(g) {
  effectSources.delete(g);
  emit(g,'clash',{label:'COLISÃO DE SANGUE'});g.log.push(`— Confronto ${g.round} —`);
  for(const lane of LANES) {
    const [a,b]=g.players.map(p=>p.lanes[lane.id]);
    for(let i=0;i<Math.min(a.length,b.length);i++) {
      const hitA=b[i].ready!==false?combatAttack(b[i]):0,hitB=a[i].ready!==false?combatAttack(a[i]):0;
      if(hitA)damage(g,0,a[i].uid,hitA,lane.id,1);if(hitB)damage(g,1,b[i].uid,hitB,lane.id,0);
    }
    for(let seat=0;seat<2;seat++)for(const u of g.players[seat].lanes[lane.id])if(u.bleed&&u.health>0){damage(g,seat,u.uid,u.bleed,lane.id,null);u.bleed=0;}
    clearDead(g,lane.id);
    const strengths=g.players.map(p=>power(p,lane.id));
    if(strengths[0]===strengths[1])continue;
    const winner=strengths[0]>strengths[1]?0:1,p=g.players[winner];
    const renown=(lane.id==='court'?2:1)+(EVENTS[g.round-1].lane===lane.id?1:0);p.renown+=renown;p.claims++;p.laneClaims||={court:0,crypt:0,hunt:0};p.laneClaims[lane.id]++;battleExperience(g,winner,2);for(const survivor of p.lanes[lane.id])veteran(g,winner,lane.id,survivor,1);
    if(lane.id==='court'){
      heal(g,winner,1);
      const diff=Math.abs(strengths[0]-strengths[1]);
      const gainedFavors=diff>=2?2:1;
      p.favors=Math.min(5,(p.favors||0)+gainedFavors);
      emit(g,'campaign',{seat:winner,category:'court',amount:gainedFavors,label:`+${gainedFavors} FAVOR(ES) POLÍTICO(S)`});
    }
    if(lane.id==='crypt'){
      if(p.hand.length<10){p.hand.push({uid:`c${g.nextId++}`,cardId:'relic'});emit(g,'loot',{seat:winner,lane:lane.id,label:'RELÍQUIA SAQUEADA'});}
      p.supplies=Math.min(6,(p.supplies||0)+2);
      emit(g,'campaign',{seat:winner,category:'crypt',amount:2,label:'+2 SUPRIMENTOS DE CAMPO'});
    }
    if(lane.id==='hunt'){
      damage(g,1-winner,'hero',3,lane.id);
      p.siege=Math.min(3,(p.siege||0)+1);
      emit(g,'campaign',{seat:winner,category:'hunt',amount:1,label:`CERCO MILITAR (NÍVEL ${p.siege})`});
    }
    emit(g,'claim',{seat:winner,lane:lane.id,captured:true,label:`+${renown} RENOME`});
    g.log.push(`${lane.name}: combatente ${winner+1} ganha ${renown} Renome.`);
  }
  finish(g,true);if(g.phase==='finished')return;
  g.round++;g.initiative=1-g.initiative;g.turn=g.initiative;
  g.players.forEach(p=>{p.passed=false;p.combo=0;p.skillUsed=false;p.ultimateUsed=false;p.tributeActive=false;p.ordersUsed={};p.boosts={court:0,crypt:0,hunt:0};p.energy=Math.min(7,g.round+2);Object.values(p.lanes).flat().forEach(u=>{u.ready=true;u.tempAttack=0;u.tempInfluence=0;});draw(g,p);});
  if(g.mode==='dungeon'){damage(g,0,'hero',1);emit(g,'curse',{seat:1,label:'MALDIÇÃO DO SEPULCRO'});const boss=g.players[1];if(boss.health<=18&&!boss.enraged){boss.enraged=true;Object.values(boss.lanes).flat().forEach(u=>u.attack++);emit(g,'ultimate',{seat:1,label:'O REI DESPERTA'});}}
  finish(g);if(g.phase==='playing')emit(g,'round',{label:`RODADA ${g.round}`,round:g.round});
}
export function applyAction(original,actor,action,{visuals=false}={}) {
  check(original.phase==='playing','Esta aventura já terminou.');check(actor===original.turn,'Aguarde seu turno.');
  check(action&&['play','pass','attack','skill','ultimate','campaign','concede'].includes(action.type),'Ação inválida.');
  const g=structuredClone(original),p=g.players[actor];
  const sourceCard=action.type==='play'?p.hand.find(x=>x.uid===action.uid)?.cardId:action.type==='attack'?p.lanes[action.lane]?.find(x=>x.uid===action.uid)?.cardId:null;if(sourceCard)effectSources.set(g,sourceCard);
  if(visuals)visualTraces.set(g,visualState(g));
  check(!p.passed,'Você já encerrou sua rodada.');
  if(action.type==='concede'){p.health=0;p.conceded=true;finish(g);g.version++;return g;}
  if(action.type==='pass'){p.passed=true;g.log.push(`Combatente ${actor+1} encerrou a rodada.`);}
  else if(action.type==='campaign'){
    const {category,tactic}=action,order=ORDERS[tactic];
    check(order&&order.category===category,'Ordem de campanha inválida.');p.ordersUsed||={};check(!p.ordersUsed[category]&&!Object.keys(ORDERS).some(id=>ORDERS[id].category===category&&p.ordersUsed[id]),'Você já emitiu uma ordem desta frente nesta rodada.');p.ordersUsed[category]=true;
    check(['court','hunt','crypt'].includes(category),'Categoria de campanha inválida.');
    if(category==='court'){
      if(tactic==='tribute'){
        check((p.favors||0)>=order.cost,'Favores políticos insuficientes.');
        check(!g.players[1-actor].tributeActive&&!g.players[1-actor].passed,'O rival já está tributado ou encerrou a rodada.');
        p.favors-=order.cost;
        g.players[1-actor].tributeActive=true;
        emit(g,'campaign-action',{seat:actor,category:'court',tactic:'tribute',label:'EDITO DE TRIBUTO'});
        g.log.push(`Combatente ${actor+1} aprova Edito de Tributo: a próxima carta do rival custa +1 nesta rodada.`);
      }else if(tactic==='bribe'){
        check((p.favors||0)>=1,'Favores políticos insuficientes.');
        check(LANES.some(l=>l.id===action.lane),'Frente inválida.');
        p.favors-=1;
        p.boosts[action.lane]=(p.boosts[action.lane]||0)+2;
        emit(g,'campaign-action',{seat:actor,category:'court',tactic:'bribe',lane:action.lane,label:'PACTO DE FRONTEIRA'});
        g.log.push(`Combatente ${actor+1} suborna a frente ${LANES.find(l=>l.id===action.lane)?.name}: +2 poder nesta rodada.`);
      }else if(tactic==='immunity'){
        check((p.favors||0)>=2,'São necessários 2 Favores para Salva-Guarda.');
        check(LANES.some(l=>l.id===action.lane),'Frente inválida.');
        const ally=p.lanes[action.lane]?.find(u=>u.uid===action.target);
        check(ally,'Escolha um aliado desta frente para proteger.');
        p.favors-=2;
        check(!ally.guard&&CARDS[ally.cardId].keyword!=='guard'&&ally.guardUntilRound!==g.round,'Este aliado já possui Guarda.');ally.guardUntilRound=g.round;
        emit(g,'campaign-action',{seat:actor,category:'court',tactic:'immunity',target:ally.uid,lane:action.lane,label:'SALVA-GUARDA DIPLOMÁTICA'});
        g.log.push(`Combatente ${actor+1} concede Salva-Guarda a ${CARDS[ally.cardId].name}.`);
      }else throw new RuleError('Tática política desconhecida.');
    }else if(category==='hunt'){
      if(tactic==='breach'){
        check((p.siege||0)>=1,'Pressão de Cerco insuficiente.');
        check(LANES.some(l=>l.id===action.lane),'Frente inválida.');
        const foe=g.players[1-actor].lanes[action.lane]?.find(u=>u.uid===action.target);
        check(foe,'Escolha um combatente inimigo para a ruptura.');
        p.siege-=1;
        emit(g,'campaign-action',{seat:actor,category:'hunt',tactic:'breach',target:action.target,lane:action.lane,label:'RUPTURA DE TRINCHEIRA'});
        damage(g,1-actor,action.target,2,action.lane,actor);
        clearDead(g,action.lane);
        g.log.push(`Combatente ${actor+1} rompe a linha na ${LANES.find(l=>l.id===action.lane)?.name}: 2 de dano tático.`);
      }else if(tactic==='plunder'){
        check((p.siege||0)>=2,'São necessários 2 pontos de Cerco para saquear.');
        p.siege-=2;
        p.energy=Math.min(7,p.energy+1);
        emit(g,'campaign-action',{seat:actor,category:'hunt',tactic:'plunder',label:'INCURSÃO'});
        damage(g,1-actor,'hero',2,'hunt',actor);
        g.log.push(`Combatente ${actor+1} saqueia suprimentos inimigos: +1 energia e 2 de dano ao líder.`);
      }else throw new RuleError('Tática militar desconhecida.');
    }else if(category==='crypt'){
      if(tactic==='logistics'){
        check((p.supplies||0)>=1,'Suprimentos insuficientes para manobra.');
        check(LANES.some(l=>l.id===action.from)&&LANES.some(l=>l.id===action.to)&&action.from!==action.to,'Frentes de remanejamento inválidas.');
        check(p.lanes[action.to].length<3,'A frente de destino está cheia.');
        const uIndex=p.lanes[action.from].findIndex(x=>x.uid===action.uid);
        check(uIndex!==-1,'Aliado não encontrado na frente de origem.');
        p.supplies-=1;
        const [moved]=p.lanes[action.from].splice(uIndex,1);
        p.lanes[action.to].push(moved);
        emit(g,'campaign-action',{seat:actor,category:'crypt',tactic:'logistics',uid:moved.uid,from:action.from,to:action.to,label:'MANOBRA LOGÍSTICA'});
        g.log.push(`Combatente ${actor+1} desloca ${CARDS[moved.cardId].name} de ${LANES.find(l=>l.id===action.from).name} para ${LANES.find(l=>l.id===action.to).name}.`);
      }else if(tactic==='rations'){
        check((p.supplies||0)>=2,'São necessários 2 Suprimentos para rações.');
        check(p.hand.length<10&&p.deck.length>0,'Requisição exige espaço na mão e cartas no baralho.');p.supplies-=2;
        emit(g,'campaign-action',{seat:actor,category:'crypt',tactic:'rations',label:'REQUISIÇÃO'});
        draw(g,p,1);
        g.log.push(`Combatente ${actor+1} distribui rações de guerra: compra 1 carta.`);
      }else if(tactic==='field_repair'){
        check((p.supplies||0)>=2,'Suprimentos insuficientes para reparo.');
        check(LANES.some(l=>l.id===action.lane),'Frente inválida.');
        const ally=p.lanes[action.lane]?.find(u=>u.uid===action.target);
        check(ally&&ally.health<ally.maxHealth,'Escolha um aliado ferido para socorrer.');
        p.supplies-=2;
        emit(g,'campaign-action',{seat:actor,category:'crypt',tactic:'field_repair',target:ally.uid,lane:action.lane,label:'SOCORRO DE CAMPO'});
        healUnit(g,actor,action.lane,ally,3);
        g.log.push(`Combatente ${actor+1} repara ${CARDS[ally.cardId].name}: +3 vida.`);
      }else throw new RuleError('Tática logística desconhecida.');
    }
  }else {
    check(LANES.some(l=>l.id===action.lane),'Frente inválida.');
    if(action.type==='attack')strike(g,actor,action);
    else if(action.type==='skill'||action.type==='ultimate'){
      const ult=action.type==='ultimate';
      check(ult?!p.ultimateUsed:!p.skillUsed,'Habilidade já usada nesta rodada.');
      check(ult?p.rage>=6:p.energy>=2,ult?'Frenesi insuficiente.':'Recursos insuficientes.');
      check(action.target==='hero'||g.players[1-actor].lanes[action.lane].some(u=>u.uid===action.target),'Escolha um alvo inimigo.');
      if(ult){p.rage=0;p.ultimateUsed=true;p.lanes[action.lane].forEach(u=>u.tempAttack=(u.tempAttack||0)+1);}else{p.energy-=2;p.skillUsed=true;gainRage(p);}
      emit(g,ult?'ultimate':'skill',{seat:actor,target:action.target,lane:action.lane,label:ult?HEROES[p.faction].ultimate:HEROES[p.faction].skill});
      const targetUnit=action.target==='hero'?null:g.players[1-actor].lanes[action.lane].find(u=>u.uid===action.target);
      const dealt=damage(g,1-actor,action.target,(ult?5:p.faction==='vampire'?2:3)+(p.heroAttackBonus||0),action.lane,actor);
      if(gearHas(p.heroGear,'lifesteal'))heal(g,actor,dealt,{target:action.target,seat:1-actor,lane:action.lane});
      if(gearHas(p.heroGear,'bleed')&&targetUnit?.health>0){targetUnit.bleed=(targetUnit.bleed||0)+1;emit(g,'status',{seat:1-actor,target:targetUnit.uid,lane:action.lane,label:'SANGRAMENTO'});triggerSynergies(g,actor,action.lane,'bleed-applied');}
      if(gearHas(p.heroGear,'fury'))gainRage(p);
      if(gearHas(p.heroGear,'mend'))heal(g,actor,1);
      if(p.faction==='vampire')heal(g,actor,ult?3:2,{target:action.target,seat:1-actor,lane:action.lane});
      clearDead(g,action.lane);g.log.push(`${HEROES[p.faction].name}: ${ult?HEROES[p.faction].ultimate:HEROES[p.faction].skill}.`);
    }else{
      const index=p.hand.findIndex(c=>c.uid===action.uid);check(index!==-1,'Carta indisponível.');
      const cardInstance=p.hand[index],c=CARDS[cardInstance.cardId],units=p.lanes[action.lane];
      const extraCost=p.tributeActive?1:0;
      check(p.energy>=(c.cost+extraCost),'Recursos insuficientes.');
      p.energy-=(c.cost+extraCost);p.tributeActive=false;
      p.hand.splice(index,1);p.cardsPlayed++;
      emit(g,'play',{seat:actor,source:action.uid,cardId:c.id,lane:action.lane,target:action.target,label:c.name});
      if(c.type==='unit'){check(units.length<3,'Esta frente já possui três unidades.');const u=unit(g,c.id);units.push(u);emit(g,'summon',{seat:actor,cardId:c.id,target:u.uid,lane:action.lane,label:c.name});triggerSynergies(g,actor,action.lane,'ally-summoned',{faction:c.faction,exclude:u.uid});}
      else if(c.type==='equipment'||['pounce','rally','guard'].includes(c.effect)){
        let equippedTarget='hero';
        if(c.type==='equipment'&&action.target==='hero'){
          check((p.heroGear||[]).length<1,'Seu líder já está usando um item.');p.heroGear.push({itemId:cardInstance.itemId,cardId:c.id,bound:cardInstance.itemBound});p.heroAttackBonus=(p.heroAttackBonus||0)+Math.ceil(c.attack/2)+(c.gearEffect==='focus'||c.gearEffect==='pierce'?1:0);p.maxHealth+=c.health;p.health+=c.health;
          if(c.gearEffect==='mend')heal(g,actor,1);
          if(c.gearEffect==='fury')gainRage(p);
          if(c.gearEffect==='rally')p.boosts[action.lane]++;
        }else{
          check(units.length>0,'É preciso ter uma unidade aliada nesta frente.');
          const u=action.target?units.find(x=>x.uid===action.target):units[0];check(u,'Escolha um aliado desta frente.');
          if(c.type==='equipment'){check((u.equipment||0)<2,'Este aliado já tem dois equipamentos.');u.attack+=c.attack;u.health+=c.health;u.maxHealth=(u.maxHealth||CARDS[u.cardId].health)+c.health;u.influence+=c.gearEffect==='focus'?1:0;u.equipment=(u.equipment||0)+1;u.gearItems||=[];u.gearItems.push({itemId:cardInstance.itemId,cardId:c.id,bound:cardInstance.itemBound});if(c.gearEffect==='guard')u.guard=true;if(c.gearEffect==='rally')u.tempAttack=(u.tempAttack||0)+1;}
          else if(c.effect==='pounce'){u.attack+=c.effectAmount||2;u.ready=true;}
          else if(c.effect==='rally')u.tempAttack=(u.tempAttack||0)+(c.effectAmount||2);
          else u.guardUntilRound=g.round;
          equippedTarget=u.uid;
        }
        emit(g,'equip',{seat:actor,cardId:c.id,target:equippedTarget,lane:action.lane,label:c.effect==='pounce'?'CAÇADA RENOVADA':c.type==='equipment'?'EQUIPADO':c.effect==='rally'?'ALIADO FORTALECIDO':'GUARDA ERGUIDA'});
        if(c.type==='equipment')triggerSynergies(g,actor,action.lane,'equipment-played',{faction:c.faction,target:equippedTarget});
      }else if(c.effect==='damage'||c.effect==='execute'||c.effect==='rend'||c.effect==='drain'){
        const enemies=g.players[1-actor].lanes[action.lane];check(enemies.length>0,'Escolha uma frente com inimigos.');
        const target=action.target||enemies[0].uid;check(enemies.some(x=>x.uid===target),'Escolha um alvo desta frente.');
        emit(g,'skill',{seat:actor,cardId:c.id,target,lane:action.lane,label:c.name});const marked=enemies.find(x=>x.uid===target),dealt=damage(g,1-actor,target,c.effect==='execute'?(c.effectAmount||4):c.effect==='rend'?(c.effectAmount||1):(c.effectAmount||2),action.lane,actor);
        if(c.effect==='drain')heal(g,actor,dealt,{target,seat:1-actor,lane:action.lane});
        if((c.effect==='rend'||c.effect==='drain')&&marked?.health>0){marked.bleed=(marked.bleed||0)+1;emit(g,'status',{seat:1-actor,target,lane:action.lane,label:'SANGRAMENTO'});triggerSynergies(g,actor,action.lane,'bleed-applied');}
        clearDead(g,action.lane);
      }else if(c.effect==='heal')heal(g,actor,c.effectAmount||3);
      else if(c.effect==='draw')draw(g,p,c.effectAmount||1);
      else if(c.effect==='rage')gainRage(p,c.effectAmount||1);
      else if(c.effect==='influence'){const amount=c.effectAmount||3;p.boosts[action.lane]+=amount;emit(g,'claim',{seat:actor,lane:action.lane,label:`+${amount} PODER`});}
      if(c.type==='spell')triggerSynergies(g,actor,action.lane,'spell-played');
      if(c.effect==='sacrifice'){damage(g,actor,'hero',c.healthCost||2);draw(g,p,c.effectAmount||2);}
      p.combo++;if(p.combo===3){gainRage(p,2);damage(g,1-actor,'hero',2);emit(g,'combo',{seat:actor,label:'COMBO · SEDE DE SANGUE'});}
      g.log.push(`${c.name} → ${LANES.find(l=>l.id===action.lane).name}.`);
    }
  }
  finish(g);
  if(g.phase==='playing'){if(g.players.every(x=>x.passed))resolve(g);else g.turn=g.players[1-actor].passed?actor:1-actor;}
  g.version++;if(visuals)emit(g,'settled',{seat:actor,label:'AÇÃO RESOLVIDA'});g.log=g.log.slice(-60);g.events=g.events.slice(-180);return g;
}
export function botAction(g) {
  const actor=g.turn,p=g.players[actor],enemy=g.players[1-actor],options=[],style=p.rival||{};
  const laneBias=lane=>lane===style.lane?1.9:0;
  function consider(action,score){
    if(action.type==='skill'&&(p.skillUsed||p.energy<2)||action.type==='ultimate'&&(p.ultimateUsed||p.rage<6))return;
    if(action.type==='play'){
      const instance=p.hand.find(card=>card.uid===action.uid),card=instance&&CARDS[instance.cardId],allies=p.lanes[action.lane]||[],foes=enemy.lanes[action.lane]||[];
      if(!card)return;
      const neededEnergy=c=>c.cost+(p.tributeActive?1:0);
      if(p.energy<neededEnergy(card))return;
      if(card.type==='unit'&&allies.length>=3)return;
      if(card.type==='equipment'&&action.target==='hero'&&(p.heroGear||[]).length>=1)return;
      if(card.type==='equipment'&&action.target!=='hero'&&!allies.some(unit=>unit.uid===action.target&&(unit.equipment||0)<2))return;
      if(['pounce','rally','guard'].includes(card.effect)&&!allies.some(unit=>unit.uid===action.target))return;
      if(['damage','execute','rend','drain'].includes(card.effect)&&!foes.some(unit=>unit.uid===action.target))return;
    }
    if(action.type==='campaign'){
      const order=ORDERS[action.tactic];if(!order||p.ordersUsed?.[action.category]||Object.keys(ORDERS).some(id=>ORDERS[id].category===action.category&&p.ordersUsed?.[id])||(p[order.resource]||0)<order.cost)return;
      if(action.category==='court'){
        if(action.tactic==='tribute'&&((p.favors||0)<ORDERS.tribute.cost||enemy.tributeActive||enemy.passed))return;
        if(action.tactic==='bribe'&&(p.favors||0)<1)return;
        if(action.tactic==='immunity'&&((p.favors||0)<2||!p.lanes[action.lane]?.some(u=>u.uid===action.target&&!u.guard&&u.guardUntilRound!==g.round)))return;
      }
      if(action.category==='hunt'){
        if(action.tactic==='breach'&&((p.siege||0)<1||(!enemy.lanes[action.lane]?.some(u=>u.uid===action.target)&&action.target!=='hero')))return;
        if(action.tactic==='plunder'&&(p.siege||0)<2)return;
      }
      if(action.category==='crypt'){
        if(action.tactic==='logistics'&&((p.supplies||0)<1||p.lanes[action.to]?.length>=3))return;
        if(action.tactic==='rations'&&(p.supplies||0)<2)return;
        if(action.tactic==='field_repair'&&((p.supplies||0)<2||!p.lanes[action.lane]?.some(u=>u.uid===action.target)))return;
      }
    }
    if(action.type==='attack'){
      const attacker=p.lanes[action.lane]?.find(unit=>unit.uid===action.uid),foes=enemy.lanes[action.lane]||[];
      if(!attacker||attacker.ready===false||(action.target==='hero'?foes.length>0:!foes.some(unit=>unit.uid===action.target)))return;
    }
    options.push({action,score});
  }
  for(const l of LANES){
    const foes=enemy.lanes[l.id],allies=p.lanes[l.id],eventBonus=EVENTS[g.round-1].lane===l.id?1.2:0,bias=laneBias(l.id)+eventBonus;
    for(const u of allies)if(u.ready!==false){
      if(!foes.length)consider({type:'attack',uid:u.uid,lane:l.id,target:'hero'},2+u.attack*(style.heroAggression||.9)+bias);
      else for(const target of foes){const hit=Math.min(u.attack,target.health),kill=u.attack>=target.health?4.2:0,trade=target.attack>=u.health?1.6:0,pressure=(target.attack+target.influence*.4)*.22;consider({type:'attack',uid:u.uid,lane:l.id,target:target.uid},1+hit*.72+kill+trade+pressure+bias*(style.aggression||1));}
    }
    for(const type of ['skill','ultimate'])for(const target of ['hero',...foes.map(u=>u.uid)]){
      const victim=target==='hero'?null:foes.find(u=>u.uid===target),damageValue=type==='ultimate'?5:p.faction==='vampire'?2:3;
      let score=type==='ultimate'?4:2;
      if(victim)score+=Math.min(victim.health,damageValue)*.9+(victim.health<=damageValue?5:0)+(victim.attack+victim.influence*.5)*.28;
      else score+=damageValue*(style.heroAggression||.9)*.65;
      if(type==='skill'&&p.faction==='vampire'&&p.health<p.maxHealth)score+=1.5;
      if(type==='ultimate')score+=allies.length*1.15;
      consider({type,lane:l.id,target},score+bias*.45);
    }
    for(const instance of p.hand){
      const c=CARDS[instance.cardId];if(!c)continue;
      if(c.type==='unit'){
        const synergy=(c.tags||[]).filter(tag=>allies.some(unit=>(CARDS[unit.cardId].tags||[]).includes(tag))).length;
        const score=1.8+c.attack*.78+c.health*.43+(c.influence||0)*.62+synergy*1.05+(c.synergy?1.1:0)-c.cost*.28+bias;
        consider({type:'play',uid:instance.uid,lane:l.id},score);
      }else if(c.type==='equipment'||['pounce','rally','guard'].includes(c.effect)){
        const targets=c.type==='equipment'?allies.filter(u=>(u.equipment||0)<2):allies;
        for(const target of targets){const value=c.type==='equipment'?c.attack*.8+c.health*.65+(c.gearEffect==='lifesteal'||c.gearEffect==='guard'?1.4:0):c.effect==='pounce'?3.3:c.effect==='rally'?2.4:allies.some(u=>u.health<=2)?2.8:1;
          consider({type:'play',uid:instance.uid,lane:l.id,target:target.uid},value+laneBias(l.id)*.3-c.cost*.2);}
        if(c.type==='equipment'&&(p.heroGear||[]).length<1)consider({type:'play',uid:instance.uid,lane:l.id,target:'hero'},c.attack*.45+c.health*.35+(style.survival||1)*.7-c.cost*.3+bias*.25);
      }else if(['damage','execute','rend','drain'].includes(c.effect)){
        for(const target of foes){const amount=c.effect==='execute'?(c.effectAmount||4):c.effect==='rend'?(c.effectAmount||1):(c.effectAmount||2),score=Math.min(target.health,amount)*.9+(target.health<=amount?5.1:0)+(target.attack+target.influence*.5)*.3+(c.effect==='drain'&&p.health<p.maxHealth?1.6:0)+bias*.3-c.cost*.2;consider({type:'play',uid:instance.uid,lane:l.id,target:target.uid},score*(style.removal||1));}
      }else{
        let score=0;
        if(c.effect==='heal')score=Math.min(c.effectAmount||3,p.maxHealth-p.health)*.8*(style.survival||1);
        if(c.effect==='draw')score=(c.effectAmount||1)*(p.hand.length<5?2.1:1.1);
        if(c.effect==='rage')score=p.rage>=4?3.4:1.2;
        if(c.effect==='influence')score=(power(p,l.id)<=power(enemy,l.id)?3.5:1.4)+bias;
        if(c.effect==='sacrifice')score=p.health>8&&p.hand.length<5?2.8:-1;
        consider({type:'play',uid:instance.uid,lane:l.id},score-c.cost*.25);
      }
    }
  }
  if((p.supplies||0)>=2&&p.hand.length<=2&&p.deck.length)consider({type:'campaign',category:'crypt',tactic:'rations'},4.2);
  if((p.favors||0)>=ORDERS.tribute.cost&&!enemy.tributeActive&&!enemy.passed&&enemy.energy>=3)consider({type:'campaign',category:'court',tactic:'tribute'},3.5);
  if((p.favors||0)>=1)consider({type:'campaign',category:'court',tactic:'bribe',lane:'court'},2.5+laneBias('court'));
  if((p.siege||0)>=1){
    for(const bl of LANES){const bfoes=enemy.lanes[bl.id]||[];const btarget=bfoes.find(u=>u.health<=2);if(btarget){consider({type:'campaign',category:'hunt',tactic:'breach',lane:bl.id,target:btarget.uid},4.4);break;}}
    if(!options.some(o=>o.action.tactic==='breach')){for(const bl of LANES){const bfoes=enemy.lanes[bl.id]||[];if(bfoes.length)consider({type:'campaign',category:'hunt',tactic:'breach',lane:bl.id,target:bfoes[0].uid},2.8);}}
  }
  if((p.siege||0)>=2)consider({type:'campaign',category:'hunt',tactic:'plunder'},3.8);
  options.sort((a,b)=>b.score-a.score);return options[0]?.score>0.65?options[0].action:{type:'pass'};
}
export function publicView(g,seat){const view=structuredClone(g);view.players.forEach((p,i)=>{p.deckCount=p.deck.length;delete p.deck;p.handCount=p.hand.length;if(i!==seat)delete p.hand;for(const u of Object.values(p.lanes).flat())u.gearItems=(u.gearItems||[]).map(x=>i===seat?x:{cardId:x.cardId});p.heroGear=(p.heroGear||[]).map(x=>i===seat?x:{cardId:x.cardId});});view.events=view.events.map(e=>{const safe={...e};delete safe.itemId;return safe;});return {...view,seat};}
