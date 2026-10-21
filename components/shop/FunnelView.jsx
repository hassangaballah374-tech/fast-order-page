'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useShop } from './StoreContext';
import { track } from './tracker';
import Checkout from './Checkout';
import { soldOut } from './ui';
import { money, effectivePrice, saleActive } from '../../lib/storeKit';

function ytId(u) {
  const m = String(u || '').match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : '';
}

function Countdown({ slug, minutes }) {
  const key = `spike_cd_${slug}`;
  const [left, setLeft] = useState(null);
  useEffect(() => {
    let end;
    try { end = Number(sessionStorage.getItem(key)); } catch { /* تجاهل */ }
    if (!end || end < Date.now() - 1) { end = Date.now() + minutes * 60000; try { sessionStorage.setItem(key, String(end)); } catch { /* تجاهل */ } }
    const tick = () => setLeft(Math.max(0, end - Date.now()));
    tick();
    const t = setInterval(tick, 1000);
    return () => clearInterval(t);
  }, [key, minutes]);
  if (left === null) return null;
  const s = Math.floor(left / 1000);
  const p = (n) => String(n).padStart(2, '0');
  return (
    <div style={{ textAlign: 'center', margin: '14px 0' }}>
      <div className="mut" style={{ marginBottom: 4 }}>{left > 0 ? 'ينتهي العرض خلال' : 'انتهى العرض'}</div>
      <b className="num" style={{ fontSize: 30, letterSpacing: 2 }}>{p(Math.floor(s / 3600))}:{p(Math.floor((s % 3600) / 60))}:{p(s % 60)}</b>
    </div>
  );
}

/* صفحة هبوط Funnel: عنوان + فيديو + نقاط + عدّاد + نموذج الطلب */
export default function FunnelView({ funnel: fn, product: p }) {
  const { slug, cur } = useShop();
  const [opts, setOpts] = useState({});
  const [qty, setQty] = useState(1);
  const sold = soldOut(p);
  const price = effectivePrice(p);
  const onSale = saleActive(p) && p.compare_price > price;
  const groups = p.variants || [];
  const optsOk = groups.every((g) => opts[g.name]);
  const vid = ytId(fn.video_url);
  const item = useMemo(() => ({ key: p.id, product_id: p.id, title: p.title, image: p.images[0] || '', price, qty, options: opts }), [p.id, qty, opts, price]);

  useEffect(() => { track('ViewContent', { value: price, items: [{ id: p.id, title: p.title, price, qty: 1 }] }); }, [p.id]);

  return (
    <div className="wrap" style={{ maxWidth: 640 }}>
      <div style={{ textAlign: 'center', margin: '18px 0' }}>
        {fn.headline ? <h1 style={{ marginBottom: 8 }}>{fn.headline}</h1> : <h1>{p.title}</h1>}
        {fn.subheadline ? <p className="mut">{fn.subheadline}</p> : null}
      </div>

      {vid ? (
        <div style={{ position: 'relative', paddingTop: '56.25%', borderRadius: 14, overflow: 'hidden', marginBottom: 14 }}>
          <iframe src={`https://www.youtube.com/embed/${vid}`} title={fn.headline || p.title} allow="accelerometer; encrypted-media; picture-in-picture" allowFullScreen style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', border: 0 }} />
        </div>
      ) : p.images[0] ? (
        <img src={p.images[0]} alt={p.title} style={{ width: '100%', borderRadius: 14, marginBottom: 14 }} />
      ) : null}

      {fn.bullets.length > 0 && (
        <ul style={{ listStyle: 'none', padding: 0, margin: '0 0 14px', display: 'grid', gap: 8 }}>
          {fn.bullets.map((b, i) => <li key={i} style={{ display: 'flex', gap: 8 }}><span style={{ color: 'var(--brand, #16a34a)' }}>✔</span><span>{b}</span></li>)}
        </ul>
      )}

      <div className="price" style={{ justifyContent: 'center' }}>
        <b className="num">{money(price, cur)}</b>
        {onSale && <><span className="old num">{money(p.compare_price, cur)}</span><span className="save">وفّر {Math.round((1 - price / p.compare_price) * 100)}%</span></>}
      </div>

      {fn.countdown_minutes > 0 ? <Countdown slug={`${slug}_${fn.slug}`} minutes={fn.countdown_minutes} /> : null}

      {sold ? <div className="err">نفدت الكمية حالياً</div> : (
        <div id="checkout" style={{ marginTop: 10 }}>
          {groups.map((g) => (
            <div className="opt" key={g.name}>
              <b>{g.name}</b>
              <div className="chips">{g.values.map((v) => <button type="button" key={v} className={'chip' + (opts[g.name] === v ? ' act' : '')} onClick={() => setOpts({ ...opts, [g.name]: v })}>{v}</button>)}</div>
            </div>
          ))}
          <div className="qty" style={{ margin: '10px 0' }}>
            <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="إنقاص">−</button>
            <span className="num">{qty}</span>
            <button type="button" onClick={() => setQty(Math.min(50, qty + 1))} aria-label="زيادة">+</button>
          </div>
          {!optsOk ? <div className="err" style={{ marginBottom: 10 }}>اختر {groups.filter((g) => !opts[g.name]).map((g) => g.name).join(' و ')} لإتمام الطلب</div> : null}
          <Checkout items={optsOk ? [item] : []} bump={null} funnel={fn.slug} buttonText={fn.cta_text || undefined} title="اطلب الآن · الدفع عند الاستلام" />
        </div>
      )}
    </div>
  );
}
