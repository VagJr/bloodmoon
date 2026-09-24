import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { once } from 'node:events';

test('API: acesso, privacidade, concorrência e duelo completo', async () => {
  const directory=await mkdtemp(path.join(tmpdir(),'bloodmoon-test-'));
  const server=spawn(process.execPath,['server/index.js'],{env:{...process.env,MONGO_URI:'',NODE_ENV:'test',PORT:'0',HOST:'127.0.0.1',DATA_DIR:directory},stdio:['ignore','pipe','pipe']});
  try {
    const origin=await new Promise((resolve,reject)=>{
      const timer=setTimeout(()=>reject(new Error('Servidor não iniciou')),5000);
      server.stdout.on('data',chunk=>{const found=String(chunk).match(/http:\/\/127\.0\.0\.1:\d+/);if(found){clearTimeout(timer);resolve(found[0]);}});
      server.once('error',reject);
    });
    const request=async(route,method='GET',data,token)=>{
      const response=await fetch(origin+route,{method,headers:{'Content-Type':'application/json',...(token?{Authorization:`Bearer ${token}`}:{})},...(data?{body:JSON.stringify(data)}:{})});
      return {status:response.status,data:await response.json()};
    };
    const a=(await request('/api/profile','POST',{name:'A'})).data;
    const b=(await request('/api/profile','POST',{name:'B',faction:'werewolf'})).data;
    const outsider=(await request('/api/profile','POST',{name:'C'})).data;
    assert.equal((await request('/api/vault/transfer','POST',{direction:'deposit',amount:50,version:0})).status,401);
    const deposits=await Promise.all([0,1].map(()=>request('/api/vault/transfer','POST',{direction:'deposit',amount:50,version:0},a.id)));
    assert.equal(deposits.filter(r=>r.status===200).length,1);
    const bank=deposits.find(r=>r.status===200).data.profile;
    assert.equal(bank.coins,a.coins-50);assert.equal(bank.vault.balance,50);
    assert.equal((await request('/api/vault/transfer','POST',{direction:'withdraw',amount:50,version:1},a.id)).data.profile.coins,a.coins);
    const purchase=await request('/api/market/orders','POST',{cardId:'blade',price:50},a.id);
    assert.equal(purchase.status,200);
    const orders=(await request('/api/market/orders','GET',undefined,a.id)).data.orders;
    const order=orders.find(o=>o.mine);assert.ok(order);assert.equal(order.buyerId,undefined);
    assert.equal((await request(`/api/market/orders/${order.id}/cancel`,'POST',{},b.id)).status,400);
    assert.equal((await request(`/api/market/orders/${order.id}/fill`,'POST',{itemId:b.items[0].id},b.id)).status,400);
    assert.equal((await request(`/api/market/orders/${order.id}/cancel`,'POST',{},a.id)).status,200);
    assert.equal((await request(`/api/market/orders/${order.id}/cancel`,'POST',{},a.id)).status,400);
    assert.equal((await request('/api/profile','GET',undefined,a.id)).data.coins,a.coins);
    const readiness=await request('/api/readiness?faction=vampire','GET',undefined,a.id);
    assert.equal(readiness.status,200);assert.equal(readiness.data.canStart,true);assert.equal(readiness.data.deck.cards,20);assert.ok(readiness.data.inventory.available>=1);
    assert.equal((await request('/api/readiness')).status,401);
    const deck=a.decks.find(d=>d.id===a.activeDecks.vampire);
    const invalidPreparation=await request('/api/decks/loadout','POST',{deckId:deck.id,auto:true,expectedCards:[],expectedResult:deck.cards},a.id);
    assert.equal(invalidPreparation.status,400);
    const preparation=await request('/api/decks/loadout','POST',{deckId:deck.id,auto:true,expectedCards:deck.cards,expectedResult:deck.cards},a.id);
    assert.equal(preparation.status,200);assert.deepEqual(preparation.data.deck.cards,deck.cards);assert.equal(preparation.data.profile.activeDecks.vampire,deck.id);
    const pack=await request('/api/boosters/open','POST',{},outsider.id);
    assert.equal(pack.status,200);assert.equal(pack.data.pulls.length,5);
    assert.equal(pack.data.pulls.filter(p=>p.item).length,1);
    assert.ok(pack.data.pulls.every(p=>typeof p.id==='string'&&p.rarity));
    assert.equal((await request('/api/rooms','POST',{mode:'duel',faction:'vampire'})).status,401);
    assert.equal((await request('/api/rooms','POST',{mode:'duel',faction:'vampire'},a.id)).status,400);
    assert.equal((await request('/api/matchmaking','POST',{faction:'vampire'},a.id)).data.state,'searching');
    const pair=(await request('/api/matchmaking','POST',{faction:'werewolf'},b.id)).data;
    assert.equal(pair.state,'matched');
    let room=(await request('/api/rooms/'+pair.roomId,'GET',undefined,a.id)).data;
    const route=`/api/rooms/${room.roomId}`;
    assert.equal(room.waiting,false);assert.equal(room.players[1].hand,undefined);
    const resumed=(await request('/api/readiness?faction=vampire','GET',undefined,a.id)).data;
    assert.equal(resumed.activeRoom.id,room.roomId);assert.equal(resumed.canStart,false);
    assert.match(resumed.deckError,/partida em andamento/);
    assert.equal((await request('/api/decks/loadout','POST',{deckId:deck.id,auto:true,expectedCards:deck.cards,expectedResult:deck.cards},a.id)).status,400);
    assert.equal((await request('/api/rooms','POST',{mode:'practice',faction:'vampire'},a.id)).status,400);
    assert.equal((await request(route)).status,401);
    assert.equal((await request(route,'GET',undefined,outsider.id)).status,403);
    const joined=await request(route,'GET',undefined,b.id);
    assert.equal(joined.data.seat,1);assert.equal(joined.data.waiting,false);
    assert.equal((await request(route+'/join','POST',{},outsider.id)).status,410);
    room=(await request(route+'/actions','POST',{version:0,action:{type:'pass'}},a.id)).data;
    assert.equal((await request(route+'/actions','POST',{version:0,action:{type:'pass'}},b.id)).status,409);
    while(room.phase==='playing'){
      const response=await request(route+'/actions','POST',{version:room.version,action:{type:'pass'}},room.turn===0?a.id:b.id);
      assert.equal(response.status,200);room=response.data;
    }
    assert.equal(room.winner,-1);
    const result=(await request('/api/profile','GET',undefined,a.id)).data;
    assert.equal(result.matches,1);assert.equal(result.xp,50);
    assert.equal((await request(route+'/actions','POST',{version:room.version,action:{type:'pass'}},a.id)).status,400);
    assert.equal((await request('/api/profile','GET',undefined,a.id)).data.xp,50);
    const hunter=(await request('/api/profile','POST',{name:'Hunter',faction:'vampire'})).data;
    for(let hunt=0;hunt<8;hunt++){
      let practice=(await request('/api/rooms','POST',{mode:'practice',faction:'vampire'},hunter.id)).data;
      for(let turn=0;turn<32&&practice.phase==='playing';turn++)practice=(await request(`/api/rooms/${practice.roomId}/actions`,'POST',{version:practice.version,action:{type:'pass'}},hunter.id)).data;
      assert.equal(practice.phase,'finished');
    }
    const progressed=(await request('/api/profile','GET',undefined,hunter.id)).data;
    assert.equal(progressed.matches,8);assert.ok(progressed.items.some(item=>item.source==='contract'));
    const page=await fetch(origin);assert.equal(page.status,200);assert.match(await page.text(),/Bloodmoon/);
    for(const track of ['song1','ambient_idle','battle','battle2']){
      const audio=await fetch(`${origin}/music/${track}.mp3`);
      assert.equal(audio.status,200,`${track} deve ser servido pelo jogo`);
      assert.match(audio.headers.get('content-type')||'',/audio\/mpeg/);
      assert.ok(Number(audio.headers.get('content-length'))>1000000);
      await audio.body?.cancel();
    }
    assert.equal((await fetch(`${origin}/music/fora-da-lista.mp3`)).status,404);
    assert.equal((await fetch(origin+'/server/index.js')).status,404);
  } finally {
    const exited=once(server,'exit');server.kill();await exited;
    // Apenas o diretório temporário criado acima é removido.
    assert.ok(directory.startsWith(path.join(tmpdir(),'bloodmoon-test-')));
    await rm(directory,{recursive:true,force:true});
  }
});
