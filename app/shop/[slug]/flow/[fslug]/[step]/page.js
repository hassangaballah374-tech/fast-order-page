import React from 'react';
import { notFound } from 'next/navigation';
import { loadStore, getFlow, getFunnel, getProduct } from '../../../../../../lib/storeData';
import { OFFER_TYPES } from '../../../../../../lib/flowKit';
import LandingView from '../../../../../../components/shop/LandingView';
import UpsellView from '../../../../../../components/shop/UpsellView';
import ThankYouView from '../../../../../../components/shop/ThankYouView';

export const dynamic = 'force-dynamic';

async function load(params) {
  const ctx = await loadStore(params.slug);
  if (!ctx) return null;
  const flow = await getFlow(ctx.sb, ctx.sid, params.fslug);
  const step = flow?.steps.find((s) => s.id === params.step);
  if (!flow || !step) return null;
  return { ctx, flow, step };
}

export async function generateMetadata({ params }) {
  const d = await load(params);
  if (!d) return {};
  const { ctx, step } = d;
  if (step.type === 'landing' || step.type === 'page') {
    const f = await getFunnel(ctx.sb, ctx.sid, step.page);
    const seo = f?.seo || {};
    return {
      title: seo.title || f?.headline || f?.name,
      description: seo.description || f?.subheadline || undefined,
      openGraph: seo.image ? { images: [seo.image] } : undefined,
      robots: seo.noindex ? { index: false, follow: false } : undefined,
    };
  }
  return { title: step.type === 'thanks' ? 'تم استلام طلبك' : (step.headline || 'عرض خاص'), robots: { index: false, follow: false } };
}

export default async function FlowStepPage({ params }) {
  const d = await load(params);
  if (!d) notFound();
  const { ctx, flow, step } = d;
  const pub = { slug: flow.slug, steps: flow.steps.map((s) => ({ id: s.id, type: s.type })), step: step.id, type: step.type };

  if (step.type === 'landing' || step.type === 'page') {
    const f = await getFunnel(ctx.sb, ctx.sid, step.page);
    if (!f || !f.product_id) notFound();
    const p = await getProduct(ctx.sb, ctx.sid, String(f.product_id));
    if (!p) notFound();
    const funnel = {
      slug: f.slug, name: f.name, headline: f.headline || '', subheadline: f.subheadline || '',
      bullets: Array.isArray(f.bullets) ? f.bullets.map(String).filter(Boolean) : [],
      video_url: f.video_url || '', countdown_minutes: Number(f.countdown_minutes) || 0, cta_text: f.cta_text || '',
      sections: Array.isArray(f.sections) ? f.sections : [], theme: f.theme || {}, settings: f.settings || {},
    };
    return <LandingView funnel={funnel} product={p} flow={pub} />;
  }
  if (OFFER_TYPES.includes(step.type)) {
    const p = await getProduct(ctx.sb, ctx.sid, String(step.product_id));
    if (!p) notFound();
    return <UpsellView flow={pub} step={step} product={p} />;
  }
  return <ThankYouView flow={pub} />;
}
