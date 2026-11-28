'use client';
import { useT } from '../I18n';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Ph, PriceEl, QuickPick, FocusSheet, useBrowseCart, pad2 } from './browseKit';

/* عرض «الشماعة»: سكة ذهبية منحنية على عرض الشاشة، القطع متعلقة عليها بشماعات وتتأرجح مع سرعة التحريك.
   العجلة/السحب/الأسهم بتحرّك السكة بقصور ذاتي. القطعة اللي تقف عليها بتلف وتواجهك وتكبر، والجيران بيبعدوا،
   وزر «للخلف» بيقلبها لوجه الظهر (الصورة التانية للمنتج) لو موجودة. ضغطة على القطعة الأمامية تفتح العرض السريع. */

const AMP = 0.085;
const mod = (a, n) => ((a % n) + n) % n; // eslint-disable-line no-unused-vars
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const NEIGH = [0, 50, 24, 9, 0];

export default function RailView({ list = [] }) {
  const tx = useT();
  const cart = useBrowseCart();
  const items = list.slice(0, 30);
  const n = items.length;
  const root = useRef(null); const zone = useRef(null); const pathMain = useRef(null); const pathSh = useRef(null); const pathHi = useRef(null);
  const els = useRef([]); const swayEls = useRef([]); const thumb = useRef(null);
  const S = useRef({ cur: 0, target: 0, vel: 0, last: 0, dragging: false, hover: -1, sway: [], av: [], drag: null, moved: false, cdx: [], layout: { start: 0, gap: 100, w: 0, max: 0 } });
  const [hover, setHover] = useState(-1);
  const [pin, setPin] = useState(-1); /* آخر قطعة وقفت عليها: بتفضل مختارة عشان تقدر توصل لزر «للخلف» */
  const [center, setCenter] = useState(0);
  const [flipped, setFlipped] = useState({});
  const [focus, setFocus] = useState(false);
  const [noHover, setNoHover] = useState(false);

  useEffect(() => { try { setNoHover(window.matchMedia('(hover: none)').matches); } catch { /* تجاهل */ } }, []);

  const active = hover >= 0 ? hover : pin >= 0 ? pin : center;
  const p = items[Math.min(active, n - 1)];

  const centerOn = useCallback((i) => {
    const s = S.current; const L = s.layout;
    s.target = clamp((L.start + i * L.gap) - L.w / 2, 0, L.max); setPin(-1);
  }, []);

  useEffect(() => {
    if (!n) return undefined;
    const r = root.current; const s = S.current;
    const reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let raf = 0; let alive = true;
    const layout = () => {
      const W = zone.current.clientWidth; const phone = W < 640;
      const gap = phone ? 84 : clamp(W * 0.086, 96, 150);
      const boxW = gap * (phone ? 1.25 : 1.5);
      const start = phone ? 52 : gap * 0.85;
      s.layout = { start, gap, w: W, boxW, boxH: boxW * 1.34, top: phone ? 34 : 46, sag: phone ? 26 : 58, max: Math.max(0, start * 2 + (n - 1) * gap - W) };
      r.style.setProperty('--rl-bw', `${boxW}px`); r.style.setProperty('--rl-bh', `${boxW * 1.34}px`);
    };
    layout();
    const railY = (x) => { const L = s.layout; const t = (x - L.w / 2) / (L.w / 2); return L.top + L.sag * (1 - t * t); };
    const draw = () => {
      const L = s.layout; const y0 = railY(0); const yc = 2 * railY(L.w / 2) - y0;
      const d = `M0 ${y0} Q ${L.w / 2} ${yc} ${L.w} ${y0}`;
      if (pathMain.current) pathMain.current.setAttribute('d', d);
      if (pathSh.current) pathSh.current.setAttribute('d', d);
      if (pathHi.current) pathHi.current.setAttribute('d', d);
    };
    draw();
    const ro = new ResizeObserver(() => { layout(); draw(); }); ro.observe(zone.current);
    for (let i = 0; i < n; i += 1) { s.sway[i] = 0; s.av[i] = 0; s.cdx[i] = 0; }
    /* دخول: كل قطعة تنزل على السكة بعد اللي قبلها */
    if (!reduce) els.current.forEach((el, i) => { if (el) el.animate([{ opacity: 0, transform: `translateY(-30px)`, filter: 'blur(5px)' }, { opacity: 1, transform: 'none', filter: 'none' }], { duration: 600, delay: Math.min(i, 12) * 70, easing: 'cubic-bezier(.2,.9,.3,1)', fill: 'backwards' }); });
    if (!reduce) for (let i = 0; i < n; i += 1) { s.av[i] = (i % 2 ? 1 : -1) * 1.6; }

    const frame = (t) => {
      if (!alive) return;
      const dt = Math.min(3, (t - (s.last || t)) / 16.667); s.last = t;
      const before = s.cur;
      s.cur += (s.target - s.cur) * (1 - Math.pow(1 - AMP, dt));
      s.vel = (s.cur - before) / Math.max(dt, 0.001);
      const L = s.layout;
      let best = 0; let bd = Infinity;
      for (let i = 0; i < n; i += 1) {
        const el = els.current[i]; if (!el) continue;
        let x = L.start + i * L.gap - s.cur;
        const dH = s.hover >= 0 ? i - s.hover : 0;
        const want = s.hover >= 0 && dH !== 0 ? Math.sign(dH) * NEIGH[Math.min(Math.abs(dH), 4)] * (L.gap / 100) : 0;
        s.cdx[i] += (want - s.cdx[i]) * 0.16; x += s.cdx[i];
        const y = railY(x) - 2;
        el.style.transform = `translate3d(${x - L.boxW / 2}px,${y}px,0)`;
        el.style.visibility = x < -L.boxW || x > L.w + L.boxW ? 'hidden' : 'visible';
        const dc = Math.abs(x - L.w / 2); if (dc < bd) { bd = dc; best = i; }
        const sw = swayEls.current[i];
        if (sw && !reduce) {
          const target = clamp(-s.vel * 0.22, -7, 7);
          s.av[i] += (target - s.sway[i]) * 0.05 * dt; s.av[i] *= Math.pow(0.88, dt); s.sway[i] += s.av[i] * dt;
          sw.style.transform = `rotate(${s.sway[i]}deg)`;
        }
      }
      if (thumb.current) thumb.current.style.insetInlineStart = `${(L.max ? s.cur / L.max : 0) * 42}%`;
      setCenter((c) => (c === best ? c : best));
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const wheel = (e) => { if (focusRef.current) return; e.preventDefault(); setPin(-1); const d = Math.abs(e.deltaX) > Math.abs(e.deltaY) ? e.deltaX : e.deltaY; s.target = clamp(s.target + d * 0.9, 0, s.layout.max); };
    const dn = (e) => { if (e.target.closest('.rl2-bk')) return; s.drag = { x: e.clientX, t0: s.target, lx: e.clientX, lt: performance.now(), v: 0 }; s.moved = false; };
    const mv = (e) => {
      const d = s.drag; if (!d) return; const dx = e.clientX - d.x;
      if (Math.abs(dx) > 6 && !s.moved) { s.moved = true; s.dragging = true; s.hover = -1; setHover(-1); setPin(-1); zone.current.classList.add('drg'); }
      if (s.moved) { const now = performance.now(); d.v = (e.clientX - d.lx) / Math.max(8, now - d.lt) * 0.6 + d.v * 0.4; d.lx = e.clientX; d.lt = now; s.target = clamp(d.t0 - dx * 1.15, 0, s.layout.max); }
    };
    const up = () => { const d = s.drag; s.drag = null; zone.current && zone.current.classList.remove('drg'); if (d && s.moved) { s.target = clamp(s.target - d.v * 260, 0, s.layout.max); setTimeout(() => { s.moved = false; s.dragging = false; }, 0); } };
    const kd = (e) => {
      const rtl = getComputedStyle(zone.current).direction === 'rtl';
      const g = s.layout.gap * (e.key === 'ArrowLeft' ? -1 : e.key === 'ArrowRight' ? 1 : 0);
      if (g) { e.preventDefault(); s.target = clamp(s.target + (rtl ? -g : g), 0, s.layout.max); }
      else if (e.key === 'Enter') setFocus(true);
    };
    const z = zone.current;
    z.addEventListener('wheel', wheel, { passive: false }); z.addEventListener('pointerdown', dn); window.addEventListener('pointermove', mv); window.addEventListener('pointerup', up); z.addEventListener('keydown', kd);
    return () => { alive = false; cancelAnimationFrame(raf); ro.disconnect(); z.removeEventListener('wheel', wheel); z.removeEventListener('pointerdown', dn); window.removeEventListener('pointermove', mv); window.removeEventListener('pointerup', up); z.removeEventListener('keydown', kd); };
  }, [n]); // eslint-disable-line react-hooks/exhaustive-deps
  const focusRef = useRef(false); focusRef.current = focus;

  const flip = (id) => setFlipped((f) => ({ ...f, [id]: !f[id] }));
  if (!n) return <div className="empty">{tx('لا توجد منتجات مطابقة')}</div>;
  const hasBack = !!(p.images && p.images[1]);
  const isBack = !!flipped[p.id] && hasBack;

  return (
    <div className="rl2" ref={root}>
      <div className="rl2-zone" ref={zone} tabIndex={0} role="listbox" aria-label={tx('المنتجات على الشماعة، استخدم الأسهم أو اسحب')}>
        <svg className="rl2-svg" aria-hidden="true" width="100%" height="100%">
          <defs><linearGradient id="rl2g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#E9DCBC" /><stop offset=".45" stopColor="#C2A877" /><stop offset="1" stopColor="#7F6743" /></linearGradient></defs>
          <path ref={pathSh} fill="none" stroke="rgba(80,60,35,.12)" strokeWidth="3" transform="translate(0 4)" />
          <path ref={pathMain} fill="none" stroke="url(#rl2g)" strokeWidth="5.2" strokeLinecap="round" />
          <path ref={pathHi} fill="none" stroke="rgba(255,247,226,.85)" strokeWidth="1.1" transform="translate(0 -1.3)" />
        </svg>
        {items.map((it, i) => {
          const face = hover === i || (noHover && center === i);
          const back = !!flipped[it.id] && !!(it.images && it.images[1]);
          return (
            <div key={it.id} className={'rl2-g' + (i === active ? ' on' : '')} ref={(el) => { els.current[i] = el; }} style={{ zIndex: i === active ? 5 : 1 }}>
              <div className="rl2-sw" ref={(el) => { swayEls.current[i] = el; }}>
                <div className="rl2-lift" style={{ transform: face ? 'translateY(10px) scale(1.18)' : 'none' }}>
                  <svg className="rl2-hk" viewBox="0 0 60 34" aria-hidden="true"><path d="M30 2c-4 0-6 3-6 6 0 2 1 3 3 4l-22 14c-2 1-1 4 1 4h48c2 0 3-3 1-4L33 12" fill="none" stroke="#5a4330" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  <div className="rl2-in" style={{ transform: `rotateY(${(face ? 0 : -64) + (back ? 180 : 0)}deg)` }}>
                    <span className="rl2-f">{it.images[0] ? <img src={it.images[0]} alt="" loading={i < 8 ? 'eager' : 'lazy'} decoding="async" draggable="false" /> : <Ph p={it} />}</span>
                    {it.images[1] ? <span className="rl2-b"><img src={it.images[1]} alt="" loading="lazy" decoding="async" draggable="false" /></span> : null}
                  </div>
                  <span className="rl2-tg num" style={{ transform: `rotate(${[-5, 4, -3, 6, -4, 3, -6, 4, -3, 5][i % 10]}deg)` }}>{pad2(i + 1)}</span>
                </div>
              </div>
              <button type="button" className="rl2-hit" role="option" aria-selected={i === active} aria-label={it.title}
                onPointerEnter={(e) => { if (e.pointerType === 'mouse' && !S.current.dragging) { S.current.hover = i; setHover(i); setPin(i); } }}
                onPointerLeave={(e) => { if (e.pointerType === 'mouse') { S.current.hover = -1; setHover((h) => (h === i ? -1 : h)); } }}
                onClick={() => { if (S.current.moved) return; if (i === center || hover === i || pin === i) { setFocus(true); } else { centerOn(i); setPin(i); } }} />
            </div>
          );
        })}
      </div>
      <div className="rl2-bar" aria-hidden="true"><span className="rl2-pt"><i ref={thumb} /></span></div>
      <div className="rl2-info" key={p.id}>
        <div className="ob-cnt num" dir="ltr">{pad2(active + 1)} / {pad2(n)}</div>
        <h3>{p.title}</h3>
        <PriceEl p={p} cur={cart.cur} />
        <div className="rl-act">
          <button type="button" className="rl-more" onClick={() => setFocus(true)}>{tx('عرض سريع')}</button>
          {hasBack ? <button type="button" className="rl2-bk rl-more" aria-pressed={isBack} onClick={() => flip(p.id)}>{isBack ? tx('↻ للأمام') : tx('↻ للخلف')}</button> : null}
          <Link className="ob-lnk" href={`${cart.base}/p/${p.id}`}>{tx('كل التفاصيل ←')}</Link>
        </div>
        <QuickPick p={p} cart={cart} srcSel=".rl2-g.on .rl2-f img" onMore={() => setFocus(true)} />
      </div>
      {focus && <FocusSheet list={items} idx={active} onGo={(i) => { const k = Math.max(0, Math.min(n - 1, i)); centerOn(k); setCenter(k); }} onClose={() => setFocus(false)} cart={cart} />}
    </div>
  );
}
