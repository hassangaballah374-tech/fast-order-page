/* غرفة القياس (بدون ذكاء اصطناعي): صورة موديل من التاجر + صور قطع شفافة (PNG) بتتركّب فوقه.
   cfg.fitting = { enabled, title, models:[{id,name,image}], items:{ [productId]: { image, slot } } } */

export const FITTING_DEFAULT = { enabled: false, title: 'غرفة القياس', models: [], items: {} };

export const SLOTS = {
  top: { t: 'علوي (تيشيرت/قميص)', x: 50, y: 30, w: 58, z: 2 },
  outer: { t: 'جاكيت / كارديجان', x: 50, y: 32, w: 66, z: 3 },
  bottom: { t: 'سفلي (بنطلون/جيبة)', x: 50, y: 64, w: 46, z: 1 },
  shoes: { t: 'حذاء', x: 50, y: 90, w: 40, z: 1 },
  acc: { t: 'إكسسوار (شنطة/نظارة/قبعة)', x: 50, y: 14, w: 26, z: 4 },
};

const uid = () => 'fm' + Math.random().toString(36).slice(2, 8);
export const newFitId = uid;

export function cleanFitting(v) {
  const models = [];
  for (const m of (v && v.models) || []) {
    if (!m.image) continue;
    models.push({ id: m.id || uid(), name: String(m.name || '').trim().slice(0, 40), image: String(m.image).slice(0, 600) });
  }
  const items = {};
  for (const [pid, it] of Object.entries((v && v.items) || {})) {
    if (!it || !it.image) continue;
    items[String(pid)] = { image: String(it.image).slice(0, 600), slot: SLOTS[it.slot] ? it.slot : 'top' };
  }
  return { enabled: !!(v && v.enabled), title: String((v && v.title) || FITTING_DEFAULT.title).trim().slice(0, 60), models: models.slice(0, 8), items };
}

/* القطع القابلة للتجربة: منتجات موجودة ولها صورة تركيب */
export function fittingReady(cfg, products) {
  const f = (cfg && cfg.fitting) || FITTING_DEFAULT;
  if (!f.enabled || !(f.models || []).length) return null;
  const list = (products || []).filter((p) => f.items && f.items[String(p.id)]).map((p) => ({ ...p, fit: f.items[String(p.id)] }));
  return list.length ? { title: f.title, models: f.models, products: list } : null;
}
