const CACHE='bloodmoon-shell-v13-smooth-dodge';
const SHELL=['/','/play','/offline.html','/manifest.webmanifest','/app-icon.svg','/app-icon-192.png','/app-icon-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('bloodmoon-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;
 const navigation=request.mode==='navigate',code=/\.(?:css|js)$/i.test(url.pathname),asset=/\.(?:svg|png|webp|woff2?)$/i.test(url.pathname);
 if(!navigation&&!code&&!asset)return;
 // Copy while the network response is still unused, before giving it to the page.
 const network=fetch(request).then(response=>{
  if(response.ok){const copy=response.clone();event.waitUntil(caches.open(CACHE).then(cache=>cache.put(request,copy)).catch(()=>{}));}
  return response;
 });
 event.waitUntil(network.then(()=>{},()=>{}));
 if(navigation||code)event.respondWith(network.catch(async()=>await caches.match(request)||(navigation&&await caches.match('/offline.html'))||Response.error()));
 else event.respondWith(caches.match(request).then(cached=>cached||network).catch(()=>Response.error()));
});
