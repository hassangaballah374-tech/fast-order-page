/* التشكيلات: مجموعة منتجات بتخطيط خاص (مدار / رف / خلط / شبكة) بتظهر في الرئيسية أو في صفحة لوحدها.
   cfg.showcases = { items:[ { id, name, subtitle, style, source:'all'|'cat'|'pick', cat_id, product_ids, limit, home } ] } */
import { BROWSE_STYLES } from './browse';

export const SHOWCASES_DEFAULT = { items: [] };
export const newShowcaseId = () => 'sc' + Math.random().toString(36).slice(2, 7);

export function cleanShowcases(v) {
  const items = [];
  for (const x of (v && v.items) || []) {
    const name = String(x.name || '').trim().slice(0, 60);
    if (!name) continue;
    const source = ['all', 'cat', 'pick'].includes(x.source) ? x.source : 'all';
    items.push({
      id: String(x.id || newShowcaseId()).replace(/[^a-z0-9_-]/gi, '').slice(0, 20) || newShowcaseId(),
      name,
      subtitle: String(x.subtitle || '').trim().slice(0, 140),
      style: BROWSE_STYLES[x.style] ? x.style : 'orbit',
      source,
      cat_id: source === 'cat' ? String(x.cat_id || '') : '',
      product_ids: source === 'pick' ? [...new Set((x.product_ids || []).map(String))].slice(0, 60) : [],
      limit: Math.max(2, Math.min(60, Number(x.limit) || 12)),
      home: x.home !== false,
    });
  }
  return { items: items.slice(0, 12) };
}

/* منتجات التشكيلة (تتجاهل المحذوف) */
export function showcaseProducts(sc, products) {
  const list = products || [];
  let out;
  if (sc.source === 'cat') out = list.filter((p) => String(p.category_id || '') === String(sc.cat_id));
  else if (sc.source === 'pick') { const m = new Map(list.map((p) => [String(p.id), p])); out = (sc.product_ids || []).map((id) => m.get(String(id))).filter(Boolean); }
  else out = list;
  return out.slice(0, sc.limit || 12);
}

export const liveShowcases = (cfg, products) => (((cfg && cfg.showcases) || SHOWCASES_DEFAULT).items || [])
  .map((sc) => ({ ...sc, list: showcaseProducts(sc, products) })).filter((sc) => sc.list.length);
