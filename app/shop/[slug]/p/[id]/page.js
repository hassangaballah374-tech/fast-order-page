import React from 'react';
import { notFound } from 'next/navigation';
import { loadStore, getProduct, getProducts, getReviews, getRatingStats, getBlocks } from '../../../../../lib/storeData';
import ProductView from '../../../../../components/shop/ProductView';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const ctx = await loadStore(params.slug);
  if (!ctx) return {};
  const p = await getProduct(ctx.sb, ctx.sid, params.id);
  if (!p) return {};
  const desc = (p.description || '').replace(/\s+/g, ' ').slice(0, 160);
  return { title: p.title, description: desc || undefined, openGraph: { title: p.title, description: desc || undefined, images: p.images[0] ? [p.images[0]] : undefined } };
}

export default async function ProductPage({ params }) {
  const ctx = await loadStore(params.slug);
  if (!ctx) notFound();
  const { sb, sid } = ctx;
  const p = await getProduct(sb, sid, params.id);
  if (!p) notFound();
  const wanted = [...(p.cross_sell || []), p.upsell ? p.upsell.product_id : null].filter(Boolean).map(String);
  const [catalog, reviews, stats, blocks] = await Promise.all([
    wanted.length ? getProducts(sb, sid, { ids: wanted, limit: 20, order: null }) : Promise.resolve([]),
    getReviews(sb, sid, { productId: p.id, limit: 30 }),
    getRatingStats(sb, sid, p.id),
    getBlocks(sb, sid),
  ]);
  return <ProductView product={p} catalog={catalog} reviews={reviews} stats={stats} blocks={blocks} />;
}
