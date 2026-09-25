// Authenticated streams carry only each viewer's public world projection.
import {realmWorldDelta} from '../shared/realm-delta.js';
const clients = new Map();
const MAX_STREAM_BACKLOG=512*1024;
const PAUSE_STREAM_BACKLOG=256*1024;

function write(client, event, data) {
  if (client.res.destroyed || client.res.writableEnded || !client.authorized() || client.res.writableLength > MAX_STREAM_BACKLOG) {
    client.res.end();
    return;
  }
  client.res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function writeEncoded(client, payload) {
  if (client.res.destroyed || client.res.writableEnded || !client.authorized() || client.res.writableLength > MAX_STREAM_BACKLOG) {
    client.res.end();
    return;
  }
  client.res.write(payload);
}

export function realmPulse() {
  for (const group of clients.values()) for (const client of group) write(client, 'world', {});
}

export function realmLivePulse(snapshot,minimumInterval=()=>0,now=Date.now()) {
  for (const [profileId, group] of clients) {
    const interval=minimumInterval(profileId);
    const due=[...group].filter(client=>now-client.lastLiveAt>=interval&&client.res.writableLength<PAUSE_STREAM_BACKLOG);
    if(!due.length)continue;
    const liveWorld = snapshot(profileId);
    if (liveWorld) {
      for (const client of due){
        const payload=`event: realm-live\ndata: ${JSON.stringify({liveWorld:realmWorldDelta(liveWorld,client.snapshot)})}\n\n`;
        writeEncoded(client,payload);client.snapshot=structuredClone(liveWorld);client.lastLiveAt=now;
      }
    }
  }
}

export function closeRealmStreams() {
  for (const group of clients.values()) for (const client of group) client.res.end();
}

export function realmStream(profile, req, res, { snapshot, authorized = () => true } = {}) {
  let group = clients.get(profile.id);
  if (!group) { group = new Set(); clients.set(profile.id, group); }
  if (group.size >= 2) { res.writeHead(429); res.end(); return; }
  res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive', 'X-Accel-Buffering': 'no' });
  res.write(': connected\n\n');
  const client = { res, authorized, lastLiveAt:Date.now() };
  group.add(client);
  if (snapshot){const liveWorld=snapshot();client.snapshot=structuredClone(liveWorld);write(client, 'realm-live', { liveWorld });}
  const ping = setInterval(() => {
    if (!authorized()) return res.end();
    if (!res.destroyed && !res.writableEnded) res.write(': heartbeat\n\n');
  }, 15000);
  const expiry = setTimeout(() => res.end(), 600000);
  ping.unref(); expiry.unref();
  res.on('close', () => {
    clearInterval(ping); clearTimeout(expiry); group.delete(client);
    if (!group.size) clients.delete(profile.id);
  });
}
