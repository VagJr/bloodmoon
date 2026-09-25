// One placement definition for illustrated scenery and authoritative collision.
const SETS={sanctuary:['brazier','supply-crates','signpost'],forest:['evergreen-trees','dead-tree','moon-mushrooms'],mine:['mossy-boulder','broken-pillar','brazier'],dungeon:['gravestones','ruined-arch','monster-bones'],fortress:['brazier','watchtower','iron-fence'],capital:['barracks','fortified-gate','lantern']};
const RADII={'supply-crates':.5,'mossy-boulder':.8,'broken-pillar':.5,watchtower:.85,barracks:1,'fortified-gate':.65};
export function realmScenery(region){
  return (SETS[region.kind]||['dead-tree','mossy-boulder','lantern']).map((art,index)=>{
    const angle=(index*120+25)*Math.PI/180;
    return {id:`scenery-${region.id}-${index}`,kind:'scenery',art,x:region.x+Math.cos(angle)*6.5,y:region.y+Math.sin(angle)*7.5,radius:RADII[art]||0,large:index===1};
  });
}
export function ensureSceneryObstacles(world,regions){
  if(world.sceneryCollisionVersion===1)return;
  world.obstacles=[...(world.obstacles||[]).filter(o=>!o.id?.startsWith('scenery-')),...regions.flatMap(realmScenery).filter(o=>o.radius>0)];
  world.sceneryCollisionVersion=1;
}
