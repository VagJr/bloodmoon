import {playSound} from '/effects.js';
// Navigation has its own quiet foley; gameplay cues remain owned by combat playback.
document.addEventListener('click',event=>{
 const b=event.target.closest('button,summary');if(!b||b.disabled)return;
 if(b.matches('[data-close],[data-codex-close],[data-rpg-close]'))playSound('close');
 else if(b.matches('[data-modal],[data-inspect],[data-trade-zone],[data-trade-select],[data-trade-page],[data-trade-filter],[data-rpg-unit],[data-category],summary'))playSound('navigate');
},true);
