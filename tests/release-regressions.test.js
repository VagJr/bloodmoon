import test from 'node:test';
import assert from 'node:assert/strict';
import {createGame,applyAction} from '../shared/engine.js';
import {createWorld,enterRealms,realmAction,REGIONS} from '../shared/realms.js';
import {CHAPTERS,chapterProgress} from '../shared/adventure.js';
import {SIDE_STORIES,storyAction,storyProgress} from '../shared/side-stories.js';

test('all published chapters are completable and each reward is granted once',()=>{
 const world=createWorld(),p={id:'release',name:'Release',coins:0,items:[]};let next=0;const id=()=>String(++next);enterRealms(p,id,1000000);const r=p.realm;
 r.visited=REGIONS.map(n=>n.id);r.level=20;r.xp=2280;r.holdings={camp:5,forge:5,library:5};r.adventure.stats={wins:100,dungeons:30,gathers:150,fronts:{court:20,crypt:20,hunt:20}};
 let coins=0;
 for(const c of CHAPTERS){assert.equal(chapterProgress(r).ready,true,c.id);const version=r.version;realmAction(world,p,{type:'chapter',version,choice:c.choices[0][0]},id,1000000);coins+=c.reward.coins||0;assert.equal(p.coins,coins);assert.throws(()=>realmAction(world,p,{type:'chapter',version,choice:c.choices[0][0]},id,1000000));assert.equal(p.coins,coins);}
 assert.equal(chapterProgress(r).complete,true);assert.equal(new Set(r.adventure.claimed).size,CHAPTERS.length);
});
test('politics respects passed opponents, category limit and legacy tactic saves',()=>{
 let g=createGame();g.players[0].favors=5;g.players[1].passed=true;
 assert.throws(()=>applyAction(g,0,{type:'campaign',category:'court',tactic:'tribute'}),/encerrou/);
 assert.equal(g.players[0].favors,5);g.players[1].passed=false;
 g=applyAction(g,0,{type:'campaign',category:'court',tactic:'tribute'});assert.equal(g.players[0].favors,3);
 g=applyAction(g,1,{type:'pass'});
 assert.throws(()=>applyAction(g,0,{type:'campaign',category:'court',tactic:'bribe',lane:'court'}),/ordem desta frente/);
 g.players[0].ordersUsed={tribute:true};assert.throws(()=>applyAction(g,0,{type:'campaign',category:'court',tactic:'bribe',lane:'court'}),/ordem desta frente/);
});
test('side stories require new activity, valid destinations and unique endings',()=>{
 const p={id:'stories',name:'Stories',coins:0,items:[]};enterRealms(p,()=> 'id',1000000);const r=p.realm;r.level=20;r.visited=REGIONS.map(n=>n.id);
 for(const s of SIDE_STORIES){assert.ok(REGIONS.some(n=>n.id===s.node));storyAction(r,{type:'story-accept',id:s.id});assert.equal(storyProgress(r,s).ready,false);assert.throws(()=>storyAction(r,{type:'story-finish',id:s.id,choice:s.choices[0][0]}));if(['court','crypt','hunt'].includes(s.stat))r.adventure.stats.fronts[s.stat]+=s.goal;else r.adventure.stats[s.stat]+=s.goal;assert.equal(storyProgress(r,s).ready,true);assert.throws(()=>storyAction(r,{type:'story-finish',id:s.id,choice:'invalid'}));const reward=storyAction(r,{type:'story-finish',id:s.id,choice:s.choices[0][0]});assert.equal(reward.coins,s.coins);assert.throws(()=>storyAction(r,{type:'story-finish',id:s.id,choice:s.choices[1][0]}));}
});
