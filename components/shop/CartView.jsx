'use client';
import { useT } from '../I18n';
import React, { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useShop, hit } from './StoreContext';
import { track } from './tracker';
import Checkout from './Checkout';
import { Blocks, soldOut } from './ui';
import { money, effectivePrice } from '../../lib/storeKit';

export default function CartView({ catalog = [], blocks = [] }) {
  const tx = useT();
  const { slug, cfg, cur, base, cart, ready, setQty, remove, add, bump, setBump } = useShop();
  const byId = useMemo(() => new Map(catalog.map((p) => [p.id, p])), [catalog]);
  const inCart = new Set(cart.map((i) => i.product_id));

  const host = cart.map((i) => byId.get(i.product_id)).find((p) => p?.upsell && byId.get(String(p.upsell.product_id)) && !soldOut(byId.get(String(p.upsell.product_id))) && !inCart.has(String(p.upsell.product_id)));
  const bumpProd = host ? byId.get(String(host.upsell.product_id)) : null;
  const bumpPct = host ? Math.min(90, Math.max(0, Number(host.upsell.percent) || 0)) : 0;
  const activeBump = bumpProd && bump?.product_id === bumpProd.id ? { product_id: bumpProd.id } : null;

  useEffect(() => { if (bump && !activeBump && ready) setBump(null); }, [ready, !!activeBump]);

  const cross = cfg.cross?.show_in_cart !== false
    ? [...new Set(cart.flatMap((i) => byId.get(i.product_id)?.cross_sell || []))].map((id) => byId.get(String(id))).filter((p) => p && !inCart.has(p.id) && !soldOut(p)).slice(0, Number(cfg.cross?.max_items) || 4)
    : [];

  if (!ready) return <div className="wrap empty">...</div>;
  if (!cart.length) {
    return (
      <div className="wrap empty">
        <div style={{ fontSize: 56 }}>🛒</div>
        <h2>{tx('سلتك فارغة')}</h2>
        <p className="mut" style={{ margin: '8px 0 16px' }}>{tx('ابدأ بإضافة منتجات من المتجر')}</p>
        <Link className="b p" href={`${base}/products`}>{tx('تصفح المنتجات')}</Link>
      </div>
    );
  }

  const quick = (p) => {
    add({ product_id: p.id, title: p.title, image: p.images[0] || '', price: effectivePrice(p), qty: 1, options: {} });
    track('AddToCart', { value: effectivePrice(p), items: [{ id: p.id, title: p.title, price: effectivePrice(p), qty: 1 }] });
    hit(slug, 'cross');
  };

  return (
    <div className="wrap">
      <Blocks list={blocks.filter((b) => b.placement === 'checkout_top')} />
      <div className="sh" style={{ marginTop: 22 }}><h2>{tx('سلة المشتريات')}</h2></div>
      <div className="cl">
        <div>
          {cart.map((i) => (
            <div className="ci" key={i.key}>
              {i.image ? <img src={i.image} alt="" /> : <div style={{ width: 70, height: 70, borderRadius: 12, background: 'var(--ln)' }} />}
              <div className="ci-b">
                <Link href={`${base}/p/${i.product_id}`}><b>{i.title}</b></Link>
                {Object.keys(i.options || {}).length ? <span className="mut" style={{ fontSize: 13 }}>{Object.values(i.options).join(' / ')}</span> : null}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 6 }}>
                  <div className="qty">
                    <button type="button" onClick={() => setQty(i.key, i.qty - 1)} disabled={i.qty <= 1} aria-label={tx('إنقاص')}>−</button>
                    <span className="num">{i.qty}</span>
                    <button type="button" onClick={() => setQty(i.key, i.qty + 1)} aria-label={tx('زيادة')}>+</button>
                  </div>
                  <button type="button" className="b sm" onClick={() => remove(i.key)}>{tx('حذف')}</button>
                </div>
              </div>
              <b className="num">{money(i.price * i.qty, cur)}</b>
            </div>
          ))}

          {bumpProd && (
            <label className="bump">
              <input type="checkbox" checked={!!activeBump} onChange={(e) => setBump(e.target.checked ? { product_id: bumpProd.id } : null)} />
              {bumpProd.images[0] ? <img src={bumpProd.images[0]} alt="" /> : null}
              <span><b>{host.upsell.text || tx('أضف {1} بخصم {2}%', [bumpProd.title, bumpPct])}</b><small>{bumpProd.title} · <span className="num">{money(Math.round(effectivePrice(bumpProd) * (1 - bumpPct / 100)), cur)}</span></small></span>
            </label>
          )}

          {cross.length > 0 && (
            <div style={{ marginTop: 18 }}>
              <h3 style={{ marginBottom: 8 }}>{tx(cfg.cross?.title || 'كمّل طلبك بـ')}</h3>
              {cross.map((p) => (
                <div className="ci" key={p.id}>
                  {p.images[0] ? <img src={p.images[0]} alt="" /> : null}
                  <div className="ci-b"><Link href={`${base}/p/${p.id}`}><b>{p.title}</b></Link><span className="num" style={{ color: 'var(--c)', fontWeight: 800 }}>{money(effectivePrice(p), cur)}</span></div>
                  {(p.variants || []).length ? <Link className="b sm" href={`${base}/p/${p.id}`}>{tx('اختر')}</Link> : <button type="button" className="b p sm" onClick={() => quick(p)}>{tx('+ أضف')}</button>}
                </div>
              ))}
            </div>
          )}
        </div>
        <Checkout items={cart} bump={activeBump} />
      </div>
    </div>
  );
}
