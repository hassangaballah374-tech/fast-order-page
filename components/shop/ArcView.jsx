'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Ph, PriceEl, QuickPick, FocusSheet, useBrowseCart, pad2 } from './browseKit';

/* عرض «القوس»: كروت زجاجية بتلف في قوس ثلاثي الأبعاد حوالين الموديل. اسحب/مرّر/اضغط سهم/اضغط كارت.
   في النص بتظهر صورة القطعة المختارة (من غير موديل أو تلبيس). */

const XS = [0, 0.215, 0.345, 0.432, 0.49, 0.52];
const XS_M = [0, 0.36, 0.5, 0.56, 0.6, 0.62];
const mod = (a, n) => ((a % n) + n) % n;
const xAt = (tbl, a) => { const i = Math.min(tbl.length - 2, Math.floor(a)); return tbl[i] + (tbl[i + 1] - tbl[i]) * Math.min(1, a - i); };

export default function ArcView({ list = [] }) {
  const cart = useBrowseCart();
  const { cfg } = cart;
  const items = list.slice(0, 24);
  const n = items.length;
  const rootRef = useRef(null);
  const cardRefs = useRef([]);
  const st = useRef({ pos: 0, target: 0, drag: null, intro: 0, wheel: 0, lastStep: 0, last: 0, moved: false, sx: 0, sy: 0, px: 0, py: 0 });
  const [idx, setIdx] = useState(0);
  const [focus, setFocus] = useState(false);


  const go = useCallback((d) => { st.current.target = Math.round(st.current.target) + d; }, []);
  const toIndex = useCallback((i) => {
    const s = st.current; const cur = mod(Math.round(s.target), n);
    let d = mod(i - cur, n); if (d > n / 2) d -= n; s.target = Math.round(s.target) + d;
  }, [n]);

  useEffect(() => {
    if (!n) return undefined;
    const root = rootRef.current; const s = st.current;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reduce) s.intro = 1;
    let raf = 0; let alive = true;
    const frame = (t) => {
      if (!alive) return;
      const W = root.clientWidth; const H = root.clientHeight; const phone = W < 768;
      const tbl = phone ? XS_M : XS;
      if (!s.drag) s.pos += (s.target - s.pos) * (reduce ? 1 : 0.11);
      s.intro = Math.min(1, s.intro + 0.012); const ie = 1 - Math.pow(1 - s.intro, 3);
      s.sx += (s.px - s.sx) * 0.06; s.sy += (s.py - s.sy) * 0.06;
      const CW = Math.min(phone ? Math.min(W * 0.3, 150) : W * 0.148, H * 0.33);
      root.style.setProperty('--arc-cw', `${CW}px`);
      const N = n;
      for (let i = 0; i < N; i += 1) {
        const el = cardRefs.current[i]; if (!el) continue;
        const half = N / 2;
        const u = mod(i - s.pos + half, N) - half; const a = Math.abs(u); const sg = Math.sign(u) || 1;
        const x = sg * xAt(tbl, Math.min(5, a)) * W * ie;
        let sc; let z; let op; let ry; let blur = 0;
        if (a < 1) { sc = 0.55 + 0.45 * a; z = -260 * (1 - a); op = a; ry = -sg * 16 * a; }
        else { sc = 1 / (1 + 0.3 * Math.pow(a - 1, 1.15)); z = -110 * (a - 1); ry = -sg * (16 + 9 * Math.min(2, a - 1)); blur = Math.max(0, a - 1.6) * 2.4; op = 1; }
        if (a > 3.4) op = Math.max(0, 1 - (a - 3.4) / 0.8);
        const bob = reduce ? 0 : Math.sin(t / 1000 * 1.1 + i * 1.7) * H * 0.006 * Math.min(1, a);
        const y = bob - (1 - sc) * H * 0.04;
        ry += s.sx * 10;
        op *= ie;
        el.style.transform = `translate(${x}px,${y}px) perspective(1300px) translateZ(${z}px) rotateY(${ry}deg) rotateX(${-s.sy * 6}deg) scale(${sc * (0.6 + 0.4 * ie)})`;
        el.style.opacity = String(op); el.style.filter = blur > 0.05 ? `blur(${blur}px)` : 'none';
        el.style.zIndex = a < 1 ? '1' : String(Math.round(100 - 10 * a));
        el.style.visibility = op < 0.01 ? 'hidden' : 'visible';
        el.style.pointerEvents = op < 0.3 ? 'none' : 'auto';
      }
      const cur = mod(Math.round(s.target), N);
      if (Math.abs(s.target - s.pos) < 0.02 && !s.drag) setIdx((c) => (c === cur ? c : cur));
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const pm = (e) => { const r = root.getBoundingClientRect(); s.px = (e.clientX - r.left) / r.width - 0.5; s.py = (e.clientY - r.top) / r.height - 0.5; };
    const pd = (e) => { if (e.target.closest('.arc-buy,.arc-nav,.rl-more')) return; s.drag = { x: e.clientX, p0: s.pos, t: performance.now(), lx: e.clientX, v: 0 }; s.moved = false; };
    const pmv = (e) => {
      const d = s.drag; if (!d) return; const dx = e.clientX - d.x;
      if (Math.abs(dx) > 6) s.moved = true;
      const now = performance.now(); d.v = (e.clientX - d.lx) / Math.max(1, now - d.t); d.lx = e.clientX; d.t = now;
      const W = root.clientWidth; const step = (W < 768 ? XS_M[1] : XS[1]) * W;
      s.pos = d.p0 - (getComputedStyle(root).direction === 'rtl' ? -1 : 1) * dx / step;
    };
    const pu = () => { const d = s.drag; if (!d) return; const ds = getComputedStyle(root).direction === 'rtl' ? -1 : 1; const fl = Math.max(-3, Math.min(3, ds * d.v * 3.2)); s.target = Math.round(s.pos + fl); s.drag = null; };
    const wh = (e) => {
      const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY;
      s.wheel += d; if (Math.abs(s.wheel) > 60) { const now = performance.now(); if (now - s.lastStep > 260) { s.target = Math.round(s.target) + Math.sign(s.wheel); s.lastStep = now; } s.wheel = 0; }
      e.preventDefault();
    };
    const kd = (e) => { if (e.key === 'ArrowLeft') { e.preventDefault(); s.target = Math.round(s.target) + (getComputedStyle(root).direction === 'rtl' ? 1 : -1); } else if (e.key === 'ArrowRight') { e.preventDefault(); s.target = Math.round(s.target) + (getComputedStyle(root).direction === 'rtl' ? -1 : 1); } else if (e.key === 'Enter') setFocus(true); };
    root.addEventListener('pointermove', pm); root.addEventListener('pointerdown', pd); window.addEventListener('pointermove', pmv); window.addEventListener('pointerup', pu);
    root.addEventListener('wheel', wh, { passive: false }); root.addEventListener('keydown', kd);
    return () => { alive = false; cancelAnimationFrame(raf); root.removeEventListener('pointermove', pm); root.removeEventListener('pointerdown', pd); window.removeEventListener('pointermove', pmv); window.removeEventListener('pointerup', pu); root.removeEventListener('wheel', wh); root.removeEventListener('keydown', kd); };
  }, [n]);

  if (!n) return <div className="empty">لا توجد منتجات مطابقة</div>;
  const p = items[Math.min(idx, n - 1)];
  const sel = '.arc-card.cur .arc-g img';

  return (
    <div className="arc" ref={rootRef} tabIndex={0} aria-label="قوس المنتجات" role="group">
      <div className="arc-ghost" aria-hidden="true">{(cfg.store_name || 'FIT').toString().slice(0, 4).toUpperCase()}</div>
      <div className="arc-model" aria-hidden="true">
        {p.images[0] ? <img key={p.id} src={p.images[0]} alt="" draggable="false" /> : null}
      </div>
      <div className="arc-stage">
        {items.map((it, i) => (
          <button key={it.id} type="button" ref={(el) => { cardRefs.current[i] = el; }} className={'arc-card' + (i === idx ? ' cur' : '')} aria-label={it.title}
            onClick={() => { if (st.current.moved) return; if (i === idx) setFocus(true); else toIndex(i); }}>
            <span className="arc-g">{it.images[0] ? <img src={it.images[0]} alt="" loading={i < 6 ? 'eager' : 'lazy'} draggable="false" /> : <Ph p={it} />}</span>
            <span className="arc-n">{it.title}</span>
          </button>
        ))}
      </div>
      <button type="button" className="arc-nav arc-pv" aria-label="السابق" onClick={() => go(-1)}>‹</button>
      <button type="button" className="arc-nav arc-nx" aria-label="التالي" onClick={() => go(1)}>›</button>
      <div className="arc-buy" key={p.id}>
        <div className="arc-bi">
          <div className="ob-cnt num" dir="ltr">{pad2(idx + 1)} / {pad2(n)}</div>
          <h3>{p.title}</h3>
          <PriceEl p={p} cur={cart.cur} />
          <div className="rl-act"><button type="button" className="rl-more" onClick={() => setFocus(true)}>عرض سريع</button><Link className="ob-lnk" href={`${cart.base}/p/${p.id}`}>كل التفاصيل ←</Link></div>
        </div>
        <QuickPick p={p} cart={cart} srcSel={sel} onMore={() => setFocus(true)} />
      </div>
      {focus && <FocusSheet list={items} idx={idx} onGo={(i) => toIndex(Math.max(0, Math.min(n - 1, i)))} onClose={() => setFocus(false)} cart={cart} />}
    </div>
  );
}
