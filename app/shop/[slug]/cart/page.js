import React from 'react';
import { notFound } from 'next/navigation';
import { loadStore, getProducts, getBlocks } from '../../../../lib/storeData';
import CartView from '../../../../components/shop/CartView';
import { getT } from '../../../../lib/i18n/server';

export const dynamic = 'force-dynamic';

export function generateMetadata() {
  return { title: getT().T('السلة')  };
}

export default async function CartPage({ params }) {
  const { T } = getT();
  const ctx = await loadStore(params.slug);
  if (!ctx) notFound();
  const { sb, sid } = ctx;
  const [catalog, blocks] = await Promise.all([getProducts(sb, sid, { limit: 200 }), getBlocks(sb, sid)]);
  return <CartView catalog={catalog} blocks={blocks} />;
}
