(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const T = reduce ? 0.01 : 1;
  const AUTOPLAY = 7500;
  const EASE = 'cubic-bezier(.2,.7,.1,1)';

  /* ---- Slide content: description changes with each background ---- */
  const copy = [
    { lines:["Every child learns at their own pace.",
             "Our tutors sit beside them, line by line,",
             "until the idea finally clicks."], note:"Small steps, big dreams." },
    { lines:["Learning grows stronger when it is shared.",
             "Small groups build confidence, curiosity",
             "and friendships, one idea at a time."], note:"Better, together." },
    { lines:["The best mentors make learning joyful.",
             "Online or in person, we turn doubt",
             "into discovery, one smile at a time."], note:"Curiosity, lit up." },
    { lines:["Great teaching is patient and kind.",
             "Experienced mentors who listen first,",
             "then guide every step with care."], note:"Wisdom, passed on." },
    { lines:["The whole world is a classroom.",
             "Learn online, from anywhere, with tutors",
             "who turn curiosity into confidence."], note:"A world to explore." }
  ];

  const slides = [...document.querySelectorAll('.slide')];
  const dots = [...document.querySelectorAll('.dot')];
  const desc = document.getElementById('desc');
  const note = document.getElementById('note');
  const noteText = document.getElementById('noteText');
  const root = document.documentElement;
  let cur = 0, busy = false, queued = null, timer;

  document.querySelector('.dots').style.setProperty('--dur', AUTOPLAY + 'ms');

  function setDot(n){
    dots.forEach((d,i) => {
      d.classList.remove('on');
      if (i === n){ void d.offsetWidth; d.classList.add('on'); }
    });
  }

  async function swapText(n){
    const spans = [...desc.querySelectorAll('.dl > span')];
    const outs = spans.map((s,i) => s.animate(
      [{transform:'translateY(0)',opacity:1},{transform:'translateY(-112%)',opacity:0}],
      {duration:480*T,delay:i*70*T,easing:'cubic-bezier(.6,0,.8,.3)',fill:'forwards'}));
    const noteOut = note.animate([{opacity:1},{opacity:0}],{duration:400*T,fill:'forwards'});
    await Promise.all(outs.map(a => a.finished));
    spans.forEach((s,i) => s.textContent = copy[n].lines[i]);
    noteText.textContent = copy[n].note;
    note.classList.remove('shown');
    const ins = spans.map((s,i) => s.animate(
      [{transform:'translateY(112%)',opacity:0},{transform:'translateY(0)',opacity:1}],
      {duration:900*T,delay:i*90*T,easing:EASE,fill:'both'}));
    const noteIn = note.animate([{opacity:0,transform:'translateY(10px) rotate(0deg)'},{opacity:1,transform:'none'}],
      {duration:800*T,delay:200*T,easing:EASE,fill:'both'});
    outs.forEach(a => a.cancel()); noteOut.cancel();
    setTimeout(() => note.classList.add('shown'), 450*T);
    await Promise.all([...ins.map(a => a.finished), noteIn.finished]);
    ins.forEach(a => a.cancel()); noteIn.cancel();
  }

  async function go(n){
    if (busy){ queued = n; return; }   // a tap during a transition is remembered, not lost
    if (n === cur) return;
    busy = true; clearTimeout(timer);
    const prev = slides[cur], next = slides[n];
    setDot(n);

    next.style.zIndex = 3;
    next.style.visibility = 'visible';
    // circular reveal that blooms from the lower right, like light spreading across the room
    const clip = next.animate(
      [{clipPath:'circle(0% at 82% 72%)'},{clipPath:'circle(150% at 82% 72%)'}],
      {duration:1500*T,easing:'cubic-bezier(.77,0,.18,1)',fill:'both'});
    next.querySelector('.img').animate(
      [{transform:'scale(1.38)'},{transform:'scale(1.06)'}],
      {duration:1600*T,easing:EASE});

    swapText(n);
    await clip.finished;

    next.classList.add('active');
    clip.cancel();
    prev.classList.remove('active');
    prev.style.visibility = '';
    prev.style.zIndex = 0;
    next.style.zIndex = 1; next.style.visibility = '';
    cur = n; busy = false;
    if (queued !== null){ const q = queued; queued = null; go(q); } else schedule();
  }

  function schedule(){
    clearTimeout(timer);
    timer = setTimeout(() => {
      if (document.hidden) return schedule();
      go((cur + 1) % slides.length);
    }, AUTOPLAY);
  }

  dots.forEach(d => d.addEventListener('click', () => go(+d.dataset.i)));
  addEventListener('keydown', e => {
    if (e.key === 'ArrowRight') go((cur + 1) % slides.length);
    if (e.key === 'ArrowLeft')  go((cur + slides.length - 1) % slides.length);
  });

  setDot(0);
  setTimeout(() => note.classList.add('shown'), 2200*T);
  schedule();

  /* ---- Scroll: stage tucks into a rounded card, content drifts up and fades ---- */
  const nav = document.getElementById('nav');
  const track = document.getElementById('track');
  const subjects = document.getElementById('subjects');
  const navLinks = [...document.querySelectorAll('.links a')];
  const storyEl = document.getElementById('story');
  const tcs = [...document.querySelectorAll('.tc')];
  let ticking = false;
  function onScroll(){
    const max = track.offsetHeight - innerHeight;
    const p = Math.min(1, Math.max(0, scrollY / max));
    root.style.setProperty('--p', p.toFixed(4));
    root.style.setProperty('--sp', Math.min(1, scrollY / Math.max(1, root.scrollHeight - innerHeight)).toFixed(4));
    nav.classList.toggle('scrolled', scrollY > 30);
    const inSubjects = subjects.getBoundingClientRect().top < innerHeight * .5;
    const sr = storyEl.getBoundingClientRect();
    root.style.setProperty('--sp2', Math.min(1, Math.max(0, (innerHeight - sr.top) / (innerHeight + sr.height))).toFixed(3));
    const top = id => document.getElementById(id).getBoundingClientRect().top < innerHeight * .5;
    const inAbout = top('about'), inPlans = top('plans'), inRev = top('reviews'), inCon = top('contact');
    navLinks[0].classList.toggle('on', !inSubjects && !inAbout);
    navLinks[1].classList.toggle('on', inSubjects && !inAbout);
    navLinks[2].classList.toggle('on', inAbout && !inPlans);
    navLinks[3].classList.toggle('on', inPlans && !inRev);
    navLinks[4].classList.toggle('on', inRev && !inCon);
    navLinks[5].classList.toggle('on', inCon);
    tcs.forEach(t => { const q = t.getBoundingClientRect(); if (q.bottom < 0 || q.top > innerHeight) return;
      t.style.setProperty('--py', ((q.top + q.height / 2 - innerHeight / 2) / innerHeight * -22).toFixed(1) + 'px'); });
    ticking = false;
  }
  addEventListener('scroll', () => { if (!ticking){ ticking = true; requestAnimationFrame(onScroll); } }, {passive:true});
  addEventListener('resize', onScroll);
  onScroll();

  /* ---- Word-by-word reveal below the hero ---- */
  const h2 = document.getElementById('split');
  h2.innerHTML = h2.textContent.trim().split(/\s+/)
    .map((w,i) => `<span class="w"><span style="--i:${i}">${w}</span></span>`).join(' ');
  new IntersectionObserver((es, io) => es.forEach(e => {
    if (e.isIntersecting){ document.getElementById('subjects').classList.add('in'); io.disconnect(); }
  }), {rootMargin:'0px 0px -12% 0px'}).observe(h2);


  /* ---- About / Teachers reveals ---- */
  let wi = 0;
  const wrapWords = n => [...n.childNodes].forEach(c => {
    if (c.nodeType === 3){
      const f = document.createDocumentFragment();
      c.textContent.split(/(\s+)/).forEach(t => {
        if (!t.trim()) f.append(t);
        else { const w = document.createElement('span'); w.className = 'w'; w.innerHTML = `<span style="--i:${wi++}">${t}</span>`; f.append(w); }
      });
      c.replaceWith(f);
    } else wrapWords(c);
  });
  document.querySelectorAll('.sec h2, .story h2').forEach(el => { wi = 0; wrapWords(el); });
  const rio2 = new IntersectionObserver((es, io) => es.forEach(e => {
    if (e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); }
  }), {rootMargin:'0px 0px -10% 0px'});
  document.querySelectorAll('.rv').forEach(el => rio2.observe(el));

  /* ---- Treasure trail: dotted path draws as you scroll, each card appears when the path reaches it ---- */
  (() => {
    const box = document.getElementById('trail'); if (!box) return;
    const svg = box.querySelector('.trail'), xm = box.querySelector('.xmark');
    const cards = [...box.querySelectorAll('.pillar')], NS = 'http://www.w3.org/2000/svg';
    let segs = [], L = 0, arrive = [], endY = 1, cur = 0, raf = 0;
    const mkPath = (cls, d) => { const p = document.createElementNS(NS, 'path'); p.setAttribute('d', d); p.setAttribute('class', cls); return p; };
    const seg = (a, b) => { const dy = b[1] - a[1], dx = b[0] - a[0], bow = Math.min(.26 * Math.abs(dx), 150) * Math.sign(dx); return `C${a[0] - bow} ${a[1] + dy * .45} ${b[0] + bow} ${b[1] - dy * .45} ${b[0]} ${b[1]}`; };
    function layout(){
      const br = box.getBoundingClientRect();
      const r = cards.map(c => { const q = c.getBoundingClientRect(); return {x: q.left - br.left + q.width / 2, t: q.top - br.top, b: q.bottom - br.top}; });
      const W = box.offsetWidth, H = box.offsetHeight;
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`); svg.innerHTML = '';
      const stops = [];
      for (let i = 1; i < r.length; i++) stops.push([[r[i - 1].x, r[i - 1].b + 8], [r[i].x, r[i].t - 10]]);
      const last = r[r.length - 1], endP = [Math.min(W - 120, last.x + W * .32), last.b + Math.min(150, (H - last.b) * .62)];
      stops.push([[last.x, last.b + 8], endP]);
      const defs = document.createElementNS(NS, 'defs'); svg.appendChild(defs);
      segs = []; arrive = [0]; let acc = 0;
      stops.forEach((s, i) => {
        const d = `M${s[0][0]} ${s[0][1]} ${seg(s[0], s[1])}`;
        const base = mkPath('base', d); svg.appendChild(base); const len = base.getTotalLength();
        const mask = document.createElementNS(NS, 'mask'); mask.setAttribute('id', 'tm' + i); mask.setAttribute('maskUnits', 'userSpaceOnUse');
        mask.setAttribute('x', -W); mask.setAttribute('y', 0); mask.setAttribute('width', W * 3); mask.setAttribute('height', H);
        const mp = mkPath('', d); mp.setAttribute('style', `fill:none;stroke:#fff;stroke-width:14;stroke-linecap:round;stroke-dasharray:${len} ${len + 2}`);
        mask.appendChild(mp); defs.appendChild(mask);
        const lit = mkPath('lit', d); lit.setAttribute('mask', `url(#tm${i})`); svg.appendChild(lit);
        segs.push({mp, len, start: acc}); acc += len; arrive.push(acc);
      });
      L = acc; endY = endP[1];
      xm.style.left = endP[0] + 'px'; xm.style.top = endP[1] + 26 + 'px';
      draw(cur);
    }
    function draw(v){
      cur = v;
      segs.forEach(s => s.mp.style.strokeDashoffset = s.len - Math.max(0, Math.min(s.len, v - s.start)));
      cards.forEach((c, i) => {
        const on = i === 0 ? box.getBoundingClientRect().top < innerHeight * .78 : v >= arrive[i] - 4;
        if (on && !c.classList.contains('show')){ c.classList.add('show'); setTimeout(() => c.classList.add('done'), 1300); }
      });
      xm.classList.toggle('on', v >= L - 4);
    }
    function target(){
      const top = box.getBoundingClientRect().top;
      return Math.max(0, Math.min(L, (innerHeight * .72 - top - 40) / Math.max(1, endY) * L));
    }
    function tick(){
      const t = reduce ? L : target(), diff = t - cur;
      if (Math.abs(diff) < .6){ draw(t); raf = 0; return; }
      draw(cur + diff * .14); raf = requestAnimationFrame(tick);
    }
    const kick = () => { if (!raf) raf = requestAnimationFrame(tick); };
    addEventListener('scroll', kick, {passive:true});
    addEventListener('resize', () => { layout(); kick(); });
    addEventListener('load', () => { layout(); kick(); });
    layout(); kick();
  })();

  /* ---- Billing toggle: prices count to their new value ---- */
  (() => {
    const bill = document.getElementById('bill'); if (!bill) return;
    const nums = [...document.querySelectorAll('.plan .price b')], notes = [...document.querySelectorAll('.plan .billed')];
    const fmt = n => Math.round(n).toLocaleString('en-IN');
    const set = (m, off) => nums.forEach((b, i) => {
      const to = Number(b.dataset.base) * (1 - off), from = Number(b.dataset.cur || b.dataset.base);
      b.dataset.cur = to;
      notes[i].textContent = m === 1 ? '\u00a0' : `Billed \u20b9${fmt(to * m)} every ${m === 12 ? 'year' : '3 months'}`;
      if (reduce){ b.textContent = fmt(to); return; }
      const t0 = performance.now();
      (function step(t){ const k = Math.min(1, (t - t0) / 700), e = 1 - Math.pow(1 - k, 3); b.textContent = fmt(from + (to - from) * e); if (k < 1) requestAnimationFrame(step); })(t0);
    });
    bill.querySelectorAll('button').forEach((btn, i) => btn.addEventListener('click', () => {
      bill.querySelectorAll('button').forEach(x => x.classList.toggle('on', x === btn));
      bill.style.setProperty('--i', i); set(Number(btn.dataset.m), Number(btn.dataset.off));
    }));
  })();

  /* ---- Reviews: hover/tap a parent to swap the quote; auto-advances ---- */
  (() => {
    const box = document.querySelector('.rvw'); if (!box) return;
    const D = [{"n": "Priya M.", "g": "Parent · Grade 8 Mathematics", "q": "Maths used to end in tears at our house. Within two months my daughter was explaining fractions to her little brother. Her mentor never rushed her, and never made her feel behind."}, {"n": "Rahul S.", "g": "Parent · Grade 10 Physics", "q": "What I notice most is the patience. Questions that were skipped in school get answered here, slowly and properly, until he says, “Oh, that is all it is.”"}, {"n": "Fatima K.", "g": "Parent · Grade 6 English", "q": "My son would hide his notebook. Now he reads aloud at dinner and corrects my grammar. The weekly notes tell us exactly what he is working on and why."}, {"n": "Sandeep R.", "g": "Parent · Grade 11 Computer Science", "q": "Calm, clear and genuinely kind. She turned coding from something scary into a puzzle he looks forward to. The small group keeps him curious without the pressure."}, {"n": "Anita D.", "g": "Parent · Grade 9 Chemistry", "q": "We tried bigger coaching centres first. Here someone actually knows my daughter, how she thinks and where she gets stuck. Her confidence came back before her marks did."}, {"n": "Vikram S.", "g": "Parent · Grade 12 Exam Preparation", "q": "The board-exam sprint was well paced and never frantic. He walked into the hall calm, and that, more than the result, is what I will remember."}];
    const items = [...box.querySelectorAll('.rv-item')], fig = box.querySelector('.rv-quote'), q = document.getElementById('rvQ'), c = document.getElementById('rvC');
    let cur = 0, timer = 0, busy = 0;
    function show(i){
      if (i === cur || busy) return; busy = 1;
      items.forEach((b, k) => { b.classList.remove('on'); if (k === i){ void b.offsetWidth; b.classList.add('on'); } });
      fig.classList.add('swap');
      setTimeout(() => {
        q.textContent = D[i].q; c.innerHTML = '<b></b> \u00b7 ' + D[i].g; c.firstChild.textContent = D[i].n;
        fig.classList.remove('swap'); cur = i; busy = 0;
      }, reduce ? 0 : 420);
      restart();
    }
    const restart = () => { clearTimeout(timer); timer = setTimeout(() => { if (!box.classList.contains('paused')) show((cur + 1) % D.length); else restart(); }, 7000); };
    items.forEach((b, i) => { b.addEventListener('mouseenter', () => { if (matchMedia('(hover:hover)').matches) show(i); }); b.addEventListener('click', () => show(i)); b.addEventListener('focus', () => show(i)); });
    box.addEventListener('mouseenter', () => box.classList.add('paused')); box.addEventListener('mouseleave', () => box.classList.remove('paused'));
    restart();
  })();

  /* ---- Contact form (opens the visitor's email app) + outro ---- */
  (() => {
    const f = document.getElementById('cform'); if (!f) return;
    const msg = document.getElementById('fmsg');
    f.addEventListener('submit', e => {
      e.preventDefault();
      const n = f.name.value.trim(), m = f.email.value.trim(), ok = /^\S+@\S+\.\S+$/.test(m);
      f.querySelectorAll('.fld').forEach(x => x.classList.remove('bad'));
      if (!n || !ok){ [!n && f.name, !ok && f.email].filter(Boolean).forEach(i => i.parentElement.classList.add('bad')); msg.textContent = 'Please add your name and a valid email.'; return; }
      const body = `Name: ${n}\nEmail: ${m}\nGrade & subject: ${f.grade.value}\n\n${f.msg.value}`;
      location.href = 'mailto:ayanjit7987@gmail.com?subject=' + encodeURIComponent('Free trial request from ' + n) + '&body=' + encodeURIComponent(body);
      msg.textContent = 'Thank you, ' + n.split(' ')[0] + '. Your email app is opening to send this.';
    });
    const wm = document.getElementById('wm');
    wm.innerHTML = [...wm.textContent].map((c, i) => `<span class="ch" style="--i:${i}">${c}</span>`).join('');
    new IntersectionObserver((es, io) => es.forEach(e => { if (e.isIntersecting){ setTimeout(() => wm.classList.add('done'), 2400); io.disconnect(); } }), {rootMargin:'0px 0px -15% 0px'}).observe(wm);
    document.getElementById('totop').addEventListener('click', () => scrollTo({top:0, behavior:'smooth'}));
  })();

  /* ---- Intro: centred brand glides into the nav while the curtain lifts ---- */
  (() => {
    const curtain = document.getElementById('curtain'), logo = document.querySelector('.nav .logo');
    const finish = () => { root.classList.remove('intro'); curtain.remove(); document.querySelector('.intro-brand')?.remove(); };
    if (!root.classList.contains('intro') || !logo || !curtain.animate){ finish(); return; }
    setTimeout(() => { if (root.classList.contains('intro')) finish(); }, 8000);   // failsafe
    Promise.race([document.fonts.ready, new Promise(r => setTimeout(r, 1500))]).then(() => {
      const r = logo.getBoundingClientRect();
      const brand = logo.cloneNode(true); brand.removeAttribute('href'); brand.removeAttribute('data-cursor'); brand.classList.add('intro-brand');
      Object.assign(brand.style, {left: r.left + 'px', top: r.top + 'px', width: r.width + 'px', height: r.height + 'px'});
      document.body.appendChild(brand);
      const S = Math.min(3.6, innerWidth * .78 / r.width);
      const from = `translate(${innerWidth / 2 - r.width * S / 2 - r.left}px, ${innerHeight / 2 - r.height * S / 2 - r.top}px) scale(${S})`;
      const ease = 'cubic-bezier(.76,0,.24,1)', soft = 'cubic-bezier(.2,.7,.1,1)';
      brand.style.transform = from;
      brand.animate([{opacity:0, clipPath:'inset(0 100% 0 0)'}, {opacity:1, clipPath:'inset(0 0 0 0)'}], {duration:1100, easing:soft, fill:'both'});
      curtain.querySelector('.ln').animate([{transform:'translateX(-50%) scaleX(0)'}, {transform:'translateX(-50%) scaleX(1)'}], {duration:1100, delay:500, easing:soft, fill:'both'});
      const tg = curtain.querySelector('.tg').animate([{opacity:0, transform:'translateY(10px)'}, {opacity:1, transform:'none'}], {duration:900, delay:800, easing:soft, fill:'both'});
      setTimeout(() => {
        curtain.querySelector('.ln').animate([{opacity:1}, {opacity:0}], {duration:400, fill:'forwards'});
        curtain.querySelector('.tg').animate([{opacity:1}, {opacity:0}], {duration:400, fill:'forwards'});
        const D = 1300;
        const fly = brand.animate([{transform:from}, {transform:'none'}], {duration:D, easing:ease, fill:'forwards'});
        curtain.animate([{transform:'translateY(0)', borderRadius:'0'}, {transform:'translateY(-102%)', borderRadius:'0 0 50% 50% / 0 0 12vw 12vw'}], {duration:D, easing:ease, fill:'forwards'});
        setTimeout(() => root.classList.remove('intro'), D - 250);   // un-pause the hero as the curtain clears
        fly.onfinish = () => { logo.style.visibility = 'visible'; root.classList.remove('intro'); requestAnimationFrame(() => { curtain.remove(); brand.remove(); logo.style.visibility = ''; }); };
      }, 2500);
    });
  })();

  /* ---- Cursor, magnetic buttons, gentle image parallax ---- */
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  if (fine && !reduce){
    root.classList.add('has-cursor');
    const dot = document.getElementById('dot'), ring = document.getElementById('ring');
    const slidesEl = document.getElementById('slides');
    let x = innerWidth/2, y = innerHeight/2, rx = x, ry = y, px = 0, py = 0, tx = 0, ty = 0;

    addEventListener('mousemove', e => {
      x = e.clientX; y = e.clientY;
      tx = (x / innerWidth - .5) * -26;
      ty = (y / innerHeight - .5) * -18;
      document.body.classList.add('cursor-ready');
    });
    document.addEventListener('mouseleave', () => document.body.classList.remove('cursor-ready'));
    document.addEventListener('mouseover', e => ring.classList.toggle('big', !!e.target.closest('a,button,[data-cursor]')));

    (function loop(){
      rx += (x - rx) * .16; ry += (y - ry) * .16;
      px += (tx - px) * .06; py += (ty - py) * .06;
      dot.style.transform = `translate3d(${x}px,${y}px,0)`;
      ring.style.transform = `translate3d(${rx}px,${ry}px,0)`;
      slidesEl.style.setProperty('--mx', px.toFixed(2) + 'px');
      slidesEl.style.setProperty('--my', py.toFixed(2) + 'px');
      requestAnimationFrame(loop);
    })();

    document.querySelectorAll('.magnetic').forEach(el => {
      el.addEventListener('mousemove', e => {
        const r = el.getBoundingClientRect();
        el.style.transform = `translate(${(e.clientX - r.left - r.width/2) * .22}px,${(e.clientY - r.top - r.height/2) * .32}px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });

    /* photo preview that trails the cursor; images wipe upward into each other */
    const peek = document.getElementById('peek');
    const layers = [...peek.children];
    let top = 0, shown = null, qx = x, qy = y;
    const hide = () => peek.classList.remove('on');
    const show = key => {
      const wasOn = peek.classList.contains('on');
      peek.classList.add('on');
      if (key === shown) return;
      shown = key;
      const paint = el => {
        el.style.backgroundImage = `var(--img-${key})`;
        el.style.backgroundPosition = `var(--pos-${key})`;
      };
      if (!wasOn){ paint(layers[top]); return; }
      const nxt = layers[1 - top], old = layers[top];
      top = 1 - top;
      paint(nxt);
      nxt.style.zIndex = 2; old.style.zIndex = 1;
      nxt.animate(
        [{clipPath:'inset(100% 0 0 0)',transform:'scale(1.3)'},{clipPath:'inset(0 0 0 0)',transform:'scale(1)'}],
        {duration:900*T,easing:'cubic-bezier(.77,0,.18,1)'});
    };
    document.querySelectorAll('.row-head').forEach(h => h.addEventListener('mouseenter', () => {
      const row = h.parentElement;
      // no cursor photo at all while any dropdown is open
      document.querySelector('.row.open') ? hide() : show(row.dataset.img);
    }));
    document.querySelectorAll('.rb-pad').forEach(p => p.addEventListener('mouseenter', hide));
    document.querySelector('.rows').addEventListener('mouseleave', hide);
    (function follow(){
      const dx = x + 48 - qx;
      qx += dx * .12; qy += (y - qy) * .12;
      peek.style.transform = `translate3d(${qx}px,${qy}px,0) translate(0,-50%) rotate(${Math.max(-8, Math.min(8, dx * .08))}deg)`;
      requestAnimationFrame(follow);
    })();
  }

  /* one subject open at a time (per list, so Science's sub-subjects work too) */
  document.querySelectorAll('.row-head').forEach(btn => btn.addEventListener('click', () => {
    const row = btn.parentElement, open = !row.classList.contains('open');
    [...row.parentElement.children].forEach(r => {
      if (r !== row && r.classList.contains('open')){
        r.classList.remove('open'); r.firstElementChild.setAttribute('aria-expanded', 'false');
      }
    });
    row.classList.toggle('open', open);
    btn.setAttribute('aria-expanded', open);
    document.getElementById('peek').classList.remove('on');
  }));

  /* each subject row reveals as it scrolls into view */
  const rio = new IntersectionObserver((es, io) => {
    let k = 0;
    es.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.style.setProperty('--b', (k++ * .12) + 's');
      e.target.classList.add('in'); io.unobserve(e.target);
    });
  }, {threshold:.2, rootMargin:'0px 0px -8% 0px'});
  document.querySelectorAll('.rows:not(.sub) > .row').forEach(r => rio.observe(r));

  /* nav, logo and hero links scroll smoothly; a bare "#" means back to the top */
  document.querySelectorAll('.logo, .links a, .cta a, .ulink, .outro .btn').forEach(a => a.addEventListener('click', e => {
    const id = a.getAttribute('href').slice(1);
    const el = id && document.getElementById(id);
    if (id && !el) return;   // that section isn't built yet
    e.preventDefault();
    el ? el.scrollIntoView({behavior:'smooth'}) : scrollTo({top:0, behavior:'smooth'});
  }));

  /* light / dark: the new theme grows as a circle out of the toggle button */
  const themeBtn = document.getElementById('theme');
  const applyTheme = dark => {
    root.dataset.theme = dark ? 'dark' : 'light';
    themeBtn.setAttribute('aria-label', dark ? 'Switch to light mode' : 'Switch to dark mode');
    try { localStorage.setItem('theme', root.dataset.theme); } catch (e) {}
  };
  if (root.dataset.theme === 'dark') themeBtn.setAttribute('aria-label', 'Switch to light mode');
  themeBtn.addEventListener('click', () => {
    const dark = root.dataset.theme !== 'dark';
    if (!document.startViewTransition || reduce){ applyTheme(dark); return; }
    const r = themeBtn.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
    document.startViewTransition(() => applyTheme(dark)).ready.then(() => root.animate(
      {clipPath:[`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`]},
      {duration:1000, easing:'cubic-bezier(.65,0,.2,1)', pseudoElement:'::view-transition-new(root)'})).catch(() => {});
  });
})();
