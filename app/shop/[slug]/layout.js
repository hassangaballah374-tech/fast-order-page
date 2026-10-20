import React from 'react';
import { notFound } from 'next/navigation';
import { loadStore, publicCfg, getPages, getCategories, getPixels, getZonesPublic, getBlocks, onColor } from '../../../lib/storeData';
import { themeById, FONTS, GTM_RE } from '../../../lib/storeKit';
import { SHOP_CSS } from '../../../components/shop/style';
import { StoreProvider } from '../../../components/shop/StoreContext';
import Tracker from '../../../components/shop/tracker';
import Shell from '../../../components/shop/Shell';
import { Blocks } from '../../../components/shop/ui';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const ctx = await loadStore(params.slug);
  if (!ctx) return { title: 'المتجر غير موجود' };
  const { store, cfg } = ctx;
  const title = cfg.seo.title || store.store_name || 'متجر';
  const description = cfg.seo.description || cfg.brand.tagline || '';
  const meta = {
    title: { default: title, template: `%s | ${store.store_name || title}` },
    description,
    openGraph: { title, description, type: 'website', locale: 'ar_EG', images: cfg.seo.og_image ? [cfg.seo.og_image] : undefined },
  };
  if (cfg.brand.favicon) meta.icons = { icon: cfg.brand.favicon };
  if (cfg.seo.robots_index === false) meta.robots = { index: false, follow: false };
  if (cfg.tracking.google_site_verification) meta.verification = { google: cfg.tracking.google_site_verification };
  if (cfg.tracking.facebook_domain_verification) meta.other = { 'facebook-domain-verification': cfg.tracking.facebook_domain_verification };
  return meta;
}

export default async function ShopLayout({ children, params }) {
  const ctx = await loadStore(params.slug);
  if (!ctx) notFound();
  const { sb, store, sid, cfg } = ctx;

  const [pages, categories, pixels, zones, blocks] = await Promise.all([
    getPages(sb, sid), getCategories(sb, sid), getPixels(sb, sid), getZonesPublic(sb, sid), getBlocks(sb, sid),
  ]);

  const b = cfg.brand;
  const th = themeById(b.theme);
  const color = /^#[0-9a-fA-F]{3,8}$/.test(b.color || '') ? b.color : th.color;
  const font = FONTS.includes(b.font) ? b.font : 'Cairo';
  const radius = Math.max(0, Math.min(30, Number(b.radius) || th.radius));
  const cols = Math.max(2, Math.min(4, Number(b.columns) || 4));
  const style = {
    '--c': color, '--onc': onColor(color), '--bg': th.bg, '--card': th.card, '--ink': th.ink, '--mut': th.mut, '--ln': th.ln,
    '--r': `${radius}px`, '--cols': cols, '--font': `'${font}'`,
  };
  const cls = `spk ${b.card_style === 'outline' ? 'outline' : b.card_style === 'flat' ? 'flat' : 'soft'}`;
  const gtm = store.live && GTM_RE.test(String(cfg.tracking.gtm_id || '').trim()) ? String(cfg.tracking.gtm_id).trim() : '';
  const pubCfg = publicCfg(cfg);
  if (store.whatsapp_button === false) pubCfg.whatsapp = { ...pubCfg.whatsapp, enabled: false };
  const footerPages = pages.filter((p) => p.in_footer).map((p) => ({ title: p.title, slug: p.slug }));

  return (
    <div className={cls} style={style} dir="rtl" lang="ar">
      <style dangerouslySetInnerHTML={{ __html: SHOP_CSS }} />
      <link rel="stylesheet" href={`https://fonts.googleapis.com/css2?family=${font.replace(/ /g, '+')}:wght@400;600;700;800;900&display=swap`} />
      <StoreProvider slug={store.store_slug} name={store.store_name || ''} cfg={pubCfg} pages={footerPages} categories={categories} zones={zones} live={store.live} reason={store.reason}>
        <Tracker pixels={store.live ? pixels : []} gtm={gtm} />
        <Shell footerExtra={<Blocks list={blocks.filter((x) => x.placement === 'footer')} />}>{children}</Shell>
      </StoreProvider>
    </div>
  );
}
