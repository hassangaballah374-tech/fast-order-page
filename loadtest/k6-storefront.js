// اختبار ضغط للمتجر (k6): بيحاكي زوار بيتصفحوا ويضيفوا للسلة ويحسبوا الإجمالي، بدون إنشاء طلبات حقيقية.
// التشغيل (على جهازك، مش على الإنتاج): k6 run -e BASE=https://YOUR-PREVIEW.vercel.app -e SLUG=your-store -e PRODUCT=<product-id> loadtest/k6-storefront.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export const options = {
  stages: [
    { duration: '1m', target: 50 },
    { duration: '3m', target: 200 },
    { duration: '3m', target: 500 },
    { duration: '1m', target: 0 },
  ],
  thresholds: { http_req_failed: ['rate<0.02'], http_req_duration: ['p(95)<1500'] },
};

const BASE = __ENV.BASE; const SLUG = __ENV.SLUG; const PID = __ENV.PRODUCT;
const J = { headers: { 'Content-Type': 'application/json' } };

export default function () {
  const home = http.get(`${BASE}/shop/${SLUG}`);
  check(home, { 'home 200': (r) => r.status === 200 });
  http.post(`${BASE}/api/store/hit`, JSON.stringify({ slug: SLUG, events: [{ event: 'visit' }, { event: 'pview', product: PID }] }), J);
  sleep(1 + Math.random() * 3);
  const prod = http.get(`${BASE}/shop/${SLUG}/p/${PID}`);
  check(prod, { 'product 200': (r) => r.status === 200 });
  if (Math.random() < 0.3) {
    http.post(`${BASE}/api/store/hit`, JSON.stringify({ slug: SLUG, event: 'cart', product: PID }), J);
    const q = http.post(`${BASE}/api/store/quote`, JSON.stringify({ slug: SLUG, items: [{ product_id: PID, qty: 1, options: {} }], governorate: 'القاهرة' }), J);
    check(q, { 'quote ok': (r) => r.status === 200 });
  }
  sleep(1 + Math.random() * 3);
}
