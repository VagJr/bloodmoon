// The public construction scaffold is deterministic. Distant camera views can
// draw it without streaming every occupied slot in every province each pulse.
export const SITE_SLOT_KINDS=Object.freeze(['construction','resource','weapon','trap','frontline','influence']);
export function realmSiteSlots(region){
 return SITE_SLOT_KINDS.map((kind,index)=>{
  const angle=index*Math.PI/3;
  return {id:`${region.id}:${kind}`,node:region.id,kind,x:Math.max(2,Math.min(1498,region.x+Math.cos(angle)*3.9)),y:Math.max(2,Math.min(98,region.y+Math.sin(angle)*5.9)),occupant:null};
 });
}

const KIND_FEATURE={
 sanctuary:{art:'watch-camp',accent:'shelter',label:'VIGÍLIA E COMÉRCIO'},
 wilds:{art:'signpost',accent:'wilds',label:'TRILHA E COLETA'},
 mine:{art:'oath-mine',accent:'quarry',label:'VEIOS E EXTRAÇÃO'},
 dungeon:{art:'dungeon-gate',accent:'crypt',label:'EXPEDIÇÃO E RISCO'},
 fortress:{art:'watchtower',accent:'bastion',label:'DEFESA E DOMÍNIO'},
 capital:{art:'fortified-gate',accent:'city',label:'POLÍTICA E MERCADO'}
};
const ROLE_ART={
 'logging-waystation':'ash-sawmill','forge-waystation':'blacksmith',forge:'blacksmith','industrial-city':'blacksmith',
 'canal-port':'stone-bridge','trade-gate':'moon-caravan','grand-market':'moon-caravan',customs:'barracks',
 temple:'stone-well','healer-outpost':'stone-well','wolf-clan':'watch-camp','astral-camp':'moon-caravan',
 observatory:'lunar-essence','throne-city':'fortified-gate'
};
const HABITAT_ART={forest:'evergreen-trees',marsh:'river-reeds',mountain:'iron-vein',ruins:'ruined-arch',city:'barracks',snow:'evergreen-trees',volcanic:'brazier',astral:'lunar-essence',citadel:'iron-fence'};
export function realmSiteIdentity(region){
 const kind=KIND_FEATURE[region.kind]||KIND_FEATURE.wilds;
 return {...kind,secondary:ROLE_ART[region.settlementRole]||HABITAT_ART[region.habitat]||'broken-pillar',resource:region.resource==='timber'?'fallen-timber':region.resource==='ore'?'iron-vein':'lunar-essence'};
}
