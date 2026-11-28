'use client';
import { useT } from '../I18n';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { useShop } from './StoreContext';
import { Ph, PriceEl, FocusSheet, useBrowseCart, pad2 } from './browseKit';
import { soldOut } from './ui';
import { track } from './tracker';
import { money, effectivePrice, unitPrice } from '../../lib/storeKit';

/* عرض «الممشى»: حلقة ثلاثية الأبعاد من المنتجات، القطعة الأمامية كبيرة والباقي بيصغر ويغيم، تشغيل تلقائي كل 5 ثواني مع شريط تقدم،
   ولوحة يمين «في الإطلالة دي» فيها القطعة + اللي بعدها مع اختيار المقاس وزر «أضف الإطلالة كاملة» بإجمالي السعر. */

const AUTO_MS = 5000;
const mod = (a, n) => ((a % n) + n) % n;

export default function RunwayView({ list = [] }) {
  const tx = useT();
  const cart = useBrowseCart();
  const { add } = useShop();
  const items = list.slice(0, 12);
  const n = items.length;
  const [idx, setIdx] = useState(0);
  const [play, setPlay] = useState(false);
  const [focus, setFocus] = useState(false);
  const [opts, setOpts] = useState({});
  const [done, setDone] = useState('');
  const [tick, setTick] = useState(0);
  const dragRef = useRef(null); const moved = useRef(false);
  const stageRef = useRef(null); const curRef = useRef(null);

  useEffect(() => { const r = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches; setPlay(!r); }, []);
  const go = useCallback((d) => { setIdx((i) => mod(i + d, n || 1)); setTick((t) => t + 1); setDone(''); }, [n]);
  const to = useCallback((i) => { setIdx(mod(i, n || 1)); setTick((t) => t + 1); setDone(''); }, [n]);
  useEffect(() => {
    if (!play || n < 2 || focus) return undefined;
    const t = setTimeout(() => go(1), AUTO_MS);
    return () => clearTimeout(t);
  }, [play, idx, tick, n, focus, go]);
  useEffect(() => { if (!done) return undefined; const t = setTimeout(() => setDone(''), 6000); return () => clearTimeout(t); }, [done]);

  const pieces = useMemo(() => (n ? [0, 1, 2].filter((k) => k < n).map((k) => items[mod(idx + k, n)]) : []), [idx, items, n]);
  const setOpt = (pid, g, v) => setOpts((o) => ({ ...o, [pid]: { ...(o[pid] || {}), [g]: v } }));
  const missing = (p) => (p.variants || []).filter((g) => !(opts[p.id] || {})[g.name]);
  const addOne = (p, src) => {
    if (soldOut(p) || missing(p).length) return false;
    const o = opts[p.id] || {}; const price = unitPrice(p, o);
    add({ product_id: p.id, title: p.title, image: p.images[0] || '', price, qty: 1, options: o });
    track('AddToCart', { value: price, items: [{ id: p.id, title: p.title, price, qty: 1 }] });
    return true;
  };
  const buyable = pieces.filter((p) => !soldOut(p));
  const total = buyable.reduce((a, p) => a + effectivePrice(p), 0);
  const need = buyable.find((p) => missing(p).length);
  const addAll = () => {
    if (need) { setDone(tx('اختر {1} لـ «{2}» الأول', [missing(need)[0].name, need.title])); return; }
    buyable.forEach((p) => addOne(p));
    setDone(tx('تمت إضافة الإطلالة كاملة للسلة ✓'));
  };

  const down = (e) => { dragRef.current = { x: e.clientX }; moved.current = false; };
  const move = (e) => {
    const d = dragRef.current; if (!d) return; const dx = e.clientX - d.x;
    if (Math.abs(dx) > 6) moved.current = true;
    const c = stageRef.current && stageRef.current.querySelector('.rw-cur'); if (c) { c.style.setProperty('--rw-dx', `${dx * 0.3}px`); }
  };
  const up = (e) => {
    const d = dragRef.current; dragRef.current = null; if (!d) return;
    const c = stageRef.current && stageRef.current.querySelector('.rw-cur'); if (c) c.style.removeProperty('--rw-dx');
    const dx = e.clientX - d.x; if (Math.abs(dx) > 50) { const rtl = getComputedStyle(stageRef.current).direction === 'rtl'; go((dx < 0) !== rtl ? 1 : -1); }
  };
  const cursorMove = (e) => {
    const el = curRef.current; if (!el) return; const r = stageRef.current.getBoundingClientRect();
    el.style.transform = `translate(${e.clientX - r.left}px,${e.clientY - r.top}px)`;
    el.dataset.over = e.target.closest && e.target.closest('.rw-it.cur') ? 'view' : 'drag';
  };
  const key = (e) => {
    const rtl = getComputedStyle(stageRef.current).direction === 'rtl';
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(rtl ? 1 : -1); } else if (e.key === 'ArrowRight') { e.preventDefault(); go(rtl ? -1 : 1); } else if (e.key === 'Enter') setFocus(true);
  };

  if (!n) return <div className="empty">{tx('لا توجد منتجات مطابقة')}</div>;
  const cur = items[idx];
  return (
    <div className="rw">
      <div className="rw-l">
        <div className="rw-head"><h2>{tx('أطلّ بإطلالتك')}</h2><p>{tx('{1} قطع، اسحب أو اضغط الأسهم لتغيير الإطلالة، وضغطة على القطعة الأمامية تفتحها.', [n])}</p></div>
        <div className="rw-stage" ref={stageRef} tabIndex={0} role="region" aria-roledescription="carousel" aria-label={tx('الإطلالات: استخدم الأسهم أو اسحب للتغيير')}
          onPointerDown={down} onPointerMove={(e) => { move(e); cursorMove(e); }} onPointerUp={up} onPointerLeave={(e) => { up(e); }} onKeyDown={key}>
          {items.map((it, i) => {
            let d = mod(i - idx + n / 2, n) - n / 2; if (n % 2 === 0 && d === -n / 2) d = n / 2;
            const a = Math.abs(d);
            const st = { '--d': d, '--a': a };
            return (
              <button key={it.id} type="button" className={'rw-it' + (d === 0 ? ' cur' : '')} style={st} aria-label={`${pad2(i + 1)} ${it.title}`} tabIndex={-1} data-hide={a > 3 ? 1 : 0}
                onClick={() => { if (moved.current) return; if (d === 0) setFocus(true); else to(i); }}>
                <span className="rw-sh" />
                <span className="rw-pic">{it.images[0] ? <img src={it.images[0]} alt="" draggable="false" loading={a < 3 ? 'eager' : 'lazy'} /> : <Ph p={it} />}</span>
              </button>
            );
          })}
          <span className="rw-cursor" ref={curRef} data-over="drag" aria-hidden="true"><b className="rw-cd">{tx('اسحب')}</b><b className="rw-cv">{tx('عرض')}</b></span>
        </div>
        <div className="rw-ctl">
          <button type="button" className="rw-ic" aria-label={tx('السابق')} onClick={() => go(-1)}>←</button>
          <div className="rw-ticks" role="tablist">
            {items.map((it, i) => (
              <button key={it.id} type="button" role="tab" aria-selected={i === idx} aria-label={`${pad2(i + 1)} ${it.title}`} className={'rw-tk' + (i === idx ? ' on' : i < idx ? ' past' : '')} onClick={() => to(i)}>
                <span className="rw-bar"><i key={i === idx ? `${tick}${play}` : 'x'} className={i === idx && play ? 'go' : ''} style={i === idx && play ? { animationDuration: `${AUTO_MS}ms` } : undefined} /></span>
                <span className="rw-tl num">{pad2(i + 1)}{i === idx ? <em> {it.title}</em> : null}</span>
              </button>
            ))}
          </div>
          <button type="button" className="rw-ic" aria-pressed={play} aria-label={play ? tx('إيقاف التشغيل التلقائي') : tx('تشغيل تلقائي')} onClick={() => setPlay((p) => !p)}>{play ? '❚❚' : '▶'}</button>
          <button type="button" className="rw-ic" aria-label={tx('التالي')} onClick={() => go(1)}>→</button>
        </div>
        <span className="sr-only" aria-live="polite" style={{ position: 'absolute', width: 1, height: 1, overflow: 'hidden', clip: 'rect(0,0,0,0)' }}>{tx('إطلالة {1}: {2}', [idx + 1, cur.title])}</span>
      </div>
      <aside className="rw-p">
        <div className="rw-ph"><h3>{tx('في الإطلالة دي')}</h3><span className="num">{pieces.length} {pieces.length === 1 ? tx('قطعة') : tx('قطع')}</span></div>
        <ul className="rw-li">
          {pieces.map((p, k) => {
            const groups = p.variants || []; const sold = soldOut(p); const ok = !sold && !missing(p).length;
            return (
              <li key={p.id} className="rw-row" style={{ '--i': k }}>
                <Link className="rw-m" href={`${cart.base}/p/${p.id}`}>{p.images[0] ? <img src={p.images[0]} alt="" loading="lazy" /> : <Ph p={p} />}<span className="num">{k + 1}</span></Link>
                <div className="rw-in">
                  <Link className="rw-nm" href={`${cart.base}/p/${p.id}`}>{p.title}</Link>
                  <PriceEl p={p} cur={cart.cur} />
                  {sold ? <small className="rw-so">{tx('نفدت الكمية')}</small> : groups.map((g) => (
                    <div key={g.name} className="rw-sz" role="group" aria-label={g.name}>
                      {g.values.map((v) => <button key={v} type="button" className={(opts[p.id] || {})[g.name] === v ? 'on' : ''} aria-pressed={(opts[p.id] || {})[g.name] === v} onClick={() => setOpt(p.id, g.name, v)}>{v}</button>)}
                    </div>
                  ))}
                </div>
                <button type="button" className={'rw-add' + (ok ? ' ok' : '')} disabled={sold} aria-label={tx('أضف {1} للسلة', [p.title])} onClick={() => { if (addOne(p)) setDone(tx('تمت إضافة «{1}» ✓', [p.title])); else if (!sold) setDone(tx('اختر {1} الأول', [missing(p)[0].name])); }}>+</button>
              </li>
            );
          })}
        </ul>
        <div className="rw-bd">
          <div className="rw-bt"><span>{tx('كمّل الإطلالة')}</span><b className="num">{money(total, cart.cur)}</b></div>
          <button type="button" className="rw-all" disabled={!buyable.length} onClick={addAll}>{tx('أضف الإطلالة كاملة للسلة')}</button>
          {done ? <div className="rw-ok" role="status">{done} {done.includes('✓') ? <button type="button" onClick={cart.openCart}>{tx('عرض السلة ←')}</button> : null}</div> : null}
        </div>
      </aside>
      {focus && <FocusSheet list={items} idx={idx} onGo={(i) => to(Math.max(0, Math.min(n - 1, i)))} onClose={() => setFocus(false)} cart={cart} />}
    </div>
  );
}
