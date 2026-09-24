import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, applyAction, power, combatAttack } from '../shared/engine.js';
import { CARDS } from '../shared/cards.js';

test('Campanha Política (Corte): acúmulo de Favores e execução de Decretos', () => {
  let g = createGame('vampire');
  // Atribuir unidades para o jogador 0 vencer a Corte com excesso de influência
  g.players[0].lanes.court.push({ uid: 'u1', cardId: 'oracle', attack: 3, health: 5, influence: 4, ready: true });
  // Passar ambos os jogadores para resolver a rodada
  g = applyAction(g, 0, { type: 'pass' });
  g = applyAction(g, 1, { type: 'pass' });

  // Na rodada 2, jogador 0 deve ter ganho Favores Políticos (+2 pelo excesso de 4 de influência)
  assert.equal(g.players[0].favors, 2);

  // Na rodada 2, g.turn é 1. Vamos passar o jogador 1 para a vez voltar ao jogador 0
  g = applyAction(g, 1, { type: 'play',uid:g.players[1].hand[0].uid,lane:'crypt' });

  // Tributo custa dois Favores e exige adversário ativo.
  const currentFavors = g.players[0].favors;
  g = applyAction(g, 0, { type: 'campaign', category: 'court', tactic: 'tribute' });
  assert.equal(g.players[0].favors, currentFavors - 2);
  assert.equal(g.players[1].tributeActive, true);

  // Executar Suborno de Fronteira na frente de Caçada (gasta 1 Favor)
  g = applyAction(g,1,{type:'pass'});
  g.players[0].favors=1;
  assert.throws(()=>applyAction(g,0,{type:'campaign',category:'court',tactic:'bribe',lane:'hunt'}),/ordem desta frente/);
});

test('Guerra (Caçada): acúmulo de Cerco e Ruptura de Linha', () => {
  let g = createGame('werewolf');
  // Jogador 0 vence a caçada
  g.players[0].lanes.hunt.push({ uid: 'u1', cardId: 'alpha', attack: 6, health: 6, influence: 2, ready: true });
  g = applyAction(g, 0, { type: 'pass' });
  g = applyAction(g, 1, { type: 'pass' });

  // Rodada 2: jogador 0 acumulou +1 Cerco
  assert.equal(g.players[0].siege, 1);

  // Passar jogador 1 para vez voltar a 0
  g = applyAction(g, 1, { type: 'pass' });

  // Criar alvo inimigo na caçada
  g.players[1].lanes.hunt.push({ uid: 'foe1', cardId: 'thrall', attack: 1, health: 3, influence: 1, ready: true });

  // Disparar Ruptura de Trincheira
  g = applyAction(g, 0, { type: 'campaign', category: 'hunt', tactic: 'breach', lane: 'hunt', target: 'foe1' });
  assert.equal(g.players[0].siege, 0);
  assert.equal(g.players[1].lanes.hunt.find(u => u.uid === 'foe1').health, 1); // 3 - 2 = 1
});

test('Economia e Logística (Catacumbas): Suprimentos, remanejamento e rações', () => {
  let g = createGame('vampire');
  // Jogador 0 vence as catacumbas
  g.players[0].lanes.crypt.push({ uid: 'u1', cardId: 'duelist', attack: 4, health: 3, influence: 1, ready: true });
  g = applyAction(g, 0, { type: 'pass' });
  g = applyAction(g, 1, { type: 'pass' });

  // Rodada 2: jogador 0 ganhou +2 Suprimentos
  assert.equal(g.players[0].supplies, 2);

  // Passar jogador 1 para vez voltar a 0
  g = applyAction(g, 1, { type: 'pass' });

  // Manobra Logística: mover criatura de crypt para court (custa 1 Suprimento)
  assert.equal(g.players[0].lanes.crypt.length, 1);
  assert.equal(g.players[0].lanes.court.length, 0);
  g = applyAction(g, 0, { type: 'campaign', category: 'crypt', tactic: 'logistics', uid: 'u1', from: 'crypt', to: 'court' });
  assert.equal(g.players[0].supplies, 1);
  assert.equal(g.players[0].lanes.crypt.length, 0);
  assert.equal(g.players[0].lanes.court.length, 1);
  assert.equal(g.players[0].lanes.court[0].uid, 'u1');

  // Testar Rações de Guerra (compra de carta com 2 suprimentos)
  g.players[0].supplies = 2;
  const handBefore = g.players[0].hand.length;
  assert.throws(()=>applyAction(g,0,{type:'campaign',category:'crypt',tactic:'rations'}),/ordem desta frente/);
  g=applyAction(g,0,{type:'pass'});
  g=applyAction(g,0,{type:'campaign',category:'crypt',tactic:'rations'});
  assert.equal(g.players[0].supplies, 0);
  assert.equal(g.players[0].hand.length, handBefore + 2);
});

test('Ações de campanha rejeitam comandos sem recursos suficientes', () => {
  let g = createGame('vampire');
  assert.equal(g.players[0].favors, 0);
  assert.throws(() => {
    applyAction(g, 0, { type: 'campaign', category: 'court', tactic: 'tribute' });
  }, /Favores políticos insuficientes/);

  assert.equal(g.players[0].siege, 0);
  assert.throws(() => {
    applyAction(g, 0, { type: 'campaign', category: 'hunt', tactic: 'breach', lane: 'hunt', target: 'hero' });
  }, /Pressão de Cerco insuficiente/);

  assert.equal(g.players[0].supplies, 0);
  assert.throws(() => {
    applyAction(g, 0, { type: 'campaign', category: 'crypt', tactic: 'rations' });
  }, /São necessários 2 Suprimentos/);
});
