/* ترجمة المنصة: المفتاح = النص العربي نفسه، والقيمة = الإنجليزي. أي نص مفيش له ترجمة بيفضل عربي.
   المتغيرات: {1} {2} ... بالترتيب (مصفوفة)، أو {name} (كائن). */
import { EN_SHOP } from './en.shop';
import { EN_MISC } from './en.misc';

export const EN = { ...EN_SHOP, ...EN_MISC };

const fill = (s, vars) => {
  if (vars == null) return s;
  return String(s).replace(/\{(\w+)\}/g, (m, k) => {
    const v = Array.isArray(vars) ? vars[Number(k) - 1] : vars[k];
    return v === undefined || v === null ? '' : String(v);
  });
};

export function tr(lang, key, vars) {
  const k = String(key ?? '');
  let out = k;
  if (lang === 'en') {
    if (Object.prototype.hasOwnProperty.call(EN, k)) out = EN[k];
    else {
      const m = k.match(/^(\s*)([\s\S]*?)(\s*)$/); /* نفس النص بمسافات زيادة على الأطراف */
      if (m && m[2] && Object.prototype.hasOwnProperty.call(EN, m[2])) out = m[1] + EN[m[2]] + m[3];
    }
  }
  return fill(out, vars);
}
