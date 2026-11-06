import React from 'react';
import { notFound } from 'next/navigation';
import { loadStore, getProducts } from '../../../../lib/storeData';
import { liveLooks } from '../../../../lib/looks';
import LooksView from '../../../../components/shop/LooksView';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'تسوّق الإطلالة' };

export default async function LooksPage({ params }) {
  const ctx = await loadStore(params.slug);
  if (!ctx) notFound();
  const { sb, sid, cfg } = ctx;
  const products = await getProducts(sb, sid, { limit: 200 });
  const looks = liveLooks(cfg, products);
  if (!looks.length) {
    return <div className="wrap empty"><div style={{ fontSize: 48 }}>👗</div><h2>الإطلالات قادمة قريباً</h2></div>;
  }
  return <div className="wrap sec"><LooksView looks={looks} title={cfg.looks?.title || 'تسوّق الإطلالة'} /></div>;
}
