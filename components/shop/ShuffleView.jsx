'use client';
import React, { useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Ph, PriceEl, FocusSheet, useBrowseCart } from './browseKit';

/* عرض «شبكة الخلط»: المنتجات عايمة في شبكة، وزر «اخلط» بيعيد ترتيبها بحركة سلسة.
   ضغطة على أي منتج بتفتحه في العرض المركّز مع المقاسات والإضافة للسلة. */

function shuffled(a) {
  const r = [...a];
  for (let i = r.length - 1; i > 0; i -= 1) { const j = Math.floor(Math.random() * (i + 1)); [r[i], r[j]] = [r[j], r[i]]; }
  return r;
}

export default function ShuffleView({ list = [] }) {
  const cart = useBrowseCart();
  const [order, setOrder] = useState(() => list.map((p) => p.id));
  const [focusI, setFocusI] = useState(-1);
  const wrap = useRef(null);
  const rects = useRef(null);

  const byId = useMemo(() => { const m = new Map(); list.forEach((p) => m.set(p.id, p)); return m; }, [list]);
  const items = order.map((id) => byId.get(id)).filter(Boolean);

  const shuffle = () => {
    const el = wrap.current;
    if (el && !cart.reduce()) { const m = new Map(); el.querySelectorAll('[data-id]').forEach((k) => m.set(k.dataset.id, k.getBoundingClientRect())); rects.current = m; }
    setOrder((o) => shuffled(o));
  };

  useLayoutEffect(() => {
    const m = rects.current; const el = wrap.current;
    if (!m || !el) return;
    rects.current = null;
    el.querySelectorAll('[data-id]').forEach((k, i) => {
      const a = m.get(k.dataset.id); if (!a || !k.animate) return;
      const b = k.getBoundingClientRect();
      const dx = a.left - b.left; const dy = a.top - b.top;
      if (!dx && !dy) return;
      k.animate([{ transform: `translate(${dx}px,${dy}px) scale(.92)` }, { transform: 'none' }], { duration: 620 + (i % 5) * 40, easing: 'cubic-bezier(.2,.8,.2,1)' });
    });
  }, [order]);

  if (!list.length) return <div className="empty">لا توجد منتجات مطابقة</div>;
  return (
    <div className="sh2">
      <div className="sh2-bar"><button type="button" className="sh2-btn" onClick={shuffle}>🔀 اخلط المنتجات</button><span className="num">{items.length}</span></div>
      <div className="sh2-grid" ref={wrap}>
        {items.map((p, i) => (
          <button key={p.id} type="button" data-id={p.id} className="sh2-it" style={{ '--dl': `${(i % 7) * -0.7}s`, '--du': `${4.6 + (i % 4) * 0.5}s` }} aria-label={p.title} onClick={() => setFocusI(i)}>
            <span className="sh2-pic">{p.images[0] ? <img src={p.images[0]} alt="" loading="lazy" decoding="async" draggable="false" /> : <Ph p={p} />}</span>
            <span className="sh2-nm">{p.title}</span>
            <PriceEl p={p} cur={cart.cur} />
          </button>
        ))}
      </div>
      {focusI >= 0 && <FocusSheet list={items} idx={Math.min(focusI, items.length - 1)} onGo={(i) => setFocusI(Math.max(0, Math.min(items.length - 1, i)))} onClose={() => setFocusI(-1)} cart={cart} />}
    </div>
  );
}
