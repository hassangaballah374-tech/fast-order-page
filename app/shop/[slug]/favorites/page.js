import React from 'react';
import { notFound } from 'next/navigation';
import { loadStore, getProducts } from '../../../../lib/storeData';
import FavoritesView from '../../../../components/shop/FavoritesView';
import { getT } from '../../../../lib/i18n/server';

export const dynamic = 'force-dynamic';

export function generateMetadata() {
  return { title: getT().T('المفضلة')  };
}

export default async function FavoritesPage({ params }) {
  const { T } = getT();
  const ctx = await loadStore(params.slug);
  if (!ctx) notFound();
  const { sb, sid } = ctx;
  const catalog = await getProducts(sb, sid, { limit: 200 });
  return <FavoritesView catalog={catalog} />;
}
