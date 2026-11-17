'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';

/* مشغّل 360°: فيديو دوران (turntable) للمنتج. بنستخرج كل فريم من الفيديو مرة واحدة في الذاكرة (JPEG)،
   وبعدها السحب يمين/شمال بيلف المنتج دورة كاملة بقصور ذاتي، ولو الزائر ساب الصفحة 3 ثواني بيلف لوحده ببطء.
   لو المتصفح ماقدرش يستخرج الفريمات (CORS مثلاً) بنرجع لوضع بسيط: التحريك بيحرّك زمن الفيديو نفسه. */

const FPS = 24;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const fmt = (a) => String(Math.round((((a % 1) + 1) % 1) * 360) % 360).padStart(3, '0');

export default function SpinViewer({ src, title = '' }) {
  const wrap = useRef(null); const vid = useRef(null); const cv = useRef(null);
  const st = useRef({ ang: 0, vel: 0, dragging: false, idle: 0, tween: null, frames: [], nf: 0, mode: 'loading', drawn: -1, busy: false, want: -1, last: 0, drag: null, ratio: 9 / 16 });
  const [mode, setMode] = useState('loading'); // loading | cache | scrub | error
  const [pct, setPct] = useState(0);
  const [deg, setDeg] = useState(0);
  const [thumbs, setThumbs] = useState(null);
  const [look, setLook] = useState(0);
  const [ratio, setRatio] = useState(9 / 16);

  /* رسم الفريم المطلوب (واحد بس بيتفك في نفس الوقت) */
  const show = useCallback(async () => {
    const s = st.current;
    if (s.mode !== 'cache' || s.busy || !s.nf) return;
    const i = ((Math.round(s.ang * s.nf) % s.nf) + s.nf) % s.nf;
    if (i === s.drawn) return;
    s.busy = true;
    try {
      const bmp = await createImageBitmap(s.frames[i]);
      const c = cv.current; if (c) { const x = c.getContext('2d'); x.drawImage(bmp, 0, 0, c.width, c.height); s.drawn = i; }
      bmp.close && bmp.close();
    } catch { /* تجاهل */ }
    s.busy = false;
    const j = ((Math.round(s.ang * s.nf) % s.nf) + s.nf) % s.nf;
    if (j !== s.drawn) show();
  }, []);

  /* استخراج الفريمات */
  useEffect(() => {
    const v = vid.current; const s = st.current; let dead = false;
    if (!v) return undefined;
    const fail = () => { if (!dead) { s.mode = v.duration ? 'scrub' : 'error'; setMode(s.mode); } };
    const onLoaded = async () => {
      const dur = v.duration || 0; if (!dur || !v.videoWidth) { fail(); return; }
      s.ratio = v.videoWidth / v.videoHeight; setRatio(s.ratio);
      const NF = Math.max(2, Math.round(dur * FPS));
      const W = Math.min(540, v.videoWidth); const H = Math.round(W / s.ratio);
      const off = document.createElement('canvas'); off.width = W; off.height = H; const ox = off.getContext('2d');
      const c = cv.current; if (c) { c.width = W; c.height = H; }
      const got = new Array(NF).fill(null);
      const grab = () => new Promise((res) => { ox.drawImage(v, 0, 0, W, H); try { off.toBlob((b) => res(b), 'image/jpeg', 0.86); } catch { res(null); } });
      try {
        if (!v.requestVideoFrameCallback) throw new Error('no rvfc');
        ox.drawImage(v, 0, 0, W, H); ox.getImageData(0, 0, 1, 1); /* لو الفيديو ممنوع (CORS) هيرمي خطأ هنا */
        v.loop = false; v.currentTime = 0; v.playbackRate = 2;
        await new Promise((resolve, reject) => {
          let n = 0; const pending = [];
          const cb = (now, meta) => {
            if (dead) return resolve();
            const i = Math.round(meta.mediaTime * FPS);
            if (i >= 0 && i < NF && !got[i]) { got[i] = true; pending.push(grab().then((b) => { got[i] = b; })); n += 1; setPct(Math.min(99, Math.round((n / NF) * 100))); }
            if (!v.ended && !v.paused) v.requestVideoFrameCallback(cb);
          };
          v.addEventListener('ended', () => setTimeout(() => Promise.all(pending).then(resolve), 150), { once: true });
          v.addEventListener('error', () => reject(new Error('video')), { once: true });
          v.requestVideoFrameCallback(cb);
          v.play().catch(reject);
        });
        if (dead) return;
        /* نملأ الفجوات من أقرب فريم، ونشيل آخر فريم (نفس الأول) عشان اللفة تبقى متصلة */
        let last = null; for (let i = 0; i < NF; i += 1) { if (got[i] && got[i] !== true) last = got[i]; else got[i] = last; }
        last = null; for (let i = NF - 1; i >= 0; i -= 1) { if (got[i]) last = got[i]; else got[i] = last; }
        const frames = got.slice(0, NF - 1).filter(Boolean);
        if (frames.length < 8) throw new Error('few');
        s.frames = frames; s.nf = frames.length; s.mode = 'cache'; v.style.display = 'none';
        /* صورتين مصغرتين: وش وضهر */
        const mk = async (a) => { const bmp = await createImageBitmap(frames[Math.round(a * s.nf) % s.nf]); const t = document.createElement('canvas'); const side = Math.round(bmp.width * 0.62); t.width = 96; t.height = 96; t.getContext('2d').drawImage(bmp, bmp.width * 0.19, bmp.height * 0.07, side, side, 0, 0, 96, 96); return t.toDataURL('image/jpeg', 0.8); };
        const th = [await mk(0), await mk(0.5)];
        if (!dead) { setThumbs(th); setMode('cache'); s.drawn = -1; show(); }
      } catch {
        if (dead) return;
        v.pause(); v.playbackRate = 1; v.loop = false; s.mode = 'scrub'; setMode('scrub'); v.currentTime = 0;
      }
    };
    if (v.readyState >= 2) onLoaded(); else v.addEventListener('loadeddata', onLoaded, { once: true });
    v.addEventListener('error', fail, { once: true });
    return () => { dead = true; };
  }, [src, show]);

  /* حلقة الحركة: السحب + القصور الذاتي + الدوران التلقائي */
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
      if (s.mode === 'cache') show();
      else if (s.mode === 'scrub' && vid.current && vid.current.duration) { const a = ((s.ang % 1) + 1) % 1; const tt = a * (vid.current.duration - 0.05); if (Math.abs(vid.current.currentTime - tt) > 0.02 && !vid.current.seeking) vid.current.currentTime = tt; }
      setDeg((d) => { const nd = Math.round((((s.ang % 1) + 1) % 1) * 360); return d === nd ? d : nd; });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => { alive = false; cancelAnimationFrame(raf); };
  }, [show]);

  const down = (e) => { const s = st.current; if (s.mode !== 'cache' && s.mode !== 'scrub') return; s.dragging = true; s.tween = null; s.idle = 0; s.drag = { x: e.clientX, t: performance.now(), v: 0 }; wrap.current.setPointerCapture && wrap.current.setPointerCapture(e.pointerId); };
  const move = (e) => {
    const s = st.current; s.idle = 0; if (!s.dragging || !s.drag) return;
    const w = wrap.current.clientWidth || 400; const dx = e.clientX - s.drag.x; const now = performance.now();
    s.ang += -dx / (w * 1.6);
    const dd = -dx / (w * 1.6); s.drag.v = dd / Math.max(0.008, (now - s.drag.t) / 1000) * 0.6 + s.drag.v * 0.4;
    s.drag.x = e.clientX; s.drag.t = now;
  };
  const up = () => { const s = st.current; if (!s.dragging) return; s.dragging = false; s.vel = clamp(s.drag ? s.drag.v : 0, -2.5, 2.5); s.drag = null; };
  const spinTo = (a, idx) => {
    const s = st.current; setLook(idx); s.idle = 0;
    let d = a - (((s.ang % 1) + 1) % 1); if (d > 0.5) d -= 1; if (d < -0.5) d += 1;
    s.tween = { a0: s.ang, a1: s.ang + d, t0: performance.now(), dur: 900 + Math.abs(d) * 900 };
  };
  const key = (e) => { const s = st.current; if (e.key === 'ArrowLeft') { s.ang -= 0.04; s.idle = 0; e.preventDefault(); } else if (e.key === 'ArrowRight') { s.ang += 0.04; s.idle = 0; e.preventDefault(); } };

  const ready = mode === 'cache' || mode === 'scrub';
  return (
    <div className="sp">
      <div className={'sp-st' + (ready ? ' rdy' : '')} ref={wrap} style={{ aspectRatio: String(ratio) }} tabIndex={0} role="img" aria-label={`عرض 360 درجة: ${title}. اسحب أو استخدم الأسهم للتدوير`}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerCancel={up} onKeyDown={key}>
        <video ref={vid} src={src} muted playsInline loop autoPlay preload="auto" crossOrigin="anonymous" className="sp-v" />
        <canvas ref={cv} className="sp-c" width="540" height="960" style={{ display: mode === 'cache' ? 'block' : 'none' }} />
        {mode === 'loading' ? <div className="sp-ld" role="status"><i /><span>جاري تجهيز الـ 360°{pct ? ` ${pct}%` : ''}</span></div> : null}
        {mode === 'error' ? <div className="sp-ld"><span>تعذر تشغيل فيديو الـ 360°</span></div> : null}
      </div>
      <div className="sp-rd" aria-hidden="true"><span>اسحب للتدوير</span><i className="sp-bar"><b style={{ insetInlineStart: `${(deg / 360) * 100}%` }} /></i><em className="num">{String(deg % 360).padStart(3, '0')}°</em></div>
      {thumbs ? (
        <div className="sp-lk" role="group" aria-label="زوايا">
          {['وش', 'ضهر'].map((l, i) => <button key={l} type="button" className={look === i ? 'on' : ''} aria-label={l} aria-pressed={look === i} onClick={() => spinTo(i === 0 ? 0 : 0.5, i)}><img src={thumbs[i]} alt="" /><span>{l}</span></button>)}
        </div>
      ) : null}
    </div>
  );
}
