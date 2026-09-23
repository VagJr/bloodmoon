import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { connectMongoStore } from '../server/mongo-store.js';

if (!process.argv.includes('--confirm') && process.env.BLOODMOON_CONFIRM_WIPE !== 'YES') {
  console.error('Operação destrutiva. Para limpar somente os dados do Bloodmoon, use: npm run db:wipe:confirm');
  process.exit(2);
}
if (!process.env.MONGO_URI) {
  console.error('MONGO_URI não configurada; nada foi apagado.');
  process.exit(2);
}

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dataDir = path.resolve(process.env.DATA_DIR || path.join(root, 'data'));
const store = await connectMongoStore();
try {
  const deleted = await store.wipe();
  await mkdir(dataDir, { recursive: true });
  await writeFile(path.join(dataDir, 'state.json'), `${JSON.stringify({ schema: 3, profiles: [], rooms: [], world: null }, null, 2)}\n`, 'utf8');
  for (const legacyFile of ['profiles.json', 'state.json.tmp', 'profiles.json.tmp']) {
    await rm(path.join(dataDir, legacyFile), { force: true });
  }
  console.log(`Wipe concluído em ${store.dbName}: ${deleted.profiles} perfis, ${deleted.rooms} partidas e ${deleted.world} registros de mundo removidos. O estado local também foi reiniciado.`);
} finally {
  await store.close();
}
