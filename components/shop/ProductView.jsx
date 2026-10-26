'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useShop, hit } from './StoreContext';
import { track } from './tracker';
import { useFavs, pushViewed, readViewed } from './favs';
import Checkout from './Checkout';
import { Stars, ProductCard, Blocks, soldOut } from './ui';
import { money, effectivePrice, saleActive, applyOffer, waLink, normalizePhone, isValidEgPhone } from '../../lib/storeKit';

function ReviewForm({ productId }) {
  const { slug } = useShop();
  const [f, setF] = useState({ name: '', rating: 5, comment: '' });
  const [hp, setHp] = useState('');
  const [st, setSt] = useState({ busy: false, msg: '', ok: false });
  const send = async (e) => {
    e.preventDefault();
    if (f.name.trim().length < 2) { setSt({ busy: false, msg: 'اكتب اسمك', ok: false }); return; }
    setSt({ busy: true, msg: '', ok: false });
    try {
      const r = await fetch('/api/store/review', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug, product_id: productId, ...f, hp }) });
      const j = await r.json();
      if (j.ok) { setSt({ busy: false, msg: 'شكراً! سيظهر تقييمك بعد المراجعة 💚', ok: true }); setF({ name: '', rating: 5, comment: '' }); } else setSt({ busy: false, msg: j.error || 'تعذر إرسال التقييم', ok: false });
    } catch { setSt({ busy: false, msg: 'تعذر الاتصال', ok: false }); }
  };
  return (
    <form className="frm" onSubmit={send} style={{ marginTop: 14 }}>
      <h3>أضف تقييمك</h3>
      <div className="r2">
        <div className="fld"><label>الاسم</label><input className="in" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></div>
        <div className="fld"><label>التقييم</label>
          <select className="in" value={f.rating} onChange={(e) => setF({ ...f, rating: Number(e.target.value) })}>
            {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{'★'.repeat(n)}</option>)}
          </select>
        </div>
      </div>
      <div className="fld"><label>رأيك</label><input className="in" value={f.comment} onChange={(e) => setF({ ...f, comment: e.target.value })} /></div>
      <input className="hp" tabIndex={-1} autoComplete="off" aria-hidden="true" value={hp} onChange={(e) => setHp(e.target.value)} />
      {st.msg ? <div className={st.ok ? 'okm' : 'err'}>{st.msg}</div> : null}
      <button className="b p" type="submit" disabled={st.busy}>{st.busy ? '...' : 'إرسال التقييم'}</button>
    </form>
  );
}

export default function ProductView({ product: p, catalog = [], reviews = [], stats = { count: 0, avg: 0 }, blocks = [] }) {
  const { slug, cfg, cur, base, add, setBump: saveBump } = useShop();
  const router = useRouter();
  const [img, setImg] = useState(0);
  const [opts, setOpts] = useState({});
  const [qty, setQty] = useState(1);
  const [bumpOn, setBumpOn] = useState(false);
  const [msg, setMsg] = useState('');
  const sold = soldOut(p);
  const price = effectivePrice(p);
  const onSale = saleActive(p) && p.compare_price > price;
  const maxQty = p.track_stock ? Math.max(1, Math.min(50, p.stock_quantity)) : 50;
  const groups = p.variants || [];
  const optsOk = groups.every((g) => opts[g.name]);
  const offer = applyOffer(price, qty, p.offers);
  const bumpProd = p.upsell ? catalog.find((x) => x.id === String(p.upsell.product_id) && !soldOut(x)) : null;
  const bumpPct = p.upsell ? Math.min(90, Math.max(0, Number(p.upsell.percent) || 0)) : 0;
  const bumpPrice = bumpProd ? Math.round(effectivePrice(bumpProd) * (1 - bumpPct / 100)) : 0;
  const cross = (cfg.cross?.show_on_product !== false ? (p.cross_sell || []).map((id) => catalog.find((x) => x.id === String(id))).filter(Boolean) : []).slice(0, Number(cfg.cross?.max_items) || 4);
  const wa = normalizePhone(cfg.contact?.whatsapp);
  const waOk = cfg.whatsapp?.enabled && cfg.whatsapp?.show_on_product !== false && isValidEgPhone(wa);
  const scarce = cfg.scarcity?.enabled && p.track_stock && p.stock_quantity > 0 && p.stock_quantity <= (Number(cfg.scarcity.threshold) || 5);
  const item = useMemo(() => ({ key: p.id, product_id: p.id, title: p.title, image: p.images[0] || '', price, qty, options: opts }), [p.id, qty, opts, price]);
  const sent = useRef({ scroll: false });
  const fav = useFavs(slug);
  const [viewed, setViewed] = useState([]);
  useEffect(() => { setViewed(readViewed(slug).filter((x) => x !== p.id)); pushViewed(slug, p.id); }, [slug, p.id]);
  const viewedList = viewed.map((id) => catalog.find((x) => x.id === id)).filter(Boolean).slice(0, 8);

  useEffect(() => {
    track('ViewContent', { value: price, items: [{ id: p.id, title: p.title, price, qty: 1 }] });
    const t = setTimeout(() => track('Time30', {}), 30000);
    const onScroll = () => {
      const h = document.documentElement;
      if (!sent.current.scroll && (window.scrollY + window.innerHeight) / h.scrollHeight >= 0.75) { sent.current.scroll = true; track('Scroll75', {}); }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => { clearTimeout(t); window.removeEventListener('scroll', onScroll); };
  }, [p.id]);

  const toCheckout = () => { document.getElementById('checkout')?.scrollIntoView({ behavior: 'smooth', block: 'center' }); };

  const addToCart = () => {
    setMsg('');
    if (sold) return; 
    if (!optsOk) { setMsg(`اختر ${groups.filter((g) => !opts[g.name]).map((g) => g.name).join(' و ')} أولاً`); return; }
    add({ product_id: p.id, title: p.title, image: p.images[0] || '', price, qty, options: opts });
    saveBump(bumpOn && bumpProd ? { product_id: bumpProd.id } : null);
    track('AddToCart', { value: offer.total, items: [{ id: p.id, title: p.title, price, qty }] });
    hit(slug, 'cart');
    router.push(`${base}/cart`);
  };

  const onePage = cfg.checkout?.one_page !== false;

  return (
    <div className="wrap">
      <Blocks list={blocks.filter((b) => b.placement === 'product_top')} />
      <div className="pv">
        <div className="gal">
          <div className="gal-main">{p.images[img] ? <img src={p.images[img]} alt={p.title} /> : null}</div>
          {p.images.length > 1 && (
          fetchPriority="high" decoding="async"
            <div className="gal-th">{p.images.map((s, i) => <button key={i} type="button" className={i === img ? 'act' : ''} onClick={() => setImg(i)} aria-label={`صورة ${i + 1}`}><img src={s} alt="" loading="lazy" /></button>)}</div>
          )}
        </div>

        <div className="info">
          <h1>{p.title} <button type="button" className={'pc-fav big' + (fav.has(p.id) ? ' on' : '')} aria-label="المفضلة" onClick={() => fav.toggle(p.id)}>{fav.has(p.id) ? '♥' : '♡'}</button></h1>
          {stats.count > 0 && <div><Stars value={stats.avg} /> <span className="mut" style={{ fontSize: 13 }}>({stats.count} تقييم)</span></div>}
          <div className="price">
            <b className="num">{money(price, cur)}</b>
            {onSale && <><span className="old num">{money(p.compare_price, cur)}</span><span className="save">وفّر {Math.round((1 - price / p.compare_price) * 100)}%</span></>}
          </div>
          {sold ? <div className="err">نفدت الكمية حالياً</div> : scarce ? <div className="scar">{String(cfg.scarcity.text || 'باقي {n} قطع فقط!').replace('{n}', p.stock_quantity)}</div> : null}

          {groups.map((g) => (
            <div className="opt" key={g.name}>
              <b>{g.name}</b>
              <div className="chips">{g.values.map((v) => <button type="button" key={v} className={'chip' + (opts[g.name] === v ? ' act' : '')} onClick={() => setOpts({ ...opts, [g.name]: v })}>{v}</button>)}</div>
            </div>
          ))}

          {(p.offers || []).length > 0 && (
            <div className="offers">
              {p.offers.map((o, i) => {
                const r = applyOffer(price, Number(o.qty), [o]);
                return (
                  <button type="button" key={i} className={'offer' + (qty === Number(o.qty) ? ' act' : '')} onClick={() => setQty(Math.min(maxQty, Number(o.qty)))} disabled={Number(o.qty) > maxQty}>
                    <span><b>{o.label}</b><small>{o.qty} قطع</small></span>
                    <b className="num">{money(r.total, cur)}</b>
                  </button>
                );
              })}
            </div>
          )}

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, margin: '12px 0', flexWrap: 'wrap' }}>
            <div className="qty">
              <button type="button" onClick={() => setQty(Math.max(1, qty - 1))} aria-label="إنقاص">−</button>
              <span className="num">{qty}</span>
              <button type="button" onClick={() => setQty(Math.min(maxQty, qty + 1))} aria-label="زيادة">+</button>
            </div>
            <span className="mut">الإجمالي: <b className="num" style={{ color: 'var(--ink)' }}>{money(offer.total, cur)}</b>{offer.saved > 0 ? <span className="okm"> (وفّرت {money(offer.saved, cur)})</span> : null}</span>
          </div>

          {bumpProd && !sold && (
            <label className="bump">
              <input type="checkbox" checked={bumpOn} onChange={(e) => setBumpOn(e.target.checked)} />
              {bumpProd.images[0] ? <img src={bumpProd.images[0]} alt="" /> : null}
              <span><b>{p.upsell.text || `أضف ${bumpProd.title} بخصم ${bumpPct}%`}</b><small>{bumpProd.title} · <span className="num">{money(bumpPrice, cur)}</span></small></span>
            </label>
          )}

          {msg ? <div className="err" style={{ marginBottom: 10 }}>{msg}</div> : null}
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            <button type="button" className="b blk" onClick={addToCart} disabled={sold}>🛒 أضف للسلة</button>
            {waOk ? <a className="b wa blk" target="_blank" rel="noopener noreferrer" href={waLink(wa, `استفسار عن: ${p.title}`)} onClick={() => track('Contact', {})}>💬 اسأل على واتساب</a> : null}
          </div>

          {p.description ? <div style={{ marginTop: 20 }}><h3 style={{ marginBottom: 6 }}>الوصف</h3><p className="desc">{p.description}</p></div> : null}
        </div>
      </div>

      {onePage && !sold && (
        <div style={{ maxWidth: 560, margin: '0 auto 24px' }}>
          {!optsOk ? <div className="err" style={{ marginBottom: 10 }}>اختر {groups.filter((g) => !opts[g.name]).map((g) => g.name).join(' و ')} من الأعلى لإتمام الطلب</div> : null}
          <Checkout items={optsOk ? [item] : []} bump={bumpOn && bumpProd ? { product_id: bumpProd.id } : null} title="اطلب الآن · الدفع عند الاستلام" />
        </div>
      )}
    
      {viewedList.length > 0 && (
        <section className="sec">
          <div className="sh"><h2>شاهدت مؤخراً</h2></div>
          <div className="grid">{viewedList.map((x) => <ProductCard key={x.id} p={x} />)}</div>
        </section>
      )}
      {cross.length > 0 && (
        <section className="sec">
          <div className="sh"><h2>{cfg.cross?.title || 'كمّل طلبك بـ'}</h2></div>
          <div className="grid">{cross.map((x) => <div key={x.id} onClick={() => hit(slug, 'cross')}><ProductCard p={x} /></div>)}</div>
        </section>
      )}

      <section className="sec">
        <div className="sh"><h2>تقييمات العملاء</h2></div>
        {reviews.length ? reviews.map((r) => (
          <div className="rev" key={r.id}><Stars value={r.rating} /> <b>{r.customer_name || 'عميل'}</b>{r.comment ? <p style={{ marginTop: 4 }}>{r.comment}</p> : null}</div>
        )) : <p className="mut">لا توجد تقييمات بعد، كن أول من يقيّم.</p>}
        <ReviewForm productId={p.id} />
      </section>

      <Blocks list={blocks.filter((b) => b.placement === 'product_bottom')} />

      {!sold && (
        <div className="stk">
          <b className="num">{money(offer.total, cur)}</b>
          <button type="button" className="b p" onClick={onePage ? (optsOk ? toCheckout : addToCart) : addToCart}>{onePage ? 'اطلب الآن' : 'أضف للسلة'}</button>
        </div>
      )}
      <div style={{ height: 70 }} className="stk-sp" />
    </div>
  );
}
