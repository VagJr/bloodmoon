function changedEntries(current,previous,key){
  const before=new Map((previous[key]||[]).map(entry=>[entry.id,entry]));
  const afterIds=new Set((current[key]||[]).map(entry=>entry.id));
  const updates=[];
  for(const entry of current[key]||[]){
    const old=before.get(entry.id);
    if(!old){updates.push(entry);continue;}
    const patch={id:entry.id};
    for(const [field,value] of Object.entries(entry)){
      if(field!=='id'&&(value&&typeof value==='object'||old[field]&&typeof old[field]==='object'
        ? JSON.stringify(value)!==JSON.stringify(old[field]) : value!==old[field]))patch[field]=value;
    }
    if(Object.keys(patch).length>1)updates.push(patch);
  }
  return {updates,removed:(previous[key]||[]).filter(entry=>!afterIds.has(entry.id)).map(entry=>entry.id)};
}

function changedObject(current,previous){
  const patch={};
  for(const [field,value] of Object.entries(current||{})){
    const old=previous?.[field];
    if(value&&typeof value==='object'||old&&typeof old==='object'
      ? JSON.stringify(value)!==JSON.stringify(old) : value!==old)patch[field]=value;
  }
  return patch;
}

export function realmWorldDelta(current,previous){
  if(!previous)return current;
  const delta={...current,partial:true,removed:{}};
  for(const key of ['actors','slots','players']){
    const {updates,removed}=changedEntries(current,previous,key);
    delta[key]=updates;
    delta.removed[key]=removed;
  }
  for(const key of ['rules','blueprints','slotKinds','continents','cityBuildings'])delete delta[key];
  for(const key of ['cards','ecology','plots','settlements','events','invasions','karma']){
    if(JSON.stringify(current[key])===JSON.stringify(previous[key]))delete delta[key];
  }
  // Character definitions, campaign catalogues and combat metadata are stable
  // for most frames. Send their changed fields while retaining their exact shape.
  for(const key of ['rpg','campaign','combat']){
    if(!current[key]||!previous[key])continue;
    const patch=changedObject(current[key],previous[key]);
    if(Object.keys(patch).length)delta[key]=patch;
    else delete delta[key];
    (delta.partialObjects??=[]).push(key);
  }
  return delta;
}

export function applyRealmWorldDelta(previous,next){
  if(!next?.partial)return next;
  if(!previous)return null;
  const merged={...previous,...next};
  for(const key of next.partialObjects||[])if(next[key])merged[key]={...previous[key],...next[key]};
  for(const key of ['actors','slots','players']){
    const removed=new Set(next.removed?.[key]||[]),updates=new Map((next[key]||[]).map(entry=>[entry.id,entry]));
    merged[key]=(previous[key]||[]).filter(entry=>!removed.has(entry.id)).map(entry=>updates.has(entry.id)?{...entry,...updates.get(entry.id)}:entry);
    const known=new Set(merged[key].map(entry=>entry.id));
    for(const entry of next[key]||[])if(!known.has(entry.id))merged[key].push(entry);
  }
  delete merged.partial;delete merged.partialObjects;delete merged.removed;
  return merged;
}

export function realmCombatDelta(current,radius=25){
  const near=entry=>Math.hypot((entry.x-current.player.x)*1.5,entry.y-current.player.y)<=radius;
  const delta={...current,partial:true,removed:{actors:[],slots:[],players:[]}};
  delta.actors=(current.actors||[]).filter(near);
  delta.slots=(current.slots||[]).filter(near);
  for(const key of ['rules','blueprints','slotKinds','continents','cityBuildings'])delete delta[key];
  return delta;
}
