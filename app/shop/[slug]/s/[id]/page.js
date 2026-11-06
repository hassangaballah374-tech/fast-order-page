import React from 'react';
import { notFound } from 'next/navigation';
import { loadStore, getProducts } from '../../../../../lib/storeData';
import { showcaseProducts } from '../../../../../lib/showcases';
import BrowseView from '../../../../../components/shop/BrowseView';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  return { title: 'تشكيلة' };
}

export default async function ShowcasePage({ params }) {
  const ctx = await loadStore(params.slug);
  if (!ctx) notFound();
  const { sb, sid, cfg } = ctx;
  const sc = ((cfg.showcases && cfg.showcases.items) || []).find((x) => x.id === params.id);
  if (!sc) notFound();
  const products = await getProducts(sb, sid, { limit: 200 });
  const list = showcaseProducts(sc, products);
  return (
    <>
      <div className="wrap sec"><div className="sh"><h2>{sc.name}</h2>{sc.subtitle ? <p className="mut">{sc.subtitle}</p> : null}</div></div>
      <BrowseView style={sc.style} list={list} />
    </>
  );
}
