import { connectMongoStore } from '../server/mongo-store.js';

const store = await connectMongoStore();
try {
  const state = await store.load();
  console.log(`Atlas OK · base=${store.dbName} · perfis=${state.profiles.length} · partidas=${state.rooms.length} · mundo=${state.world ? 'inicializado' : 'vazio'}`);
} finally {
  await store.close();
}
