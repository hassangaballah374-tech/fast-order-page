/* هوية المنصة: افتراضي + دمج + استبدال الاسم داخل النصوص. آمن للاستخدام في السيرفر والعميل. */
export const DEFAULT_BRAND = {
  name: 'سبايك', name_en: 'SPIKE', tagline: 'ابنِ متجرك.. وضاعف طلباتك',
  description: 'المنظومة الأقوى لإدارة المتاجر الإلكترونية، الشحن، والدفع عند الاستلام',
  logo_light: '', logo_night: '', icon: '', v: '',
};
const s = (x, n) => String(x ?? '').trim().slice(0, n);
export function mergeBrand(j) {
  const o = j && typeof j === 'object' ? j : {};
  return {
    name: s(o.name, 40) || DEFAULT_BRAND.name,
    name_en: s(o.name_en, 40) || (s(o.name, 40) ? s(o.name, 40) : DEFAULT_BRAND.name_en),
    tagline: s(o.tagline, 120) || DEFAULT_BRAND.tagline,
    description: s(o.description, 200) || DEFAULT_BRAND.description,
    logo_light: s(o.logo_light, 500), logo_night: s(o.logo_night, 500), icon: s(o.icon, 500), v: s(o.v, 20),
  };
}
export const withV = (u, v) => (!u ? '' : v ? u + (u.includes('?') ? '&' : '?') + 'v=' + v : u);
/* بيبدّل «سبايك» و«SPIKE» جوه أي نص بالاسم الحالي (لو الاسم اتغيّر) */
export function brandText(text, b) {
  if (!b || typeof text !== 'string') return text;
  let t = text;
  if (b.name !== DEFAULT_BRAND.name) t = t.replace(/سبايك/g, b.name);
  if (b.name_en !== DEFAULT_BRAND.name_en) t = t.replace(/SPIKE/g, b.name_en);
  return t;
}
export function brandDeep(o, b) {
  if (typeof o === 'string') return brandText(o, b);
  if (Array.isArray(o)) return o.map((x) => brandDeep(x, b));
  if (o && typeof o === 'object') { const r = {}; for (const k of Object.keys(o)) r[k] = brandDeep(o[k], b); return r; }
  return o;
}
