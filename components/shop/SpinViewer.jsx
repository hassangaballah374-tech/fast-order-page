'use client';
import { useT } from '../I18n';
import React, { useCallback, useEffect, useRef, useState } from 'react';

/* مشغّل 360° متعدد الارتفاعات.
   - الفيديو الأساسي: دورة كاملة من مستوى النظر (ضروري).
   - فيديو «من فوق» و«من تحت»: اختياريين، نفس الدورة بالظبط من زاوية أعلى/أدنى.
   السحب يمين/شمال بيلف المنتج، والسحب فوق/تحت بيمزج بين الارتفاعات (حقيقي). لو ارتفاع ناقص، بنكتفي بإمالة بصرية خفيفة.
   بنستخرج الفريمات من كل فيديو في الذاكرة مرة واحدة، ولو الاستخراج فشل (CORS مثلاً) بنرجع لتحريك الفيديو الأساسي نفسه. */

const FPS = 24;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const smooth = (t) => t * t * (3 - 2 * t);

/* استخراج كل فريمات فيديو على عنصر فيديو مستقل (غير ظاهر). بيرجع { frames, ratio } */
function extract(url, onPct, alive) {
  return new Promise((resolve, reject) => {
    const v = document.createElement('video');
    v.muted = true; v.playsInline = true; v.preload = 'auto'; v.crossOrigin = 'anonymous'; v.src = url;
    const done = (fn, a) => { try { v.pause(); v.removeAttribute('src'); v.load(); } catch { /* تجاهل */ } fn(a); };
    v.addEventListener('error', () => done(reject, new Error('video')), { once: true });
    v.addEventListener('loadeddata', async () => {
      try {
        const dur = v.duration || 0; if (!dur || !v.videoWidth) throw new Error('dur');
        if (!v.requestVideoFrameCallback) throw new Error('no rvfc');
        const ratio = v.videoWidth / v.videoHeight; const NF = Math.max(2, Math.round(dur * FPS));
        const W = Math.min(540, v.videoWidth); const H = Math.round(W / ratio);
        const off = document.createElement('canvas'); off.width = W; off.height = H; const ox = off.getContext('2d');
        ox.drawImage(v, 0, 0, W, H); ox.getImageData(0, 0, 1, 1); /* يرمي خطأ لو الفيديو ممنوع (CORS) */
        const got = new Array(NF).fill(null); const pending = []; let n = 0;
        const grab = () => new Promise((res) => { ox.drawImage(v, 0, 0, W, H); try { off.toBlob((b) => res(b), 'image/jpeg', 0.86); } catch { res(null); } });
        v.playbackRate = 2; v.currentTime = 0;
        await new Promise((ok, no) => {
          const cb = (now, meta) => {
            if (!alive()) return ok();
            const i = Math.round(meta.mediaTime * FPS);
            if (i >= 0 && i < NF && !got[i]) { got[i] = true; pending.push(grab().then((b) => { got[i] = b; })); n += 1; onPct && onPct(Math.min(99, Math.round((n / NF) * 100))); }
            if (!v.ended && !v.paused) v.requestVideoFrameCallback(cb);
          };
          v.addEventListener('ended', () => setTimeout(() => Promise.all(pending).then(ok), 150), { once: true });
          v.requestVideoFrameCallback(cb);
          v.play().catch(no);
        });
        if (!alive()) return done(reject, new Error('gone'));
        let last = null; for (let i = 0; i < NF; i += 1) { if (got[i] && got[i] !== true) last = got[i]; else got[i] = last; }
        last = null; for (let i = NF - 1; i >= 0; i -= 1) { if (got[i]) last = got[i]; else got[i] = last; }
        const frames = got.slice(0, NF - 1).filter(Boolean); /* نشيل آخر فريم (نفس الأول) عشان اللفة تتصل */
        if (frames.length < 8) throw new Error('few');
        return done(resolve, { frames, ratio });
      } catch (e) { return done(reject, e); }
    }, { once: true });
  });
}

export default function SpinViewer({ src, top = '', bottom = '', title = '' }) {
  const tx = useT();
  const wrap = useRef(null); const vid = useRef(null); const cv = useRef(null); const tilt = useRef(null);
  const st = useRef({ ang: 0, vis: 0, vel: 0, dragging: false, idle: 0, tween: null, rings: {}, mode: 'loading', drawn: '', last: 0, drag: null, pitch: 0, pitchT: 0, lastUp: 0, bmps: new Map() });
  const [mode, setMode] = useState('loading'); // loading | cache | scrub | error
  const [pct, setPct] = useState(0);
  const [deg, setDeg] = useState(0);
  const [thumbs, setThumbs] = useState(null);
  const [look, setLook] = useState(0);
  const [elev, setElev] = useState('mid');
  const [have, setHave] = useState({ top: false, bottom: false });
  const [ratio, setRatio] = useState(9 / 16);

  /* كاش صغير للصور المفكوكة (آخر 40 فريم من كل الارتفاعات) */
  const bmp = useCallback((r, i) => {
    const s = st.current; const m = s.bmps; const k = `${r}:${i}`; const ring = s.rings[r];
    if (!ring) return null;
    if (m.has(k)) { const v = m.get(k); m.delete(k); m.set(k, v); return v.b || null; }
    const ent = { b: null }; m.set(k, ent);
    createImageBitmap(ring.frames[i]).then((b) => { ent.b = b; s.drawn = ''; }).catch(() => { m.delete(k); });
    while (m.size > 40) { const o = m.keys().next().value; const e = m.get(o); e && e.b && e.b.close && e.b.close(); m.delete(o); }
    return null;
  }, []);

  /* نرسم حلقة واحدة (مع مزج فريمين متجاورين) بشفافية a */
  const layer = useCallback((x, c, r, a) => {
    const s = st.current; const ring = s.rings[r]; if (!ring || a <= 0) return true;
    const nf = ring.frames.length; const f = (((s.vis % 1) + 1) % 1) * nf; const i0 = Math.floor(f) % nf; const i1 = (i0 + 1) % nf; const t = f - Math.floor(f);
    const b0 = bmp(r, i0); const b1 = t > 0.04 ? bmp(r, i1) : null; bmp(r, (i1 + 1) % nf);
    if (!b0) return false;
    x.globalAlpha = a; x.drawImage(b0, 0, 0, c.width, c.height);
    if (b1) { x.globalAlpha = a * t; x.drawImage(b1, 0, 0, c.width, c.height); }
    x.globalAlpha = 1; return true;
  }, [bmp]);

  const show = useCallback(() => {
    const s = st.current; const c = cv.current;
    if (s.mode !== 'cache' || !c || !s.rings.mid) return;
    const nf = s.rings.mid.frames.length; const f = (((s.vis % 1) + 1) % 1) * nf;
    const p = s.pitch; const side = p > 0 ? 'top' : 'bottom'; const w = s.rings[side] ? smooth(clamp(Math.abs(p), 0, 1)) : 0;
    const key = `${Math.floor(f)}:${Math.round((f % 1) * 16)}:${Math.round(w * 20)}:${side}`;
    if (key === s.drawn) return;
    const x = c.getContext('2d'); x.globalAlpha = 1;
    /* أولاً الارتفاع الأساسي كاملاً، وبعدين الارتفاع التاني فوقه بنسبة w */
    const okMid = layer(x, c, 'mid', 1);
    if (!okMid) return;
    if (w > 0) layer(x, c, side, w);
    s.drawn = key;
  }, [layer]);

  /* التحميل: الأساسي أولاً (نبدأ نعرض)، وبعدين فوق وتحت في الخلفية */
  useEffect(() => {
    const s = st.current; let dead = false; const alive = () => !dead; const v = vid.current;
    (async () => {
      try {
        const m = await extract(src, (n) => !dead && setPct(n), alive);
        if (dead) return;
        s.rings.mid = { frames: m.frames }; s.mode = 'cache'; if (v) v.pause(); s.vis = s.ang; setRatio(m.ratio);
        const c = cv.current; if (c) { const bm = await createImageBitmap(m.frames[0]); c.width = bm.width; c.height = bm.height; bm.close && bm.close(); }
        const mk = async (a) => { const bmx = await createImageBitmap(m.frames[Math.round(a * m.frames.length) % m.frames.length]); const t = document.createElement('canvas'); const side = Math.round(bmx.width * 0.62); t.width = 96; t.height = 96; t.getContext('2d').drawImage(bmx, bmx.width * 0.19, bmx.height * 0.07, side, side, 0, 0, 96, 96); return t.toDataURL('image/jpeg', 0.8); };
        const th = [await mk(0), await mk(0.5)];
        if (dead) return;
        setThumbs(th); setMode('cache'); s.drawn = '';
        for (const [k, u] of [['top', top], ['bottom', bottom]]) {
          if (!u || dead) continue;
          try { const r = await extract(u, null, alive); if (dead) return; s.rings[k] = { frames: r.frames }; setHave((h) => ({ ...h, [k]: true })); s.drawn = ''; } catch { /* نكمّل بدونه */ }
        }
      } catch {
        if (dead) return;
        /* رجوع لوضع بسيط: تحريك زمن الفيديو الأساسي نفسه */
        const go = () => { if (dead) return; if (v && v.duration) { v.pause(); s.mode = 'scrub'; setMode('scrub'); } else { s.mode = 'error'; setMode('error'); } };
        if (v && v.readyState >= 1) go(); else if (v) { v.addEventListener('loadedmetadata', go, { once: true }); v.addEventListener('error', go, { once: true }); }
      }
    })();
    return () => { dead = true; };
  }, [src, top, bottom]);

  /* حلقة الحركة: السحب + القصور الذاتي + الدوران التلقائي + نعومة الزاوية والإمالة */
  useEffect(() => {
    const s = st.current; const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0; let alive = true;
    const loop = (t) => {
      if (!alive) return;
      const dt = Math.min(0.05, (t - (s.last || t)) / 1000); s.last = t;
      if (s.tween) { const k = clamp((t - s.tween.t0) / s.tween.dur, 0, 1); const e = k < 0.5 ? 4 * k * k * k : 1 - Math.pow(-2 * k + 2, 3) / 2; s.ang = s.tween.a0 + (s.tween.a1 - s.tween.a0) * e; if (k >= 1) s.tween = null; s.vel = 0; }
      else if (!s.dragging && (s.mode === 'cache' || s.mode === 'scrub')) {
        s.idle += dt;
        const tv = !reduce && s.idle > 3 ? 0.045 : 0;
        s.vel += (tv - s.vel) * Math.min(1, dt * (tv ? 0.8 : 2.2));
        s.ang += s.vel * dt;
      }
      s.vis += (s.ang - s.vis) * (1 - Math.exp(-dt * (s.dragging ? 22 : 14)));
      if (Math.abs(s.ang - s.vis) < 1e-5) s.vis = s.ang;
      /* ارتفاع بدون فيديو حقيقي: الإمالة البصرية بترجع للنص. وارتفاع ليه فيديو: بيفضل زي ما اخترته */
      const real = (s.pitchT > 0 && s.rings.top) || (s.pitchT < 0 && s.rings.bottom);
      if (!s.dragging && !real && t - s.lastUp > 350) s.pitchT += (0 - s.pitchT) * (1 - Math.exp(-dt * 3));
      s.pitch += (s.pitchT - s.pitch) * (1 - Math.exp(-dt * (s.tween2 ? 6 : 12)));
      const fake = (s.pitch > 0 && s.rings.top) || (s.pitch < 0 && s.rings.bottom) ? 0 : s.pitch;
      if (tilt.current) tilt.current.style.transform = `perspective(900px) rotateX(${(fake * 14).toFixed(2)}deg) translateY(${(fake * -2).toFixed(2)}%) scale(${(1 + Math.abs(fake) * 0.04).toFixed(3)})`;
      if (s.mode === 'cache') show();
      else if (s.mode === 'scrub' && vid.current && vid.current.duration) { const a = ((s.vis % 1) + 1) % 1; const tt = a * (vid.current.duration - 0.05); if (Math.abs(vid.current.currentTime - tt) > 0.02 && !vid.current.seeking) vid.current.currentTime = tt; }
      setDeg((d) => { const nd = Math.round((((s.ang % 1) + 1) % 1) * 360); return d === nd ? d : nd; });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { alive = false; cancelAnimationFrame(raf); };
  }, [show]);

  const down = (e) => { const s = st.current; if (s.mode !== 'cache' && s.mode !== 'scrub') return; s.dragging = true; s.tween = null; s.idle = 0; s.drag = { x: e.clientX, y: e.clientY, t: performance.now(), v: 0 }; wrap.current.setPointerCapture && wrap.current.setPointerCapture(e.pointerId); };
  const move = (e) => {
    const s = st.current; s.idle = 0; if (!s.dragging || !s.drag) return;
    const w = wrap.current.clientWidth || 400; const h = wrap.current.clientHeight || 500;
    const dx = e.clientX - s.drag.x; const now = performance.now();
    s.ang += -dx / (w * 1.6);
    s.pitchT = clamp(s.pitchT + (e.clientY - s.drag.y) / (h * 0.45), -1, 1); /* سحب لتحت = شوف من فوق */
    const dd = -dx / (w * 1.6); s.drag.v = dd / Math.max(0.008, (now - s.drag.t) / 1000) * 0.6 + s.drag.v * 0.4;
    s.drag.x = e.clientX; s.drag.y = e.clientY; s.drag.t = now;
  };
  const up = () => { const s = st.current; if (!s.dragging) return; s.dragging = false; s.lastUp = performance.now(); s.vel = clamp(s.drag ? s.drag.v : 0, -2.5, 2.5); s.drag = null; setElev(elevOf(s.pitchT)); };
  const elevOf = (p) => (p > 0.5 ? 'top' : p < -0.5 ? 'bottom' : 'mid');
  const spinTo = (a, idx) => {
    const s = st.current; setLook(idx); s.idle = 0;
    let d = a - (((s.ang % 1) + 1) % 1); if (d > 0.5) d -= 1; if (d < -0.5) d += 1;
    s.tween = { a0: s.ang, a1: s.ang + d, t0: performance.now(), dur: 900 + Math.abs(d) * 900 };
  };
  const goElev = (k) => { const s = st.current; s.idle = 0; s.lastUp = performance.now(); s.pitchT = k === 'top' ? 1 : k === 'bottom' ? -1 : 0; setElev(k); };
  const key = (e) => {
    const s = st.current; s.idle = 0;
    if (e.key === 'ArrowLeft') { s.ang -= 0.04; e.preventDefault(); }
    else if (e.key === 'ArrowRight') { s.ang += 0.04; e.preventDefault(); }
    else if (e.key === 'ArrowUp') { s.pitchT = clamp(s.pitchT - 0.5, -1, 1); s.lastUp = performance.now(); setElev(elevOf(s.pitchT)); e.preventDefault(); }
    else if (e.key === 'ArrowDown') { s.pitchT = clamp(s.pitchT + 0.5, -1, 1); s.lastUp = performance.now(); setElev(elevOf(s.pitchT)); e.preventDefault(); }
  };

  const ready = mode === 'cache' || mode === 'scrub';
  const elevs = [['top', tx('من فوق'), have.top], ['mid', tx('مستوى النظر'), true], ['bottom', tx('من تحت'), have.bottom]].filter((x) => x[2]);
  return (
    <div className="sp">
      <div className={'sp-st' + (ready ? ' rdy' : '')} ref={wrap} style={{ aspectRatio: String(ratio) }} tabIndex={0} role="img" aria-label={tx('عرض 360 درجة: {1}. اسحب يمين وشمال وفوق وتحت أو استخدم الأسهم', [title])}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onKeyDown={key}>
        <div className="sp-t" ref={tilt}>
          <video ref={vid} src={src} muted playsInline loop autoPlay preload="auto" crossOrigin="anonymous" className="sp-v" style={{ display: mode === 'cache' ? 'none' : 'block' }} />
          <canvas ref={cv} className="sp-c" width="540" height="960" style={{ display: mode === 'cache' ? 'block' : 'none' }} />
        </div>
        {mode === 'loading' ? <div className="sp-ld" role="status"><i /><span>{tx('جاري تجهيز الـ 360°')}{pct ? ` ${pct}%` : ''}</span></div> : null}
        {mode === 'error' ? <div className="sp-ld"><span>{tx('تعذر تشغيل فيديو الـ 360°')}</span></div> : null}
      </div>
      <div className="sp-rd" aria-hidden="true"><span>{tx('اسحب في كل الاتجاهات')}</span><i className="sp-bar"><b style={{ insetInlineStart: `${(deg / 360) * 100}%` }} /></i><em className="num">{String(deg % 360).padStart(3, '0')}°</em></div>
      {thumbs ? (
        <div className="sp-lk" role="group" aria-label={tx('زوايا')}>
          {[tx('وش'), tx('ضهر')].map((l, i) => <button key={l} type="button" className={look === i ? 'on' : ''} aria-label={l} aria-pressed={look === i} onClick={() => spinTo(i === 0 ? 0 : 0.5, i)}><img src={thumbs[i]} alt="" /><span>{l}</span></button>)}
          {elevs.length > 1 ? <span className="sp-sep" aria-hidden="true" /> : null}
          {elevs.length > 1 ? elevs.map(([k, l]) => <button key={k} type="button" className={'sp-el' + (elev === k ? ' on' : '')} aria-pressed={elev === k} onClick={() => goElev(k)}>{l}</button>) : null}
        </div>
      ) : null}
    </div>
  );
}
