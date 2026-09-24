import test from 'node:test';
import assert from 'node:assert/strict';
import {battleResult} from '../client/battle-result.js';
const room={seat:0,winner:0,round:4,mode:'practice',players:[{health:17,kills:3,renown:5},{health:0}],rewards:{xp:100,coins:20,dust:0,scrap:2,items:1,lootCards:[{cardId:'blade',rarity:'common',durability:3,maxDurability:3}]}};
test('result uses actual rewards and received card identities',()=>{
 const html=battleResult(room,id=>`<b data-card="${id}"></b>`);
 assert.match(html,/data-card="blade"/);assert.match(html,/\+100/);assert.match(html,/\+20/);assert.match(html,/data-result-prepare/);
 const noRewards=battleResult({...room,rewards:{}},()=> '');assert.doesNotMatch(noRewards,/\+100/);
});
test('result escapes reward messages and preserves realm continuation',()=>{
 const html=battleResult({...room,mode:'realm',encounter:{},rewards:{realm:{message:'<script>evil</script>',xp:15},wornOut:['<img>']}},()=> '');
 assert.match(html,/data-return-realms/);assert.doesNotMatch(html,/<script>|<img>/);assert.match(html,/&lt;script&gt;/);
});
