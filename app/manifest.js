/* تطبيق سبايك للتاجر (لوحة التحكم): بيتثبّت على الشاشة الرئيسية ويفتح بملء الشاشة */
export default function manifest() {
  return {
    id: '/dashboard',
    name: 'سبايك | SPIKE',
    short_name: 'سبايك',
    description: 'منصة إدارة المتاجر والدفع عند الاستلام',
    start_url: '/dashboard?source=pwa',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait',
    dir: 'rtl',
    lang: 'ar',
    background_color: '#ffffff',
    theme_color: '#014D6F',
    icons: [
      { src: '/brand/icon-192.png?v=2', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/brand/icon-512.png?v=2', sizes: '512x512', type: 'image/png', purpose: 'any' },
    ],
  };
}
