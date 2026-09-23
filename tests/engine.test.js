import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, applyAction, botAction, publicView, RuleError } from '../shared/engine.js';
import { CARDS } from '../shared/cards.js';

test('estado inicial e informações privadas', () => {
  const g=createGame('vampire',()=>0.5), view=publicView(g,0);
  assert.equal(g.players[0].hand.length,5); assert.equal(g.players[0].deck.length,15);
  assert.equal(view.players[1].hand,undefined); assert.equal(view.players[0].deck,undefined);
  assert.equal(view.players[1].handCount,5); assert.equal(view.players[0].hand.length,5);
});
test('Edição I abre com 100 cartas de facção e 60 equipamentos sem ids repetidos',()=>{
  const cards=Object.values(CARDS);
  assert.equal(cards.filter(c=>c.faction==='vampire').length,50);
  assert.equal(cards.filter(c=>c.faction==='werewolf').length,50);
  assert.equal(cards.filter(c=>c.type==='equipment').length,60);
  assert.equal(new Set(cards.map(c=>c.id)).size,cards.length);
});
test('ações ilegais são rejeitadas sem alterar o estado', () => {
  const g=createGame(), before=structuredClone(g);
  assert.throws(()=>applyAction(g,1,{type:'pass'}),RuleError);
  assert.throws(()=>applyAction(g,0,{type:'play',uid:'fake',lane:'court'}),RuleError);
  assert.throws(()=>createGame('unknown'),RuleError); assert.deepEqual(g,before);
});
test('custo, alternância e capacidade são validados', () => {
  const g=createGame(); g.players[0].hand=[{uid:'test',cardId:'oracle'}];
  assert.throws(()=>applyAction(g,0,{type:'play',uid:'test',lane:'court'}),/Recursos/);
  g.players[0].hand=[{uid:'test',cardId:'thrall'}];
  const n=applyAction(g,0,{type:'play',uid:'test',lane:'court'});
  assert.equal(n.turn,1); assert.equal(n.players[0].energy,2); assert.equal(n.players[0].hand.length,0);
  g.players[0].lanes.court=Array.from({length:3},()=>({health:3,attack:1,influence:1}));
  assert.throws(()=>applyAction(g,0,{type:'play',uid:'test',lane:'court'}),/três/);
});
test('combate simultâneo elimina ambos e não premia empate', () => {
  let g=createGame();
  g.players.forEach(p=>{p.lanes.hunt=[{uid:'u',cardId:'duelist',attack:4,health:3,influence:1}];});
  g=applyAction(g,0,{type:'pass'}); g=applyAction(g,1,{type:'pass'});
  assert.equal(g.round,2); assert.equal(g.turn,1);
  g.players.forEach(p=>{assert.equal(p.lanes.hunt.length,0);assert.equal(p.renown,0);assert.equal(p.energy,4);});
});
test('Guarda reduz o primeiro impacto e Transbordo leva excesso ao líder',()=>{
  let g=createGame();g.players[0].lanes.hunt=[{uid:'guard',cardId:'iceveinwarden',attack:1,health:5,maxHealth:5,influence:2,ready:true,equipment:0}];g.players[1].lanes.hunt=[{uid:'fang',cardId:'duelist',attack:3,health:4,maxHealth:4,influence:1,ready:true,equipment:0}];g.turn=1;
  g=applyAction(g,1,{type:'attack',uid:'fang',lane:'hunt',target:'guard'});
  assert.equal(g.players[0].lanes.hunt[0].health,3);assert.equal(g.events.find(e=>e.type==='damage'&&e.target==='guard').blocked,1);
  g=createGame();g.players[0].lanes.hunt=[{uid:'breaker',cardId:'heartseeker',attack:4,health:4,maxHealth:4,influence:1,ready:true,equipment:0}];g.players[1].lanes.hunt=[{uid:'screen',cardId:'thrall',attack:0,health:2,maxHealth:2,influence:1,ready:true,equipment:0}];
  g=applyAction(g,0,{type:'attack',uid:'breaker',lane:'hunt',target:'screen'});
  assert.equal(g.players[1].health,22);assert.ok(g.events.some(e=>e.type==='damage'&&e.target==='hero'&&e.amount===2));
});
test('recompensas e loot são concedidos após o combate', () => {
  let g=createGame();
  for(const lane of ['court','crypt','hunt'])g.players[0].lanes[lane]=[{uid:lane,cardId:'envoy',attack:1,health:4,influence:3}];
  g=applyAction(g,0,{type:'pass'}); g=applyAction(g,1,{type:'pass'});
  assert.equal(g.players[0].renown,4);assert.equal(g.players[1].health,21);
  assert.ok(g.players[0].hand.some(c=>c.cardId==='relic'));
});
test('equipamento exige aliado e modifica a unidade correta', () => {
  let g=createGame();g.players[0].hand=[{uid:'eq',cardId:'blade'}];
  assert.throws(()=>applyAction(g,0,{type:'play',uid:'eq',lane:'crypt'}),/aliada/);
  g.players[0].lanes.crypt=[{uid:'u',cardId:'thrall',attack:1,health:3,influence:1}];
  g=applyAction(g,0,{type:'play',uid:'eq',lane:'crypt'});
  assert.equal(g.players[0].lanes.crypt[0].attack,3);
});
test('equipamento aciona a sinergia correta uma vez na frente',()=>{
  let g=createGame('vampire');
  g.players[0].lanes.court=[{uid:'speaker',cardId:'keepspeaker',attack:2,health:4,maxHealth:4,influence:3,ready:true,equipment:0}];
  g.players[0].hand=[{uid:'gear',cardId:'votivedagger',itemId:'test-item'}];
  g=applyAction(g,0,{type:'play',uid:'gear',lane:'court',target:'speaker'});
  assert.equal(g.players[0].hand.length,1,'a sinergia do Porta-Voz deve comprar uma carta');
  assert.ok(g.events.some(e=>e.type==='synergy'&&e.target==='speaker'));
  assert.equal(g.players[0].lanes.court[0].attack,3);
});
test('passar permite ao rival continuar e vitória encerra ações', () => {
  let g=createGame(); g.players[1].hand=[{uid:'x',cardId:'scout'}];
  g=applyAction(g,0,{type:'pass'});g=applyAction(g,1,{type:'play',uid:'x',lane:'hunt'});
  assert.equal(g.turn,1);g.players[0].health=2;g=applyAction(g,1,{type:'pass'});
  assert.equal(g.phase,'finished');assert.equal(g.winner,1);assert.throws(()=>applyAction(g,0,{type:'pass'}),/terminou/);
});
test('oitava rodada empata quando Renome e vitalidade são iguais', () => {
  let g=createGame();g.round=8;g=applyAction(g,0,{type:'pass'});g=applyAction(g,1,{type:'pass'});
  assert.equal(g.phase,'finished');assert.equal(g.winner,-1);
});
test('200 partidas automáticas terminam com estados válidos', () => {
  for(let i=0;i<200;i++){
    let g=createGame(i%2?'vampire':'werewolf'), moves=0;
    while(g.phase==='playing' && moves++<300)g=applyAction(g,g.turn,botAction(g));
    assert.equal(g.phase,'finished');assert.ok([-1,0,1].includes(g.winner));assert.ok(g.round<=8);
    g.players.forEach(p=>{assert.ok(p.energy>=0);assert.ok(p.hand.length<=10);Object.values(p.lanes).forEach(units=>{assert.ok(units.length<=3);units.forEach(u=>assert.ok(u.health>0));});});
  }
});
