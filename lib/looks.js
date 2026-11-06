/* الإطلالات (Shop the look): صورة موديل + مجموعة منتجات تتباع سوا.
   بتتخزن في إعدادات المتجر: cfg.looks = { enabled, title, items:[ { id, name, image, note, product_ids:[...] } ] } */

export const LOOKS_DEFAULT = { enabled: true, title: 'تسوّق الإطلالة', items: [] };

const uid = () => 'lk' + Math.random().toString(36).slice(2, 8);
export const newLookId = uid;

export function cleanLooks(v) {
  const items = [];
  for (const l of (v && v.items) || []) {
    const name = String(l.name || '').trim().slice(0, 80);
    const ids = [...new Set((l.product_ids || []).map(String))].slice(0, 12);
    if (!name || !ids.length) continue;
    items.push({ id: l.id || uid(), name, image: String(l.image || '').slice(0, 600), note: String(l.note || '').trim().slice(0, 160), product_ids: ids });
  }
  return { enabled: v && v.enabled === false ? false : true, title: String((v && v.title) || LOOKS_DEFAULT.title).trim().slice(0, 60), items: items.slice(0, 24) };
}

/* الإطلالات الصالحة للعرض: فيها منتج واحد على الأقل موجود فعلاً (المنتجات المحذوفة بتتشال لوحدها) */
export function liveLooks(cfg, products) {
  const l = (cfg && cfg.looks) || LOOKS_DEFAULT;
  if (l.enabled === false) return [];
  const byId = new Map((products || []).map((p) => [String(p.id), p]));
  return (l.items || [])
    .map((x) => ({ ...x, products: (x.product_ids || []).map((id) => byId.get(String(id))).filter(Boolean) }))
    .filter((x) => x.products.length);
}
