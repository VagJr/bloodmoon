import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame} from '../shared/engine.js';
import {DOCTRINES,chooseDoctrine,applyDoctrine} from '../shared/expedition-doctrines.js';
import {createWorld,enterRealms,prepareEncounter,settleEncounter} from '../shared/realms.js';
test('expedition preparation is level gated and frozen during a dungeon',()=>{
 const r={level:1};assert.throws(()=>chooseDoctrine(r,'siege'));chooseDoctrine(r,'standard');r.level=4;chooseDoctrine(r,'siege');assert.equal(r.doctrine,'siege');r.expedition={stage:1};assert.throws(()=>chooseDoctrine(r,'council'));assert.equal(r.doctrine,'siege');
});
test('preparations apply symmetrically and leave normal games unchanged',()=>{
 for(const id of Object.keys(DOCTRINES)){const game=createGame();applyDoctrine(game,id);for(const p of game.players){assert.equal(p.favors,id==='council'?2:0);assert.equal(p.supplies,id==='caravan'?2:0);assert.equal(p.siege,id==='siege'?1:0);assert.equal(p.health,id==='siege'?28:24);}}
 assert.equal(createGame().players[0].health,24);
});
test('dungeon preparation survives stages and progress only counts eligible endings',()=>{
 const world=createWorld(),p={id:'expedition',name:'Test',coins:0};enterRealms(p,()=> 'id',1000000);p.realm.location='crypt';p.realm.level=4;
 for(let stage=0;stage<3;stage++){const encounter={...prepareEncounter(world,p,1000000),doctrine:'council'};settleEncounter(world,p,encounter,true,false,1000000);if(stage<2)assert.equal(p.realm.expedition.doctrine,'council');}
 assert.equal(p.realm.adventure.doctrineWins.council,1);
 const encounter={...prepareEncounter(world,p),stage:2,doctrine:'council'};settleEncounter(world,p,encounter,true,false,1000001);assert.equal(p.realm.adventure.doctrineWins.council,1);
});
