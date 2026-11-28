'use client';
import { useT } from '../I18n';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useShop, hit } from './StoreContext';
import { track } from './tracker';
import { money } from '../../lib/storeKit';
import { lockScroll, unlockIfIdle } from './scrollLock';

/* سلة جانبية: تُفتح بحدث 'spike:cart-open' (بعد "أضف للسلة" أو الضغط على أيقونة السلة) */
export default function MiniCart() {
  const tx = useT();
  const { slug, cfg, cur, base, cart, setQty, remove, add } = useShop();
  const [recs, setRecs] = useState([]);
  const [open, setOpen] = useState(false);
  const path = usePathname();

  useEffect(() => {
    const o = () => setOpen(true);
    window.addEventListener('spike:cart-open', o);
    return () => window.removeEventListener('spike:cart-open', o);
  }, []);
  useEffect(() => { setOpen(false); }, [path]);
  useEffect(() => {
    if (!open) return undefined;
    const k = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', k);
    const unlock = lockScroll();
    return () => { document.removeEventListener('keydown', k); unlock(); };
  }, [open]);
  useEffect(() => { unlockIfIdle(); }, [path]);

  /* «قد يعجبك»: بنجيبها مرة لما السلة تتفتح (ومش بتتغير وانت بتضيف عشان ما تتلخبطش) */
  useEffect(() => {
    if (!open || cfg.cart?.recs === false) return;
    const ids = [...new Set(cart.map((i) => String(i.product_id)))];
    fetch('/api/store/suggest', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug, recs: ids }) })
      .then((r) => r.json()).then((j) => setRecs(Array.isArray(j.items) ? j.items : [])).catch(() => setRecs([]));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!open) return null;
  const addRec = (p) => {
    add({ product_id: p.id, title: p.title, image: p.image, price: p.price, qty: 1, options: {} });
    track('AddToCart', { value: p.price, items: [{ id: p.id, title: p.title, price: p.price, qty: 1 }] });
    hit(slug, 'cart', { product: String(p.id) });
  };
  const inCart = new Set(cart.map((i) => String(i.product_id)));
  const sugg = recs.filter((p) => !inCart.has(String(p.id))).slice(0, 4);
  const sub = cart.reduce((a, i) => a + (Number(i.price) || 0) * (Number(i.qty) || 0), 0);
  const free = Number(cfg.shipping?.free_over) || 0;
  const showP = free > 0 && cfg.shipping?.show_progress !== false;
  const left = Math.max(0, free - sub);
  const pct = free ? Math.min(100, (sub / free) * 100) : 0;

  return (
    <div className="mc-wrap" role="dialog" aria-modal="true" aria-label={tx('السلة')}>
      <div className="mc-scrim" onClick={() => setOpen(false)} />
      <aside className="mc">
        <div className="mc-hd"><b>{tx('🛒 سلتك')}</b><button type="button" onClick={() => setOpen(false)} aria-label={tx('إغلاق')}>✕</button></div>
        {showP && cart.length > 0 && (
          <div className="mc-ship">
            <span>{left > 0 ? <>{tx('فاضل')} <b className="num">{money(left, cur)}</b> {tx('وشحنك يبقى مجاني 🚚')}</> : <>{tx('🎉 مبروك! شحنك مجاني')}</>}</span>
            <div className="mc-bar"><i style={{ width: `${pct}%` }} /></div>
          </div>
        )}
        <div className="mc-list">
          {cart.length === 0 ? <div className="empty" style={{ padding: '40px 10px' }}><div style={{ fontSize: 44 }}>🛒</div>{tx('سلتك فارغة')}</div> : cart.map((i) => (
            <div className="mc-it" key={i.key}>
              {i.image ? <img src={i.image} alt="" /> : <div className="mc-ph" />}
              <div className="mc-b">
                <Link href={`${base}/p/${i.product_id}`}><b>{i.title}</b></Link>
                {Object.keys(i.options || {}).length ? <small className="mut">{Object.values(i.options).join(' / ')}</small> : null}
                <div className="mc-q">
                  <div className="qty">
                    <button type="button" onClick={() => setQty(i.key, i.qty - 1)} disabled={i.qty <= 1} aria-label={tx('إنقاص')}>−</button>
                    <span className="num">{i.qty}</span>
                    <button type="button" onClick={() => setQty(i.key, i.qty + 1)} aria-label={tx('زيادة')}>+</button>
                  </div>
                  <button type="button" className="mc-rm" onClick={() => remove(i.key)}>{tx('حذف')}</button>
                </div>
              </div>
              <b className="num">{money(i.price * i.qty, cur)}</b>
            </div>
          ))}
        </div>
        {cart.length > 0 && sugg.length > 0 && (
          <div className="mc-rec">
            <b className="mc-rh">{tx('قد يعجبك')}</b>
            <div className="mc-rl">
              {sugg.map((p) => (
                <div className="mc-rc" key={p.id}>
                  <Link href={`${base}/p/${p.id}`} className="mc-ri">{p.image ? <img src={p.image} alt="" loading="lazy" /> : null}</Link>
                  <Link href={`${base}/p/${p.id}`} className="mc-rt">{p.title}</Link>
                  <span className="num mc-rp">{money(p.price, cur)}</span>
                  {p.needs
                    ? <Link href={`${base}/p/${p.id}`} className="mc-ra">{tx('اختر المقاس')}</Link>
                    : <button type="button" className="mc-ra" onClick={() => addRec(p)}>{tx('+ أضف')}</button>}
                </div>
              ))}
            </div>
          </div>
        )}
        {cart.length > 0 && (
          <div className="mc-ft">
            <div className="mc-sub"><span>{tx('الإجمالي الفرعي')}</span><b className="num">{money(sub, cur)}</b></div>
            <Link className="b p blk" href={`${base}/cart`}>{tx('إتمام الطلب · الدفع عند الاستلام')}</Link>
            <button type="button" className="b blk" onClick={() => setOpen(false)}>{tx('متابعة التسوق')}</button>
          </div>
        )}
      </aside>
    </div>
  );
}
