/* باحث المقاس: دوال نقية (بتشتغل في المتصفح وفي لوحة التاجر).
   جدول المقاسات بيتخزن في إعدادات المتجر: cfg.sizing = { enabled, default_chart, charts:[...], assign:{ [productId | 'cat:'+categoryId]: chartId | 'none' } }
   الجدول: { id, name, kind:'clothes'|'shoes', rows:[ {size, h:[min,max], w:[min,max]}  |  {size, foot:[min,max]} ] } */

export const SIZING_DEFAULT = { enabled: false, default_chart: '', charts: [], assign: {} };

export const isSizeGroup = (name) => /مقاس|size|قياس|حجم/i.test(String(name || ''));
const norm = (s) => String(s ?? '').trim().toLowerCase().replace(/\s+/g, '');
const clamp = (n, a, b) => Math.min(b, Math.max(a, n));
const mid = (r) => (Number(r?.[0]) + Number(r?.[1])) / 2;

/* الجدول المربوط بالمنتج: مباشرة، أو بتصنيفه، أو الافتراضي. 'none' = بدون باحث لهذا المنتج */
export function chartFor(sizing, product) {
  const s = sizing || {};
  if (!s.enabled || !Array.isArray(s.charts) || !s.charts.length || !product) return null;
  const a = s.assign || {};
  let id = a[String(product.id)];
  if (id === 'none') return null;
  if (!id && product.category_id) id = a['cat:' + product.category_id];
  if (id === 'none') return null;
  if (!id) id = s.default_chart;
  return s.charts.find((c) => c.id === id) || null;
}

/* أول مجموعة خيارات للمقاس في المنتج */
export function sizeGroupOf(product) {
  return (product?.variants || []).find((g) => isSizeGroup(g.name)) || null;
}

/* ترتيب القيم الرقمية: يحوّل قيمة قياس لموضع (index) بين مراكز صفوف الجدول بشكل خطي */
function toIdx(val, centers) {
  const n = centers.length;
  if (n === 1) return 0;
  if (val <= centers[0]) return -(centers[0] - val) / Math.max(0.0001, centers[1] - centers[0]);
  if (val >= centers[n - 1]) return n - 1 + (val - centers[n - 1]) / Math.max(0.0001, centers[n - 1] - centers[n - 2]);
  for (let i = 0; i < n - 1; i += 1) {
    if (val >= centers[i] && val <= centers[i + 1]) return i + (val - centers[i]) / Math.max(0.0001, centers[i + 1] - centers[i]);
  }
  return 0;
}

const sortBy = (rows, f) => [...rows].sort((a, b) => f(a) - f(b));

/* input للملابس: { h (سم), w (كجم), chest, stomach, hips (-1/0/1), fit (-1 ضيق / 0 عادي / 1 واسع) }
   input للأحذية: { foot (سم), width (-1 ضيق / 0 عادي / 1 عريض), fit (-1 مظبوط / 0 عادي / 1 مريح) } */
export function recommend(chart, input) {
  if (!chart || !Array.isArray(chart.rows) || !chart.rows.length) return null;
  const shoes = chart.kind === 'shoes';
  const rows = shoes
    ? sortBy(chart.rows.filter((r) => Array.isArray(r.foot)), (r) => mid(r.foot))
    : sortBy(chart.rows.filter((r) => Array.isArray(r.w)), (r) => mid(r.w));
  if (!rows.length) return null;
  const n = rows.length;
  let idx;
  let notes = [];

  if (shoes) {
    const foot = Number(input.foot) || 0;
    idx = toIdx(foot, rows.map((r) => mid(r.foot)));
    idx += (Number(input.width) || 0) * 0.45 + (Number(input.fit) || 0) * 0.35;
    if (input.width > 0) notes.push('قدمك عريضة — اخترنا لك مقاس أريح');
  } else {
    const shape = (Number(input.stomach) || 0) * 5 + (Number(input.chest) || 0) * 3 + (Number(input.hips) || 0) * 2;
    const w = (Number(input.w) || 0) + shape;
    const idxW = toIdx(w, rows.map((r) => mid(r.w)));
    const hasH = rows.every((r) => Array.isArray(r.h));
    const idxH = hasH ? toIdx(Number(input.h) || 0, rows.map((r) => mid(r.h))) : idxW;
    idx = hasH ? 0.8 * idxW + 0.2 * idxH : idxW;
    idx += (Number(input.fit) || 0) * 0.5;
    if (hasH && idxH - idxW > 1) notes.push('طولك أكبر من المتوسط لوزنك — لو بتحب الطول مريح خد المقاس الأكبر');
    if (hasH && idxW - idxH > 1) notes.push('وزنك أعلى من المتوسط لطولك — المقاس الأكبر هيريّحك أكتر');
  }

  const best = clamp(Math.round(idx), 0, n - 1);
  const frac = idx - best;
  const out = idx < -0.6 || idx > n - 0.4;
  const alt = !out && frac > 0.22 && best < n - 1 ? best + 1 : (!out && frac < -0.22 && best > 0 ? best - 1 : null);
  let confidence = 97 - Math.abs(frac) * 70 - (out ? 35 : 0);
  confidence = Math.round(clamp(confidence, 40, 98));
  const fitText = out ? 'خارج الجدول' : frac > 0.3 ? 'هيكون ضيق شوية' : frac < -0.3 ? 'هيكون واسع شوية' : 'مظبوط عليك';
  if (out) notes.push(idx < 0 ? 'قياسك أصغر من أصغر مقاس في الجدول' : 'قياسك أكبر من أكبر مقاس في الجدول');
  return {
    size: rows[best].size,
    alt: alt != null ? rows[alt].size : null,
    confidence,
    fitText,
    out,
    position: n > 1 ? clamp((idx + 0) / (n - 1), 0, 1) : 0.5,
    scale: rows.map((r) => r.size),
    bestIndex: best,
    notes,
  };
}

/* يطابق مقاس الجدول مع قيمة موجودة فعلاً في خيارات المنتج (S = s = " S ") */
export function matchValue(size, values) {
  const t = norm(size);
  return (values || []).find((v) => norm(v) === t) || null;
}

/* تقدير حي بسيط (للعرض أثناء تحريك الطول والوزن) */
export function quickSize(chart, input) {
  try { const r = recommend(chart, input); return r ? r.size : ''; } catch { return ''; }
}

/* ===== قوالب جاهزة (قيم تقريبية شائعة، والتاجر يعدّلها حسب براند منتجاته) ===== */
const uid = () => 'sz' + Math.random().toString(36).slice(2, 8);
const cl = (size, h0, h1, w0, w1) => ({ size, h: [h0, h1], w: [w0, w1] });

function shoeRows(startEU, endEU, firstFoot) {
  const rows = [];
  let f = firstFoot;
  for (let s = startEU; s <= endEU; s += 1) { rows.push({ size: String(s), foot: [Math.round(f * 10) / 10, Math.round((f + 0.67) * 10) / 10] }); f += 0.67; }
  return rows;
}

export const SIZE_TEMPLATES = [
  { key: 'men_top', name: 'ملابس علوية رجالي (تيشيرت / قميص / جاكيت)', kind: 'clothes', rows: [cl('S', 160, 170, 55, 65), cl('M', 165, 175, 63, 73), cl('L', 170, 180, 71, 83), cl('XL', 175, 185, 81, 93), cl('XXL', 178, 190, 91, 105), cl('3XL', 180, 195, 103, 120)] },
  { key: 'women_top', name: 'ملابس علوية حريمي', kind: 'clothes', rows: [cl('XS', 150, 160, 42, 50), cl('S', 155, 165, 48, 57), cl('M', 160, 168, 55, 65), cl('L', 162, 172, 63, 74), cl('XL', 165, 175, 72, 85), cl('XXL', 165, 178, 83, 98)] },
  { key: 'men_pants', name: 'بناطيل رجالي (مقاس الوسط)', kind: 'clothes', rows: [cl('30', 165, 175, 55, 65), cl('32', 168, 178, 63, 73), cl('34', 170, 180, 71, 83), cl('36', 172, 182, 81, 93), cl('38', 175, 185, 91, 105), cl('40', 175, 190, 103, 120)] },
  { key: 'men_shoes', name: 'أحذية رجالي (مقاس أوروبي)', kind: 'shoes', rows: shoeRows(39, 46, 24.0) },
  { key: 'women_shoes', name: 'أحذية حريمي (مقاس أوروبي)', kind: 'shoes', rows: shoeRows(36, 41, 22.2) },
];

export function chartFromTemplate(key) {
  const t = SIZE_TEMPLATES.find((x) => x.key === key) || SIZE_TEMPLATES[0];
  return { id: uid(), name: t.name, kind: t.kind, rows: JSON.parse(JSON.stringify(t.rows)) };
}
export const newChartId = uid;

/* تنظيف قبل الحفظ: أرقام صحيحة وصفوف كاملة بس */
export function cleanChart(c) {
  const kind = c.kind === 'shoes' ? 'shoes' : 'clothes';
  const num = (v) => { const n = parseFloat(String(v ?? '').replace(/[^\d.]/g, '')); return Number.isFinite(n) ? n : NaN; };
  const rows = [];
  for (const r of c.rows || []) {
    const size = String(r.size ?? '').trim();
    if (!size) continue;
    if (kind === 'shoes') {
      const a = num(r.foot?.[0]); const b = num(r.foot?.[1]);
      if (Number.isFinite(a) && Number.isFinite(b) && b >= a) rows.push({ size, foot: [a, b] });
    } else {
      const w0 = num(r.w?.[0]); const w1 = num(r.w?.[1]);
      if (!(Number.isFinite(w0) && Number.isFinite(w1) && w1 >= w0)) continue;
      const h0 = num(r.h?.[0]); const h1 = num(r.h?.[1]);
      rows.push(Number.isFinite(h0) && Number.isFinite(h1) && h1 >= h0 ? { size, h: [h0, h1], w: [w0, w1] } : { size, w: [w0, w1] });
    }
  }
  return { id: c.id || uid(), name: String(c.name || 'جدول مقاسات').trim().slice(0, 80), kind, rows };
}
