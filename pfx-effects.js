(function(){
  'use strict';

  // ========= Konfiguracja =========
  const PFX = {
    vibrateOnAssemble: true,
    soundOnAssemble:   true,
    cameraGlance:      true,
    lightSweep:        true,
    rollingNumbers:    true,
    priceFlash:        true,
    buttonRipple:      true,
    mugDropAssembly:   true,
    springEasing:      true,
  };
  // Ekspozycja konfiguracji (dev console może wyłączać)
  window.PFX = PFX;

  // ========= Utils =========
  function onReady(fn){
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
      setTimeout(fn, 0);
    } else {
      window.addEventListener('DOMContentLoaded', fn);
    }
  }

  function isMobile(){ return window.innerWidth < 768; }

  // ========= Dźwięk "tuk" (Web Audio, bez zewnętrznych plików) =========
  let audioCtx = null;
  function ensureAudioCtx(){
    if (!PFX.soundOnAssemble) return null;
    try {
      if (!audioCtx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        audioCtx = new AC();
      }
      if (audioCtx.state === 'suspended') audioCtx.resume().catch(()=>{});
      return audioCtx;
    } catch(e){ return null; }
  }
  function playTuk(){
    const ctx = ensureAudioCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const sr = ctx.sampleRate;
      // Impuls szumu — symulacja uderzenia drewna
      const impSamples = Math.floor(sr * 0.005);
      const nBuf = ctx.createBuffer(1, impSamples, sr);
      const nd = nBuf.getChannelData(0);
      for (let i = 0; i < impSamples; i++) nd[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource();
      noise.buffer = nBuf;
      // Rezonans drewna ~200Hz
      const res = ctx.createBiquadFilter();
      res.type = 'bandpass'; res.frequency.value = 195 + Math.random() * 30; res.Q.value = 12;
      const env = ctx.createGain();
      env.gain.setValueAtTime(0.45, now);
      env.gain.exponentialRampToValueAtTime(0.0001, now + 0.18);
      noise.connect(res).connect(env).connect(ctx.destination);
      noise.start(now); noise.stop(now + 0.20);
      // Body — niski bas drewna
      const body = ctx.createOscillator(), bg = ctx.createGain();
      body.type = 'sine';
      body.frequency.setValueAtTime(90 + Math.random() * 20, now);
      body.frequency.exponentialRampToValueAtTime(50, now + 0.14);
      bg.gain.setValueAtTime(0.28, now);
      bg.gain.exponentialRampToValueAtTime(0.0001, now + 0.16);
      body.connect(bg).connect(ctx.destination);
      body.start(now); body.stop(now + 0.18);
    } catch(e){}
  }

  // ========= Haptic =========
  function pulseVibrate(pattern){
    if (!PFX.vibrateOnAssemble) return;
    try {
      if (navigator.vibrate) navigator.vibrate(pattern || 12);
    } catch(e){}
  }

  // ========= Rolling numbers =========
  function parsePrice(txt){
    if (!txt) return null;
    const m = String(txt).match(/-?\d+(?:[.,]\d+)?/);
    if (!m) return null;
    return parseFloat(m[0].replace(',', '.'));
  }
  function formatLikeOriginal(original, num){
    // zachowaj separator i jednostkę
    const suffix = String(original).replace(/^\s*-?\d+(?:[.,]\d+)?\s*/, '');
    const usesComma = /,/.test(original);
    const fixed = num.toFixed(2);
    return (usesComma ? fixed.replace('.', ',') : fixed) + (suffix ? (suffix.startsWith(' ') ? suffix : ' ' + suffix) : '');
  }
  const _rollTokens = new WeakMap();
  function rollNumber(el){
    if (!PFX.rollingNumbers || !el) return;
    const raw = el.textContent;
    const to = parsePrice(raw);
    if (to == null) return;
    // poprzednia wartość zapamiętana przez nas
    const prevStored = _rollTokens.get(el);
    const from = prevStored && prevStored.value != null ? prevStored.value : to;
    if (from === to) { _rollTokens.set(el, {value: to, token: Math.random()}); return; }

    const token = Math.random();
    _rollTokens.set(el, {value: to, token});

    const dur = 480;
    const t0 = performance.now();
    const direction = to >= from ? 'up' : 'down';
    el.classList.remove('pfx-price-up','pfx-price-down');
    void el.offsetWidth;
    el.classList.add(direction === 'up' ? 'pfx-price-up' : 'pfx-price-down');

    function step(now){
      const cur = _rollTokens.get(el);
      if (!cur || cur.token !== token) return; // przerwane nowszym rollem
      const p = Math.min(1, (now - t0) / dur);
      const eased = 1 - Math.pow(1 - p, 3);
      const v = from + (to - from) * eased;
      el.textContent = formatLikeOriginal(raw, v);
      if (p < 1) requestAnimationFrame(step);
      else {
        el.textContent = formatLikeOriginal(raw, to);
        setTimeout(()=>{ el.classList.remove('pfx-price-up','pfx-price-down'); }, 400);
      }
    }
    requestAnimationFrame(step);
  }
  function flashPrice(el){
    if (!PFX.priceFlash || !el) return;
    el.classList.remove('pfx-price-flash');
    void el.offsetWidth;
    el.classList.add('pfx-price-flash');
    setTimeout(()=>el.classList.remove('pfx-price-flash'), 950);
  }
  function animatePriceElements(){
    const ids = ['priceSummary','totalPriceDisplay','mobilePriceValue'];
    ids.forEach(id=>{
      const el = document.getElementById(id);
      if (el && el.textContent.trim()) {
        rollNumber(el);
        flashPrice(el);
      }
    });
  }

  // ========= Light sweep over preview canvas =========
  function fireLightSweep(){
    if (!PFX.lightSweep) return;
    const host = document.getElementById('canvasContainer')
              || document.getElementById('shelfContainer')
              || (document.querySelector('canvas') && document.querySelector('canvas').parentElement);
    if (!host) return;
    const sweep = document.createElement('div');
    sweep.className = 'pfx-sweep';
    host.appendChild(sweep);
    // force reflow then run
    void sweep.offsetWidth;
    sweep.classList.add('pfx-run');
    setTimeout(()=>{ if (sweep && sweep.parentNode) sweep.parentNode.removeChild(sweep); }, 1200);

    host.classList.remove('pfx-frame-glow');
    void host.offsetWidth;
    host.classList.add('pfx-frame-glow');
    setTimeout(()=>host.classList.remove('pfx-frame-glow'), 1500);
  }

  // ========= Camera glance (subtelny dolly-in i powrót) =========
  function cameraGlance(){
    if (!PFX.cameraGlance) return;
    try {
      if (typeof camera === 'undefined' || !camera || typeof gsap === 'undefined') return;
      if (window.__pfxCameraGlanceBusy) return;
      window.__pfxCameraGlanceBusy = true;

      const startZ = camera.position.z;
      const startY = camera.position.y;
      const dz = Math.max(0.6, Math.abs(startZ) * 0.08);

      gsap.to(camera.position, {
        z: startZ - dz,
        y: startY + 0.08,
        duration: 0.45,
        ease: 'power2.out',
        onUpdate: function(){ if (typeof controls !== 'undefined' && controls) controls.update(); },
        onComplete: function(){
          gsap.to(camera.position, {
            z: startZ,
            y: startY,
            duration: 0.55,
            ease: 'power2.inOut',
            onUpdate: function(){ if (typeof controls !== 'undefined' && controls) controls.update(); },
            onComplete: function(){ window.__pfxCameraGlanceBusy = false; }
          });
        }
      });
    } catch(e){ window.__pfxCameraGlanceBusy = false; }
  }

  // ========= Mug-shelf drop assembly (uzupełnienie braku animacji składania) =========
  function mugShelfDropAssembly(group){
    if (!PFX.mugDropAssembly || !group || typeof gsap === 'undefined') return;
    try {
      const kids = [];
      group.traverse(function(c){ if (c.isMesh) kids.push(c); });
      if (!kids.length) return;

      // Zapamiętaj finalne pozycje
      const finals = new Map();
      kids.forEach(k => finals.set(k, {x: k.position.x, y: k.position.y, z: k.position.z}));

      // Klasyfikacja obiektów
      const left  = group.getObjectByName('leftSide');
      const right = group.getObjectByName('rightSide');
      const bottom= group.getObjectByName('bottomPanel');
      const top   = group.getObjectByName('topPanel');

      // Boki z boku, góra/dół z góry, półki i przegródki z góry ze stagger
      kids.forEach(k => {
        const f = finals.get(k);
        const n = k.name || '';
        if (k === left)       gsap.set(k.position, { x: f.x - 9 });
        else if (k === right) gsap.set(k.position, { x: f.x + 9 });
        else if (k === top)   gsap.set(k.position, { y: f.y + 12 });
        else if (k === bottom)gsap.set(k.position, { y: f.y - 12 });
        else                  gsap.set(k.position, { y: f.y + 16 });
      });

      const tl = gsap.timeline();
      const springEase = PFX.springEasing ? 'back.out(1.6)' : 'power2.out';
      const softEase   = PFX.springEasing ? 'back.out(1.2)' : 'power2.out';

      if (bottom) tl.to(bottom.position, { y: finals.get(bottom).y, duration: 0.45, ease: softEase }, 0);
      if (left && right) tl.to([left.position, right.position], { x: (i)=> finals.get(i===0?left:right).x, duration: 0.5, ease: softEase }, 0.1);

      const internals = kids.filter(c => c.name && c.name.startsWith('internalShelf_'))
                            .sort((a,b)=> finals.get(a).y - finals.get(b).y);
      const dividers = kids.filter(c => c.name && (c.name.startsWith('divider_') || c.name.startsWith('divider_editor_')));

      if (internals.length) {
        tl.to(internals.map(s=>s.position), {
          y: (i)=> finals.get(internals[i]).y,
          duration: 0.42, ease: springEase,
          stagger: 0.06
        }, 0.28);
      }
      if (dividers.length) {
        tl.to(dividers.map(d=>d.position), {
          y: (i)=> finals.get(dividers[i]).y,
          duration: 0.38, ease: springEase,
          stagger: 0.03
        }, 0.42);
      }
      if (top) tl.to(top.position, { y: finals.get(top).y, duration: 0.45, ease: softEase }, 0.55);

      // Dźwięki zsynchronizowane z każdym etapem animacji GSAP
      tl.call(()=>{ // Dno ląduje
        const _c = getShelfAudioCtx(); if(!_c) return;
        const _n = _c.currentTime;
        const _o = _c.createOscillator(), _g = _c.createGain();
        _o.type='triangle'; _o.frequency.setValueAtTime(240,_n); _o.frequency.exponentialRampToValueAtTime(80,_n+0.18);
        _g.gain.setValueAtTime(0.0001,_n); _g.gain.exponentialRampToValueAtTime(0.28,_n+0.008); _g.gain.exponentialRampToValueAtTime(0.0001,_n+0.22);
        _o.connect(_g).connect(_c.destination); _o.start(_n); _o.stop(_n+0.25);
      }, null, 0.08);
      tl.call(()=>{ // Boki wsuwają się
        const _c = getShelfAudioCtx(); if(!_c) return;
        const _n = _c.currentTime;
        const _o = _c.createOscillator(), _g = _c.createGain();
        _o.type='sawtooth'; _o.frequency.setValueAtTime(100,_n); _o.frequency.exponentialRampToValueAtTime(240,_n+0.10);
        const _f = _c.createBiquadFilter(); _f.type='bandpass'; _f.frequency.value=600; _f.Q.value=2;
        _g.gain.setValueAtTime(0.0001,_n); _g.gain.exponentialRampToValueAtTime(0.18,_n+0.01); _g.gain.exponentialRampToValueAtTime(0.0001,_n+0.14);
        _o.connect(_f).connect(_g).connect(_c.destination); _o.start(_n); _o.stop(_n+0.16);
      }, null, 0.18);
      tl.call(()=>playTuk(), null, 0.32); // Pierwsza półka wewnętrzna
      tl.call(()=>playTuk(), null, 0.44); // Kolejne półki
      tl.call(()=>{ // Górna płyta zamyka — "snap"
        const _c = getShelfAudioCtx(); if(!_c) return;
        const _n = _c.currentTime;
        const _o = _c.createOscillator(), _g = _c.createGain();
        _o.type='triangle'; _o.frequency.setValueAtTime(300,_n); _o.frequency.exponentialRampToValueAtTime(120,_n+0.14);
        _g.gain.setValueAtTime(0.0001,_n); _g.gain.exponentialRampToValueAtTime(0.26,_n+0.007); _g.gain.exponentialRampToValueAtTime(0.0001,_n+0.18);
        _o.connect(_g).connect(_c.destination); _o.start(_n); _o.stop(_n+0.20);
        if(navigator.vibrate){try{navigator.vibrate([5,20,8]);}catch(_){}}
      }, null, 0.60);
    } catch(e){}
  }

  // Wykryj czy grupa to mug-shelf na podstawie config lub struktury
  function isMugShelfConfig(cfg){
    return cfg && cfg.shelfType === 'mug_shelf';
  }

  // Znajdź aktywną grupę półki w scenie (shelfGroup jest w lokalnym scope)
  function findShelfGroup(){
    try {
      if (typeof shelfGroup !== 'undefined' && shelfGroup) return shelfGroup;
    } catch(e){}
    try {
      if (typeof scene === 'undefined' || !scene || !scene.children) return null;
      for (let i = scene.children.length - 1; i >= 0; i--) {
        const ch = scene.children[i];
        if (!ch || !ch.getObjectByName) continue;
        if (ch.getObjectByName('leftSide') ||
            ch.getObjectByName('leftModule') ||
            (ch.children && ch.children.some(k => k.name && (k.name.startsWith('internalShelf_') || k.name.startsWith('divider_'))))) {
          return ch;
        }
      }
    } catch(e){}
    return null;
  }

  // ========= Dźwięk DODANIA DO KOSZYKA — delikatne "pop + chime" =========
  function playAddToCart(){
    const ctx = getShelfAudioCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const sr  = ctx.sampleRate;

      const master = ctx.createDynamicsCompressor();
      master.threshold.value = -16; master.knee.value = 10;
      master.ratio.value = 3; master.attack.value = 0.002; master.release.value = 0.20;
      master.connect(ctx.destination);

      // === 1. Miękki "pop" — jak bańka mydlana (0ms) ===
      const popLen = Math.floor(sr * 0.018);
      const popBuf = ctx.createBuffer(1, popLen, sr);
      const pd = popBuf.getChannelData(0);
      for (let i = 0; i < popLen; i++) {
        const t = i / popLen;
        pd[i] = (Math.random() * 2 - 1) * Math.exp(-t * 18);
      }
      const pop = ctx.createBufferSource();
      pop.buffer = popBuf;
      const popBp = ctx.createBiquadFilter();
      popBp.type = 'bandpass'; popBp.frequency.value = 320; popBp.Q.value = 1.2;
      const popG = ctx.createGain();
      popG.gain.setValueAtTime(0.55, now);
      popG.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
      pop.connect(popBp).connect(popG).connect(master);
      pop.start(now); pop.stop(now + 0.07);

      // === 2. Dwa delikatne "ding" jak szkło (60ms + 130ms) ===
      function softDing(freq, startAt, vol, decay) {
        const o = ctx.createOscillator(), g = ctx.createGain();
        o.type = 'sine'; o.frequency.value = freq;
        g.gain.setValueAtTime(0.0001, startAt);
        g.gain.linearRampToValueAtTime(vol, startAt + 0.006);
        g.gain.exponentialRampToValueAtTime(vol * 0.25, startAt + decay * 0.3);
        g.gain.exponentialRampToValueAtTime(0.0001, startAt + decay);
        o.connect(g).connect(master);
        o.start(startAt); o.stop(startAt + decay + 0.04);
        // cicha harmoniczna
        const o2 = ctx.createOscillator(), g2 = ctx.createGain();
        o2.type = 'sine'; o2.frequency.value = freq * 2.756; // naturalny alikwot dzwonka
        g2.gain.setValueAtTime(0.0001, startAt);
        g2.gain.linearRampToValueAtTime(vol * 0.15, startAt + 0.005);
        g2.gain.exponentialRampToValueAtTime(0.0001, startAt + decay * 0.4);
        o2.connect(g2).connect(master);
        o2.start(startAt); o2.stop(startAt + decay * 0.5);
      }

      softDing(880,  now + 0.06, 0.14, 0.55);   // A5 — wejście
      softDing(1174, now + 0.13, 0.10, 0.48);   // D6 — wyższy, delikatniejszy

      // === 3. Bardzo cichy "shimmer" końcowy (220ms) ===
      const shimLen = Math.floor(sr * 0.08);
      const shimBuf = ctx.createBuffer(1, shimLen, sr);
      const shd = shimBuf.getChannelData(0);
      for (let i = 0; i < shimLen; i++) shd[i] = Math.random() * 2 - 1;
      const shim = ctx.createBufferSource();
      shim.buffer = shimBuf;
      const shimHp = ctx.createBiquadFilter();
      shimHp.type = 'highpass'; shimHp.frequency.value = 7000;
      const shimG = ctx.createGain();
      shimG.gain.setValueAtTime(0.0001, now + 0.22);
      shimG.gain.linearRampToValueAtTime(0.055, now + 0.24);
      shimG.gain.exponentialRampToValueAtTime(0.0001, now + 0.34);
      shim.connect(shimHp).connect(shimG).connect(master);
      shim.start(now + 0.22); shim.stop(now + 0.36);

      if (navigator.vibrate) { try { navigator.vibrate([5, 35, 5]); } catch(_){} }
    } catch(e){}
  }

    // ========= Dźwięk KOPIOWANIA KODU — przyjemne "klik-pyk" =========
  function playCopyCode(){
    const ctx = getShelfAudioCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // Szybkie dwa kliknięcia jak kopia pisma maszynowego
      [0, 0.055].forEach((delay, i) => {
        const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
        o.type = 'square';
        o.frequency.setValueAtTime(1600 - i * 200, now + delay);
        f.type = 'bandpass'; f.frequency.value = 1800 - i * 200; f.Q.value = 4;
        g.gain.setValueAtTime(0.0001, now + delay);
        g.gain.exponentialRampToValueAtTime(0.09, now + delay + 0.003);
        g.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.048);
        o.connect(f).connect(g).connect(ctx.destination);
        o.start(now + delay); o.stop(now + delay + 0.06);
      });
      // Delikatny "pyk" potwierdzenia po chwili
      const oc = ctx.createOscillator(), gc = ctx.createGain();
      oc.type = 'sine';
      oc.frequency.setValueAtTime(880, now + 0.12);
      oc.frequency.exponentialRampToValueAtTime(660, now + 0.22);
      gc.gain.setValueAtTime(0.0001, now + 0.12);
      gc.gain.exponentialRampToValueAtTime(0.15, now + 0.124);
      gc.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);
      oc.connect(gc).connect(ctx.destination);
      oc.start(now + 0.12); oc.stop(now + 0.28);
      if (navigator.vibrate) { try { navigator.vibrate([4, 15, 4]); } catch(_){} }
    } catch(e){}
  }

  // ========= Dźwięk OTWARCIA DRAWERA (szuflady parametrów) — "whoosh" wysunięcia =========
  function playDrawerOpen(){
    const ctx = getShelfAudioCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // Szybki wznoszący sweep — szuflada wysuwa się
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(140, now);
      o.frequency.exponentialRampToValueAtTime(360, now + 0.14);
      o.frequency.exponentialRampToValueAtTime(320, now + 0.22);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.18, now + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.24);
      o.connect(g).connect(ctx.destination);
      o.start(now); o.stop(now + 0.26);
      // Szum "powietrza" przy wysunięciu
      const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.10), ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const ns = ctx.createBufferSource(), nf = ctx.createBiquadFilter(), ng2 = ctx.createGain();
      nf.type = 'highpass'; nf.frequency.value = 1800;
      ng2.gain.setValueAtTime(0.06, now + 0.02);
      ng2.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      ns.buffer = buf; ns.connect(nf).connect(ng2).connect(ctx.destination);
      ns.start(now + 0.02); ns.stop(now + 0.13);
    } catch(e){}
  }

  // ========= Dźwięk ZAMKNIĘCIA DRAWERA — "klik" zamknięcia =========
  function playDrawerClose(){
    const ctx = getShelfAudioCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // Opadający sweep — szuflada wsuwa się
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(300, now);
      o.frequency.exponentialRampToValueAtTime(130, now + 0.13);
      o.frequency.exponentialRampToValueAtTime(100, now + 0.20);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.14, now + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
      o.connect(g).connect(ctx.destination);
      o.start(now); o.stop(now + 0.25);
      // Krótki "tok" domknięcia
      const o2 = ctx.createOscillator(), g2 = ctx.createGain();
      o2.type = 'triangle';
      o2.frequency.setValueAtTime(220, now + 0.16);
      o2.frequency.exponentialRampToValueAtTime(110, now + 0.24);
      g2.gain.setValueAtTime(0.0001, now + 0.16);
      g2.gain.exponentialRampToValueAtTime(0.16, now + 0.163);
      g2.gain.exponentialRampToValueAtTime(0.0001, now + 0.26);
      o2.connect(g2).connect(ctx.destination);
      o2.start(now + 0.16); o2.stop(now + 0.28);
    } catch(e){}
  }

  // ========= Dźwięk BUDOWANIA półki — fizyczne drewno "tok-tok-thud" =========
  // Każde uderzenie = impuls szumu + rezonansowy filtr (symulacja drewna)
  function playShelfBuildSequence(){
    const ctx = getShelfAudioCtx();
    if (!ctx) return;

    // Helper: jedno uderzenie drewniane
    // freq: częstotliwość rezonansu (niżej = grubsza deska)
    // gain: głośność 0-1
    // decay: czas zaniku w sekundach
    // at: kiedy zagrać (ctx.currentTime offset)
    function woodHit(freq, gain, decay, at){
      try {
        const sr = ctx.sampleRate;
        // Impuls szumu (krótki — symuluje uderzenie)
        const impulseSamples = Math.floor(sr * 0.004);
        const noiseBuf = ctx.createBuffer(1, impulseSamples, sr);
        const nd = noiseBuf.getChannelData(0);
        for (let i = 0; i < impulseSamples; i++) nd[i] = (Math.random() * 2 - 1);

        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuf;

        // Filtr rezonansowy — daje charakter drewna
        const res = ctx.createBiquadFilter();
        res.type = 'bandpass';
        res.frequency.value = freq;
        res.Q.value = 14; // wysokie Q = dłuższy rezonans = bardziej "drewniane"

        // Drugi filtr — dodaje ciepło (low-shelf)
        const warmth = ctx.createBiquadFilter();
        warmth.type = 'lowshelf';
        warmth.frequency.value = 200;
        warmth.gain.value = 6;

        // Obwiednia dynamiki
        const env = ctx.createGain();
        env.gain.setValueAtTime(gain, at);
        env.gain.exponentialRampToValueAtTime(0.0001, at + decay);

        noise.connect(res).connect(warmth).connect(env).connect(ctx.destination);
        noise.start(at);
        noise.stop(at + decay + 0.02);

        // Dodatkowy "body" — niski sinusoidalny uderzenie dla grubości
        const body = ctx.createOscillator();
        const bodyGain = ctx.createGain();
        body.type = 'sine';
        body.frequency.setValueAtTime(freq * 0.45, at);
        body.frequency.exponentialRampToValueAtTime(freq * 0.22, at + decay * 0.6);
        bodyGain.gain.setValueAtTime(gain * 0.30, at);
        bodyGain.gain.exponentialRampToValueAtTime(0.0001, at + decay * 0.7);
        body.connect(bodyGain).connect(ctx.destination);
        body.start(at); body.stop(at + decay * 0.75);
      } catch(e){}
    }

    // Helper: tarcie drewna o drewno (wsuwanie boku)
    function woodSlide(freqStart, freqEnd, gain, duration, at){
      try {
        const sr = ctx.sampleRate;
        const samples = Math.floor(sr * duration);
        const noiseBuf = ctx.createBuffer(1, samples, sr);
        const nd = noiseBuf.getChannelData(0);
        // Szum z zanikającą amplitudą
        for (let i = 0; i < samples; i++){
          const t = i / samples;
          nd[i] = (Math.random() * 2 - 1) * (1 - t) * (1 - t);
        }
        const noise = ctx.createBufferSource();
        noise.buffer = noiseBuf;

        const filt = ctx.createBiquadFilter();
        filt.type = 'bandpass';
        filt.frequency.setValueAtTime(freqStart, at);
        filt.frequency.exponentialRampToValueAtTime(freqEnd, at + duration);
        filt.Q.value = 3;

        const env = ctx.createGain();
        env.gain.setValueAtTime(gain, at);
        env.gain.exponentialRampToValueAtTime(0.0001, at + duration);

        noise.connect(filt).connect(env).connect(ctx.destination);
        noise.start(at); noise.stop(at + duration + 0.01);
      } catch(e){}
    }

    const now = ctx.currentTime;

    // === Krok 1 (0ms): Lewy bok wsuwa się ===
    woodSlide(320, 180, 0.06, 0.18, now + 0.00);

    // === Krok 2 (80ms): Prawy bok wsuwa się ===
    woodSlide(300, 160, 0.055, 0.18, now + 0.08);

    // === Krok 3 (220ms): Dno ląduje — delikatne "tok" ===
    woodHit(110, 0.11, 0.22, now + 0.22);  // główne — ciche i miękkie
    woodHit(200, 0.06, 0.10, now + 0.23);  // harmoniczna

    // === Krok 4 (420ms): Pierwsza półka wewnętrzna — "tok" ===
    woodHit(210, 0.09, 0.15, now + 0.42);

    // === Krok 5 (540ms): Druga półka — "tok" (lżejsza) ===
    woodHit(240, 0.07, 0.13, now + 0.54);

    // === Krok 6 (650ms): Trzecia półka (jeśli jest) ===
    woodHit(230, 0.06, 0.12, now + 0.65);

    // === Krok 7 (780ms): Góra opada — delikatne zamknięcie ===
    woodHit(105, 0.10, 0.22, now + 0.78);  // bas — ciche
    woodHit(190, 0.05, 0.11, now + 0.79);  // harmoniczna

    // === Krok 8 (900ms): Finalne "osadzenie" — lekki dźwięk przetarcia ===
    woodSlide(260, 140, 0.04, 0.12, now + 0.92);
  }

  // ========= Dźwięk WSTAWIANIA przegródki — klocek drewniany =========
  // Każda przegródka ma swój ton (wyższy → niższy lewo→prawo), krótkie uderzenie + rezonans
  function playDividerBlock(index, total){
    const ctx = getShelfAudioCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // Ton przegródki: pierwsza najwyższa, ostatnia najniższa — jak ksylofon
      const t = total > 1 ? index / (total - 1) : 0.5;
      const baseFreq = 520 - t * 160; // 520Hz → 360Hz

      // Warstwa 1: impuls uderzenia — krótki szum przefiltrowany (drewno o drewno)
      const impSamples = Math.floor(ctx.sampleRate * 0.005);
      const impBuf = ctx.createBuffer(1, impSamples, ctx.sampleRate);
      const impD = impBuf.getChannelData(0);
      for (let i = 0; i < impSamples; i++) impD[i] = (Math.random() * 2 - 1);
      const impSrc = ctx.createBufferSource();
      impSrc.buffer = impBuf;
      const impBp = ctx.createBiquadFilter();
      impBp.type = 'bandpass'; impBp.frequency.value = baseFreq * 1.4; impBp.Q.value = 3;
      const impG = ctx.createGain();
      impG.gain.setValueAtTime(0.12, now);
      impG.gain.exponentialRampToValueAtTime(0.0001, now + 0.022);
      impSrc.connect(impBp).connect(impG).connect(ctx.destination);
      impSrc.start(now); impSrc.stop(now + 0.025);

      // Warstwa 2: rezonans drewna — opadający sine z wybrzmiewaniem
      const oRes = ctx.createOscillator(), gRes = ctx.createGain();
      oRes.type = 'triangle';
      oRes.frequency.setValueAtTime(baseFreq, now + 0.003);
      oRes.frequency.exponentialRampToValueAtTime(baseFreq * 0.72, now + 0.18);
      gRes.gain.setValueAtTime(0.0001, now + 0.003);
      gRes.gain.exponentialRampToValueAtTime(0.10, now + 0.007);
      gRes.gain.exponentialRampToValueAtTime(0.018, now + 0.08);
      gRes.gain.exponentialRampToValueAtTime(0.0001, now + 0.22);
      const resLp = ctx.createBiquadFilter();
      resLp.type = 'lowpass'; resLp.frequency.value = 1400; resLp.Q.value = 0.6;
      oRes.connect(resLp).connect(gRes).connect(ctx.destination);
      oRes.start(now + 0.003); oRes.stop(now + 0.25);

      // Warstwa 3: subtelny bas — "body" klocka
      const oBas = ctx.createOscillator(), gBas = ctx.createGain();
      oBas.type = 'sine';
      oBas.frequency.setValueAtTime(baseFreq * 0.48, now + 0.002);
      oBas.frequency.exponentialRampToValueAtTime(baseFreq * 0.32, now + 0.12);
      gBas.gain.setValueAtTime(0.0001, now + 0.002);
      gBas.gain.exponentialRampToValueAtTime(0.055, now + 0.006);
      gBas.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
      oBas.connect(gBas).connect(ctx.destination);
      oBas.start(now + 0.002); oBas.stop(now + 0.16);

    } catch(e){}
  }

  // ========= Dźwięk przy SHRINK półki (kurczenie w 3D — shelfCount maleje) =========
  // "Sprężyna wciskana" — zabawny fanny sound
  function playShelfShrink(){
    const ctx = getShelfAudioCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // Delikatne opadające "tik" — spokojne, minimalne
      const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
      o.type = 'sine';
      o.frequency.setValueAtTime(340, now);
      o.frequency.exponentialRampToValueAtTime(210, now + 0.10);
      f.type = 'lowpass'; f.frequency.value = 900; f.Q.value = 0.8;
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.07, now + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);
      o.connect(f).connect(g).connect(ctx.destination);
      o.start(now); o.stop(now + 0.15);
    } catch(e){}
  }

  // ========= Dźwięk ROZSZERZENIA półki (shelfCount rośnie) =========
  // Delikatne wznoszące "tik" — spokojne, minimalne
  function playShelfExpand(){
    const ctx = getShelfAudioCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // Łagodny wznoszący sine — subtelne potwierdzenie
      const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
      o.type = 'sine';
      o.frequency.setValueAtTime(260, now);
      o.frequency.exponentialRampToValueAtTime(420, now + 0.10);
      f.type = 'lowpass'; f.frequency.value = 1000; f.Q.value = 0.8;
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.07, now + 0.005);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.13);
      o.connect(f).connect(g).connect(ctx.destination);
      o.start(now); o.stop(now + 0.15);
    } catch(e){}
  }

  // ========= Główny hook: po zakończeniu rebuildAndAnimateIn =========
  function onShelfAssembled(config){
    try {
      // Ripple/flash UI
      animatePriceElements();
      fireLightSweep();
      cameraGlance();
      pulseVibrate([8, 30, 14]);
      // Bogata sekwencja dźwięków budowania zamiast samego "tuk"
      playShelfBuildSequence();
    } catch(e){}

    // --- Snap-in półek ---
    try { pfxSnapGroupOnce(); } catch(e){}

    // --- Particle dust ---
    try {
      var _host = document.getElementById('canvasContainer')
               || document.getElementById('shelfContainer')
               || (document.querySelector('canvas') && document.querySelector('canvas').parentElement);
      if (_host) setTimeout(function(){ pfxSpawnDust(_host); }, 80);
    } catch(e){}
  }

  // ========= Obserwacja zmian ceny (backup dla sytuacji bez updateOrderSummary) =========
  function observePrice(){
    const el = document.getElementById('priceSummary');
    if (!el) return;
    let last = el.textContent;
    const mo = new MutationObserver(()=>{
      const now = el.textContent;
      if (now !== last) {
        last = now;
        rollNumber(el);
        flashPrice(el);
        // aktualizuj mobilkę przy okazji
        const mob = document.getElementById('mobilePriceValue');
        if (mob) { rollNumber(mob); flashPrice(mob); }
      }
    });
    mo.observe(el, { childList:true, characterData:true, subtree:true });
  }

  // ========= Ripple na przyciskach =========
  function attachRipple(){
    if (!PFX.buttonRipple) return;
    document.addEventListener('click', function(e){
      const target = e.target.closest('button, .modular-control-button, .mobile-divider-icon-small, #addToCartBtn, [data-pfx-ripple]');
      if (!target) return;
      // pomiń jeśli przycisk jest disabled
      if (target.disabled) return;
      const rect = target.getBoundingClientRect();
      const size = Math.max(rect.width, rect.height);
      const x = e.clientX - rect.left - size/2;
      const y = e.clientY - rect.top  - size/2;
      const prev = getComputedStyle(target).position;
      if (prev === 'static') target.style.position = 'relative';
      target.style.overflow = 'hidden';
      const r = document.createElement('span');
      r.className = 'pfx-ripple';
      r.style.left = x + 'px';
      r.style.top  = y + 'px';
      r.style.width  = size + 'px';
      r.style.height = size + 'px';
      target.appendChild(r);
      setTimeout(()=>{ if (r.parentNode) r.parentNode.removeChild(r); }, 560);
      // mikrohaptyka
      pulseVibrate(5);
    }, true);
  }

  // ========= Input flash przy zmianie =========
  function attachInputFlash(){
    document.addEventListener('change', function(e){
      const t = e.target;
      if (!t || !t.matches) return;
      if (t.matches('select, input[type="checkbox"], input[type="radio"]')) {
        let host = t;
        if (t.type === 'checkbox' || t.type === 'radio') {
          host = t.closest('label') || t.parentElement || t;
        }
        host.classList.remove('pfx-input-flash');
        void host.offsetWidth;
        host.classList.add('pfx-input-flash');
        setTimeout(()=>host.classList.remove('pfx-input-flash'), 650);
      }
    }, true);
  }

  // ========= Delikatny klik dla zmian opcji (kolory, bez górnej/dolnej półki) =========
  function playClickSoft(){
    const ctx = ensureAudioCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // Jedno krótkie "pyk" — wysokie, miękkie
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(780 + Math.random()*120, now);
      o.frequency.exponentialRampToValueAtTime(420, now + 0.09);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.22, now + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.12);
      o.connect(g).connect(ctx.destination);
      o.start(now); o.stop(now + 0.15);

      // Mikrohaptyka na telefonach
      if (navigator.vibrate) { try { navigator.vibrate(8); } catch(_){} }
    } catch(e){}
  }

  // Podpięcie dźwięku pod najważniejsze przełączniki konfiguratora.
  // Obsługujemy:
  //   - selecty #sideColor / #shelfColor (wybór koloru boków / półek)
  //   - checkboxy #noTopShelf / #noBottomShelf (bez górnej / bez dołu) — są tworzone dynamicznie,
  //     więc używamy delegacji zdarzeń na documencie.
  // ========= DŹWIĘKI WYMIARÓW — szerokość / wysokość / głębokość =========
  //
  // Koncepcja: każdy wymiar ma własny "charakter" dźwiękowy pasujący do jego roli:
  //   Szerokość  — boczne rozciąganie, panoramiczny "whoosh" w poziomie (stereo spread)
  //   Wysokość   — pionowe rozciąganie, wznoszący/opadający glide, nutka "sprężyny"
  //   Głębokość  — poczucie tunelowania/rezonansu — filtrowany szmer z pogłosem
  //   Niestandardowa (slider) — ciągły elastyczny "squeak" zsynchronizowany z ruchem
  //
  // Wszystkie dźwięki kodują KIERUNEK zmiany:
  //   większa wartość → wyższy/jaśniejszy/szerszy dźwięk
  //   mniejsza wartość → niższy/głębszy/węższy dźwięk

  // Pamięć poprzednich wartości (by znać kierunek)
  const _dimPrev = { width: null, height: null, depth: null };

  // Pomocnik — normalizuj wartość wymiaru 0..1 w zakresie opcji danego selecta
  function _dimNorm(selectEl, val){
    if (!selectEl) return 0.5;
    const opts = Array.from(selectEl.options)
      .map(o => parseFloat(o.value))
      .filter(v => !isNaN(v) && v > 0)
      .sort((a,b) => a-b);
    if (opts.length < 2) return 0.5;
    const mn = opts[0], mx = opts[opts.length-1];
    return Math.max(0, Math.min(1, (val - mn) / (mx - mn)));
  }

  // --- SZEROKOŚĆ — delikatne poszerzanie / kurczenie zsynchronizowane z animacją ---
  function playWidthSound(newVal, oldVal){
    const ctx = getShelfAudioCtx(); if (!ctx) return;
    // Nie graj gdy aktywny jest slider niestandardowy (ma własny dźwięk)
    if (typeof _customWidthActive !== 'undefined' && _customWidthActive) return;
    try {
      const now = ctx.currentTime;
      const bigger = oldVal === null || newVal >= oldVal;
      const normVal = _dimNorm(document.getElementById('width'), newVal);
      const dur = 0.46;

      if (bigger) {
        // === POSZERZANIE — dwa głosy "rozchodzą się" na boki, miękki zanik ===

        // Głos lewy: opadający sine, jakby lewy bok odjeżdża
        const oL = ctx.createOscillator(), gL = ctx.createGain(), fL = ctx.createBiquadFilter();
        oL.type = 'sine';
        oL.frequency.setValueAtTime(320 + normVal * 60, now);
        oL.frequency.exponentialRampToValueAtTime(140 + normVal * 30, now + dur * 0.75);
        fL.type = 'lowpass'; fL.frequency.value = 900; fL.Q.value = 0.5;
        gL.gain.setValueAtTime(0.0001, now);
        gL.gain.exponentialRampToValueAtTime(0.07, now + 0.010);
        gL.gain.exponentialRampToValueAtTime(0.032, now + dur * 0.5);
        gL.gain.exponentialRampToValueAtTime(0.0001, now + dur);
        oL.connect(fL).connect(gL).connect(ctx.destination);
        oL.start(now); oL.stop(now + dur + 0.02);

        // Głos prawy: minimalnie opóźniony, lekko inny ton — razem dają "przestrzeń"
        const oR = ctx.createOscillator(), gR = ctx.createGain(), fR = ctx.createBiquadFilter();
        oR.type = 'sine';
        oR.frequency.setValueAtTime(295 + normVal * 55, now + 0.012);
        oR.frequency.exponentialRampToValueAtTime(130 + normVal * 28, now + 0.012 + dur * 0.75);
        fR.type = 'lowpass'; fR.frequency.value = 850; fR.Q.value = 0.5;
        gR.gain.setValueAtTime(0.0001, now + 0.012);
        gR.gain.exponentialRampToValueAtTime(0.06, now + 0.022);
        gR.gain.exponentialRampToValueAtTime(0.028, now + 0.012 + dur * 0.5);
        gR.gain.exponentialRampToValueAtTime(0.0001, now + 0.012 + dur);
        oR.connect(fR).connect(gR).connect(ctx.destination);
        oR.start(now + 0.012); oR.stop(now + 0.012 + dur + 0.02);

        // Miękki "tok" osadzenia na końcu
        const oTok = ctx.createOscillator(), gTok = ctx.createGain();
        oTok.type = 'triangle';
        oTok.frequency.setValueAtTime(360 + normVal * 70, now + dur * 0.82);
        oTok.frequency.exponentialRampToValueAtTime(190 + normVal * 35, now + dur * 0.82 + 0.08);
        gTok.gain.setValueAtTime(0.0001, now + dur * 0.82);
        gTok.gain.exponentialRampToValueAtTime(0.055, now + dur * 0.82 + 0.004);
        gTok.gain.exponentialRampToValueAtTime(0.0001, now + dur * 0.82 + 0.09);
        oTok.connect(gTok).connect(ctx.destination);
        oTok.start(now + dur * 0.82); oTok.stop(now + dur * 0.82 + 0.11);

      } else {
        // === KURCZENIE — dwa głosy "zbiegają się" do środka, wznoszące ===

        const oL = ctx.createOscillator(), gL = ctx.createGain(), fL = ctx.createBiquadFilter();
        oL.type = 'sine';
        oL.frequency.setValueAtTime(130 + normVal * 28, now);
        oL.frequency.exponentialRampToValueAtTime(300 + normVal * 55, now + dur * 0.72);
        oL.frequency.exponentialRampToValueAtTime(260 + normVal * 45, now + dur);
        fL.type = 'lowpass'; fL.frequency.value = 900; fL.Q.value = 0.5;
        gL.gain.setValueAtTime(0.0001, now);
        gL.gain.exponentialRampToValueAtTime(0.07, now + 0.010);
        gL.gain.exponentialRampToValueAtTime(0.028, now + dur * 0.55);
        gL.gain.exponentialRampToValueAtTime(0.0001, now + dur);
        oL.connect(fL).connect(gL).connect(ctx.destination);
        oL.start(now); oL.stop(now + dur + 0.02);

        const oR = ctx.createOscillator(), gR = ctx.createGain(), fR = ctx.createBiquadFilter();
        oR.type = 'sine';
        oR.frequency.setValueAtTime(122 + normVal * 25, now + 0.012);
        oR.frequency.exponentialRampToValueAtTime(285 + normVal * 50, now + 0.012 + dur * 0.72);
        oR.frequency.exponentialRampToValueAtTime(245 + normVal * 42, now + 0.012 + dur);
        fR.type = 'lowpass'; fR.frequency.value = 850; fR.Q.value = 0.5;
        gR.gain.setValueAtTime(0.0001, now + 0.012);
        gR.gain.exponentialRampToValueAtTime(0.058, now + 0.022);
        gR.gain.exponentialRampToValueAtTime(0.025, now + 0.012 + dur * 0.55);
        gR.gain.exponentialRampToValueAtTime(0.0001, now + 0.012 + dur);
        oR.connect(fR).connect(gR).connect(ctx.destination);
        oR.start(now + 0.012); oR.stop(now + 0.012 + dur + 0.02);

        // Miękki "tok" domknięcia
        const oTok = ctx.createOscillator(), gTok = ctx.createGain();
        oTok.type = 'triangle';
        oTok.frequency.setValueAtTime(280 + normVal * 50, now + dur * 0.82);
        oTok.frequency.exponentialRampToValueAtTime(150 + normVal * 25, now + dur * 0.82 + 0.08);
        gTok.gain.setValueAtTime(0.0001, now + dur * 0.82);
        gTok.gain.exponentialRampToValueAtTime(0.050, now + dur * 0.82 + 0.004);
        gTok.gain.exponentialRampToValueAtTime(0.0001, now + dur * 0.82 + 0.09);
        oTok.connect(gTok).connect(ctx.destination);
        oTok.start(now + dur * 0.82); oTok.stop(now + dur * 0.82 + 0.11);
      }

    } catch(e){}
  }

  // --- WYSOKOŚĆ — organiczne skrzypienie drewna rozciąganego pionowo ---
  // Rośnie: włókna naciągają się w górę — ciągły głęboki szmer z lekkim "tok" osadzenia
  // Maleje:  drewno opada, włókna odpuszczają — szmer opadający, cichy thud
  function playHeightSound(newVal, oldVal){
    const ctx = getShelfAudioCtx(); if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const bigger = oldVal === null || newVal >= oldVal;
      const normVal = _dimNorm(document.getElementById('height'), newVal);
      const dur = 0.42;

      // === Warstwa 1: skrzypienie włókien pionowych — przefiltrowany szum ===
      const sr = ctx.sampleRate;
      const samples = Math.floor(sr * dur);
      const buf = ctx.createBuffer(1, samples, sr);
      const d = buf.getChannelData(0);
      for (let i = 0; i < samples; i++){
        const t = i / samples;
        const env = bigger
          ? Math.pow(1 - t, 1.2)                    // opadający — naciąganie
          : (t < 0.15 ? t / 0.15 : Math.pow(1 - (t - 0.15) / 0.85, 1.5)); // krótki atak, zanik
        d[i] = (Math.random() * 2 - 1) * env;
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;

      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass'; bp.Q.value = 3.8;
      if (bigger) {
        // rośnie: filtr stopniowo opada — drewno się rozciąga, ton grubieje
        bp.frequency.setValueAtTime(1600 + normVal * 400, now);
        bp.frequency.exponentialRampToValueAtTime(600 + normVal * 150, now + dur * 0.75);
      } else {
        // maleje: filtr najpierw w górę (ściśnięcie), potem w dół (rozluźnienie)
        bp.frequency.setValueAtTime(700 + normVal * 200, now);
        bp.frequency.exponentialRampToValueAtTime(1200 + normVal * 250, now + dur * 0.3);
        bp.frequency.exponentialRampToValueAtTime(500 + normVal * 100, now + dur * 0.85);
      }

      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = 2000; lp.Q.value = 0.6;

      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(bigger ? 0.095 : 0.08, now + 0.007);
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      src.connect(bp).connect(lp).connect(g).connect(ctx.destination);
      src.start(now); src.stop(now + dur + 0.02);

      // === Warstwa 2: "tok" drewnianego osadzenia na końcu ruchu ===
      const oTok = ctx.createOscillator(), gTok = ctx.createGain();
      oTok.type = 'triangle';
      const tokAt = now + dur * 0.82;
      oTok.frequency.setValueAtTime(bigger ? 380 + normVal*80 : 260 + normVal*50, tokAt);
      oTok.frequency.exponentialRampToValueAtTime(bigger ? 200 + normVal*40 : 140 + normVal*25, tokAt + 0.09);
      gTok.gain.setValueAtTime(0.0001, tokAt);
      gTok.gain.exponentialRampToValueAtTime(0.06, tokAt + 0.004);
      gTok.gain.exponentialRampToValueAtTime(0.0001, tokAt + 0.10);
      oTok.connect(gTok).connect(ctx.destination);
      oTok.start(tokAt); oTok.stop(tokAt + 0.12);

      if (navigator.vibrate) try { navigator.vibrate(bigger ? [3,10,5] : [5,8,3]); } catch(_){}
    } catch(e){}
  }

  // --- GŁĘBOKOŚĆ — organiczne skrzypienie drewna w osi głębokości ---
  // Głębsza: włókna ciągną się w głąb — szmer ciemniejszy, filtr opada wolniej
  // Płytsza:  drewno wraca — szmer jaśniejszy, lekkie skrzypnięcie powrotu
  function playDepthSound(newVal, oldVal){
    const ctx = getShelfAudioCtx(); if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const deeper = oldVal === null || newVal >= oldVal;
      const normVal = _dimNorm(document.getElementById('depth'), newVal);
      const dur = 0.36;

      // === Warstwa 1: skrzypienie drewna w głąb / powrót ===
      const sr = ctx.sampleRate;
      const samples = Math.floor(sr * dur);
      const buf = ctx.createBuffer(1, samples, sr);
      const d = buf.getChannelData(0);
      for (let i = 0; i < samples; i++){
        const t = i / samples;
        const env = Math.pow(1 - t, 1.3);
        d[i] = (Math.random() * 2 - 1) * env;
      }
      const src = ctx.createBufferSource();
      src.buffer = buf;

      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass'; bp.Q.value = 5.0;
      if (deeper) {
        // wchodzenie w głąb — ton ciemnieje, jak napinające się deski tylne
        bp.frequency.setValueAtTime(1100 + normVal * 250, now);
        bp.frequency.exponentialRampToValueAtTime(400 + normVal * 80, now + dur * 0.8);
      } else {
        // wychodzenie — lekkie skrzypnięcie powrotu, nieco jaśniejsze
        bp.frequency.setValueAtTime(550 + normVal * 150, now);
        bp.frequency.exponentialRampToValueAtTime(980 + normVal * 200, now + dur * 0.4);
        bp.frequency.exponentialRampToValueAtTime(620 + normVal * 120, now + dur * 0.9);
      }

      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass'; lp.frequency.value = deeper ? 1600 : 2000; lp.Q.value = 0.6;

      const g = ctx.createGain();
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(deeper ? 0.085 : 0.075, now + 0.007);
      g.gain.exponentialRampToValueAtTime(0.0001, now + dur);

      src.connect(bp).connect(lp).connect(g).connect(ctx.destination);
      src.start(now); src.stop(now + dur + 0.02);

      // === Warstwa 2: miękki "tok" osadzenia na końcu ===
      const oTok = ctx.createOscillator(), gTok = ctx.createGain();
      oTok.type = 'triangle';
      const tokAt = now + dur * 0.80;
      oTok.frequency.setValueAtTime(deeper ? 300 + normVal*60 : 360 + normVal*70, tokAt);
      oTok.frequency.exponentialRampToValueAtTime(deeper ? 160 + normVal*30 : 200 + normVal*40, tokAt + 0.08);
      gTok.gain.setValueAtTime(0.0001, tokAt);
      gTok.gain.exponentialRampToValueAtTime(0.052, tokAt + 0.004);
      gTok.gain.exponentialRampToValueAtTime(0.0001, tokAt + 0.09);
      oTok.connect(gTok).connect(ctx.destination);
      oTok.start(tokAt); oTok.stop(tokAt + 0.11);

      if (navigator.vibrate) try { navigator.vibrate(deeper ? [4,8,3] : [3,6,4]); } catch(_){}
    } catch(e){}
  }

  // --- SLIDER NIESTANDARDOWEJ SZEROKOŚCI — pojedyncze delikatne "pyk" ---
  let _customWidthLastPlay = 0;
  let _customWidthLastVal  = null;
  let _customWidthActive   = false; // flaga blokująca playWidthSound podczas suwania
  function playCustomWidthSlider(val){
    const ctx = getShelfAudioCtx(); if (!ctx) return;
    const now2 = Date.now();
    if (now2 - _customWidthLastPlay < 80) return;
    _customWidthLastPlay = now2;
    _customWidthActive = true;
    // Zdejmij flagę po czasie dłuższym niż animacja
    clearTimeout(playCustomWidthSlider._blockTimer);
    playCustomWidthSlider._blockTimer = setTimeout(() => { _customWidthActive = false; }, 600);
    try {
      const now = ctx.currentTime;
      // Jedno miękkie "pyk" — krótka sinusoida z szybkim zanikiem
      const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
      o.type = 'sine';
      const norm = Math.max(0, Math.min(1, (val - 35) / (59 - 35)));
      o.frequency.setValueAtTime(600 + norm * 180, now);
      o.frequency.exponentialRampToValueAtTime(360 + norm * 100, now + 0.07);
      f.type = 'lowpass'; f.frequency.value = 1200; f.Q.value = 0.6;
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.07, now + 0.004);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.08);
      o.connect(f).connect(g).connect(ctx.destination);
      o.start(now); o.stop(now + 0.10);
      _customWidthLastVal = val;
    } catch(e){}
  }

  // ========= Podpięcie dźwięków wymiarów =========
  function attachDimensionSounds(){
    // Odblokowanie AudioCtx — potrzebne też dla tych dźwięków
    // (getShelfAudioCtx używa tego samego ctx co drag sounds)

    // Śledź poprzednie wartości selectów wymiarów
    const _initDimPrev = () => {
      const w = document.getElementById('width');
      const h = document.getElementById('height');
      const d = document.getElementById('depth');
      if (w && w.value && w.value !== '' && w.value !== 'custom') _dimPrev.width  = parseFloat(w.value);
      if (h && h.value && h.value !== '')                          _dimPrev.height = parseFloat(h.value);
      if (d && d.value && d.value !== '')                          _dimPrev.depth  = parseFloat(d.value);
    };
    setTimeout(_initDimPrev, 500); // po załadowaniu galerii

    document.addEventListener('change', function(e){
      const t = e.target;
      if (!t) return;

      // Szerokość (select standardowy) — dźwięk odpala GSAP timeline zsynchronizowany z animacją
      // Tutaj tylko śledzimy poprzednią wartość
      if (t.id === 'width' && t.value && t.value !== 'custom') {
        const v = parseFloat(t.value);
        if (!isNaN(v)) {
          window._widthPrevForSound = _dimPrev.width; // zapamiętaj PRZED zmianą
          _dimPrev.width = v;
        }
        return;
      }

      // Wysokość
      if (t.id === 'height' && t.value && t.value !== '') {
        const v = parseFloat(t.value);
        if (!isNaN(v)) {
          playHeightSound(v, _dimPrev.height);
          _dimPrev.height = v;
        }
        return;
      }

      // Głębokość
      if (t.id === 'depth' && t.value && t.value !== '') {
        const v = parseFloat(t.value);
        if (!isNaN(v)) {
          playDepthSound(v, _dimPrev.depth);
          _dimPrev.depth = v;
        }
        return;
      }
    }, true);

    // Slider niestandardowej szerokości (input type=range)
    document.addEventListener('input', function(e){
      const t = e.target;
      if (!t || t.id !== 'customWidthInput') return;
      const v = parseFloat(t.value);
      if (!isNaN(v)) {
        playCustomWidthSlider(v);
        _dimPrev.width = v;
      }
    }, true);
  }

  function attachOptionSounds(){
    document.addEventListener('change', function(e){
      const t = e.target;
      if (!t || !t.id) return;
      if (t.id === 'sideColor' || t.id === 'shelfColor' ||
          t.id === 'noTopShelf' || t.id === 'noBottomShelf' ||
          t.id === 'modularNoTopShelf' || t.id === 'modularNoBottomShelf') {
        playClickSoft();
      }
    }, true);

    // Dodatkowo: klik w "chipy" podglądu koloru (gdyby user klikał w swatch zamiast select),
    // oraz klik w etykietę przełącznika "bez górnej / bez dołu" (label otacza checkbox).
    document.addEventListener('click', function(e){
      const t = e.target;
      if (!t || !t.closest) return;
      // Label z checkboxem noTopShelf / noBottomShelf / modular*
      const chipLabel = t.closest('label.divider-toggle-chip');
      if (chipLabel) {
        const cb = chipLabel.querySelector('input[type="checkbox"]');
        if (cb && (cb.id === 'noTopShelf' || cb.id === 'noBottomShelf' ||
                   cb.id === 'modularNoTopShelf' || cb.id === 'modularNoBottomShelf')) {
          // `change` wystrzeli i tak, ale dajemy natychmiastowy feedback przy klik
          playClickSoft();
          return;
        }
      }
      // Klik w swatch-display (użytkownik otwiera select) — lekki dźwięk otwarcia nie gra,
      // ale gdy user wybierze opcję w select, zadziała handler change powyżej.
    }, true);
  }

  // ========= Pierwsza interakcja: odblokuj AudioContext =========
  function attachAudioUnlock(){
    const unlock = ()=>{ ensureAudioCtx(); document.removeEventListener('click', unlock); document.removeEventListener('touchstart', unlock); };
    document.addEventListener('click', unlock, { once:true, passive:true });
    document.addEventListener('touchstart', unlock, { once:true, passive:true });
  }

  // ========= Wrappery funkcji konfiguratora =========
  function wrapWhenReady(){
    // Wrap rebuildAndAnimateIn (jeśli istnieje)
    if (typeof window.rebuildAndAnimateIn === 'function' && !window.rebuildAndAnimateIn.__pfxWrapped) {
      const orig = window.rebuildAndAnimateIn;
      const wrapped = function(config, withRot){
        const p = orig.apply(this, arguments);
        if (p && typeof p.then === 'function') {
          p.then(()=>{
            // Nie wywołuj mugShelfDropAssembly — główny rebuildAndAnimateIn ma własną
            // premium animację składania dla mug_shelf (unikamy podwójnej animacji).
            try { onShelfAssembled(config); } catch(e){}
          }).catch(()=>{});
        }
        return p;
      };
      wrapped.__pfxWrapped = true;
      window.rebuildAndAnimateIn = wrapped;
    }

    // Wrap updateOrderSummary → rolling price + flash
    if (typeof window.updateOrderSummary === 'function' && !window.updateOrderSummary.__pfxWrapped) {
      const orig = window.updateOrderSummary;
      const wrapped = function(){
        const r = orig.apply(this, arguments);
        try { animatePriceElements(); } catch(e){}
        return r;
      };
      wrapped.__pfxWrapped = true;
      window.updateOrderSummary = wrapped;
    }

    // Wrap updatePreview → po każdej zmianie lekki glance (opcjonalnie, tylko gdy faktycznie przebudowa)
    if (typeof window.updatePreview === 'function' && !window.updatePreview.__pfxWrapped) {
      const orig = window.updatePreview;
      const wrapped = async function(animateChanges){
        const r = await orig.apply(this, arguments);
        // tutaj nic więcej – rebuildAndAnimateIn już obsługuje efekty
        return r;
      };
      wrapped.__pfxWrapped = true;
      window.updatePreview = wrapped;
    }
  }

  // Próby podpięcia wielokrotne (funkcje są definiowane w IIFE — czekamy aż będą globalne albo wstrzykujemy przez przechwycenie)
  function pollWrap(){
    let tries = 0;
    const iv = setInterval(()=>{
      wrapWhenReady();
      tries++;
      if (tries > 40) clearInterval(iv); // ~8s
    }, 200);
  }

  // ========= Start =========
  onReady(function(){
    attachRipple();
    attachInputFlash();
    attachOptionSounds();
    attachDimensionSounds();
    attachAudioUnlock();
    observePrice();
    pollWrap();

    // Pusty stan – delikatne oddychanie ramki, dopóki nie pojawi się półka
    const canvasHost = document.getElementById('canvasContainer') || document.getElementById('shelfContainer');
    if (canvasHost) {
      canvasHost.classList.add('pfx-breathe');
      // zdejmij "breathe" przy pierwszej udanej animacji
      const stopBreathe = ()=>canvasHost.classList.remove('pfx-breathe');
      window.addEventListener('pfx:assembled', stopBreathe, { once:true });
    }

    // Emituj event po pierwszej animacji (zarówno dla zewnętrznych listenerów)
    const emitAssembled = ()=>window.dispatchEvent(new CustomEvent('pfx:assembled'));
    const oldHook = onShelfAssembled;
    // monkey-refresh nie potrzebny – już używamy wrappera rebuildAndAnimateIn
    window.addEventListener('pfx:force', emitAssembled);
  });

  // Expose helpers for manual calls / debugging
  // ========= Wspólny AudioContext dla dźwięków półek (niezależny od PFX.soundOnAssemble) =========
  let shelfAudioCtx = null;
  function getShelfAudioCtx(){
    try {
      if (!shelfAudioCtx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (!AC) return null;
        shelfAudioCtx = new AC();
      }
      if (shelfAudioCtx.state === 'suspended') shelfAudioCtx.resume().catch(()=>{});
      return shelfAudioCtx;
    } catch(e){ return null; }
  }

  // ========= Dźwięk DODAWANIA półki =========
  // Delikatne "tik" — miękkie drewniane osadzenie
  function playShelfAdd(){
    const ctx = getShelfAudioCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // Miękki drewniany "tik" — delikatny, krótki
      const o1 = ctx.createOscillator(), g1 = ctx.createGain(), f1 = ctx.createBiquadFilter();
      o1.type = 'triangle';
      o1.frequency.setValueAtTime(480 + Math.random()*30, now);
      o1.frequency.exponentialRampToValueAtTime(260, now + 0.07);
      f1.type = 'lowpass'; f1.frequency.value = 1200; f1.Q.value = 1;
      g1.gain.setValueAtTime(0.0001, now);
      g1.gain.exponentialRampToValueAtTime(0.09, now + 0.004);
      g1.gain.exponentialRampToValueAtTime(0.0001, now + 0.10);
      o1.connect(f1).connect(g1).connect(ctx.destination);
      o1.start(now); o1.stop(now + 0.12);
    } catch(e){}
  }

  // ========= Dźwięk USUWANIA półki =========
  // Delikatne "fiu" — miękkie zniknięcie
  function playShelfRemove(){
    const ctx = getShelfAudioCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // Łagodny opadający sine — miękkie "wycofanie"
      const o1 = ctx.createOscillator(), g1 = ctx.createGain(), f1 = ctx.createBiquadFilter();
      o1.type = 'sine';
      o1.frequency.setValueAtTime(360, now);
      o1.frequency.exponentialRampToValueAtTime(200, now + 0.12);
      f1.type = 'lowpass'; f1.frequency.value = 800; f1.Q.value = 1;
      g1.gain.setValueAtTime(0.0001, now);
      g1.gain.exponentialRampToValueAtTime(0.07, now + 0.005);
      g1.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
      o1.connect(f1).connect(g1).connect(ctx.destination);
      o1.start(now); o1.stop(now + 0.16);
    } catch(e){}
  }

  // ========= Dźwięk CHWYTU półki (onDragStart) =========
  // Sprężynowy "fwoop" — ciągniesz półkę
  function playDragGrab(){
    const ctx = getShelfAudioCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // Sprężynowy wznoszący sweep
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(200, now);
      o.frequency.exponentialRampToValueAtTime(580, now + 0.06);
      o.frequency.exponentialRampToValueAtTime(480, now + 0.12);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.22, now + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.14);
      o.connect(g).connect(ctx.destination);
      o.start(now); o.stop(now + 0.15);
      // Krótki drewniany "tak"
      const o2 = ctx.createOscillator(), g2 = ctx.createGain();
      o2.type = 'triangle';
      o2.frequency.setValueAtTime(300, now);
      o2.frequency.exponentialRampToValueAtTime(160, now + 0.06);
      g2.gain.setValueAtTime(0.0001, now);
      g2.gain.exponentialRampToValueAtTime(0.18, now + 0.005);
      g2.gain.exponentialRampToValueAtTime(0.0001, now + 0.07);
      o2.connect(g2).connect(ctx.destination);
      o2.start(now); o2.stop(now + 0.08);
      if (navigator.vibrate) { try { navigator.vibrate(6); } catch(_){} }
    } catch(e){}
  }

  // ========= Dźwięk PRZECIĄGANIA półki (onDragMove — ciągłe rozciąganie) =========
  // Sprężynowe "zzzt" — elastyczne ciągnięcie w czasie rzeczywistym
  // Każde wywołanie generuje krótki pulsujący ton, debounced przez wywołującego
  function playDragStretch(normalizedPos){
    // normalizedPos: 0..1 — pozycja półki w zakresie (wpływa na wysokość tonu)
    const ctx = getShelfAudioCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      const baseFreq = 180 + (normalizedPos || 0.5) * 280; // 180–460 Hz zależnie od pozycji
      // Krótki "pisk" sprężyny — FM-like z modulacją
      const carrier = ctx.createOscillator();
      const modulator = ctx.createOscillator();
      const modGain = ctx.createGain();
      const outGain = ctx.createGain();

      carrier.type = 'sine';
      modulator.type = 'sine';
      carrier.frequency.value = baseFreq;
      modulator.frequency.value = baseFreq * 3.1; // harmoniczna modulacja
      modGain.gain.value = baseFreq * 0.8;

      outGain.gain.setValueAtTime(0.0001, now);
      outGain.gain.exponentialRampToValueAtTime(0.13, now + 0.004);
      outGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);

      modulator.connect(modGain).connect(carrier.frequency);
      carrier.connect(outGain).connect(ctx.destination);

      modulator.start(now); modulator.stop(now + 0.06);
      carrier.start(now);   carrier.stop(now + 0.06);

      // Dodatkowy lekki "skrzypnięcie" — szumowy komponent
      const buf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.04), ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = (Math.random() * 2 - 1);
      const src = ctx.createBufferSource(), ng = ctx.createGain(), bp = ctx.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = 1200 + normalizedPos * 800; bp.Q.value = 6;
      ng.gain.setValueAtTime(0.07, now);
      ng.gain.exponentialRampToValueAtTime(0.0001, now + 0.04);
      src.buffer = buf;
      src.connect(bp).connect(ng).connect(ctx.destination);
      src.start(now); src.stop(now + 0.045);
    } catch(e){}
  }

  // ========= Dźwięk PUSZCZENIA półki (onDragEnd) =========
  // "Boing" — sprężyna wraca, półka osiada
  function playDragRelease(){
    const ctx = getShelfAudioCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      // Sprężynowe opadanie z vibrato
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = 'sine';
      o.frequency.setValueAtTime(520, now);
      o.frequency.exponentialRampToValueAtTime(220, now + 0.18);
      o.frequency.exponentialRampToValueAtTime(180, now + 0.32);
      g.gain.setValueAtTime(0.0001, now);
      g.gain.exponentialRampToValueAtTime(0.26, now + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, now + 0.36);
      o.connect(g).connect(ctx.destination);
      o.start(now); o.stop(now + 0.38);
      // Krótki "tok" drewna osadzenia
      const o2 = ctx.createOscillator(), g2 = ctx.createGain();
      o2.type = 'triangle';
      o2.frequency.setValueAtTime(260, now + 0.28);
      o2.frequency.exponentialRampToValueAtTime(100, now + 0.42);
      g2.gain.setValueAtTime(0.0001, now + 0.28);
      g2.gain.exponentialRampToValueAtTime(0.30, now + 0.286);
      g2.gain.exponentialRampToValueAtTime(0.0001, now + 0.44);
      o2.connect(g2).connect(ctx.destination);
      o2.start(now + 0.28); o2.stop(now + 0.46);
      if (navigator.vibrate) { try { navigator.vibrate([4, 15, 8]); } catch(_){} }
    } catch(e){}
  }

  // ========= Dźwięk ZATWIERDZENIA (Gotowe) =========
  function playCustomSnap(){
    const ctx = getShelfAudioCtx();
    if (!ctx) return;
    try {
      const now = ctx.currentTime;
      [0, 0.10].forEach(delay => {
        const o = ctx.createOscillator(), g = ctx.createGain(), f = ctx.createBiquadFilter();
        o.type = 'square';
        o.frequency.setValueAtTime(1400 - delay * 200, now + delay);
        f.type = 'bandpass'; f.frequency.value = 1600; f.Q.value = 5;
        g.gain.setValueAtTime(0.0001, now + delay);
        g.gain.exponentialRampToValueAtTime(0.10, now + delay + 0.003);
        g.gain.exponentialRampToValueAtTime(0.0001, now + delay + 0.055);
        o.connect(f).connect(g).connect(ctx.destination);
        o.start(now + delay); o.stop(now + delay + 0.07);
      });
      if (navigator.vibrate) { try { navigator.vibrate([5, 30, 8]); } catch(_){} }
    } catch(e){}
  }

  // ========= Podpięcie dźwięków pod select #shelfCount (desktop + mobile) =========
  function attachShelfSounds(){
    // Odblokuj AudioContext przy pierwszej interakcji
    const unlockShelfAudio = () => { getShelfAudioCtx(); };
    document.addEventListener('click', unlockShelfAudio, { once: true, passive: true });
    document.addEventListener('touchstart', unlockShelfAudio, { once: true, passive: true });
    document.addEventListener('mousedown', unlockShelfAudio, { once: true, passive: true });

    // Śledzimy poprzednią wartość shelfCount żeby wiedzieć kierunek zmiany
    // Inicjalizujemy od razu z aktualnej wartości selecta
    const _getShelfCountNow = () => {
      const sel = document.getElementById('shelfCount');
      if (!sel || sel.value === '' || sel.value === undefined) return null;
      const v = parseInt(sel.value);
      return isNaN(v) ? null : v;
    };

    let prevShelfCount = _getShelfCountNow();

    // Aktualizuj prevShelfCount gdy opcje się przeładują (updateShelfCountOptions)
    const shelfCountObserver = new MutationObserver(() => {
      const v = _getShelfCountNow();
      if (v !== null && prevShelfCount === null) prevShelfCount = v;
    });
    const scEl = document.getElementById('shelfCount');
    if (scEl) shelfCountObserver.observe(scEl, { childList: true });

    // Główny handler change — capture=true żeby złapać przed innymi handlerami
    document.addEventListener('change', function(e){
      const t = e.target;
      if (!t || t.id !== 'shelfCount') return;
      const newVal = parseInt(t.value);
      if (isNaN(newVal) || newVal === 0) { prevShelfCount = null; return; }
      const prev = prevShelfCount;
      prevShelfCount = newVal;
      if (prev === null || prev === newVal) return;
      if (newVal > prev) { playShelfAdd(); playShelfExpand(); }
      else { playShelfRemove(); playShelfShrink(); }
    }, true);
  }

  // ========= Podpięcie dźwięków pod addToCart, kopiowanie kodu, drawer =========
  function attachUIActionSounds(){
    // Dźwięk DODANIA DO KOSZYKA
    document.addEventListener('click', function(e){
      const btn = e.target.closest('#addToCartBtn, [id*="addToCart"], [data-action="add-to-cart"]');
      if (btn && !btn.disabled) {
        setTimeout(()=>playAddToCart(), 80); // lekkie opóźnienie po animacji kliknięcia
      }
    }, true);

    // Dźwięk KOPIOWANIA KODU — każdy przycisk z "kopiuj" lub copy
    document.addEventListener('click', function(e){
      const btn = e.target.closest('button, [role="button"]');
      if (!btn) return;
      const txt = (btn.textContent || '').toLowerCase().trim();
      const id = (btn.id || '').toLowerCase();
      const isCopy = id.includes('copy') || id.includes('kopiuj') ||
                     txt.includes('kopiuj') || txt.includes('skopiuj') ||
                     btn.closest('#codeBoxCopyBtn') || btn.closest('[id*="copyBtn"]') ||
                     btn.closest('[id*="CopyBtn"]');
      if (isCopy) { playCopyCode(); }
    }, true);

    // Dźwięk OTWARCIA/ZAMKNIĘCIA DRAWERA parametrów
    document.addEventListener('click', function(e){
      const btn = e.target.closest('#topBarParams, #mobileParamsDrawerToggle, [id*="DrawerToggle"], [id*="drawerToggle"]');
      if (btn) {
        const isOpen = btn.classList.contains('open');
        // Przed zmianą stanu — sprawdzamy aktualny (po kliknięciu się odwróci)
        setTimeout(()=>{
          const nowOpen = btn.classList.contains('open');
          if (nowOpen) playDrawerOpen(); else playDrawerClose();
        }, 10);
      }
    }, true);

    // Dźwięk przy otwarciu panelu 3D (show3dButton)
    document.addEventListener('click', function(e){
      const btn = e.target.closest('#show3dButton');
      if (btn) {
        const _c = getShelfAudioCtx(); if(!_c) return;
        const _n = _c.currentTime;
        // Delikatny "whoosh" otwarcia widoku 3D
        const _o = _c.createOscillator(), _g = _c.createGain();
        _o.type = 'sine';
        _o.frequency.setValueAtTime(120, _n);
        _o.frequency.exponentialRampToValueAtTime(380, _n + 0.18);
        _o.frequency.exponentialRampToValueAtTime(320, _n + 0.28);
        _g.gain.setValueAtTime(0.0001, _n);
        _g.gain.exponentialRampToValueAtTime(0.20, _n + 0.010);
        _g.gain.exponentialRampToValueAtTime(0.0001, _n + 0.30);
        _o.connect(_g).connect(_c.destination);
        _o.start(_n); _o.stop(_n + 0.32);
      }
    }, true);
  }
  // Działamy przez monkey-patch po załadowaniu strony
  function attachDragSounds(){
    // Debounce dla playDragStretch — max raz na 60ms
    let _lastStretchTime = 0;
    let _dragActive = false;

    const _origDragStart = window.onDragStart;
    const _origDragMove  = window.onDragMove;
    const _origDragEnd   = window.onDragEnd;

    // Patch przez nasłuchiwanie pointerdown/pointermove/pointerup na canvasie THREE.js
    // (nie możemy łatwo monkey-patchować local function, więc obserwujemy canvas bezpośrednio)
    function attachToDragCanvas(){
      // canvas THREE.js to element z id threeJsCanvasWrapper lub wewnątrz niego
      const getCanvas = () => {
        const wrap = document.getElementById('threeJsCanvasWrapper');
        if (wrap) return wrap.querySelector('canvas');
        return null;
      };

      // Obserwator — czeka aż canvas pojawi się w DOM
      const mo = new MutationObserver(() => {
        const canvas = getCanvas();
        if (!canvas || canvas._dragSoundsAttached) return;
        canvas._dragSoundsAttached = true;
        mo.disconnect();

        canvas.addEventListener('pointerdown', function(e){
          // Sprawdź czy dragModeActive jest true (zmienna globalna z THREE.js sekcji)
          if (typeof dragModeActive === 'undefined' || !dragModeActive) return;
          _dragActive = false;
          // Sprawdź czy kliknięto na półkę — jeśli tak, zacznij dźwięk chwytu
          // Dajemy 20ms żeby onDragStart ustawił draggedShelf
          setTimeout(() => {
            if (typeof draggedShelf !== 'undefined' && draggedShelf) {
              _dragActive = true;
              playDragGrab();
            }
          }, 20);
        }, true);

        canvas.addEventListener('pointermove', function(e){
          if (!_dragActive) return;
          if (typeof draggedShelf === 'undefined' || !draggedShelf) { _dragActive = false; return; }
          const now = Date.now();
          if (now - _lastStretchTime < 60) return; // max 16fps dźwięku
          _lastStretchTime = now;
          // Oblicz normalizedPos z pozycji przeciąganej półki
          try {
            const shelf = draggedShelf;
            const height = parseFloat(document.getElementById('height')?.value || 60) / 10;
            const normalizedPos = (shelf.position.y + height / 2) / height;
            playDragStretch(Math.max(0, Math.min(1, normalizedPos)));
          } catch(_){ playDragStretch(0.5); }
        }, true);

        canvas.addEventListener('pointerup', function(e){
          if (!_dragActive) return;
          _dragActive = false;
          playDragRelease();
        }, true);

        canvas.addEventListener('pointerleave', function(e){
          if (!_dragActive) return;
          _dragActive = false;
          playDragRelease();
        }, true);
      });

      mo.observe(document.body, { childList: true, subtree: true });

      // Też próbuj od razu jeśli canvas już istnieje
      const canvas = getCanvas();
      if (canvas && !canvas._dragSoundsAttached) {
        canvas._dragSoundsAttached = true;
        mo.disconnect();
        canvas.addEventListener('pointerdown', function(){
          if (typeof dragModeActive === 'undefined' || !dragModeActive) return;
          _dragActive = false;
          setTimeout(() => {
            if (typeof draggedShelf !== 'undefined' && draggedShelf) {
              _dragActive = true; playDragGrab();
            }
          }, 20);
        }, true);
        canvas.addEventListener('pointermove', function(){
          if (!_dragActive) return;
          if (typeof draggedShelf === 'undefined' || !draggedShelf) { _dragActive = false; return; }
          const now = Date.now();
          if (now - _lastStretchTime < 60) return;
          _lastStretchTime = now;
          try {
            const shelf = draggedShelf;
            const height = parseFloat(document.getElementById('height')?.value || 60) / 10;
            const normalizedPos = (shelf.position.y + height / 2) / height;
            playDragStretch(Math.max(0, Math.min(1, normalizedPos)));
          } catch(_){ playDragStretch(0.5); }
        }, true);
        canvas.addEventListener('pointerup', function(){ if(!_dragActive) return; _dragActive=false; playDragRelease(); }, true);
        canvas.addEventListener('pointerleave', function(){ if(!_dragActive) return; _dragActive=false; playDragRelease(); }, true);
      }
    }

    // Dźwięk na przycisku "Gotowe" w trybie drag — patch onClick
    function patchExitButton(){
      document.addEventListener('click', function(e){
        const btn = e.target.closest('button');
        if (!btn) return;
        const txt = (btn.textContent || '').toLowerCase().trim();
        if (txt.includes('gotowe') || txt.includes('zachowaj') || txt.includes('zatwierdź')) {
          if (typeof dragModeActive !== 'undefined') {
            playCustomSnap();
          }
        }
      }, true);
    }

    attachToDragCanvas();
    patchExitButton();
  }

  window.PFX_effects = {
    fireLightSweep, cameraGlance, playTuk, playClickSoft, pulseVibrate,
    animatePriceElements, mugShelfDropAssembly, onShelfAssembled,
    playShelfAdd, playShelfRemove, playShelfExpand, playShelfShrink,
    playDragGrab, playDragStretch, playDragRelease, playCustomSnap,
    playWidthSound, playHeightSound, playDepthSound, playCustomWidthSlider,
    playAddToCart, playCopyCode, playDrawerOpen, playDrawerClose,
    playShelfBuildSequence, playDividerBlock
  };

  // ========= Dźwięk strzałek — "tik" na każdy poziom, zsynchronizowany z gsap stagger =========
  // addShelfDimensionArrows tworzy 6 obiektów na poziom (3 linie + 2 grot + 1 sprite)
  // gsap stagger 0.05s na obiekt => każdy poziom pojawia się co 6 × 0.05 = 0.30s

  function playArrowTik(ctx, freq, at) {
    try {
      const sr = ctx.sampleRate;
      const impLen = Math.floor(sr * 0.003);
      const buf = ctx.createBuffer(1, impLen, sr);
      const d = buf.getChannelData(0);
      for (let i = 0; i < impLen; i++) d[i] = (Math.random() * 2 - 1) * Math.exp(-i / impLen * 8);
      const src = ctx.createBufferSource(); src.buffer = buf;
      const bp = ctx.createBiquadFilter();
      bp.type = 'bandpass'; bp.frequency.value = freq; bp.Q.value = 11;
      const g = ctx.createGain();
      g.gain.setValueAtTime(0.22, at);
      g.gain.exponentialRampToValueAtTime(0.0001, at + 0.040);
      src.connect(bp).connect(g).connect(ctx.destination);
      src.start(at); src.stop(at + 0.05);
      // Cienki sinusowy ding — tonalność bez natarczywości
      const o = ctx.createOscillator(), og = ctx.createGain();
      o.type = 'sine'; o.frequency.value = freq * 1.8;
      og.gain.setValueAtTime(0.0001, at);
      og.gain.linearRampToValueAtTime(0.038, at + 0.004);
      og.gain.exponentialRampToValueAtTime(0.0001, at + 0.13);
      o.connect(og).connect(ctx.destination);
      o.start(at); o.stop(at + 0.15);
    } catch(e){}
  }

  function attachArrowSounds() {
    // Pentatonika durowa — brzmi harmonijnie niezależnie od liczby poziomów
    const NOTES = [220, 246.94, 277.18, 329.63, 369.99, 440, 493.88];
    let _lastFire = 0;

    function tryPatch() {
      if (typeof window.addShelfDimensionArrows !== 'function') {
        setTimeout(tryPatch, 400); return;
      }
      if (window.addShelfDimensionArrows._pfxPatched) return;
      const _orig = window.addShelfDimensionArrows;

      window.addShelfDimensionArrows = function(group, internalShelves) {
        // Policz obiekty strzałek PRZED wywołaniem (żeby wiedzieć ile dodano)
        const countBefore = group ? group.children.length : 0;

        _orig.apply(this, arguments);

        // Wycisz gdy aktywne jest własne rozmieszczenie półek
        // customShelfPositionEnabled to  w skrypcie — nie trafia na window.
        // Sprawdzamy klasy CSS przełącznika — niezawodne.
        try {
          const _sw = document.getElementById('customShelfSwitch');
          if (_sw && _sw.classList.contains('on')) return;
        } catch(_){}

        // Debounce 350ms
        const now = Date.now();
        if (now - _lastFire < 350) return;
        _lastFire = now;

        const ctx = getShelfAudioCtx(); if (!ctx) return;

        // Policz dokładnie ile obiektów dodano
        const countAfter = group ? group.children.length : 0;
        const added = countAfter - countBefore;
        // Każdy poziom = 6 obiektów (5 linii + 1 sprite), stagger 0.05s na obiekt
        // Tik gra gdy pojawia się sprite (6. obiekt poziomu) — co 6 × 0.05 = 0.30s
        const OBJECTS_PER_LEVEL = 6;
        const STAGGER = 0.05;
        const nLevels = Math.round(added / OBJECTS_PER_LEVEL);
        if (nLevels < 1) return;

        const t0 = ctx.currentTime;
        // Sprite to 6. obiekt każdego poziomu — pojawia się na indeksie (i*6 + 5) × 0.05s
        for (let i = 0; i < nLevels; i++) {
          const spriteIndex = i * OBJECTS_PER_LEVEL + 5; // indeks sprite'a w gsap stagger
          const at = t0 + spriteIndex * STAGGER;
          playArrowTik(ctx, NOTES[i % NOTES.length], at);
        }
      };
      window.addShelfDimensionArrows._pfxPatched = true;
    }
    tryPatch();
  }

  // Podepnij dźwięki przy starcie
  onReady(function(){
    attachShelfSounds();
    attachDragSounds();
    attachUIActionSounds();
    attachArrowSounds();
  });

  // =====================================================================
  // SNAP-IN PÓŁEK — sprężynowe wskakiwanie desek po złożeniu
  // Wywoływane z onShelfAssembled jako pfxSnapGroupOnce()
  // =====================================================================
  var _snapped = new WeakSet();

  function pfxSnapMesh(mesh){
    if (!mesh || !mesh.isMesh || _snapped.has(mesh)) return;
    if (typeof gsap === 'undefined') return;
    _snapped.add(mesh);

    var finalY = mesh.scale.y;

    mesh.scale.y = 0.01;
    gsap.to(mesh.scale, {
      y: finalY * 1.10,
      duration: 0.22,
      ease: 'power2.out',
      onComplete: function(){
        gsap.to(mesh.scale, {
          y: finalY,
          duration: 0.18,
          ease: 'back.out(2.5)'
        });
      }
    });
  }

  function pfxSnapGroupOnce(){
    var grp = null;
    try { if (typeof shelfGroup !== 'undefined') grp = shelfGroup; } catch(e){}
    if (!grp) return;

    var meshes = [];
    grp.traverse(function(c){
      if (c.isMesh && !_snapped.has(c)) meshes.push(c);
    });
    if (!meshes.length) return;

    meshes.sort(function(a, b){ return a.position.y - b.position.y; });
    meshes.forEach(function(m, i){
      setTimeout(function(){ pfxSnapMesh(m); }, i * 50);
    });
  }

  // =====================================================================
  // PARTICLE DUST — opadające trociny po złożeniu półki
  // Wywoływane z onShelfAssembled jako pfxSpawnDust(hostEl)
  // =====================================================================
  var PFX_DUST_COLORS = ['#d4a96a','#e8c99a','#c8955a','#f0dbb0','#b8844a','#ead5a0'];

  function pfxSpawnDust(hostEl){
    if (!hostEl) return;

    var rect = hostEl.getBoundingClientRect();
    var W = rect.width  || 320;
    var H = rect.height || 240;
    if (W < 10 || H < 10) return;

    var cv = document.createElement('canvas');
    cv.width  = W;
    cv.height = H;
    cv.style.cssText = 'position:absolute;inset:0;pointer-events:none;z-index:50;border-radius:inherit;';

    var pos = window.getComputedStyle(hostEl).position;
    if (!pos || pos === 'static') hostEl.style.position = 'relative';
    hostEl.appendChild(cv);

    var ctx2 = cv.getContext('2d');
    var particles = [];

    for (var i = 0; i < 14; i++){
      particles.push({
        x:     W * 0.10 + Math.random() * W * 0.80,
        y:     H * 0.05 + Math.random() * H * 0.30,
        vx:    (Math.random() - 0.5) * 1.4,
        vy:    0.6 + Math.random() * 1.8,
        r:     1.5 + Math.random() * 2.5,
        alpha: 0.55 + Math.random() * 0.35,
        color: PFX_DUST_COLORS[Math.floor(Math.random() * PFX_DUST_COLORS.length)],
        rot:   Math.random() * Math.PI * 2,
        rotV:  (Math.random() - 0.5) * 0.12,
        life:  1.0,
        decay: 0.014 + Math.random() * 0.010
      });
    }

    var alive = true;
    var lastT = null;

    function frame(ts){
      if (!alive) return;
      var dt = lastT ? Math.min((ts - lastT) / 16, 3) : 1;
      lastT = ts;
      ctx2.clearRect(0, 0, W, H);

      var anyAlive = false;
      for (var j = 0; j < particles.length; j++){
        var p = particles[j];
        if (p.life <= 0) continue;
        anyAlive = true;

        p.x   += p.vx * dt;
        p.y   += p.vy * dt;
        p.vy  += 0.04 * dt;
        p.vx  *= 0.995;
        p.rot += p.rotV * dt;
        p.life -= p.decay * dt;

        ctx2.save();
        ctx2.globalAlpha = Math.max(0, p.life * p.alpha);
        ctx2.translate(p.x, p.y);
        ctx2.rotate(p.rot);
        ctx2.fillStyle = p.color;
        ctx2.fillRect(-p.r, -p.r * 0.45, p.r * 2, p.r * 0.9);
        ctx2.restore();
      }

      if (anyAlive){
        requestAnimationFrame(frame);
      } else {
        alive = false;
        if (cv.parentNode) cv.parentNode.removeChild(cv);
      }
    }

    requestAnimationFrame(frame);
    setTimeout(function(){
      alive = false;
      if (cv.parentNode) cv.parentNode.removeChild(cv);
    }, 1800);
  }

})();
