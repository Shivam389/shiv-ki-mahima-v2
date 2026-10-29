const CACHE_NAME='shivam-mahima-fc6e5861a3430882';
const PRECACHE=["./", "index.html", "app.css", "invitation.js", "install.js", "manifest.webmanifest", "wedding-programme.ics", "assets/art-baraat-clean.webp", "assets/art-baraat-prasthan-bus.webp", "assets/art-pheras-ceremony.webp", "assets/art-reception-evening.webp", "assets/art-sagai-ring-ceremony.webp", "assets/art-sangeet-clean.webp", "assets/art-varmala-transparent.webp", "assets/artwork-notes.json", "assets/envelope.jpg", "assets/font-1.ttf", "assets/font-2.ttf", "assets/font-3.ttf", "assets/font-4.ttf", "assets/font-5.ttf", "assets/fonts.css", "assets/google-maps-pin.svg", "assets/icon-180.png", "assets/icon-192.png", "assets/icon-512.png", "assets/icon-maskable.png", "assets/icon.svg", "assets/img_ganesh.jpg", "assets/img_haldi.jpg", "assets/img_palace.jpg", "assets/LICENSE-cormorantgaramond.txt", "assets/LICENSE-greatvibes.txt", "assets/LICENSE-tirodevanagarihindi.txt", "assets/manifest.json", "assets/mbot.svg", "assets/mtop.svg", "assets/music.mp3", "assets/NOTICE-google-maps.txt", "assets/orn.svg", "assets/pattern.svg", "assets/sprig.svg", "assets/topper_departure.svg", "assets/topper_sagai.svg", "assets/topper_varmala.svg"];
const ROOT=new URL('./',self.location.href);
const INDEX=new URL('index.html',ROOT).href;

self.addEventListener('install',event=>event.waitUntil((async()=>{
  const cache=await caches.open(CACHE_NAME);
  await cache.addAll(PRECACHE);
  await self.skipWaiting();
})()));
self.addEventListener('activate',event=>event.waitUntil((async()=>{
  for(const key of await caches.keys())if(key.startsWith('shivam-mahima-')&&key!==CACHE_NAME)await caches.delete(key);
  await self.clients.claim();
})()));

async function rangeResponse(request,response){
  const range=request.headers.get('range');
  if(!range)return response;
  const match=/^bytes=(\d*)-(\d*)$/.exec(range);
  if(!match)return response;
  const data=await response.arrayBuffer();
  const length=data.byteLength;
  let start=match[1]?Number(match[1]):Math.max(0,length-Number(match[2]));
  let end=match[1]&&match[2]?Math.min(Number(match[2]),length-1):length-1;
  if(!Number.isFinite(start)||!Number.isFinite(end)||start>end||start>=length)return new Response(null,{status:416,headers:{'Content-Range':`bytes */${length}`}});
  const headers=new Headers(response.headers);
  headers.set('Content-Range',`bytes ${start}-${end}/${length}`);
  headers.set('Content-Length',String(end-start+1));
  headers.set('Accept-Ranges','bytes');
  return new Response(data.slice(start,end+1),{status:206,statusText:'Partial Content',headers});
}
self.addEventListener('fetch',event=>{
  const request=event.request,url=new URL(request.url);
  if(request.method!=='GET'||url.origin!==ROOT.origin||!url.pathname.startsWith(ROOT.pathname))return;
  event.respondWith((async()=>{
    const cache=await caches.open(CACHE_NAME);
    if(request.mode==='navigate'){
      try{const response=await fetch(request);if(response.ok){await cache.put(INDEX,response.clone());return response;}throw new Error('Unavailable');}
      catch(_){
        const cached=await cache.match(INDEX)||await cache.match(ROOT.href);
        if(!cached)return Response.error();
        // Static hosts may redirect /index.html to /. Rebuild the cached
        // response so it can satisfy a navigation with redirect mode manual.
        const headers=new Headers(cached.headers);
        headers.delete('Content-Encoding');headers.delete('Content-Length');
        return new Response(cached.body,{status:cached.status,statusText:cached.statusText,headers});
      }
    }
    const cached=await cache.match(request,{ignoreSearch:true});
    if(cached)return rangeResponse(request,cached);
    return fetch(request);
  })());
});
