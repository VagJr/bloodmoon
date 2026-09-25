const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const labels={timber:'madeira',ore:'minério',essence:'essência'};
function button(city,op,label,{type='city',resource='',district='',value='',disabled=false}={}){return `<button class="rw-secondary" data-rw-dominion="${type}" data-operation="${op}" data-house="${esc(city.houseId)}" data-resource="${resource}" data-district="${esc(district)}" data-value="${value}" ${disabled?'disabled':''}>${label}</button>`;}
export function cityPanel(w,a){
 const c=w.settlements?.find(c=>c.houseId===a.houseId);if(!c)return '';
 const near=Math.hypot((w.player.x-c.x)*1.5,w.player.y-c.y)<=4.2,leader=c.leader===w.player.publicId;
 let body=`<section class="rw-city-panel"><div class="rw-city-summary"><b>Nível ${c.level}</b><span>${c.hp}/${c.maxHp} integridade</span><span>${c.population||10} habitantes · ${c.food||0} alimento</span><span>Moral ${Math.round(c.morale||0)}% · influência ${Math.round(c.influence||0)}</span><span>${c.treasury||0} Marcas no tesouro</span></div>`;
 if(c.occupiedBy)body+='<p class="rw-city-alert">Território ocupado. Reconstrua a sede para encerrar a ocupação da cidade.</p>';
 if(c.own){
  body+='<h4>Armazém compartilhado</h4><div class="rw-city-grid">'+Object.entries(labels).map(([key,name])=>`<article><b>${c.stock[key]} ${name}</b>${button(c,'deposit','Depositar 5',{resource:key,disabled:!near})}${button(c,'withdraw','Retirar 5',{resource:key,disabled:!near||c.stock[key]<5})}</article>`).join('')+'</div>';
  body+=button(c,'repair','Reparar sede · 5 madeira + 5 minério',{disabled:!near||c.hp>=c.maxHp})+button(c,'upgrade',`Ampliar cidade · ${c.level*20} madeira + ${c.level*15} minério`,{disabled:!near||!leader||!c.hp||c.level>=5});
  body+='<h4>Governo</h4><div class="rw-city-grid">'+[0,5,10,15].map(t=>button(c,'tax',`Tributo ${t}%${c.tax===t?' · ATUAL':''}`,{type:'government',value:t,disabled:!near||!leader})).join('')+'</div>';
  body+='<div class="rw-city-grid">'+Object.entries({balanced:'Equilíbrio',military:'Expansão militar',commerce:'Comércio',harvest:'Abastecimento'}).map(([v,n])=>button(c,'policy',n+(c.policy===v?' · ATUAL':''),{type:'government',value:v,disabled:!near||!leader})).join('')+'</div>';
 }else{
  body+=button(c,'alliance',c.offer?'Aceitar aliança':'Propor aliança',{disabled:!near||c.allied});
  if(c.allied)body+=Object.entries(labels).map(([key,name])=>button(c,'trade',`Trocar 5 ${key==='timber'?'minério':'madeira'} por 5 ${name}`,{resource:key,disabled:!near||c.stock[key]<5})).join('');
  else body+=button(c,'siege','Atacar sede · guerra declarada',{disabled:!near||!c.hp||c.protectedUntil>w.serverTime})+button(c,'capture','Ocupar território · 60 s após a queda',{type:'government',disabled:!near||!!c.hp||c.conqueror!==w.myHouse||w.serverTime<c.captureAt});
 }
 body+='<h4>Bairros · posições construíveis</h4><div class="rw-city-districts">';
 for(const d of c.districts||[]){const spec=w.cityBuildings[d.kind],close=Math.hypot((w.player.x-d.x)*1.5,w.player.y-d.y)<=4.2;
  body+=`<article><img src="/assets/world/objects/${spec.art}.png" alt=""><div><b>${esc(spec.name)} · ${d.level}/3</b><small>${d.hp}/${d.maxHp} integridade</small><p>${esc(spec.text)}</p></div>`;
  if(c.own)body+=button(c,'build',`Construir · ${spec.timber*(d.level+1)} madeira / ${spec.ore*(d.level+1)} minério`,{type:'district',district:d.id,disabled:!close||!c.hp||d.level>=3})+button(c,'repair','Reparar · 5 madeira + 5 minério',{type:'district',district:d.id,disabled:!close||!d.level||d.hp>=d.maxHp});
  else if(!c.allied)body+=button(c,'siege','Destruir bairro',{type:'district',district:d.id,disabled:!close||!d.hp||!c.hp||c.protectedUntil>w.serverTime});
  body+='</article>';
 }
 body+='</div><h4>Últimos ciclos da cidade</h4>'+ (c.history||[]).slice(0,4).map(e=>`<p>Receita +${e.income} · alimento ${e.food} · moral ${e.morale}% · ${e.threat} ameaças</p>`).join('');
 return body+'</section>';
}
export function districtMarkers(w){return (w.settlements||[]).flatMap(c=>(c.districts||[]).map(d=>{const spec=w.cityBuildings[d.kind];return `<button class="rw-city-lot ${d.hp?'built':'vacant'}" data-rw-actor="house-${esc(c.houseId)}" style="left:${d.x*96}px;top:${d.y*64}px" title="${esc(spec.name)} · ${esc(c.name)}">${d.level?`<img src="/assets/world/objects/${spec.art}.png" alt="">`:'<i>＋</i>'}<b>${esc(spec.name)}</b><small>${d.level?'GRAU '+d.level+' · '+d.hp+'/'+d.maxHp:'CONSTRUIR'}</small></button>`;})).join('');}
