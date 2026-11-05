/* أشكال عرض المنتجات (ملف عادي بدون 'use client' عشان يشتغل في السيرفر والمتصفح) */
export const BROWSE_STYLES = {
  orbit: 'مدار',
  rail: 'رف الشماعات',
  shuffle: 'شبكة الخلط',
  grid: 'شبكة كلاسيك',
};

export const pickStyle = (cfg, catId, view) => {
  if (view && BROWSE_STYLES[view]) return view;
  const b = (cfg && cfg.browse) || {};
  const byCat = (catId && b.by_cat && b.by_cat[catId]) || '';
  const s = byCat || b.style || 'orbit';
  return BROWSE_STYLES[s] ? s : 'orbit';
};
