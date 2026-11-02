/* =====================================================================
   ALTIORA — scroll-video website
   Edit CONFIG below; everything else works automatically.
   ===================================================================== */
const CONFIG = {
  brand: 'Altiora',
  frames: {
    count: 192,                                                  // number printed by extract-frames.sh
    path: i => `frames/frame_${String(i).padStart(4, '0')}.jpg`,
    mobileStep: 2                                                // phones load every 2nd frame (half the data)
  },
  startAltitude: 12000,                                          // feet, shown in the altitude meter
  smoothing: 0.14,                                               // 0.05 silky … 1 instant
  whatsapp: '923172476341'                                       // number for booking form (country code, no +)
};

(() => {
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = t => (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const easeOut = t => 1 - Math.pow(1 - t, 3);
  const isMobile = () => matchMedia('(max-width:720px)').matches;
  const reduce = matchMedia('(prefers-reduced-motion:reduce)').matches;
  const smoothing = reduce ? 1 : CONFIG.smoothing;

  // progress (0–1) through a tall pinned section
  function progress(el) {
    const r = el.getBoundingClientRect();
    const total = el.offsetHeight - innerHeight;
    return clamp(-r.top / total);
  }

  /* ---------------------------------------------------------------
     CANVAS + FRAME LOADING
     --------------------------------------------------------------- */
  const canvas = $('#sky');
  const ctx = canvas.getContext('2d');
  let frames = [], placeholder = false, lastDrawn = -1;

  function resizeCanvas() {
    const dpr = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(canvas.clientWidth * dpr);
    canvas.height = Math.round(canvas.clientHeight * dpr);
    lastDrawn = -1;
  }

  function setLoad(p) {
    $('.loader-bar i').style.width = (p * 100) + '%';
    $('.loader-pct').textContent = Math.round(p * 100) + '%';
  }

  function loadFrames() {
    const step = isMobile() ? CONFIG.frames.mobileStep : 1;
    const idx = [];
    for (let i = 1; i <= CONFIG.frames.count; i += step) idx.push(i);

    return new Promise(resolve => {
      const probe = new Image();
      probe.onerror = () => { placeholder = true; resolve(); };   // no frames yet → placeholder mode
      probe.onload = () => {
        let done = 0;
        frames = idx.map(i => {
          const im = new Image();
          im.decoding = 'async';
          im.onload = im.onerror = () => {
            setLoad(++done / idx.length);
            if (done === idx.length) resolve();
          };
          im.src = CONFIG.frames.path(i);
          return im;
        });
      };
      probe.src = CONFIG.frames.path(1);
    });
  }

  // Placeholder animation so you can test the layout before adding frames
  function drawPlaceholder(p) {
    const W = canvas.width, H = canvas.height;
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, `hsl(${215 - 20 * p},70%,${22 + 10 * p}%)`);
    g.addColorStop(1, `hsl(${25 + 10 * p},80%,${70 - 12 * p}%)`);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = `rgba(255,255,255,${0.55 * (1 - p)})`;
    for (let i = 0; i < 9; i++) {
      ctx.beginPath();
      ctx.ellipse((i / 8) * W * 1.2 - W * .1, H * (.55 + .5 * p) + (i % 3) * H * .04, W * .18, H * .06, 0, 0, Math.PI * 2);
      ctx.fill();
    }
    const gy = H * (1.1 - .45 * p);
    ctx.fillStyle = '#10141c'; ctx.fillRect(0, gy, W, H);
    for (let i = 0; i < 24; i++) {
      const bw = W / 24, bh = H * (.05 + ((i * 37) % 11) / 11 * .12) * p * 2;
      ctx.fillRect(i * bw + 2, gy - bh, bw - 4, bh);
    }
    const tw = W * .09 * (.5 + p), th = H * .7 * p;
    ctx.fillStyle = 'rgba(150,200,230,.85)'; ctx.fillRect(W / 2 - tw / 2, gy - th, tw, th);
    ctx.fillStyle = 'rgba(255,255,255,.55)';
    ctx.font = `${Math.round(W / 70 + 10)}px sans-serif`; ctx.textAlign = 'center';
    ctx.fillText('PLACEHOLDER — add your frames/ folder', W / 2, H - 14);
  }

  function drawFrame(f, p0) {
    if (placeholder) { drawPlaceholder(p0); return; }
    const img = frames[Math.round(f)];
    if (!img || !img.naturalWidth) return;
    const W = canvas.width, H = canvas.height;
    const s = Math.max(W / img.naturalWidth, H / img.naturalHeight);   // "cover" fit
    const w = img.naturalWidth * s, h = img.naturalHeight * s;
    ctx.drawImage(img, (W - w) / 2, (H - h) / 2, w, h);
  }

  /* ---------------------------------------------------------------
     SECTION 1 — DESCENT
     --------------------------------------------------------------- */
  const descent = $('#descent');
  const heroTitle = $('#heroTitle'), hint = $('#hint');
  const altNum = $('#altNum'), altFill = $('#altFill');
  const fcards = $$('.fcard'), statsEl = $('#stats'), statNums = $$('#stats b'), slogan = $('#slogan');
  const FRAME_END = 0.88;           // video finishes at 88%; the last 12% holds on the building for the slogan
  let curF = 0, descentP = 0;

  function updateDescent(p) {
    const mob = isMobile();
    const vp = clamp(p / FRAME_END);

    // brand name: grows, blurs and fades as you start descending
    const t = clamp(p / 0.16);
    heroTitle.style.opacity = 1 - t;
    heroTitle.style.transform = `translate3d(0,${-t * 40}px,0) scale(${1 + t * .25})`;
    heroTitle.style.filter = `blur(${t * 10}px)`;
    hint.style.opacity = p > .02 ? 0 : .8;

    // altitude meter
    altNum.textContent = Math.round(lerp(CONFIG.startAltitude, 0, vp)).toLocaleString('en-US');
    altFill.style.top = (vp * 100) + '%';

    // side cards
    fcards.forEach(c => {
      const from = +c.dataset.from, to = +c.dataset.to;
      const q = clamp((p - from) / (to - from));
      const inT = ease(clamp(q / .2)), outT = ease(clamp((1 - q) / .2));
      const o = (q <= 0 || q >= 1) ? 0 : Math.min(inT, outT);
      const away = 1 - o;
      const dir = c.dataset.side === 'left' ? -1 : 1;
      c.style.opacity = o;
      c.style.setProperty('--tx', mob ? '0px' : (dir * away * 90) + 'px');
      c.style.setProperty('--ty', mob ? (away * 40) + 'px' : '0px');
    });

    // counting stats
    const sIn = clamp((p - .22) / .07), sOut = clamp((.84 - p) / .05);
    statsEl.style.opacity = Math.min(sIn, sOut);
    const sp = easeOut(clamp((p - .22) / .5));
    statNums.forEach(n => { n.textContent = Math.round(+n.dataset.to * sp); });

    // slogan
    const s = clamp((p - FRAME_END) / .09);
    slogan.style.opacity = s;
    slogan.style.transform = `translate3d(0,${(1 - easeOut(s)) * 36}px,0)`;
    slogan.style.pointerEvents = s > .6 ? 'auto' : 'none';
  }

  /* ---------------------------------------------------------------
     SECTION 2 — ROOMS (stacked wipes)
     --------------------------------------------------------------- */
  const rooms = $('#rooms');
  const slides = $$('.slide', rooms), dots = $$('#roomDots i'), roomCount = $('#roomCount');

  function updateRooms(p) {
    const n = slides.length, x = p * (n - 1);
    slides.forEach((s, i) => {
      const r = i === 0 ? 1 : ease(clamp(x - (i - 1)));            // how much of slide i is revealed
      const rn = i < n - 1 ? ease(clamp(x - i)) : 0;                // how far the next slide has covered it
      s.style.zIndex = i + 1;
      s.style.clipPath = `inset(${(1 - r) * 100}% 0 0 0)`;
      $('.img', s).style.transform = `translate3d(0,${-rn * 7}%,0) scale(${1 + (1 - r) * .2})`;
      s.classList.toggle('active', Math.round(x) === i);
    });
    const a = Math.round(x);
    dots.forEach((d, i) => d.classList.toggle('on', i === a));
    roomCount.textContent = `${String(a + 1).padStart(2, '0')} / ${String(n).padStart(2, '0')}`;
  }

  /* ---------------------------------------------------------------
     SECTION 3 — AMENITIES (wave train of cards from the top)
     --------------------------------------------------------------- */
  const amSection = $('#amenities'), amStage = $('.am-stage'), acards = $$('.acard');

  function updateAmenities(p) {
    const W = amStage.clientWidth, H = amStage.clientHeight, mob = isMobile();
    const cw = acards[0].offsetWidth, ch = acards[0].offsetHeight;
    const gap = mob ? .26 : .2;                                    // spacing between cards in the train
    const x = p * (1 + (acards.length - 1) * gap);
    const amp = mob ? W * .17 : Math.min(W * .28, 380);            // how wide the wave swings
    acards.forEach((c, i) => {
      const t = x - i * gap;                                        // 0 = just above screen, 1 = just below
      if (t <= 0 || t >= 1) { c.style.visibility = 'hidden'; return; }
      c.style.visibility = 'visible';
      const ph = t * Math.PI * 2.4;
      const cx = W / 2 + Math.sin(ph) * amp;
      const cy = lerp(-ch / 2, H + ch / 2, t);
      c.style.zIndex = i + 1;
      c.style.transform = `translate3d(${cx - cw / 2}px,${cy - ch / 2}px,0) rotate(${Math.cos(ph) * 7}deg)`;
    });
  }

  /* ---------------------------------------------------------------
     MAIN LOOP
     --------------------------------------------------------------- */
  const pageProg = $('#pageprog'), nav = $('.nav');
  let last = {};

  function tick() {
    descentP = progress(descent);
    const n = placeholder ? 100 : frames.length;
    const p0 = clamp(descentP / FRAME_END);
    const target = p0 * (n - 1);
    curF += (target - curF) * smoothing;
    if (Math.abs(target - curF) < .02) curF = target;
    const fi = Math.round(curF);
    if (fi !== lastDrawn || placeholder) { drawFrame(curF, curF / (n - 1)); lastDrawn = fi; }

    const dp = descentP, rp = progress(rooms), ap = progress(amSection);
    if (dp !== last.d) { updateDescent(dp); last.d = dp; }
    if (rp !== last.r) { updateRooms(rp); last.r = rp; }
    if (ap !== last.a) { updateAmenities(ap); last.a = ap; }

    const sc = scrollY, max = document.documentElement.scrollHeight - innerHeight;
    pageProg.style.width = (sc / max * 100) + '%';
    nav.classList.toggle('solid', sc > innerHeight * 5.7);         // solid nav after the descent
    requestAnimationFrame(tick);
  }

  /* ---------------------------------------------------------------
     BOOKING FORM → WhatsApp
     --------------------------------------------------------------- */
  $('#bookForm').addEventListener('submit', e => {
    e.preventDefault();
    const d = Object.fromEntries(new FormData(e.target));
    const msg = [
      `Hello ${CONFIG.brand}, I'd like to book a visit.`,
      `Name: ${d.name}`, `Phone: ${d.phone}`, d.email && `Email: ${d.email}`,
      `Interested in: ${d.type}`, d.date && `Preferred date: ${d.date}`, d.msg && `Note: ${d.msg}`
    ].filter(Boolean).join('\n');
    window.open(`https://wa.me/${CONFIG.whatsapp}?text=${encodeURIComponent(msg)}`, '_blank');
    $('#formNote').textContent = 'Thank you — we will confirm your visit shortly.';
    e.target.reset();
  });
  $('#yr').textContent = new Date().getFullYear();

  /* ---------------------------------------------------------------
     START
     --------------------------------------------------------------- */
  let rt;
  addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { resizeCanvas(); last = {}; }, 120); });
  history.scrollRestoration = 'manual';
  scrollTo(0, 0);

  loadFrames().then(() => {
    resizeCanvas();
    $('#loader').classList.add('done');
    tick();
  });
})();
