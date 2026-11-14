import { headers } from 'next/headers';

export const dynamic = 'force-dynamic';

const PLATFORM = (process.env.PLATFORM_HOST || 'fast-order-page.vercel.app').toLowerCase();

/* robots.txt حسب الدومين: منصة سبايك أو دومين متجر مربوط */
export default function robots() {
  const h = headers();
  const host = (h.get('x-forwarded-host') || h.get('host') || PLATFORM).split(',')[0].trim().toLowerCase();
  const onPlatform = host === PLATFORM || host.endsWith('.vercel.app') || host.startsWith('localhost');
  return {
    rules: [{
      userAgent: '*',
      allow: '/',
      disallow: onPlatform
        ? ['/dashboard', '/admin', '/super-admin', '/api/', '/register', '/reset-password']
        : ['/api/', '/dashboard', '/admin', '/register', '/reset-password', '/shop/*/cart', '/shop/*/thank-you', '/shop/*/track', '/shop/*/favorites'],
    }],
    sitemap: `https://${host}/sitemap.xml`,
  };
}
