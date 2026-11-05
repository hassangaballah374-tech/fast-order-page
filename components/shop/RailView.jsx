'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Ph, PriceEl, QuickPick, FocusSheet, useBrowseCart, pad2 } from './browseKit';

/* عرض «رف الشماعات»: القطع متعلقة على شماعات في سكة أفقية، والعميل يسحب/يمرر عشان يتنقل.
   القطعة الأوسط بتكبر وتتقدم، والباقي بيميل بمنظور. ضغطة على القطعة الأوسط تفتح العرض المركّز. */

export default function RailView({ list = [] }) {
  const cart = useBrowseCart();
  const n = list.length;
  const scRef = useRef(null);
  const [idx, setIdx] = useState(0);
  const [focus, setFocus] = useState(false);
  const raf = useRef(0);
  const drag = useRef(null);
  const moved = useRef(false);

  const measure = useCallback(() => {
    const sc = scRef.current;
    if (!sc) return;
    const kids = sc.querySelectorAll('.rl-it');
    const mid = sc.getBoundingClientRect().left + sc.clientWidth / 2;
    let best = 0; let bd = Infinity;
    kids.forEach((k, i) => { const r = k.getBoundingClientRect(); const d = Math.abs(r.left + r.width / 2 - mid); if (d < bd) { bd = d; best = i; } });
    setIdx((c) => (c === best ? c : best));
  }, []);
  const onScroll = () => { cancelAnimationFrame(raf.current); raf.current = requestAnimationFrame(measure); };
  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const goTo = useCallback((i) => {
    const sc = scRef.current;
    const el = sc && sc.querySelectorAll('.rl-it')[Math.max(0, Math.min(n - 1, i))];
    if (!el) return;
    const r = el.getBoundingClientRect(); const s = sc.getBoundingClientRect();
    sc.scrollTo({ left: sc.scrollLeft + (r.left + r.width / 2 - (s.left + s.width / 2)), behavior: cart.reduce() ? 'auto' : 'smooth' });
  }, [n, cart]);

  /* سحب بالماوس (اللمس بيتعامل معاه المتصفح بالتمرير الأصلي) */
  const down = (e) => {
    if (e.pointerType !== 'mouse') return;
    drag.current = { x: e.clientX, left: scRef.current.scrollLeft }; moved.current = false;
  };
  const move = (e) => {
    const d = drag.current; if (!d) return;
    const dx = e.clientX - d.x;
    if (Math.abs(dx) > 6) { moved.current = true; scRef.current.classList.add('drg'); }
    if (moved.current) scRef.current.scrollLeft = d.left - dx;
  };
  const up = () => { drag.current = null; const sc = scRef.current; if (sc) { sc.classList.remove('drg'); } if (moved.current) setTimeout(() => { moved.current = false; goTo(idx); }, 0); };

  const key = (e) => {
    const rtl = getComputedStyle(scRef.current).direction === 'rtl';
    if (e.key === 'ArrowLeft') { e.preventDefault(); goTo(idx + (rtl ? 1 : -1)); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); goTo(idx + (rtl ? -1 : 1)); }
    else if (e.key === 'Enter') setFocus(true);
  };

  if (!n) return <div className="empty">لا توجد منتجات مطابقة</div>;
  const p = list[Math.min(idx, n - 1)];
  const sel = `.rl-it.on .rl-pic img`;

  return (
    <div className="rl">
      <div className="rl-rail" aria-hidden="true" />
      <div className="rl-sc" ref={scRef} tabIndex={0} role="listbox" aria-label="المنتجات" onScroll={onScroll} onKeyDown={key}
        onPointerDown={down} onPointerMove={move} onPointerUp={up} onPointerLeave={up}>
        <span className="rl-sp" aria-hidden="true" />
        {list.map((it, i) => {
          const d = i - idx;
          const cls = 'rl-it' + (i === idx ? ' on' : '') + (d !== 0 ? ` d${Math.min(3, Math.abs(d))} ${d < 0 ? 'l' : 'r'}` : '');
          return (
            <button key={it.id} type="button" className={cls} role="option" aria-selected={i === idx} aria-label={it.title}
              onClick={() => { if (moved.current) return; if (i === idx) setFocus(true); else goTo(i); }}>
              <svg className="rl-hg" viewBox="0 0 60 34" aria-hidden="true"><path d="M30 2c-4 0-6 3-6 6 0 2 1 3 3 4l-22 14c-2 1-1 4 1 4h48c2 0 3-3 1-4L33 12" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <span className="rl-pic">{it.images[0] ? <img src={it.images[0]} alt="" loading={Math.abs(d) < 5 ? 'eager' : 'lazy'} decoding="async" draggable="false" /> : <Ph p={it} />}</span>
              <span className="rl-tag num">{pad2(i + 1)}</span>
            </button>
          );
        })}
        <span className="rl-sp" aria-hidden="true" />
      </div>
      <div className="rl-info" key={p.id}>
        <div className="ob-cnt num" dir="ltr">{pad2(idx + 1)} / {pad2(n)}</div>
        <h3>{p.title}</h3>
        <PriceEl p={p} cur={cart.cur} />
        <div className="rl-act">
          <button type="button" className="rl-more" onClick={() => setFocus(true)}>عرض سريع</button>
          <Link className="ob-lnk" href={`${cart.base}/p/${p.id}`}>كل التفاصيل ←</Link>
        </div>
        <QuickPick p={p} cart={cart} srcSel={sel} onMore={() => setFocus(true)} />
      </div>
      {focus && <FocusSheet list={list} idx={idx} onGo={(i) => { const k = Math.max(0, Math.min(n - 1, i)); goTo(k); setIdx(k); }} onClose={() => setFocus(false)} cart={cart} />}
    </div>
  );
}
