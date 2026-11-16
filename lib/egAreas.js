/* مراكز وقرى مصر لنموذج الطلب. الملف: public/data/eg-areas.json (محافظة → [[مركز/قسم, [قرى/أحياء]]])
   مبني من قاعدة بيانات مفتوحة (Zeyad-Mohamed1/egypt-governorates-cities-villages) المعتمدة على بيانات CAPMAS/OCHA (CC BY-IGO) و GeoNames (CC BY 4.0).
   مش مصدر رسمي: لو القرية مش موجودة العميل بيختار «أخرى» ويكتبها. */
let cache = null;
let pending = null;
export function loadEgAreas() {
  if (cache) return Promise.resolve(cache);
  if (!pending) {
    pending = fetch('/data/eg-areas.json', { cache: 'force-cache' }).then((r) => (r.ok ? r.json() : {})).then((j) => { cache = j || {}; return cache; }).catch(() => { pending = null; return {}; });
  }
  return pending;
}
export const OTHER_VILLAGE = '__other';
