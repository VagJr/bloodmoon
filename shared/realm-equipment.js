// Card identifiers remain the combat/save format; anatomy is shared by UI and server.
export const EQUIPMENT_SLOTS={head:'Cabeça',body:'Corpo',hands:'Mãos',relic:'Relíquia',charm:'Talismã'};
export function equipmentType(id){return ({blackcrown:'head',ward:'body',ivorychain:'body',blade:'hands',fangofeclipse:'hands'})[id]||'relic';}
export function equipmentLayout(ids=[]){
 const slots={};
 for(const id of ids){const type=equipmentType(id);slots[type==='relic'&&slots.relic?'charm':type]=id;}
 return slots;
}
export function equipInLayout(ids,id){const slots=equipmentLayout(ids),type=equipmentType(id);slots[type==='relic'&&slots.relic&&slots.relic!==id?'charm':type]=id;return [...new Set(Object.values(slots))];}
export function equippedItem(profile,cardId){const pinned=profile.realm?.roaming?.equipmentItems?.[cardId];return (profile.items||[]).find(i=>(!pinned||i.id===pinned)&&i.cardId===cardId&&i.durability>0&&!i.listingId&&!i.lockedBy);}
