(() => {
  'use strict';
  const button=document.getElementById('install-invitation');
  const help=document.getElementById('install-help');
  const instructions=document.getElementById('install-instructions');
  const status=document.getElementById('offline-status');
  const standalone=window.matchMedia('(display-mode: standalone)');
  let installPrompt;
  const installed=()=>standalone.matches||window.navigator.standalone===true;
  // Match the illustration's edge colours around the visible image itself.
  document.querySelectorAll('.ceremony-image').forEach(image=>{
    const size=()=>{const r=image.getBoundingClientRect();image.parentElement.style.setProperty('--art-width',r.width+'px');image.parentElement.style.setProperty('--art-height',r.height+'px');};
    image.addEventListener('load',size);if(image.complete)size();
    if('ResizeObserver' in window)new ResizeObserver(size).observe(image);
  });
  function updateInstall(){button.hidden=installed();}
  updateInstall();
  standalone.addEventListener('change',updateInstall);
  window.addEventListener('appinstalled',()=>{installPrompt=null;button.hidden=true;});
  window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;updateInstall();});
  button.addEventListener('click',async()=>{
    if(installPrompt){
      const prompt=installPrompt;installPrompt=null;
      await prompt.prompt();
      const choice=await prompt.userChoice;
      if(choice.outcome==='accepted')button.hidden=true;
      return;
    }
    const ios=/iPad|iPhone|iPod/.test(navigator.userAgent)||(navigator.platform==='MacIntel'&&navigator.maxTouchPoints>1);
    const inApp=/WhatsApp|FBAN|FBAV|Instagram/.test(navigator.userAgent);
    instructions.textContent=inApp
      ? 'Open this invitation in Safari on iPhone or Chrome on Android. Then use Share or the browser menu and choose Add to Home Screen.'
      : ios
        ? 'In Safari, tap Share, then Add to Home Screen. Turn on Open as Web App if shown, then tap Add. The invitation will appear on your Home Screen.'
        : 'Open your browser menu and choose Install app or Add to Home Screen. Confirm to keep the invitation on your phone.';
    help.showModal();
  });
  document.getElementById('close-install-help').addEventListener('click',()=>help.close());
  help.addEventListener('click',event=>{if(event.target===help){const r=help.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)help.close();}});
  function prepareOffline(){
  if('serviceWorker' in navigator&&window.isSecureContext){
    navigator.serviceWorker.register('./sw.js',{scope:'./',updateViaCache:'none'})
      .then(()=>navigator.serviceWorker.ready)
      .then(()=>new Promise(resolve=>{
        const controlled=()=>{if(navigator.serviceWorker.controller){navigator.serviceWorker.removeEventListener('controllerchange',controlled);resolve();}};
        navigator.serviceWorker.addEventListener('controllerchange',controlled);controlled();
      }))
      .then(()=>{status.textContent='Invitation available offline';})
      .catch(()=>{status.textContent='Open the invitation while connected';});
  }else status.textContent='';
  }
  // Let the envelope, fonts and first screen finish before background caching.
  const queueOffline=()=>{
    if('requestIdleCallback' in window)requestIdleCallback(prepareOffline,{timeout:2500});
    else setTimeout(prepareOffline,1200);
  };
  if(document.readyState==='complete')queueOffline();
  else window.addEventListener('load',queueOffline,{once:true});
})();
