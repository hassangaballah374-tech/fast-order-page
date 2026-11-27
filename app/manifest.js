/* تطبيق سبايك للتاجر (لوحة التحكم): بيتثبّت على الشاشة الرئيسية ويفتح بملء الشاشة */
import { getBrand } from '../lib/brandServer';
import { withV } from '../lib/brand';

export const dynamic = 'force-dynamic';
export default async function manifest() {
  const b = await getBrand();
  const ic = withV(b.icon, b.v);
  return {
    id: '/dashboard',
    name: `${b.name} | ${b.name_en}`,
    short_name: b.name,
    description: b.description,
    start_url: '/dashboard?source=pwa',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    dir: 'rtl',
    lang: 'ar',
    background_color: '#ffffff',
    theme_color: '#014D6F',
    icons: ic ? [
      { src: ic, sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: ic, sizes: '512x512', type: 'image/png', purpose: 'any' },
    ] : [
      { src: '/brand/icon-192.png?v=2', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/brand/icon-512.png?v=2', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  };
}
