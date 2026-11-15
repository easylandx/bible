const SHELL='bible-shell-v3',DATA='bible-data-v1',FILES=['./','index.html','manifest.json','icon-192.png','icon-512.png'];
self.addEventListener('install',e=>e.waitUntil(caches.open(SHELL).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting())));
self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(k=>Promise.all(k.filter(n=>n.startsWith('bible-shell')&&n!==SHELL).map(n=>caches.delete(n)))).then(()=>clients.claim())));
self.addEventListener('fetch',e=>{
  const r=e.request,u=new URL(r.url);
  if(r.method!=='GET')return;
  if(u.origin===location.origin){
    // app files: show the saved copy at once, refresh it in the background
    e.respondWith(caches.open(SHELL).then(async c=>{
      const m=await c.match(r,{ignoreSearch:true});
      const net=fetch(r).then(res=>{if(res.ok)c.put(r,res.clone());return res}).catch(()=>m);
      return m||net;
    }));
    return;
  }
  if(/(^|\.)archive\.org$/.test(u.hostname)){
    // search results, book text and page images: network first, saved copy when offline
    const img=r.destination==='image';
    e.respondWith((async()=>{
      const c=await caches.open(DATA);
      try{
        const res=await fetch(img?new Request(r.url,{mode:'cors'}):r);
        if(res.ok){await c.put(r.url,res.clone());const k=await c.keys();if(k.length>250)await c.delete(k[0])}
        return res;
      }catch(err){
        const m=await c.match(r.url);if(m)return m;
        if(img)return fetch(r);
        throw err;
      }
    })());
  }
});
