import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, applyAction, botAction, publicView } from '../shared/engine.js';
const ally=(uid,cardId='duelist',attack=4,health=5)=>({uid,cardId,attack,health,maxHealth:health,influence:1,ready:true,level:1,kills:0,bleed:0,equipment:0});
test('ataque direto respeita a frente, revide e limite por rodada',()=>{
  let g=createGame();g.players[0].lanes.hunt=[ally('a')];g.players[1].lanes.hunt=[ally('b','fang',2,7)];
  assert.throws(()=>applyAction(g,0,{type:'attack',uid:'a',lane:'hunt',target:'hero'}),/antes/);
  assert.throws(()=>applyAction(g,0,{type:'attack',uid:'a',lane:'court',target:'b'}),/não encontrado/);
  g=applyAction(g,0,{type:'attack',uid:'a',lane:'hunt',target:'b'});
  assert.equal(g.players[0].lanes.hunt[0].health,3);assert.equal(g.players[1].lanes.hunt[0].health,3);assert.equal(g.players[0].rage,1);
  g=applyAction(g,1,{type:'pass'});
  assert.throws(()=>applyAction(g,0,{type:'attack',uid:'a',lane:'hunt',target:'b'}),/já atacou/);
});
test('atacante sobrevivente evolui; morte simultânea não revive aliado',()=>{
  let g=createGame();g.players[0].lanes.hunt=[ally('a')];g.players[1].lanes.hunt=[ally('b','fang',2,3)];
  g=applyAction(g,0,{type:'attack',uid:'a',lane:'hunt',target:'b'});
  assert.equal(g.players[0].lanes.hunt[0].level,2);assert.equal(g.players[0].lanes.hunt[0].attack,5);assert.equal(g.players[0].lanes.hunt[0].health,5);assert.equal(g.players[0].kills,1);
  g=createGame();g.players[0].lanes.hunt=[ally('a','duelist',4,2)];g.players[1].lanes.hunt=[ally('b','fang',2,3)];
  g=applyAction(g,0,{type:'attack',uid:'a',lane:'hunt',target:'b'});
  assert.equal(g.players[0].lanes.hunt.length,0);assert.equal(g.players[1].lanes.hunt.length,0);
});
test('sem bloqueador ataque atinge líder e evento registra o dano',()=>{
  let g=createGame();g.players[0].lanes.crypt=[ally('a')];
  g=applyAction(g,0,{type:'attack',uid:'a',lane:'crypt',target:'hero'});
  assert.equal(g.players[1].health,20);assert.ok(g.events.some(e=>e.type==='damage'&&e.amount===4));
});
test('habilidade valida recursos, alvos e uso único; suprema consome frenesi',()=>{
  let g=createGame();g.players[0].health=18;
  g=applyAction(g,0,{type:'skill',lane:'hunt',target:'hero'});
  assert.equal(g.players[0].energy,1);assert.equal(g.players[0].health,20);assert.equal(g.players[1].health,22);
  g=applyAction(g,1,{type:'pass'});g.players[0].energy=7;
  assert.throws(()=>applyAction(g,0,{type:'skill',lane:'hunt',target:'hero'}),/já usada/);
  assert.throws(()=>applyAction(g,0,{type:'ultimate',lane:'hunt',target:'hero'}),/Frenesi/);
  g.players[0].rage=6;g.players[0].lanes.hunt=[ally('a')];
  g=applyAction(g,0,{type:'ultimate',lane:'hunt',target:'hero'});
  assert.equal(g.players[0].rage,0);assert.equal(g.players[1].health,17);assert.equal(g.players[0].lanes.hunt[0].attack+(g.players[0].lanes.hunt[0].tempAttack||0),5);
});
test('equipamento exige alvo aliado e respeita limite de dois',()=>{
  let g=createGame();g.players[0].hand=[{uid:'e',cardId:'relic'}];g.players[0].lanes.court=[ally('a'),ally('b')];
  assert.throws(()=>applyAction(g,0,{type:'play',uid:'e',lane:'court',target:'enemy'}),/aliado/);
  g=applyAction(g,0,{type:'play',uid:'e',lane:'court',target:'b'});
  assert.equal(g.players[0].lanes.court[0].attack,4);assert.equal(g.players[0].lanes.court[1].attack,5);
  g=applyAction(g,1,{type:'pass'});g.players[0].hand=[{uid:'e2',cardId:'relic'}];g.players[0].lanes.court[1].equipment=2;
  assert.throws(()=>applyAction(g,0,{type:'play',uid:'e2',lane:'court',target:'b'}),/dois equipamentos/);
});
test('combo acontece apenas na terceira carta e reseta por rodada',()=>{
  let g=createGame();g.players[1].passed=true;g.players[0].hand=Array.from({length:4},(_,i)=>({uid:`s${i}`,cardId:'renewal'}));g.players[0].energy=7;
  for(let i=0;i<4;i++)g=applyAction(g,0,{type:'play',uid:`s${i}`,lane:'court'});
  assert.equal(g.players[1].health,22);assert.equal(g.events.filter(e=>e.type==='combo').length,1);
  g=applyAction(g,0,{type:'pass'});assert.equal(g.players[0].combo,0);
});
test('drenar cura pelo dano efetivo e sangrar é consumido no confronto',()=>{
  let g=createGame();g.players[0].health=15;g.players[0].lanes.hunt=[ally('a','reaver',4,9)];g.players[1].lanes.hunt=[ally('b','scout',1,1)];
  g=applyAction(g,0,{type:'attack',uid:'a',lane:'hunt',target:'b'});assert.equal(g.players[0].health,16);
  g=createGame('werewolf');g.players[0].lanes.hunt=[ally('a','ravager',2,9)];g.players[1].lanes.hunt=[ally('b','thrall',1,9)];
  g=applyAction(g,0,{type:'attack',uid:'a',lane:'hunt',target:'b'});assert.equal(g.players[1].lanes.hunt[0].bleed,1);
  g=applyAction(g,1,{type:'pass'});g=applyAction(g,0,{type:'pass'});
  assert.equal(g.players[1].lanes.hunt[0].health,6);assert.equal(g.players[1].lanes.hunt[0].bleed,0);
});
test('attaque en rodada 8 não encerra antes do confronto ou morte',()=>{
  let g=createGame();g.round=8;g.players[0].lanes.hunt=[ally('a')];g=applyAction(g,0,{type:'attack',uid:'a',lane:'hunt',target:'hero'});assert.equal(g.phase,'playing');
});
test('dungeon aplica maldição e mantém dados adversários privados',()=>{
  let g=createGame('vampire',()=>.4,'dungeon');assert.equal(g.players[1].health,36);assert.equal(g.players[1].lanes.crypt[0].cardId,'warden');
  g=applyAction(g,0,{type:'pass'});g=applyAction(g,1,{type:'pass'});assert.equal(g.players[0].health,23);
  const v=publicView(g,0);assert.equal(v.players[1].hand,undefined);assert.equal(v.players[1].deck,undefined);
});
test('12 dungeons automáticas terminam sem ações infinitas',()=>{
  for(let i=0;i<12;i++){let g=createGame(i%2?'vampire':'werewolf',Math.random,'dungeon'),n=0;while(g.phase==='playing'&&n++<300)g=applyAction(g,g.turn,botAction(g));assert.equal(g.phase,'finished');}
});
