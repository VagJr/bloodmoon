import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {CONTINENTS} from '../shared/realm-campaign.js';
import {WORLD_MAP_BOUNDS,FRONTIER_CONTINENTS,FRONTIER_REGIONS} from '../shared/realm-geography.js';
import {REGIONS} from '../shared/realms.js';
import {realmScenery,ensureSceneryObstacles} from '../shared/realm-scenery.js';

const imageFile=image=>fileURLToPath(new URL('../client'+image,import.meta.url));

test('dez províncias novas formam uma expansão contínua sem substituir os mapas originais',()=>{
 assert.equal(FRONTIER_CONTINENTS.length,10);
 assert.equal(CONTINENTS.length,13);
 assert.deepEqual(CONTINENTS.slice(0,3).map(land=>land.id),['vespera','boreal','cinder']);
 let edge=300;
 for(const land of FRONTIER_CONTINENTS){
  assert.equal(land.offset,edge,land.id);
  assert.equal(land.width,120,land.id);
  assert.ok(existsSync(imageFile(land.image)),`Imagem ausente: ${land.image}`);
  assert.ok(existsSync(imageFile(land.image.replace('.webp','-thumb.webp'))),`Miniatura ausente: ${land.id}`);
  edge+=land.width;
 }
 assert.equal(edge,WORLD_MAP_BOUNDS.width);
});

test('rotas, fontes e zonas de ameaça têm posição e função coerentes',()=>{
 const byId=new Map(REGIONS.map(region=>[region.id,region]));
 assert.equal(byId.size,REGIONS.length,'Ids de região devem ser únicos');
 assert.equal(FRONTIER_REGIONS.length,40);
 const fields=new Set(),styles=new Set();
 for(const region of FRONTIER_REGIONS){
  const land=FRONTIER_CONTINENTS.find(land=>land.id===region.provinceId);
  assert.ok(land,`Província ausente para ${region.id}`);
  assert.ok(region.x>=land.offset&&region.x<land.offset+land.width,`Região fora da província: ${region.id}`);
  assert.ok(region.y>0&&region.y<100,`Latitude inválida: ${region.id}`);
  assert.ok(region.levelRange.min>=1&&region.levelRange.max<=20,`Faixa de nível inválida: ${region.id}`);
  for(const link of region.links)assert.ok(byId.has(link),`Ligação quebrada: ${region.id} -> ${link}`);
  for(const source of region.resourceFields){
   fields.add(source.resource);
   assert.ok(source.x>=land.offset&&source.x<land.offset+land.width&&source.y>0&&source.y<100,`Fonte fora do terreno: ${region.id}`);
   assert.ok(source.richness>=1&&source.richness<=3);
  }
  for(const zone of region.spawnZones){
   styles.add(zone.style);
   assert.ok(zone.x>=land.offset&&zone.x<land.offset+land.width&&zone.y>0&&zone.y<100,`Spawn fora do terreno: ${region.id}`);
   assert.ok(zone.radius>=4&&zone.radius<=10);
  }
 }
 assert.deepEqual([...fields].sort(),['essence','ore','timber']);
 assert.ok(styles.size>=5);
 const reached=new Set(['haven']),todo=['haven'];
 while(todo.length){const region=byId.get(todo.shift());for(const link of region.links)if(!reached.has(link)){reached.add(link);todo.push(link);}}
 assert.ok(reached.has('eclipse-palace'),'A rota principal deve ligar o Porto ao Trono do Eclipse');
});

test('biomas usam objetos distintos e a mesma composição fornece colisões persistentes',()=>{
 const byHabitat=new Map();
 for(const region of FRONTIER_REGIONS){
  const objects=realmScenery(region);
  assert.equal(objects.length,3);
  for(const object of objects)assert.ok(existsSync(fileURLToPath(new URL(`../client/assets/world/objects/${object.art}.png`,import.meta.url))),`Objeto ausente: ${object.art}`);
  byHabitat.set(region.habitat,objects.map(object=>object.art).join(','));
 }
 assert.ok(new Set(byHabitat.values()).size>=8);
 const world={obstacles:[]};ensureSceneryObstacles(world,FRONTIER_REGIONS);
 const first=world.obstacles.map(obstacle=>obstacle.id);
 assert.ok(first.length>80);
 ensureSceneryObstacles(world,FRONTIER_REGIONS);
 assert.deepEqual(world.obstacles.map(obstacle=>obstacle.id),first);
});
