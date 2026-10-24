import React from 'react';
import { notFound } from 'next/navigation';
import { loadStore, getProducts } from '../../../../lib/storeData';
import FavoritesView from '../../../../components/shop/FavoritesView';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'المفضلة' };

export default async function FavoritesPage({ params }) {
  const ctx = await loadStore(params.slug);
  if (!ctx) notFound();
  const { sb, sid } = ctx;
  const catalog = await getProducts(sb, sid, { limit: 200 });
  return <FavoritesView catalog={catalog} />;
