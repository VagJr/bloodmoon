import { MongoClient } from 'mongodb';

const withoutMongoId = document => {
  if (!document) return null;
  const { _id, ...value } = document;
  return value;
};

async function replaceDocuments(collection, documents, session) {
  if (!documents.length) return;
  const options = session ? { ordered: true, session } : { ordered: true, writeConcern: { w: 'majority' } };
  await collection.bulkWrite(documents.map(document => ({
    replaceOne: {
      filter: { _id: document.id },
      replacement: { ...structuredClone(document), _id: document.id },
      upsert: true
    }
  })), options);
}

export async function connectMongoStore({ uri = process.env.MONGO_URI, dbName = process.env.MONGO_DB || 'bloodmoon' } = {}) {
  if (!uri) throw new Error('MONGO_URI não foi configurada.');
  const client = new MongoClient(uri, {
    appName: 'Bloodmoon',
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 5,
    minPoolSize: 0,
    maxConnecting: 2,
    maxIdleTimeMS: 60000
  });

  await client.connect();
  try {
    const db = client.db(dbName);
    await db.command({ ping: 1 });

    const profiles = db.collection('profiles');
    const rooms = db.collection('rooms');
    const worlds = db.collection('world');
    const accounts=db.collection('accounts'),sessions=db.collection('sessions');
    await Promise.all([
      accounts.createIndex({email:1},{name:'unique_email',unique:true}),
      sessions.createIndex({accountId:1},{name:'by_account'}),
      profiles.createIndex({ name: 1 }, { name: 'by_name' }),
      profiles.createIndex({ level: -1 }, { name: 'by_level' }),
      rooms.createIndex({ mode: 1, 'game.phase': 1 }, { name: 'by_mode_phase' }),
      rooms.createIndex({ seats: 1 }, { name: 'by_participant' }),
      rooms.createIndex({ createdAt: -1 }, { name: 'by_created' })
    ]);

    return {
      dbName,
      async load() {
        const [profileDocs, roomDocs, worldDoc,accountDocs,sessionDocs] = await Promise.all([
          profiles.find({}).toArray(),
          rooms.find({}).toArray(),
          worlds.findOne({ _id: 'world' }),accounts.find({}).toArray(),sessions.find({expiresAt:{$gt:Date.now()}}).toArray()
        ]);
        return {
          profiles: profileDocs.map(withoutMongoId),
          rooms: roomDocs.map(withoutMongoId),
          world: worldDoc?.value || null
          ,accounts:accountDocs.map(withoutMongoId),sessions:sessionDocs.map(withoutMongoId)
        };
      },
      async save({ profiles: profileDocs = [], rooms: roomDocs = [], deleteRooms = [], world, accounts:accountDocs=[],sessions:sessionDocs=[],deleteSessions=[] }) {
        const writeCount = profileDocs.length + roomDocs.length + deleteRooms.length + accountDocs.length+sessionDocs.length+deleteSessions.length+(world === undefined ? 0 : 1);
        if (!writeCount) return;

        const write = async session => {
          await replaceDocuments(profiles, profileDocs, session);
          await replaceDocuments(rooms, roomDocs, session);
          await replaceDocuments(accounts,accountDocs,session);
          await replaceDocuments(sessions,sessionDocs,session);
          if(deleteSessions.length)await sessions.deleteMany({_id:{$in:deleteSessions}},session?{session}:{});
          if (deleteRooms.length) {
            await rooms.deleteMany({ _id: { $in: deleteRooms } }, session ? { session } : { writeConcern: { w: 'majority' } });
          }
          if (world !== undefined) {
            await worlds.replaceOne(
              { _id: 'world' },
              { _id: 'world', value: structuredClone(world), updatedAt: new Date() },
              session ? { upsert: true, session } : { upsert: true, writeConcern: { w: 'majority' } }
            );
          }
        };

        // Single-document writes are already atomic in MongoDB. Avoid a transaction round trip
        // for the common case (one profile or one room); preserve transactions for multi-doc state.
        if (writeCount === 1) {
          await write(undefined);
          return;
        }

        const session = client.startSession();
        try {
          await session.withTransaction(async () => {
            await write(session);
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
            await accounts.deleteMany({}, {session});await sessions.deleteMany({}, {session});
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
