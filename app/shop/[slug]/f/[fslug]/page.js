import React from 'react';
import { notFound } from 'next/navigation';
import { loadStore, getProduct, getFunnel } from '../../../../../lib/storeData';
import FunnelView from '../../../../../components/shop/FunnelView';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const ctx = await loadStore(params.slug);
  if (!ctx) return {};
  const f = await getFunnel(ctx.sb, ctx.sid, params.fslug);
  if (!f) return {};
  return { title: f.headline || f.name, description: f.subheadline || undefined };
}

export default async function FunnelPage({ params }) {
  const ctx = await loadStore(params.slug);
  if (!ctx) notFound();
  const f = await getFunnel(ctx.sb, ctx.sid, params.fslug);
  if (!f || !f.product_id) notFound();
  const p = await getProduct(ctx.sb, ctx.sid, String(f.product_id));
  if (!p) notFound();
  const funnel = {
    slug: f.slug, name: f.name, headline: f.headline || '', subheadline: f.subheadline || '',
    bullets: Array.isArray(f.bullets) ? f.bullets.map(String).filter(Boolean) : [],
    video_url: f.video_url || '', countdown_minutes: Number(f.countdown_minutes) || 0, cta_text: f.cta_text || '',
  };
  return <FunnelView funnel={funnel} product={p} />;
}
