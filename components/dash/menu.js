/* قائمة لوحة التاجر: كل عنصر = شاشة حقيقية تقرأ وتكتب في Supabase.
   badge: 'جديد' يظهر بجانب العنصر.  spike: true = إضافة حصرية من سبايك. */
export const MENU = [
  { id: 'stats', t: 'لوحة الإحصائيات', i: '📊' },
     { id: 'plans', t: 'الباقات والاشتراك', i: '💎', badge: 'جديد' },
  { id: 'notifs', t: 'الإشعارات', i: '🔔' },
  {
    g: 'orders', t: 'الطلبات', i: '📦', items: [
      { id: 'orders', t: 'كل الطلبات' },
      { id: 'confirm', t: 'تأكيد الطلبات' },
      { id: 'abandoned', t: 'الطلبات المفقودة' },
      { id: 'blocked_orders', t: 'الأرقام المحظورة من الطلب' },
      { id: 'blocked_otp', t: 'الأرقام المحظورة OTP' },
      { id: 'customers', t: 'العملاء', spike: true },
      { id: 'newsletter', t: 'النشرة البريدية', badge: 'جديد' },
    ],
  },
  {
    g: 'products', t: 'المنتجات', i: '🏷️', items: [
      { id: 'products', t: 'كل المنتجات' },
      { id: 'inventory', t: 'المخزون', spike: true },
      { id: 'flash', t: 'عروض الفلاش', spike: true, badge: 'سبايك' },
      { id: 'categories', t: 'الأقسام' },
      { id: 'reviews', t: 'التقييمات' },
      { id: 'feed', t: 'Product Feed' },
      { id: 'catalog', t: 'كتالوج سبايك' },
    ],
  },
  {
    g: 'design', t: 'تصميم المتجر', i: '🎨', items: [
      { id: 'themes', t: 'الثيمات' },
      { id: 'home', t: 'تعديل الصفحة الرئيسية' },
      { id: 'pages', t: 'الصفحات' },
      { id: 'checkout', t: 'نموذج الشراء' },
      { id: 'thankyou', t: 'تعديل صفحة الشكر' },
      { id: 'blocks', t: 'UI Blocks' },
      { id: 'assets', t: 'رفع ملفات التصاميم' },
    ],
  },
  { id: 'landing', t: 'صفحات الهبوط', i: '🚀' },
  { id: 'funnels', t: 'Funnels (بسيط)', i: '🔻' },
  {
    g: 'tracking', t: 'أدوات التتبع', i: '🎯', items: [
      { id: 'pixels', t: 'إعدادات البكسل' },
      { id: 'capi', t: 'Conversion API' },
      { id: 'gtm', t: 'الربط مع جوجل تاج' },
      { id: 'utm', t: 'منشئ روابط الحملات (UTM)', spike: true },
    ],
  },
  {
    g: 'marketing', t: 'أدوات التسويق', i: '📣', items: [
      { id: 'cross', t: 'Cross Selling' },
      { id: 'bump', t: 'عرض قبل التأكيد (Order Bump)', spike: true },
      { id: 'offers', t: 'عروض الكمية (اشترِ أكثر ووفّر)', spike: true },
      { id: 'coupons', t: 'الكوبونات' },
      { id: 'retarget', t: 'إعادة الاستهداف' },
      { id: 'wa', t: 'WhatsApp Marketing' },
      { id: 'verify', t: 'توثيق الطلبات (سبايك Verify)' },
      { id: 'campaigns', t: 'تتبع نتائج الحملات الإعلانية' },
      { id: 'merchant', t: 'Google Merchant' },
      { id: 'popup', t: 'Sales Popup' },
      { id: 'referrals', t: 'إنشاء روابط الإحالة' },
      { id: 'freeship', t: 'الحد الأدنى للشحن المجاني' },
      { id: 'downsell', t: 'Downsell' },
      { id: 'scarcity', t: 'عدّاد الندرة', spike: true },
      { id: 'reports', t: 'تقارير الربح', spike: true },
    ],
  },
  {
    g: 'wallet', t: 'محفظتك', i: '👛', items: [
      { id: 'balance', t: 'رصيدك' },
      { id: 'tx', t: 'المعاملات' },
    ],
  },
  { id: 'shipping', t: 'الشحن والتوصيل', i: '🚚' },     { id: 'domains', t: 'شراء دومين', i: '🌐', badge: 'جديد' },
  { id: 'apps', t: 'التطبيقات', i: '🧩' },
  {
    h: 'خدمات مجتمع سبايك', items: [
      { id: 'services', t: 'معرض الخدمات', i: '🧰', badge: 'جديد' },
      { id: 'mservices', t: 'خدمات التسويق', i: '🏷️', badge: 'جديد' },
      { id: 'affiliate', t: 'نظام التسويق بالعمولة', i: '🤝' },
      { id: 'settings', t: 'الإعدادات', i: '⚙️' },
    ],
  },
];

export function flatMenu() {
  const out = [];
  for (const m of MENU) {
    if (m.id) out.push({ id: m.id, t: m.t, group: '' });
    if (m.items && m.g) m.items.forEach((x) => out.push({ id: x.id, t: x.t, group: m.t }));
    if (m.items && m.h) m.items.forEach((x) => out.push({ id: x.id, t: x.t, group: m.h }));
  }
  return out;
}

export function groupOf(tab) {
  for (const m of MENU) {
    if (m.g && m.items.some((x) => x.id === tab)) return m.g;
  }
  return '';
}
