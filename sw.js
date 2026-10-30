const CACHE_NAME='shivam-mahima-ac3ddb784ee7a6a0';
const PRECACHE=["./", "index.html", "app.d6d9c2342d6f.css", "invitation.fe9e36ee94c2.js", "install.0f0f29a1eb2a.js", "manifest.webmanifest", "wedding-programme.ics", "assets/art-baraat-clean-mobile.webp", "assets/art-baraat-prasthan-bus-mobile.webp", "assets/art-pheras-ceremony-mobile.webp", "assets/art-reception-evening-mobile.webp", "assets/art-sagai-ring-ceremony-mobile.webp", "assets/art-sangeet-clean-mobile.webp", "assets/art-varmala-transparent-mobile.webp", "assets/envelope-mobile.webp", "assets/font-1.woff", "assets/font-2.woff", "assets/font-3.woff", "assets/font-4.woff", "assets/font-5.woff", "assets/google-maps-pin.svg", "assets/icon-180.png", "assets/icon-192.png", "assets/icon-512.png", "assets/icon-maskable.png", "assets/img_ganesh-mobile.webp", "assets/img_haldi-mobile.webp", "assets/img_palace-mobile.webp", "assets/LICENSE-cormorantgaramond.txt", "assets/LICENSE-greatvibes.txt", "assets/LICENSE-tirodevanagarihindi.txt", "assets/manifest.json", "assets/mbot.svg", "assets/mtop.svg", "assets/music.mp3", "assets/NOTICE-google-maps.txt", "assets/orn.svg", "assets/pattern.svg", "assets/sprig.svg", "assets/topper_departure.svg", "assets/topper_sagai.svg", "assets/topper_varmala.svg"];
const ROOT=new URL('./',self.location.href);
const INDEX=new URL('index.html',ROOT).href;

self.addEventListener('install',event=>event.waitUntil((async()=>{
  const cache=await caches.open(CACHE_NAME);
  // Cache the shell first. Limit large-asset downloads so they do not compete
  // with the first envelope tap, foreground art or music on a slow connection.
  const shell=PRECACHE.filter(file=>!file.startsWith('assets/'));
  const artwork=PRECACHE.filter(file=>file.startsWith('assets/'));
  await cache.addAll(shell);
  let next=0;
  await Promise.all([0,1].map(async()=>{
    while(next<artwork.length)await cache.add(artwork[next++]);
  }));
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
    const cached=await cache.match(request);
    if(cached)return rangeResponse(request,cached);
    return fetch(request);
  })());
});
