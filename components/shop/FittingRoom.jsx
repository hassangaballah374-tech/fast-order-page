'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useShop, hit } from './StoreContext';
import { track } from './tracker';
import { soldOut } from './ui';
import { flyToCart } from './fly';
import SizeHelp from './SizeFinder';
import { chartFor, isSizeGroup } from '../../lib/sizeFinder';
import { money, effectivePrice, unitPrice } from '../../lib/storeKit';
import { SLOTS } from '../../lib/fitting';

/* غرفة القياس: اختار موديل، اضغط على قطع عشان تلبّسها، اسحب القطعة على الموديل لتظبيطها، ثم اختار المقاس وأضف اللي عجبك للسلة. */

const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

export default function FittingRoom({ data }) {
  const { slug, cfg, cur, base, add, count } = useShop();
  const router = useRouter();
  const { models, products, title } = data;
  const [mi, setMi] = useState(0);
  const [worn, setWorn] = useState([]);
  const [tf, setTf] = useState({});
  const [cur2, setCur2] = useState('');
  const [opts, setOpts] = useState({});
  const [done, setDone] = useState('');
  const box = useRef(null);
  const drag = useRef(null);
  useEffect(() => { try { hit(slug, 'fitting'); } catch { /* تجاهل */ } }, [slug]);
  useEffect(() => { if (!done) return undefined; const t = setTimeout(() => setDone(''), 6000); return () => clearTimeout(t); }, [done]);

  const byId = useMemo(() => new Map(products.map((p) => [String(p.id), p])), [products]);
  const place = (p) => { const s = SLOTS[p.fit.slot] || SLOTS.top; return tf[p.id] || { x: s.x, y: s.y, w: s.w }; };
  const toggle = (p) => {
    const id = String(p.id);
    setWorn((w) => {
      if (w.includes(id)) return w.filter((x) => x !== id);
      /* قطعة واحدة لكل خانة (بنطلون جديد يشيل القديم) */
      return [...w.filter((x) => (byId.get(x)?.fit.slot) !== p.fit.slot), id];
    });
    setCur2(id);
  };
  /* فتح الغرفة من صفحة منتج (?p=ID): القطعة تتلبّس تلقائياً */
  useEffect(() => {
    try {
      const id = new URLSearchParams(window.location.search).get('p');
      const hit1 = id ? products.find((x) => String(x.id) === String(id)) : null;
      if (hit1) { setWorn([String(hit1.id)]); setCur2(String(hit1.id)); }
    } catch { /* تجاهل */ }
  }, [products]);
  const wornP = worn.map((id) => byId.get(id)).filter(Boolean);
  const sel = byId.get(cur2) && worn.includes(cur2) ? byId.get(cur2) : wornP[wornP.length - 1];

  const down = (e, p) => {
    e.preventDefault();
    const r = box.current.getBoundingClientRect();
    const t = place(p);
    drag.current = { id: String(p.id), px: e.clientX, py: e.clientY, x: t.x, y: t.y, w: r.width, h: r.height };
    setCur2(String(p.id));
    e.currentTarget.setPointerCapture(e.pointerId);
  };
  const move = (e, p) => {
    const d = drag.current; if (!d || d.id !== String(p.id)) return;
    const t = place(p);
    setTf((c) => ({ ...c, [p.id]: { ...t, x: clamp(d.x + ((e.clientX - d.px) / d.w) * 100, 0, 100), y: clamp(d.y + ((e.clientY - d.py) / d.h) * 100, 0, 100) } }));
  };
  const up = () => { drag.current = null; };
  const resize = (p, w) => setTf((c) => ({ ...c, [p.id]: { ...place(p), w } }));

  const missing = wornP.filter((p) => !soldOut(p)).map((p) => ({ p, g: (p.variants || []).find((g) => !(opts[p.id] || {})[g.name]) })).find((x) => x.g);
  const buyable = wornP.filter((p) => !soldOut(p));
  const total = buyable.reduce((a, p) => a + effectivePrice(p), 0);
  const openCart = () => { if (cfg.cart?.drawer === false) router.push(`${base}/cart`); else window.dispatchEvent(new Event('spike:cart-open')); };
  const addAll = () => {
    if (missing || !buyable.length) return;
    flyToCart(box.current && box.current.querySelector('img'), (buyable[0].images || [])[0]);
    buyable.forEach((p) => {
      const price = unitPrice(p, opts[p.id] || {});
      add({ product_id: p.id, title: p.title, image: p.images[0] || p.fit.image, price, qty: 1, options: opts[p.id] || {} });
      track('AddToCart', { value: price, items: [{ id: p.id, title: p.title, price, qty: 1 }] });
      hit(slug, 'cart', { product: String(p.id) });
    });
    setDone(`${buyable.length} قطع`);
  };

  const model = models[Math.min(mi, models.length - 1)];
  return (
    <div className="fr">
      <div className="lk-top"><h2>{title}</h2><button type="button" className="lk-cart" data-fly-target="1" onClick={openCart} aria-label="السلة">🛒 <span className="num">{count}</span></button></div>
      <div className="fr-grid">
        <div className="fr-stage">
          {models.length > 1 && <div className="fr-models" role="tablist" aria-label="الموديل">{models.map((m, i) => <button key={m.id} type="button" role="tab" aria-selected={i === mi} className={i === mi ? 'on' : ''} onClick={() => setMi(i)}><img src={m.image} alt={m.name} /></button>)}</div>}
          <div className="fr-canvas" ref={box}>
            <img className="fr-model" src={model.image} alt={model.name || 'موديل'} draggable="false" decoding="async" />
            {wornP.map((p) => {
              const t = place(p); const z = (SLOTS[p.fit.slot] || SLOTS.top).z;
              return <img key={p.id} className={'fr-layer' + (sel && sel.id === p.id ? ' on' : '')} src={p.fit.image} alt={p.title} draggable="false" style={{ left: `${t.x}%`, top: `${t.y}%`, width: `${t.w}%`, zIndex: z }}
                onPointerDown={(e) => down(e, p)} onPointerMove={(e) => move(e, p)} onPointerUp={up} onPointerCancel={up} />;
            })}
            {!wornP.length && <div className="fr-hint">اختار قطعة من تحت عشان تلبّسها للموديل</div>}
          </div>
          {sel && <label className="fr-size">حجم «{sel.title}»<input type="range" min="15" max="100" value={Math.round(place(sel).w)} onChange={(e) => resize(sel, Number(e.target.value))} aria-label="حجم القطعة" /></label>}
        </div>
        <div className="fr-side">
          <div className="lk-k">اضغط على القطعة عشان تلبسها · اسحبها لتظبيط مكانها</div>
          <div className="fr-pick">
            {products.map((p) => { const on = worn.includes(String(p.id)); return (
              <button key={p.id} type="button" className={on ? 'on' : ''} onClick={() => toggle(p)} aria-pressed={on} aria-label={p.title}>
                {p.images[0] ? <img src={p.images[0]} alt="" loading="lazy" /> : <img src={p.fit.image} alt="" loading="lazy" />}
                <span>{p.title}</span>{on ? <i>✓</i> : null}
              </button>); })}
          </div>
          {wornP.length > 0 && (
            <div className="lk-list">
              {wornP.map((p) => { const chart = chartFor(cfg.sizing, p); return (
                <div key={p.id} className="lk-it" data-fr={p.id}>
                  <div className="lk-bd">
                    <div className="lk-nm">{p.title}</div>
                    <div className="lk-pr num">{money(effectivePrice(p), cur)}</div>
                    {soldOut(p) ? <div className="lk-sold">نفدت الكمية</div> : (p.variants || []).map((g) => (
                      <div key={g.name} className="lk-opt"><div className="lk-chips">{g.values.map((v) => <button key={v} type="button" className={(opts[p.id] || {})[g.name] === v ? 'sel' : ''} onClick={() => setOpts((c) => ({ ...c, [p.id]: { ...(c[p.id] || {}), [g.name]: v } }))}>{v}</button>)}</div>
                        {chart && isSizeGroup(g.name) ? <SizeHelp chart={chart} values={g.values} onPick={(v) => setOpts((c) => ({ ...c, [p.id]: { ...(c[p.id] || {}), [g.name]: v } }))} /> : null}</div>
                    ))}
                  </div>
                  <button type="button" className="fr-rm" onClick={() => toggle(p)} aria-label="إزالة">✕</button>
                </div>); })}
              <div className="lk-ft">
                <div className="lk-tot"><span>الإجمالي</span><b className="num">{money(total, cur)}</b></div>
                <button type="button" className={'lk-all' + (done ? ' ok' : '')} disabled={!!missing || !buyable.length} onClick={addAll}>
                  {missing ? `اختر ${missing.g.name} لـ «${missing.p.title}»` : done ? 'تمت الإضافة ✓' : '🛍️ أضف كل اللي لبسته للسلة'}
                </button>
                {done ? <div className="ob-added" role="status"><span>✓ تمت إضافة {done} للسلة</span><button type="button" onClick={openCart}>عرض السلة ←</button></div> : null}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
