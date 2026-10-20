import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { loadStore, getProducts, getCategories } from '../../../../lib/storeData';
import { ProductCard } from '../../../../components/shop/ui';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'كل المنتجات' };

const SORTS = { new: ['created_at', false, 'الأحدث'], price_asc: ['price', true, 'الأقل سعراً'], price_desc: ['price', false, 'الأعلى سعراً'] };

export default async function ProductsPage({ params, searchParams }) {
  const ctx = await loadStore(params.slug);
  if (!ctx) notFound();
  const { sb, sid, store } = ctx;
  const base = `/shop/${store.store_slug}`;
  const q = String(searchParams?.q || '').slice(0, 60);
  const cat = String(searchParams?.cat || '').replace(/[^0-9a-zA-Z-]/g, '').slice(0, 40);
  const sort = SORTS[searchParams?.sort] ? searchParams.sort : 'new';
  const [list, categories] = await Promise.all([
    getProducts(sb, sid, { limit: 120, category: cat || undefined, q: q || undefined, order: SORTS[sort][0], asc: SORTS[sort][1] }),
    getCategories(sb, sid),
  ]);
  const qs = (o) => { const p = new URLSearchParams(); Object.entries({ q, cat, sort, ...o }).forEach(([k, v]) => { if (v && !(k === 'sort' && v === 'new')) p.set(k, v); }); const s = p.toString(); return `${base}/products${s ? `?${s}` : ''}`; };

  return (
    <section className="wrap sec">
      <div className="sh"><h2>{categories.find((c) => c.id === cat)?.name || 'كل المنتجات'}</h2><p>{list.length} منتج</p></div>
      <form action={`${base}/products`} method="get" className="cpn" style={{ marginBottom: 14 }}>
        {cat ? <input type="hidden" name="cat" value={cat} /> : null}
        {sort !== 'new' ? <input type="hidden" name="sort" value={sort} /> : null}
        <input className="in" name="q" defaultValue={q} placeholder="ابحث عن منتج..." />
        <button className="b p" type="submit">بحث</button>
      </form>
      {categories.length > 0 && (
        <div className="tabs">
          <Link className={'chip' + (!cat ? ' act' : '')} href={qs({ cat: '' })}>الكل</Link>
          {categories.map((c) => <Link key={c.id} className={'chip' + (cat === c.id ? ' act' : '')} href={qs({ cat: c.id })}>{c.name}</Link>)}
        </div>
      )}
      <div className="tabs">
        {Object.entries(SORTS).map(([k, v]) => <Link key={k} className={'chip' + (sort === k ? ' act' : '')} href={qs({ sort: k })}>{v[2]}</Link>)}
      </div>
      {list.length ? <div className="grid">{list.map((p) => <ProductCard key={p.id} p={p} />)}</div> : <div className="empty">لا توجد منتجات مطابقة</div>}
    </section>
  );
}
