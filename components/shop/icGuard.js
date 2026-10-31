'use client';
import { track } from './tracker';
import { hit } from './StoreContext';

/* حدث «بدء إتمام الشراء» مرة واحدة فقط لكل زيارة صفحة، سواء جه من زرار اطلب الآن أو من أول لمسة في نموذج الطلب */
const fired = new Set();

export function fireInitiateCheckout(slug, value, items) {
  const key = slug + '|' + items.map((i) => i.id).join(',');
  if (fired.has(key) || !items.length) return;
  fired.add(key);
  track('InitiateCheckout', { value: value || 0, items });
  hit(slug, 'checkout', { products: items.map((i) => String(i.id)).slice(0, 10) });
}
