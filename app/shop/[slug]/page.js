import React from 'react';
import { notFound } from 'next/navigation';
import { loadStore, getProducts, getCategories, getReviews, getBlocks, getBestsellerIds } from '../../../lib/storeData';
import HomeSections from '../../../components/shop/HomeSections';

export const dynamic = 'force-dynamic';

export default async function ShopHome({ params }) {
  const ctx = await loadStore(params.slug);
  if (!ctx) notFound();
  const { sb, sid, cfg, store } = ctx;
  const [products, categories, reviews, blocks, bestIds] = await Promise.all([
    getProducts(sb, sid, { limit: 120 }),
    getCategories(sb, sid),
    getReviews(sb, sid, { limit: 20 }),
    getBlocks(sb, sid),
    getBestsellerIds(sb, sid, 12),
  ]);
  return <HomeSections cfg={cfg} base={`/shop/${store.store_slug}`} products={products} categories={categories} reviews={reviews} blocks={blocks} bestIds={bestIds} />;
}
