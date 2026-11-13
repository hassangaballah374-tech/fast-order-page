/** @type {import('next').NextConfig} */
/* رؤوس أمان لكل الصفحات. الـ CSP هنا مقصود إنه "غير مقيِّد للسكربتات" (عشان البكسلات: فيسبوك/تيك توك/جوجل ما تتكسرش)،
   لكنه بيمنع التضمين في صفحات تانية (clickjacking) وتغيير base/form وتحميل plugins. */
const security = [
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=(), usb=(), interest-cohort=()' },
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Cross-Origin-Opener-Policy', value: 'same-origin-allow-popups' },
  { key: 'Content-Security-Policy', value: "frame-ancestors 'self'; base-uri 'self'; object-src 'none'; form-action 'self'" },
];

const nextConfig = {
  poweredByHeader: false,
  /* روابط المتجر القديمة /store/اسم → المتجر الجديد */
  async redirects() {
    return [{ source: '/store/:slug*', destination: '/shop/:slug*', permanent: true }];
  },
  async headers() {
    return [
      { source: '/:path*', headers: security },
      /* الـ API بيانات حية: ما تتخزنش في أي كاش وسيط (الـ feed وسعر الدولار بيحددوا الكاش بتاعهم بنفسهم) */
      { source: '/api/dashboard/:path*', headers: [{ key: 'Cache-Control', value: 'no-store' }] },
      { source: '/api/shipping/:path*', headers: [{ key: 'Cache-Control', value: 'no-store' }] },
      { source: '/api/store/:path*', headers: [{ key: 'Cache-Control', value: 'no-store' }] },
      { source: '/sw.js', headers: [{ key: 'Cache-Control', value: 'no-cache, no-store, must-revalidate' }, { key: 'Service-Worker-Allowed', value: '/' }] },
    ];
  },
};

module.exports = nextConfig;
