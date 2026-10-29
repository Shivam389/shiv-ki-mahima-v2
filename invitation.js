(() => {
  'use strict';
  const config = JSON.parse(document.getElementById('invitation-config').textContent);
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const music = document.getElementById('music');
  const toggle = document.getElementById('music-toggle');
  const story = document.getElementById('story');
  const envelopeScreen = document.getElementById('envelope-screen');
  const envelope = document.getElementById('open-envelope');
  let desiredPlayback = false;
  let opening = false;
  let fadeTimer;

  function updateMusic(retry = false) {
    const playing = !music.paused && !music.muted;
    toggle.setAttribute('aria-pressed', String(playing));
    const label = retry ? config.musicRetry : playing ? config.musicMute : config.musicPlay;
    toggle.setAttribute('aria-label', label);
    toggle.classList.toggle('muted', !playing);
  }

  async function playMusic() {
    clearInterval(fadeTimer);
    desiredPlayback = true;
    music.muted = false;
    music.volume = 0.05;
    try {
      // Called directly from an actual tap, including the first envelope tap.
      await music.play();
      if (!desiredPlayback) { music.pause(); return; }
      updateMusic();
      fadeTimer = setInterval(() => {
        music.volume = Math.min(0.55, music.volume + 0.04);
        if (music.volume >= 0.55) clearInterval(fadeTimer);
      }, 100);
    } catch (_) {
      desiredPlayback = false;
      updateMusic(true);
    }
  }

  toggle.addEventListener('click', () => {
    if (!music.paused && !music.muted || desiredPlayback) {
      desiredPlayback = false;
      clearInterval(fadeTimer);
      music.pause();
      updateMusic();
    } else playMusic();
  });
  music.addEventListener('pause', () => updateMusic());
  music.addEventListener('playing', () => updateMusic());
  music.addEventListener('error', () => {desiredPlayback = false; updateMusic(true);});

  function sparkle(element, count = 24) {
    if (reducedMotion) return;
    const r = element.getBoundingClientRect();
    for (let i = 0; i < count; i++) {
      const star = document.createElement('span');
      star.className = 'sparkle';
      const angle = Math.random() * Math.PI * 2;
      const distance = 50 + Math.random() * 150;
      star.style.left = `${r.left + r.width/2}px`;
      star.style.top = `${r.top + r.height/2}px`;
      star.style.setProperty('--dx', `${Math.cos(angle)*distance}px`);
      star.style.setProperty('--dy', `${Math.sin(angle)*distance - 30}px`);
      document.body.appendChild(star);
      setTimeout(() => star.remove(), 1400);
    }
  }

  const timer = document.getElementById('countdown-timer');
  const target = new Date('2026-11-21T21:00:00+05:30').getTime();
  function tick() {
    const remaining = Math.max(0, target - Date.now());
    const seconds = Math.floor(remaining / 1000);
    const values = [Math.floor(seconds/86400), Math.floor(seconds%86400/3600), Math.floor(seconds%3600/60), seconds%60];
    ['days','hours','mins','seconds'].forEach((name,i) => {
      document.getElementById('count-'+name).textContent = i ? String(values[i]).padStart(2,'0') : values[i];
    });
    timer.hidden = false;
  }
  tick();
  setInterval(tick, 1000);

  // Essential information is static HTML. Motion is an optional enhancement.
  document.querySelectorAll('.scene').forEach(scene=>scene.querySelectorAll('.rise').forEach((element,index)=>{
    element.style.transitionDelay=`${index*.13}s`;
  }));
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (!entry.isIntersecting) return;
      entry.target.classList.add('in');
      if (entry.target.classList.contains('ev')) sparkle(entry.target.querySelector('.plaque'), 16);
      observer.unobserve(entry.target);
    }), { root: story, threshold: 0.04 });
    document.querySelectorAll('.scene').forEach(element => observer.observe(element));
  } else document.querySelectorAll('.scene').forEach(element=>element.classList.add('in'));

  if (!reducedMotion) {
    const petals = document.getElementById('petals');
    for (let i=0;i<12;i++) {
      const petal = document.createElement('span');
      petal.className='petal';
      petal.style.left=`${Math.random()*100}%`;
      petal.style.animationDuration=`${12+Math.random()*9}s`;
      petal.style.animationDelay=`${-Math.random()*20}s`;
      petals.appendChild(petal);
    }
  }

  const scratchSection = document.getElementById('scratch-section');
  const canvas = document.getElementById('scratch');
  const context = canvas.getContext('2d', {willReadFrequently:true});
  const scratchBox = canvas.parentElement;
  let revealed = false;
  let drawing = false;
  let lastPoint;
  let pointerDistance = 0;

  function paintScratch() {
    if (revealed) return;
    const r = scratchBox.getBoundingClientRect();
    if (r.width === 0) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 3);
    canvas.width=Math.round(r.width*dpr); canvas.height=Math.round(r.height*dpr);
    context.setTransform(dpr,0,0,dpr,0,0);
    context.globalCompositeOperation='source-over';
    const gold=context.createLinearGradient(0,0,r.width,r.height);
    ['#edca80','#c59336','#f3d995','#b88027','#edca80'].forEach((color,i)=>gold.addColorStop(i/4,color));
    context.fillStyle=gold;context.fillRect(0,0,r.width,r.height);
    for(let i=0;i<55;i++) {
      context.fillStyle='rgba(255,255,255,.22)';context.beginPath();
      context.arc(Math.random()*r.width,Math.random()*r.height,Math.random()*1.5+.5,0,Math.PI*2);context.fill();
    }
    context.fillStyle='#674311';context.textAlign='center';context.textBaseline='middle';
    context.font=`${config.lang==='hi' ? '19' : '17'}px "${config.fonts}"`;
    context.fillText(config.scratchCanvas,r.width/2,r.height/2);
    context.globalCompositeOperation='destination-out';
  }

  function revealDate() {
    if(revealed) return;
    revealed=true;drawing=false;scratchBox.classList.add('is-revealed');
    document.getElementById('scratch-date').setAttribute('aria-hidden','false');
    document.getElementById('scratch-status').textContent=config.revealed;
    const revealButton=document.getElementById('reveal-date');
    revealButton.textContent=config.revealed;revealButton.disabled=true;
    sparkle(scratchBox,32);
  }
  document.getElementById('reveal-date').addEventListener('click',revealDate);
  function point(e) {const r=canvas.getBoundingClientRect();return {x:e.clientX-r.left,y:e.clientY-r.top};}
  function erase(e) {
    if(!drawing||revealed)return;
    const p=point(e);
    context.lineWidth=40;context.lineCap='round';context.lineJoin='round';
    context.beginPath();context.moveTo(lastPoint.x,lastPoint.y);context.lineTo(p.x,p.y);context.stroke();
    context.beginPath();context.arc(p.x,p.y,20,0,Math.PI*2);context.fill();
    pointerDistance+=Math.hypot(p.x-lastPoint.x,p.y-lastPoint.y);
    lastPoint=p;
    if(pointerDistance>90) {
      pointerDistance=0;
      const pixels=context.getImageData(0,0,canvas.width,canvas.height).data;
      let cleared=0,total=0;
      for(let i=3;i<pixels.length;i+=160){total++;if(pixels[i]<30)cleared++;}
      if(cleared/total>.42)revealDate();
    }
  }
  if(context) {
    scratchSection.hidden=false;
    canvas.addEventListener('pointerdown',e=>{drawing=true;lastPoint=point(e);canvas.setPointerCapture(e.pointerId);erase(e);});
    canvas.addEventListener('pointermove',erase);
    ['pointerup','pointercancel','lostpointercapture'].forEach(name=>canvas.addEventListener(name,()=>drawing=false));
    if('ResizeObserver' in window)new ResizeObserver(paintScratch).observe(scratchBox);
    else window.addEventListener('resize',paintScratch);
    document.fonts.ready.then(paintScratch);
  }

  const fireworkCanvas=document.getElementById('fireworks');
  const fireworkContext=fireworkCanvas.getContext('2d');
  let particles=[],fireworkVisible=false,fireworkRunning=false,lastBurst=0,lastFrame=0;
  let fireworkWidth=0,fireworkHeight=0;
  function burst() {
    const x=fireworkWidth*(.18+Math.random()*.64),y=fireworkHeight*(.25+Math.random()*.35);
    const hue=[42,330,190,15][Math.floor(Math.random()*4)];
    for(let i=0;i<42;i++){const angle=i/42*Math.PI*2,speed=1.4+Math.random()*2;particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed,life:1,hue});}
  }
  function fireworks(ts) {
    if(!fireworkVisible||document.hidden){fireworkRunning=false;particles=[];fireworkContext.clearRect(0,0,fireworkWidth,fireworkHeight);return;}
    if(ts-lastFrame>24) {
      lastFrame=ts;
      const r=fireworkCanvas.getBoundingClientRect();
      if(r.width!==fireworkWidth||r.height!==fireworkHeight){fireworkWidth=r.width;fireworkHeight=r.height;fireworkCanvas.width=r.width;fireworkCanvas.height=r.height;}
      if(ts-lastBurst>1100){burst();lastBurst=ts;}
      fireworkContext.clearRect(0,0,fireworkWidth,fireworkHeight);
      particles=particles.filter(p=>{p.x+=p.vx;p.y+=p.vy;p.vy+=.025;p.life-=.014;if(p.life<=0)return false;fireworkContext.fillStyle=`hsla(${p.hue},100%,75%,${p.life})`;fireworkContext.beginPath();fireworkContext.arc(p.x,p.y,2,0,Math.PI*2);fireworkContext.fill();return true;});
    }
    requestAnimationFrame(fireworks);
  }
  function startFireworks(){if(fireworkVisible&&!fireworkRunning&&!document.hidden){fireworkRunning=true;requestAnimationFrame(fireworks);}}
  if(fireworkContext&&!reducedMotion&&'IntersectionObserver' in window) {
    new IntersectionObserver(entries=>{fireworkVisible=entries[0].isIntersecting;startFireworks();},{root:story,threshold:.1}).observe(document.getElementById('event-reception'));
    document.getElementById('event-reception').addEventListener('pointerup',()=>{if(fireworkVisible)burst();});
    document.addEventListener('visibilitychange',startFireworks);
  }

  envelope.addEventListener('click',()=>{
    if(opening)return;opening=true;
    playMusic();envelope.classList.add('opening');sparkle(envelope,38);
    setTimeout(()=>{
      envelopeScreen.classList.add('leaving');story.classList.remove('locked');
      toggle.hidden=false;
      setTimeout(()=>{envelopeScreen.hidden=true;toggle.focus({preventScroll:true});},reducedMotion?0:850);
    },reducedMotion?0:650);
  });
  // Only lock the page after every essential handler has been installed.
  if(!window.location.hash) {
    envelopeScreen.hidden=false;story.classList.add('locked');
  } else toggle.hidden=false;
  updateMusic();
})();
