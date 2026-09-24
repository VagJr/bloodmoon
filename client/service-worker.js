const CACHE='bloodmoon-shell-v1';
const SHELL=['/','/play','/offline.html','/manifest.webmanifest','/app-icon.svg','/app-icon-192.png','/app-icon-512.png'];
self.addEventListener('install',event=>event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)).then(()=>self.skipWaiting())));
self.addEventListener('activate',event=>event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(key=>key.startsWith('bloodmoon-')&&key!==CACHE).map(key=>caches.delete(key)))).then(()=>self.clients.claim())));
self.addEventListener('fetch',event=>{
 const request=event.request,url=new URL(request.url);
 if(request.method!=='GET'||url.origin!==self.location.origin||url.pathname.startsWith('/api/'))return;
 if(request.mode==='navigate'){
  event.respondWith(fetch(request).then(response=>{if(response.ok){const copy=response.clone();caches.open(CACHE).then(cache=>cache.put(request,copy));}return response;}).catch(async()=>await caches.match(request)||await caches.match('/offline.html')));
  return;
 }
 if(/\.(?:css|js|svg|png|webp|woff2?)$/i.test(url.pathname)){
  event.respondWith(caches.match(request).then(cached=>{
   const fresh=fetch(request).then(response=>{if(response.ok)caches.open(CACHE).then(cache=>cache.put(request,response.clone()));return response;});
   return cached||fresh;
  }));
 }
});
