'use client';
import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useShop } from './StoreContext';
import { money } from '../../lib/storeKit';

/* سلة جانبية: تُفتح بحدث 'spike:cart-open' (بعد "أضف للسلة" أو الضغط على أيقونة السلة) */
export default function MiniCart() {
  const { cfg, cur, base, cart, setQty, remove } = useShop();
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
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', k); document.body.style.overflow = prev; };
  }, [open]);

  if (!open) return null;
  const sub = cart.reduce((a, i) => a + (Number(i.price) || 0) * (Number(i.qty) || 0), 0);
  const free = Number(cfg.shipping?.free_over) || 0;
  const showP = free > 0 && cfg.shipping?.show_progress !== false;
  const left = Math.max(0, free - sub);
  const pct = free ? Math.min(100, (sub / free) * 100) : 0;

  return (
    <div className="mc-wrap" role="dialog" aria-modal="true" aria-label="السلة">
      <div className="mc-scrim" onClick={() => setOpen(false)} />
      <aside className="mc">
        <div className="mc-hd"><b>🛒 سلتك</b><button type="button" onClick={() => setOpen(false)} aria-label="إغلاق">✕</button></div>
        {showP && cart.length > 0 && (
          <div className="mc-ship">
            <span>{left > 0 ? <>فاضل <b className="num">{money(left, cur)}</b> وشحنك يبقى مجاني 🚚</> : <>🎉 مبروك! شحنك مجاني</>}</span>
            <div className="mc-bar"><i style={{ width: `${pct}%` }} /></div>
          </div>
        )}
        <div className="mc-list">
          {cart.length === 0 ? <div className="empty" style={{ padding: '40px 10px' }}><div style={{ fontSize: 44 }}>🛒</div>سلتك فارغة</div> : cart.map((i) => (
            <div className="mc-it" key={i.key}>
              {i.image ? <img src={i.image} alt="" /> : <div className="mc-ph" />}
              <div className="mc-b">
                <Link href={`${base}/p/${i.product_id}`}><b>{i.title}</b></Link>
                {Object.keys(i.options || {}).length ? <small className="mut">{Object.values(i.options).join(' / ')}</small> : null}
                <div className="mc-q">
                  <div className="qty">
                    <button type="button" onClick={() => setQty(i.key, i.qty - 1)} disabled={i.qty <= 1} aria-label="إنقاص">−</button>
                    <span className="num">{i.qty}</span>
                    <button type="button" onClick={() => setQty(i.key, i.qty + 1)} aria-label="زيادة">+</button>
                  </div>
                  <button type="button" className="mc-rm" onClick={() => remove(i.key)}>حذف</button>
                </div>
              </div>
              <b className="num">{money(i.price * i.qty, cur)}</b>
            </div>
          ))}
        </div>
        {cart.length > 0 && (
          <div className="mc-ft">
            <div className="mc-sub"><span>الإجمالي الفرعي</span><b className="num">{money(sub, cur)}</b></div>
            <Link className="b p blk" href={`${base}/cart`}>إتمام الطلب · الدفع عند الاستلام</Link>
            <button type="button" className="b blk" onClick={() => setOpen(false)}>متابعة التسوق</button>
          </div>
        )}
      </aside>
    </div>
  );
}
