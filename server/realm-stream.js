// Authenticated invalidation stream. State remains authoritative in the existing API.
const clients=new Map();
export function realmPulse(){for(const responses of clients.values())for(const res of responses){if(res.writableLength>65536){res.end();continue;}res.write('event: world\ndata: {}\n\n');}}
export function realmStream(profile,req,res){
 let set=clients.get(profile.id);if(!set){set=new Set();clients.set(profile.id,set);}if(set.size>=2){res.writeHead(429);res.end();return;}
 res.writeHead(200,{'Content-Type':'text/event-stream','Cache-Control':'no-cache','Connection':'keep-alive','X-Accel-Buffering':'no'});res.write(': connected\n\n');set.add(res);
 const ping=setInterval(()=>res.write(': heartbeat\n\n'),15000),expiry=setTimeout(()=>res.end(),600000);ping.unref();expiry.unref();
 res.on('close',()=>{clearInterval(ping);clearTimeout(expiry);set.delete(res);if(!set.size)clients.delete(profile.id);});
}
