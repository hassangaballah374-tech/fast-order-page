import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { loadStore, getProducts } from '../../../../lib/storeData';
import { effectivePrice, money, waLink, normalizePhone, isValidEgPhone } from '../../../../lib/storeKit';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'الكتالوج' };

export default async function CatalogPage({ params }) {
  const ctx = await loadStore(params.slug);
  if (!ctx) notFound();
  const { sb, sid, cfg, store } = ctx;
  const base = `/shop/${store.store_slug}`;
  const cat = cfg.catalog || {};
  const cur = cfg.currency || 'ج.م';
  const list = await getProducts(sb, sid, { limit: 300 });
  const wa = normalizePhone(cfg.contact.whatsapp);
  const waOk = cat.wa_button && isValidEgPhone(wa);

  return (
    <section className="wrap sec">
      <div className="sh"><h2>{cat.title || 'كتالوج المنتجات'}</h2><p>{list.length} منتج</p></div>
      {list.length === 0 ? <div className="empty">لا توجد منتجات بعد</div> : (
        <div style={{ display: 'grid', gap: 10 }}>
          {list.map((p) => (
            <div className="ci" key={p.id}>
              {p.images[0] ? <img src={p.images[0]} alt={p.title} loading="lazy" /> : <div style={{ width: 70, height: 70, borderRadius: 12, background: 'var(--ln)' }} />}
              <div className="ci-b">
                <Link href={`${base}/p/${p.id}`}><b>{p.title}</b></Link>
                {cat.show_prices !== false ? <span className="num" style={{ color: 'var(--c)', fontWeight: 800 }}>{money(effectivePrice(p), cur)}</span> : null}
              </div>
              {waOk ? <a className="b wa sm" target="_blank" rel="noopener noreferrer" href={waLink(wa, `أريد طلب: ${p.title}`)}>اطلب واتساب</a> : <Link className="b p sm" href={`${base}/p/${p.id}`}>التفاصيل</Link>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
