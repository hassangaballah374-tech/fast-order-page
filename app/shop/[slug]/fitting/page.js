import React from 'react';
import { notFound } from 'next/navigation';
import { loadStore, getProducts } from '../../../../lib/storeData';
import { fittingReady } from '../../../../lib/fitting';
import FittingRoom from '../../../../components/shop/FittingRoom';
import { getT } from '../../../../lib/i18n/server';

export const dynamic = 'force-dynamic';
export function generateMetadata() {
  return { title: getT().T('غرفة القياس')  };
}

export default async function FittingPage({ params }) {
  const { T } = getT();
  const ctx = await loadStore(params.slug);
  if (!ctx) notFound();
  const { sb, sid, cfg } = ctx;
  const products = await getProducts(sb, sid, { limit: 200 });
  const data = fittingReady(cfg, products);
  if (!data) return <div className="wrap empty"><div style={{ fontSize: 48 }}>🪞</div><h2>{T('غرفة القياس قريباً')}</h2></div>;
  return <div className="wrap sec"><FittingRoom data={data} /></div>;
}
