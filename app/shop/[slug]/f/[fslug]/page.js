import React from 'react';
import { notFound } from 'next/navigation';
import { loadStore, getProduct, getFunnel } from '../../../../../lib/storeData';
import LandingView from '../../../../../components/shop/LandingView';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const ctx = await loadStore(params.slug);
  if (!ctx) return {}; 
  const f = await getFunnel(ctx.sb, ctx.sid, params.fslug);
  if (!f) return {};
  const seo = f.seo || {};
  return {
    title: seo.title || f.headline || f.name,
    description: seo.description || f.subheadline || undefined,
    openGraph: seo.image ? { images: [seo.image] } : undefined,
    robots: seo.noindex ? { index: false, follow: false } : undefined,
  };
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
    sections: Array.isArray(f.sections) ? f.sections : [], theme: f.theme || {}, settings: f.settings || {},
  };
  return <LandingView funnel={funnel} product={p} />;
}
