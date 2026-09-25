// One placement definition for illustrated scenery and authoritative collision.
import {realmSiteIdentity} from './realm-site-plan.js';
const SETS={sanctuary:['brazier','supply-crates','signpost'],forest:['evergreen-trees','dead-tree','moon-mushrooms'],mine:['mossy-boulder','broken-pillar','brazier'],dungeon:['gravestones','ruined-arch','monster-bones'],fortress:['brazier','watchtower','iron-fence'],capital:['barracks','fortified-gate','lantern']};
const HABITATS={forest:['evergreen-trees','dead-tree','moon-mushrooms'],marsh:['river-reeds','stone-bridge','stone-well'],mountain:['mossy-boulder','broken-pillar','iron-vein'],ruins:['ruined-arch','ruined-stairs','gravestones'],city:['lantern','barrel','blacksmith'],snow:['evergreen-trees','stone-well','ruined-stairs'],volcanic:['brazier','mossy-boulder','broken-pillar'],astral:['moon-mushrooms','lunar-essence','broken-pillar'],citadel:['fortified-gate','brazier','iron-fence']};
const RADII={'supply-crates':.5,'mossy-boulder':.8,'broken-pillar':.5,watchtower:.85,barracks:1,'fortified-gate':.65,'evergreen-trees':.8,'dead-tree':.55,'stone-well':.5,'ruined-arch':.8,'gravestones':.35,'iron-fence':.7,'stone-bridge':.65,'ruined-stairs':.55,blacksmith:.65};
const FRONTIER_RADII={watchtower:1.05,barracks:1.1,'fortified-gate':1.15,'stone-bridge':.8,blacksmith:.9,'watch-camp':1.05,'ash-sawmill':1.1,'oath-mine':1.05,'dungeon-gate':1.1,'moon-caravan':1.05};
export function realmScenery(region){
  if(region.provinceId){
    const identity=realmSiteIdentity(region),habitat=HABITATS[region.habitat]||HABITATS.forest;
    const arts=[identity.art,identity.secondary,habitat[0],identity.resource,habitat[1],habitat[2]];
    const anchors=[[-7.8,-4.8],[7.8,-4.5],[-8.9,6.9],[8.9,7.1],[-.5,-9.4],[.6,10.2]];
    return arts.map((art,index)=>{
      let [dx,dy]=anchors[index];
      // Keep harvest fields usable and visible; the same adjusted anchor is
      // used by the client and the server's collision map.
      for(let attempt=0;attempt<5;attempt++){
        const blocked=(region.resourceFields||[]).some(field=>Math.hypot((region.x+dx-field.x)*1.5,region.y+dy-field.y)<2.8);
        if(!blocked)break;
        dy+=dy<0?-3.3:3.3;
      }
      return {id:`scenery-${region.id}-${index}`,kind:'scenery',art,x:region.x+dx,y:region.y+dy,radius:FRONTIER_RADII[art]||RADII[art]||.55,large:index<2};
    });
  }
  const artSet=region.provinceId&&HABITATS[region.habitat]||SETS[region.kind]||['dead-tree','mossy-boulder','lantern'];
  return artSet.map((art,index)=>{
    const angle=(index*120+25)*Math.PI/180;
    return {id:`scenery-${region.id}-${index}`,kind:'scenery',art,x:region.x+Math.cos(angle)*6.5,y:region.y+Math.sin(angle)*7.5,radius:RADII[art]||0,large:index===1};
  });
}
export function ensureSceneryObstacles(world,regions){
  if(world.sceneryCollisionVersion===3)return;
  world.obstacles=[...(world.obstacles||[]).filter(o=>!o.id?.startsWith('scenery-')),...regions.flatMap(realmScenery).filter(o=>o.radius>0)];
  world.sceneryCollisionVersion=3;
}
