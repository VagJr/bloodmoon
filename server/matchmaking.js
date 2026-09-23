export class MatchQueue{
  constructor(){this.entries=new Map();}
  prune(now=Date.now()){for(const [id,entry]of this.entries)if(now-entry.seenAt>20000)this.entries.delete(id);}
  join(profile,faction,now=Date.now()){
    this.prune(now);let entry=this.entries.get(profile.id);
    if(!entry||entry.faction!==faction){entry={id:profile.id,faction,rating:profile.rating||1000,joinedAt:now,seenAt:now};this.entries.set(profile.id,entry);}else entry.seenAt=now;
    const candidates=[...this.entries.values()].filter(other=>other.id!==entry.id&&Math.abs(other.rating-entry.rating)<=Math.max(150,150+Math.floor((now-Math.min(entry.joinedAt,other.joinedAt))/15000)*100)).sort((a,b)=>a.joinedAt-b.joinedAt);
    return {entry,candidates};
  }
  remove(id){this.entries.delete(id);}
}
