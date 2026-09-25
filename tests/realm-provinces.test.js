import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {FRONTIER_REGIONS} from '../shared/realm-geography.js';
import {ensureFrontier} from '../shared/realm-frontier.js';
import {provinceMarketPrices,provinceMarketTrade} from '../shared/realm-province-life.js';
import {createWorld,enterRealms,REGIONS} from '../shared/realms.js';
import {grantStarter} from '../shared/progression.js';
import {ensureRealmWorld,ensureWorldPlayer,realmWorldView} from '../shared/realm-world.js';
import {realmSiteSlots} from '../shared/realm-site-plan.js';
import {realmScenery} from '../shared/realm-scenery.js';

const now=1800000000000;

test('resource fields replace radial province spawns on new and migrated worlds',()=>{
 const region=FRONTIER_REGIONS.find(site=>site.id==='gloam-saw');
 const world={houses:[],wars:[]},live={actors:[],obstacles:[],frontierVersion:2};
 const legacy={id:`deposit-${region.id}-0`,node:region.id,kind:'resource',resource:'timber',hp:1,deposit:{x:region.x,y:region.y}};
 const field={id:`field-${region.id}-0`,node:region.id,kind:'resource',resource:'timber',hp:0,respawnAt:now+1000,deposit:{x:region.resourceFields[0].x,y:region.resourceFields[0].y}};
 live.actors.push(legacy,field);
 ensureFrontier(world,live,[region],now);
 assert.equal(live.actors.includes(legacy),false);
 assert.equal(live.actors.includes(field),true);
 assert.equal(field.hp,0,'depleted resource state must survive migration');
 const count=live.actors.filter(actor=>actor.kind==='resource').length;
 ensureFrontier(world,live,[region],now+100);
 assert.equal(live.actors.filter(actor=>actor.kind==='resource').length,count);
});

test('market prices react to local supply and trades conserve both materials and money',()=>{
 const region=FRONTIER_REGIONS.find(site=>site.id==='gloam-gate');
 const market={id:'market',node:region.id,name:'Mercado',marketStock:{timber:20,ore:20,essence:20},marketPurse:100};
 const world={ecology:{regions:{[region.id]:{security:50,prosperity:50}}}};
 const player={coins:200,realm:{materials:{timber:10,ore:10,essence:10}}};
 const price=provinceMarketPrices(market,region,world.ecology.regions[region.id]).timber;
 const coins=player.coins,stock=market.marketStock.timber,owned=player.realm.materials.timber;
 provinceMarketTrade(world,player,market,region,{operation:'buy',resource:'timber'},now);
 assert.equal(player.coins,coins-price.buy*2);
 assert.equal(market.marketStock.timber,stock-2);
 assert.equal(player.realm.materials.timber,owned+2);
 const scarce=provinceMarketPrices({...market,marketStock:{...market.marketStock,timber:1}},region,world.ecology.regions[region.id]).timber;
 assert.ok(scarce.buy>price.buy);
 assert.throws(()=>provinceMarketTrade(world,{coins:0,realm:{materials:{timber:0,ore:0,essence:0}}},market,region,{operation:'buy',resource:'timber'},now));
});

test('large-world view sends nearby actors and plots while retaining all atlas provinces',()=>{
 const world=createWorld(),profile={id:randomUUID(),name:'Cartógrafo',coins:1000};
 grantStarter(profile,'vampire',randomUUID);enterRealms(profile,randomUUID,now);
 const live=ensureRealmWorld(world,REGIONS,now),player=ensureWorldPlayer(profile,REGIONS,now);
 Object.assign(player,{x:344,y:24});profile.realm.location='gloam-saw';
 const view=realmWorldView(world,profile,new Map([[profile.id,profile]]),REGIONS,now);
 assert.equal(view.continents.length,13);
 assert.ok(live.actors.length>view.actors.length*2);
 assert.ok(view.actors.some(actor=>actor.node==='gloam-saw'));
 assert.ok(!view.actors.some(actor=>actor.node==='eclipse-palace'));
 assert.ok(view.plots.length<live.plots.length);
 assert.ok(view.plots.some(plot=>plot.node==='gloam-saw'));
});

test('every frontier site has aligned construction, city land, ecology and local interactions',()=>{
 const world=createWorld(),live=ensureRealmWorld(world,REGIONS,now);
 const stops=live.actors.filter(actor=>actor.id.startsWith('road-frontier-'));
 assert.ok(stops.length>=35,'inter-site roads have harvest or rest stops');
 assert.ok(stops.some(actor=>actor.kind==='wayshrine')&&stops.some(actor=>actor.kind==='resource'));
 for(const site of FRONTIER_REGIONS){
  const slots=live.slots.filter(slot=>slot.node===site.id),plan=realmSiteSlots(site),plots=live.plots.filter(plot=>plot.node===site.id);
  assert.equal(slots.length,6,`${site.name}: construction slots`);
  assert.deepEqual(slots.map(slot=>({id:slot.id,x:slot.x,y:slot.y})),plan.map(slot=>({id:slot.id,x:slot.x,y:slot.y})),`${site.name}: camera scaffold matches server`);
  if(site.kind!=='sanctuary')assert.equal(plots.length,2,`${site.name}: house sites`);
  assert.ok(live.actors.some(actor=>actor.node===site.id&&actor.role==='chronicler'),`${site.name}: local lore`);
  if(site.market||site.settlementRole||site.kind==='mine')assert.ok(live.actors.some(actor=>actor.node===site.id&&actor.kind==='merchant'&&actor.marketStock),`${site.name}: trade`);
  if(site.resourceFields.length)assert.ok(live.actors.some(actor=>actor.node===site.id&&actor.kind==='resource'),`${site.name}: harvest`);
  const scenery=realmScenery(site);
  assert.equal(scenery.length,6);
  for(const object of scenery)for(const field of site.resourceFields||[])assert.ok(Math.hypot((object.x-field.x)*1.5,object.y-field.y)>=2.8,`${site.name}: harvest remains reachable`);
 }
 ensureRealmWorld(world,REGIONS,now+1000);
 assert.equal(live.actors.filter(actor=>actor.id.startsWith('road-frontier-')).length,stops.length,'road stops survive without duplication');
});
