import { MongoClient } from 'mongodb';

const withoutMongoId = document => {
  if (!document) return null;
  const { _id, ...value } = document;
  return value;
};

async function replaceSnapshot(collection, documents, session) {
  const ids = documents.map(document => document.id);
  if (documents.length) {
    await collection.bulkWrite(documents.map(document => ({
      replaceOne: {
        filter: { _id: document.id },
        replacement: { ...structuredClone(document), _id: document.id },
        upsert: true
      }
    })), { ordered: true, session });
  }
  await collection.deleteMany(ids.length ? { _id: { $nin: ids } } : {}, { session });
}

export async function connectMongoStore({ uri = process.env.MONGO_URI, dbName = process.env.MONGO_DB || 'bloodmoon' } = {}) {
  if (!uri) throw new Error('MONGO_URI não foi configurada.');
  const client = new MongoClient(uri, {
    appName: 'Bloodmoon',
    serverSelectionTimeoutMS: 10000
  });

  await client.connect();
  try {
    const db = client.db(dbName);
    await db.command({ ping: 1 });

    const profiles = db.collection('profiles');
    const rooms = db.collection('rooms');
    const worlds = db.collection('world');
    await Promise.all([
      profiles.createIndex({ name: 1 }, { name: 'by_name' }),
      profiles.createIndex({ level: -1 }, { name: 'by_level' }),
      rooms.createIndex({ mode: 1, 'game.phase': 1 }, { name: 'by_mode_phase' }),
      rooms.createIndex({ seats: 1 }, { name: 'by_participant' }),
      rooms.createIndex({ createdAt: -1 }, { name: 'by_created' })
    ]);

    return {
      dbName,
      async load() {
        const [profileDocs, roomDocs, worldDoc] = await Promise.all([
          profiles.find({}).toArray(),
          rooms.find({}).toArray(),
          worlds.findOne({ _id: 'world' })
        ]);
        return {
          profiles: profileDocs.map(withoutMongoId),
          rooms: roomDocs.map(withoutMongoId),
          world: worldDoc?.value || null
        };
      },
      async save({ profiles: profileDocs, rooms: roomDocs, world }) {
        const session = client.startSession();
        try {
          await session.withTransaction(async () => {
            await replaceSnapshot(profiles, profileDocs, session);
            await replaceSnapshot(rooms, roomDocs, session);
            await worlds.replaceOne(
              { _id: 'world' },
              { _id: 'world', value: structuredClone(world), updatedAt: new Date() },
              { upsert: true, session }
            );
          }, { writeConcern: { w: 'majority' } });
        } finally {
          await session.endSession();
        }
      },
      async wipe() {
        const session = client.startSession();
        try {
          let deleted = {};
          await session.withTransaction(async () => {
            const profileResult = await profiles.deleteMany({}, { session });
            const roomResult = await rooms.deleteMany({}, { session });
            const worldResult = await worlds.deleteMany({}, { session });
            deleted = {
              profiles: profileResult.deletedCount,
              rooms: roomResult.deletedCount,
              world: worldResult.deletedCount
            };
          }, { writeConcern: { w: 'majority' } });
          return deleted;
        } finally {
          await session.endSession();
        }
      },
      close: () => client.close()
    };
  } catch (error) {
    await client.close();
    throw error;
  }
}
