// Authenticated streams carry only each viewer's public world projection.
const clients = new Map();

function write(client, event, data) {
  if (client.res.destroyed || client.res.writableEnded || !client.authorized() || client.res.writableLength > 65536) {
    client.res.end();
    return;
  }
  client.res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export function realmPulse() {
  for (const group of clients.values()) for (const client of group) write(client, 'world', {});
}

export function realmLivePulse(snapshot) {
  for (const [profileId, group] of clients) {
    const liveWorld = snapshot(profileId);
    if (liveWorld) for (const client of group) write(client, 'realm-live', { liveWorld });
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
  const client = { res, authorized };
  group.add(client);
  if (snapshot) write(client, 'realm-live', { liveWorld: snapshot() });
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
