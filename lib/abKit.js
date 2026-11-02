/* أدوات اختبار A/B: اختيار النسخة بالأوزان + اختبار الدلالة الإحصائية */
export const VARIANT_IDS = ['a', 'b', 'c', 'd'];

export function cleanVariants(list) {
  return (Array.isArray(list) ? list : []).slice(0, 4).map((v, i) => ({
    id: VARIANT_IDS[i], page: String(v?.page || '').trim().slice(0, 80), weight: Math.max(1, Math.min(100, Math.round(Number(v?.weight) || 50))),
  }));
}

export function pickVariant(variants, rnd = Math.random()) {
  const vs = (variants || []).filter((v) => v && v.page);
  if (!vs.length) return null;
  const total = vs.reduce((a, v) => a + (Number(v.weight) || 1), 0);
  let x = rnd * total;
  for (const v of vs) { x -= Number(v.weight) || 1; if (x < 0) return v; }
  return vs[vs.length - 1];
}

function erf(x) {
  const s = Math.sign(x); const t = 1 / (1 + 0.3275911 * Math.abs(x));
  const y = 1 - (((((1.061405429 * t - 1.453152027) * t) + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t * Math.exp(-x * x);
  return s * y;
}

/* اختبار نسبتين (two-proportion z-test): p صغيرة = الفرق حقيقي مش صدفة */
export function zTest(c1, n1, c2, n2) {
  if (n1 < 1 || n2 < 1) return { z: 0, p: 1 };
  const p1 = c1 / n1; const p2 = c2 / n2; const pp = (c1 + c2) / (n1 + n2);
  const se = Math.sqrt(pp * (1 - pp) * (1 / n1 + 1 / n2));
  if (!se) return { z: 0, p: 1 };
  const z = (p2 - p1) / se;
  return { z, p: 2 * (1 - 0.5 * (1 + erf(Math.abs(z) / Math.SQRT2))) };
}

/* rows: [{id, views, orders}] → { leader, sure, note } */
export function verdict(rows, minViews = 100) {
  const ok = rows.filter((r) => r.views > 0);
  if (ok.length < 2) return { leader: null, sure: false, note: 'لسه مفيش زيارات كفاية' };
  const sorted = [...ok].sort((a, b) => b.orders / b.views - a.orders / a.views);
  const [top, second] = sorted;
  if (top.views < minViews || second.views < minViews) return { leader: top.id, sure: false, note: `محتاج ${minViews} زيارة على الأقل لكل نسخة` };
  const { p } = zTest(second.orders, second.views, top.orders, top.views);
  if (p < 0.05) return { leader: top.id, sure: true, note: `الفرق حقيقي بثقة ${Math.min(99, Math.round((1 - p) * 100))}%` };
  return { leader: top.id, sure: false, note: 'الفرق لسه ممكن يكون صدفة، كمّل الاختبار' };
}
