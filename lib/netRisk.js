/* مستوى خطورة العميل حسب سجله عبر كل متاجر سبايك (يُستخدم في السيرفر واللوحة) */
export function netLevel(r) {
  if (!r) return 'none';
  const ret = Number(r.returned) || 0;
  const total = Number(r.total) || 0;
  if (ret >= 3 || (ret >= 2 && (Number(r.bad_stores) || 0) >= 2) || (total >= 3 && ret / total >= 0.5)) return 'high';
  if (ret >= 1) return 'mid';
  return 'none';
}
