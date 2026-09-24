import test from 'node:test';
import assert from 'node:assert/strict';
import { CONTRACTS, ECONOMY, accountLevelForXP, accountLevelProgress, applyDurabilityWear, deckCollection, grantStarter, reconcileDepletedGear, restoreReplacedGear, validateDeck, xpThresholdForLevel } from '../shared/progression.js';

test('progression: levels up to 10 keep their existing XP thresholds, then grow gradually',()=>{
  assert.equal(xpThresholdForLevel(1),0);
  assert.equal(xpThresholdForLevel(6),1500);
  assert.equal(accountLevelForXP(1500),6);
  assert.equal(xpThresholdForLevel(10),2700);
  assert.equal(xpThresholdForLevel(11),3050);
  assert.equal(accountLevelForXP(3049),10);
  assert.equal(accountLevelForXP(3050),11);
  assert.deepEqual(accountLevelProgress(1650,6),{earned:150,needed:300,percent:50,nextLevelXp:1800});
});

test('progression: the recurring hunt contract pays out a persistent equipment piece',()=>{
  const hunt=CONTRACTS.find(contract=>contract.id==='matches');
  assert.equal(hunt.goal,8);
  assert.equal(hunt.reward.gear,'common');
});

test('equipment: only exhausted gear can break, at the published 15% rate',()=>{
  assert.deepEqual(applyDurabilityWear(2,1,0),{durability:1,exhausted:false,broken:false});
  assert.deepEqual(applyDurabilityWear(1,1,0.149),{durability:0,exhausted:true,broken:true});
  assert.deepEqual(applyDurabilityWear(1,1,0.15),{durability:0,exhausted:true,broken:false});
  assert.equal(ECONOMY.gearBreakChance,15);
});

test('equipment: exhausted starter gear moves to repair and a valid reserve returns after repair',()=>{
  for(const faction of ['vampire','werewolf']){
    let nextId=0;const profile={xp:0,level:1,wins:0,matches:0};
    grantStarter(profile,faction,()=>`test-${++nextId}`);
    const deck=profile.decks[0],worn=profile.items.find(item=>item.cardId==='ward');
    worn.durability=0;
    assert.equal(reconcileDepletedGear(profile),true);
    assert.equal(deck.cards.length,20);
    assert.equal(deck.cards.includes('ward'),false);
    assert.equal(deck.autoRefills.length,1);
    assert.equal(profile.items.includes(worn),true);
    assert.doesNotThrow(()=>validateDeck(deck.cards,faction,deckCollection(profile.collection,deck.autoRefills),profile.items));
    worn.durability=worn.maxDurability;
    assert.equal(restoreReplacedGear(profile,'ward'),true);
    assert.equal(deck.cards.includes('ward'),true);
    assert.equal(deck.autoRefills.length,0);
    assert.doesNotThrow(()=>validateDeck(deck.cards,faction,deckCollection(profile.collection,deck.autoRefills),profile.items));
  }
});
