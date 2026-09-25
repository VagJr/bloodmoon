// One placement definition for illustrated scenery and authoritative collision.
const SETS={sanctuary:['brazier','supply-crates','signpost'],forest:['evergreen-trees','dead-tree','moon-mushrooms'],mine:['mossy-boulder','broken-pillar','brazier'],dungeon:['gravestones','ruined-arch','monster-bones'],fortress:['brazier','watchtower','iron-fence'],capital:['barracks','fortified-gate','lantern']};
const HABITATS={forest:['evergreen-trees','dead-tree','moon-mushrooms'],marsh:['river-reeds','stone-bridge','stone-well'],mountain:['mossy-boulder','broken-pillar','iron-vein'],ruins:['ruined-arch','ruined-stairs','gravestones'],city:['lantern','barrel','blacksmith'],snow:['evergreen-trees','stone-well','ruined-stairs'],volcanic:['brazier','mossy-boulder','broken-pillar'],astral:['moon-mushrooms','lunar-essence','broken-pillar'],citadel:['fortified-gate','brazier','iron-fence']};
const RADII={'supply-crates':.5,'mossy-boulder':.8,'broken-pillar':.5,watchtower:.85,barracks:1,'fortified-gate':.65,'evergreen-trees':.8,'dead-tree':.55,'stone-well':.5,'ruined-arch':.8,'gravestones':.35,'iron-fence':.7,'stone-bridge':.65,'ruined-stairs':.55,blacksmith:.65};
export function realmScenery(region){
  const artSet=region.provinceId&&HABITATS[region.habitat]||SETS[region.kind]||['dead-tree','mossy-boulder','lantern'];
  return artSet.map((art,index)=>{
    const angle=(index*120+25)*Math.PI/180;
    return {id:`scenery-${region.id}-${index}`,kind:'scenery',art,x:region.x+Math.cos(angle)*6.5,y:region.y+Math.sin(angle)*7.5,radius:RADII[art]||0,large:index===1};
  });
}
export function ensureSceneryObstacles(world,regions){
  if(world.sceneryCollisionVersion===2)return;
  world.obstacles=[...(world.obstacles||[]).filter(o=>!o.id?.startsWith('scenery-')),...regions.flatMap(realmScenery).filter(o=>o.radius>0)];
  world.sceneryCollisionVersion=2;
}
