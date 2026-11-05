import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { loadStore, getProducts, getCategories } from '../../../../lib/storeData';
import { ProductCard } from '../../../../components/shop/ui';
import BrowseView, { BROWSE_STYLES, pickStyle } from '../../../../components/shop/BrowseView';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'كل المنتجات' };

const SORTS = { new: ['created_at', false, 'الأحدث'], price_asc: ['price', true, 'الأقل سعراً'], price_desc: ['price', false, 'الأعلى سعراً'] };

export default async function ProductsPage({ params, searchParams }) {
  const ctx = await loadStore(params.slug);
  if (!ctx) notFound();
  const { sb, sid, store, cfg } = ctx;
  const base = `/shop/${store.store_slug}`;
  const q = String(searchParams?.q || '').slice(0, 60);
  const cat = String(searchParams?.cat || '').replace(/[^0-9a-zA-Z-]/g, '').slice(0, 40);
  const sort = SORTS[searchParams?.sort] ? searchParams.sort : 'new';
  const dflt = pickStyle(cfg, cat, '');
  const uview = BROWSE_STYLES[searchParams?.view] ? searchParams.view : '';
  const view = uview || dflt;
  const [list, categories] = await Promise.all([
    getProducts(sb, sid, { limit: 120, category: cat || undefined, q: q || undefined, order: SORTS[sort][0], asc: SORTS[sort][1] }),
    getCategories(sb, sid),
  ]);
  const qs = (o) => { const p = new URLSearchParams(); Object.entries({ q, cat, sort, view: uview, ...o }).forEach(([k, v]) => { if (v && !(k === 'sort' && v === 'new')) p.set(k, v); }); const s = p.toString(); return `${base}/products${s ? `?${s}` : ''}`; };

  return (
    <>
    <section className="wrap sec">
      <div className="sh"><h2>{categories.find((c) => c.id === cat)?.name || 'كل المنتجات'}</h2><p>{list.length} منتج</p></div>
      <form action={`${base}/products`} method="get" className="cpn" style={{ marginBottom: 14 }}>
        {cat ? <input type="hidden" name="cat" value={cat} /> : null}
        {sort !== 'new' ? <input type="hidden" name="sort" value={sort} /> : null}
        {uview ? <input type="hidden" name="view" value={uview} /> : null}
        <input className="in" name="q" defaultValue={q} placeholder="ابحث عن منتج..." />
        <button className="b p" type="submit">بحث</button>
      </form>
      {categories.length > 0 && (
        <div className="tabs">
          <Link className={'chip' + (!cat ? ' act' : '')} href={qs({ cat: '', view: '' })}>الكل</Link>
          {categories.map((c) => <Link key={c.id} className={'chip' + (cat === c.id ? ' act' : '')} href={qs({ cat: c.id, view: '' })}>{c.name}</Link>)}
        </div>
      )}
      <div className="tabs">
        {Object.entries(SORTS).map(([k, v]) => <Link key={k} className={'chip' + (sort === k ? ' act' : '')} href={qs({ sort: k })}>{v[2]}</Link>)}
      </div>
      <div className="tabs">
        {Object.entries(BROWSE_STYLES).map(([k, t]) => <Link key={k} className={'chip' + (view === k ? ' act' : '')} href={qs({ view: k })}>{t}</Link>)}
      </div>
    </section>
    <BrowseView key={`${view}|${cat}|${sort}|${q}`} style={view} list={list} />
    </>
  );
}
