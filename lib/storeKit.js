/* ثوابت ودوال مشتركة بين لوحة التاجر والمتجر العام والـ API (بدون أي اعتماد على React أو Next) */

import { THEMES_100, FONTS_ALL } from './themes100';
import { INDUSTRY_THEMES } from './industryThemes';
export const GOVERNORATES = [
  ['القاهرة', 50], ['الجيزة', 50], ['الإسكندرية', 60],
  ['الدقهلية', 65], ['الغربية', 65], ['المنوفية', 65], ['القليوبية', 65], ['الشرقية', 65], ['البحيرة', 65], ['كفر الشيخ', 65], ['دمياط', 65],
  ['بورسعيد', 70], ['الإسماعيلية', 70], ['السويس', 70],
  ['الفيوم', 85], ['بني سويف', 85], ['المنيا', 85], ['أسيوط', 85], ['سوهاج', 85], ['قنا', 85], ['الأقصر', 85], ['أسوان', 85], 
  ['البحر الأحمر', 110], ['الوادي الجديد', 110], ['مطروح', 110], ['شمال سيناء', 110], ['جنوب سيناء', 110],
];

export const BOSTA_CITY = {
  'القاهرة': 'Cairo', 'الجيزة': 'Giza', 'الإسكندرية': 'Alexandria', 'الدقهلية': 'Dakahlia', 'الغربية': 'Gharbia',
  'المنوفية': 'Monufia', 'القليوبية': 'Qalyubia', 'الشرقية': 'Sharqia', 'البحيرة': 'Beheira', 'كفر الشيخ': 'Kafr El-Sheikh',
  'دمياط': 'Damietta', 'بورسعيد': 'Port Said', 'الإسماعيلية': 'Ismailia', 'السويس': 'Suez', 'الفيوم': 'Fayoum',
  'بني سويف': 'Beni Suef', 'المنيا': 'Minya', 'أسيوط': 'Assiut', 'سوهاج': 'Sohag', 'قنا': 'Qena', 'الأقصر': 'Luxor',
  'أسوان': 'Aswan', 'البحر الأحمر': 'Red Sea', 'الوادي الجديد': 'New Valley', 'مطروح': 'Matrouh',
  'شمال سيناء': 'North Sinai', 'جنوب سيناء': 'South Sinai',
};

export const STATUS = {
  pending: { ar: 'جديد', color: '#b7791f' },
  confirmed: { ar: 'مؤكد', color: '#0a7f86' },
  shipped: { ar: 'في الشحن', color: '#6b46c1' },
  delivered: { ar: 'تم التسليم', color: '#2f855a' },
  returned: { ar: 'مرتجع', color: '#c53030' },
  cancelled: { ar: 'ملغي', color: '#718096' },
};
export const LIVE_STATUSES = ['pending', 'confirmed', 'shipped', 'delivered'];
export const COUNTED_STATUSES = ['confirmed', 'shipped', 'delivered'];

export const PLATFORM_LABEL = {
  facebook: 'فيسبوك / إنستجرام', tiktok: 'تيك توك', snapchat: 'سناب شات', google: 'جوجل', other: 'أخرى',
};

/* ================= الثيمات ================= */
const THEMES_OLD = [
  { id: 'spike', name: 'سبايك نهاري', desc: 'هوية سبايك: أزرق بترولي وأبيض مع درجات أزرق فاتح', color: '#014D6F', bg: '#FFFFFF', card: '#F2F6FF', ink: '#014D6F', mut: '#5B6B7A', ln: '#D6E2F0', radius: 16, pal: 1, tint: '#DEEAF4', tint2: '#ECF3FD', deep: '#02344D' },
  { id: 'night', name: 'سبايك ليلي', desc: 'النسخة الليلية من هوية سبايك: كحلي عميق وأزرق سماوي', color: '#5BB6E0', bg: '#061C2A', card: '#0A2A3E', ink: '#E8F1F8', mut: '#8FA9BC', ln: '#16435D', radius: 16, pal: 1, tint: '#0F3650', tint2: '#082436', deep: '#02131E' },
  { id: 'fresh', name: 'منعش', desc: 'أخضر هادئ مناسب للأغذية والعناية', color: '#2f855a', bg: '#f1f8f3', card: '#ffffff', ink: '#1a2e22', mut: '#5f7568', ln: '#d9e7de', radius: 14 },
  { id: 'rose', name: 'وردي ناعم', desc: 'مناسب للتجميل والأزياء النسائية', color: '#d6336c', bg: '#fff4f7', card: '#ffffff', ink: '#3b1f2b', mut: '#8a6573', ln: '#f3d9e1', radius: 18 },
  { id: 'royal', name: 'ملكي', desc: 'بنفسجي أنيق للمنتجات الراقية', color: '#6b46c1', bg: '#f6f4ff', card: '#ffffff', ink: '#271a4a', mut: '#6c628a', ln: '#e0daf3', radius: 14 },
  { id: 'minimal', name: 'مينيمال', desc: 'أسود وأبيض بزوايا حادة', color: '#111111', bg: '#ffffff', card: '#fafafa', ink: '#111111', mut: '#6b6b6b', ln: '#e6e6e6', radius: 6 },
  { id: 'sunset', name: 'غروب', desc: 'برتقالي دافئ للمتاجر الشبابية', color: '#e08f4f', bg: '#fff7ee', card: '#ffffff', ink: '#3a2410', mut: '#8b6b4f', ln: '#f1dcc6', radius: 20 },
  { id: 'ocean', name: 'محيط', desc: 'أزرق نظيف للإلكترونيات', color: '#1d6fb8', bg: '#f1f7fd', card: '#ffffff', ink: '#12263a', mut: '#5a7189', ln: '#d6e5f3', radius: 12 },
];
/* الثيمات القديمة تحتفظ بنفس المعرّفات (المتاجر الحالية لا تتأثر) + 100 ثيم جديد بشخصيات مختلفة */
const OLD_THEMES = THEMES_OLD.map((t) => ({ ...t, p: 'clean', pat: 'none', cat: 'كلاسيكي', dark: t.id === 'night' }));
export const THEMES = [...OLD_THEMES, ...INDUSTRY_THEMES, ...THEMES_100];
export const themeById = (id) => THEMES.find((t) => t.id === id) || THEMES[0];

export const FONTS = FONTS_ALL;
/* ================= أقسام الصفحة الرئيسية ================= */
export const HOME_SECTION_TYPES = {
  hero: { ar: 'البانر الرئيسي', icon: '🖼️' },
  trust: { ar: 'مميزات الثقة (شحن، دفع عند الاستلام...)', icon: '🛡️' },
  categories: { ar: 'الأقسام', icon: '🗂️' },
  featured: { ar: 'منتجات مميزة', icon: '⭐' },
  bestsellers: { ar: 'الأكثر مبيعاً', icon: '🔥' },
  newest: { ar: 'وصل حديثاً', icon: '🆕' },
  banner: { ar: 'بانر ترويجي', icon: '📢' },
  testimonials: { ar: 'آراء العملاء', icon: '💬' },
  blocks: { ar: 'عناصر UI Blocks', icon: '🧱' },
  newsletter: { ar: 'اشتراك النشرة', icon: '✉️' },
  looks: { ar: 'تسوّق الإطلالة (Shop the look)', icon: '👗' },
  fitting: { ar: 'غرفة القياس', icon: '🪞' },
  showcases: { ar: 'التشكيلات (تخطيطات خاصة)', icon: '✨' },
};

export const DEFAULT_HOME_SECTIONS = [
  { id: 'hero', type: 'hero', enabled: true, title: 'أهلاً بك في متجرنا', subtitle: 'منتجات مختارة بعناية، والدفع عند الاستلام', image: '', button_text: 'تسوّق الآن', button_link: '#products' },
  { id: 'trust', type: 'trust', enabled: true, title: '', subtitle: '' },
  { id: 'categories', type: 'categories', enabled: true, title: 'تسوّق حسب القسم', subtitle: '' },
  { id: 'featured', type: 'featured', enabled: true, title: 'منتجات مميزة', subtitle: '', limit: 8 },
  { id: 'bestsellers', type: 'bestsellers', enabled: true, title: 'الأكثر مبيعاً', subtitle: '', limit: 8 },
  { id: 'testimonials', type: 'testimonials', enabled: true, title: 'آراء عملائنا', subtitle: '', limit: 6 },
  { id: 'newsletter', type: 'newsletter', enabled: true, title: 'اشترك ليصلك كل جديد', subtitle: 'عروض حصرية تصلك أولاً' },
];

export const BLOCK_KINDS = {
  announcement: { ar: 'شريط إعلان', icon: '📣' },
  countdown: { ar: 'عدّاد تنازلي لعرض', icon: '⏳' },
  trust: { ar: 'مميزات / شارات ثقة', icon: '🛡️' },
  faq: { ar: 'أسئلة شائعة', icon: '❓' },
  image: { ar: 'صورة بانر', icon: '🖼️' },
  video: { ar: 'فيديو يوتيوب', icon: '🎬' },
  text: { ar: 'نص حر', icon: '📝' },
};
export const BLOCK_PLACEMENTS = {
  home_top: 'أعلى الرئيسية',
  home_bottom: 'أسفل الرئيسية',
  product_top: 'أعلى صفحة المنتج',
  product_bottom: 'أسفل صفحة المنتج',
  checkout_top: 'أعلى صفحة الدفع',
  footer: 'قبل الفوتر',
};

/* ================= الإعدادات الافتراضية ================= */
export const DEFAULT_CONFIG = {
  brand: { theme: 'spike', color: '#014D6F', font: 'Cairo', radius: 16, columns: 4, card_style: 'soft', logo: '', favicon: '', banner: '', tagline: '', announcement: '', announcement_link: '', night_toggle: true },
  home: { sections: DEFAULT_HOME_SECTIONS },
  contact: { whatsapp: '', phone: '', email: '', address: '' },
  social: { instagram: '', facebook: '', tiktok: '', youtube: '' },
  checkout: { phone2: false, email: false, note: true, address2: false, show_images: true, button_text: 'اطلب الآن · الدفع عند الاستلام', terms_text: '', trust_text: 'الدفع عند الاستلام · معاينة قبل الدفع', one_page: true },
  thankyou: { title: 'تم استلام طلبك 🎉', message: 'شكراً لثقتك! سيتصل بك فريقنا خلال ساعات لتأكيد الطلب.', show_wa_confirm: true, show_track: true, show_share: true, redirect_url: '' },
  payment: { cod_fee: 0 },
  shipping: { free_over: 0, default_price: 60, show_progress: true, courier_cost: 0 },
  protection: { validate_phone: true, block_duplicate_hours: 6, max_orders_per_phone_day: 3, min_fill_seconds: 3, flag_high_value: 3000 },
  seo: { title: '', description: '', og_image: '', robots_index: true },
  policies: { returns: '', about: '' },
  tracking: { gtm_id: '', google_site_verification: '', facebook_domain_verification: '' },
  scarcity: { enabled: true, threshold: 5, text: 'باقي {n} قطع فقط!' },
  popup: { enabled: false, position: 'bottom-start', delay: 6, interval: 18, max_per_visit: 5, text: '{name} من {gov} اشترى «{product}» منذ {ago}' },
  downsell: { enabled: false, trigger: 'exit', delay_seconds: 25, coupon_code: '', title: 'استنى! عندنا لك هدية', body: 'استخدم كود الخصم الآن وأكمل طلبك بسعر أقل.' },
  retarget: { welcome_back: true, welcome_text: 'أهلاً بعودتك! 👋', coupon_code: '', cart_reminder: true, abandoned_msg: 'أهلاً {name} 👋 لاحظنا إنك نسيت طلبك في {store}. كمّله دلوقتي{coupon_line}' },
  cross: { show_on_product: true, show_in_cart: true, title: 'كمّل طلبك بـ', max_items: 4 },
  whatsapp: { enabled: true, message: 'مرحباً، عندي استفسار عن منتج في متجركم', show_on_product: true },
  wa_templates: {
    confirm: 'أهلاً {name} 👋 بنأكد طلبك رقم {order_no} من {store} بقيمة {total}. هل نؤكد الشحن؟',
    shipped: 'طلبك رقم {order_no} من {store} خرج للشحن 🚚 رقم التتبع: {tracking}',
    abandoned: 'أهلاً {name} 👋 لاحظنا إنك نسيت طلبك في {store}. كمّله دلوقتي{coupon_line}',
    promo: 'أهلاً {name} 🎁 عندنا عرض جديد في {store}: {link}',
    review: 'شكراً لتسوقك من {store} 🙏 ممكن تقيّم تجربتك؟ {link}',
  },
  verify: { mode: 'whatsapp', flag_risk: true, threshold: 40, message: 'أهلاً {name}، لتأكيد طلبك رقم {order_no} من {store} من فضلك رد بكلمة (تأكيد).' },
  feed: { brand: '', condition: 'new', google_category: '', include_out_of_stock: false },
  catalog: { title: 'كتالوج المنتجات', show_prices: true, wa_button: true },
  browse: { style: 'orbit', by_cat: {}, flip: true },
  looks: { enabled: true, title: 'تسوّق الإطلالة', items: [] },
  fitting: { enabled: false, title: 'غرفة القياس', models: [], items: {} },
  showcases: { items: [] },
  sizing: { enabled: false, default_chart: '', charts: [], assign: {} },
  domain: { custom_domain: '' },
  currency: 'ج.م',
};

export function mergeConfig(c) {
  const out = {};
  const src = c && typeof c === 'object' ? c : {};
  for (const k of Object.keys(DEFAULT_CONFIG)) {
    const d = DEFAULT_CONFIG[k];
    if (d && typeof d === 'object' && !Array.isArray(d)) {
      out[k] = { ...d, ...(src[k] && typeof src[k] === 'object' ? src[k] : {}) };
    } else {
      out[k] = src[k] ?? d;
    }
  }
  if (!Array.isArray(out.home.sections) || !out.home.sections.length) out.home.sections = DEFAULT_HOME_SECTIONS;
  return out;
}

/* ================= دوال عامة ================= */
export const money = (n, c = 'ج.م') => `${Math.round(Number(n) || 0).toLocaleString('en-US')} ${c}`;
export const num = (v) => { const n = parseFloat(String(v ?? '').replace(/[^\d.\-]/g, '')); return Number.isFinite(n) ? n : 0; };
export const clamp = (n, a, b) => Math.min(b, Math.max(a, n));

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
export function normalizePhone(raw) {
  let s = String(raw || '').replace(/[٠-٩]/g, (d) => String(AR_DIGITS.indexOf(d))).replace(/[^\d+]/g, '');
  if (s.startsWith('+20')) s = '0' + s.slice(3);
  else if (s.startsWith('0020')) s = '0' + s.slice(4);
  else if (s.startsWith('20') && s.length === 12) s = '0' + s.slice(2);
  else if (/^1[0125]\d{8}$/.test(s)) s = '0' + s;
  return s;
}
export const isValidEgPhone = (p) => /^01[0125]\d{8}$/.test(p);
export const intlPhone = (phone) => { const p = normalizePhone(phone); return p.startsWith('0') ? '2' + p : p; };

export const waLink = (phone, text) => `https://wa.me/${intlPhone(phone)}?text=${encodeURIComponent(text || '')}`;

export function fillTemplate(tpl, vars) {
  return String(tpl || '').replace(/\{(\w+)\}/g, (m, k) => (vars && vars[k] !== undefined && vars[k] !== null ? String(vars[k]) : ''));
}

/* السعر الفعلي: لو انتهى عرض الفلاش يرجع السعر لسعر المقارنة */
export function effectivePrice(p, now = Date.now()) {
  const price = Number(p?.price) || 0;
  const cmp = Number(p?.compare_price) || 0;
  if (p?.sale_ends_at && cmp > price && new Date(p.sale_ends_at).getTime() < now) return cmp;
  return price;
}
export function saleActive(p, now = Date.now()) {
  const cmp = Number(p?.compare_price) || 0;
  return cmp > (Number(p?.price) || 0) && (!p?.sale_ends_at || new Date(p.sale_ends_at).getTime() >= now);
}

/* أفضل عرض كمية: offers = [{qty, percent}] أو [{qty, total}] */
export function applyOffer(price, qty, offers) {
  const base = price * qty;
  let best = { total: base, label: '' };
  for (const o of Array.isArray(offers) ? offers : []) {
    const q = Number(o.qty) || 0;
    if (!q || qty < q) continue;
    let total = base;
    if (o.percent) total = base * (1 - Number(o.percent) / 100);
    else if (o.total) total = Number(o.total) * Math.floor(qty / q) + price * (qty % q);
    if (total < best.total) best = { total, label: o.label || '' };
  }
  return { total: Math.round(best.total * 100) / 100, saved: Math.round((base - best.total) * 100) / 100, label: best.label };
}

export function toCSV(rows, columns) {
  const esc = (v) => {
    const s = v === null || v === undefined ? '' : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const head = columns.map((c) => esc(c.label)).join(',');
  const body = rows.map((r) => columns.map((c) => esc(typeof c.get === 'function' ? c.get(r) : r[c.key])).join(',')).join('\n');
  return '﻿' + head + '\n' + body;
}

export function parseCSV(text) {
  const rows = [];
  let row = [], cell = '', q = false;
  const s = String(text || '').replace(/^﻿/, '');
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) {
      if (c === '"' && s[i + 1] === '"') { cell += '"'; i++; }
      else if (c === '"') q = false;
      else cell += c;
    } else if (c === '"') q = true;
    else if (c === ',') { row.push(cell); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i++;
      row.push(cell); cell = '';
      if (row.some((x) => x.trim() !== '')) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell);
  if (row.some((x) => x.trim() !== '')) rows.push(row);
  if (!rows.length) return [];
  const head = rows[0].map((h) => h.trim());
  return rows.slice(1).map((r) => Object.fromEntries(head.map((h, i) => [h, (r[i] ?? '').trim()])));
}

export function trackUrl(courier, no) {
  if (!no) return '';
  if (courier === 'bosta') return `https://bosta.co/tracking-shipment/?lang=ar&trackingNumber=${encodeURIComponent(no)}`;
  if (courier === 'aramex') return `https://www.aramex.com/eg/en/track/results?ShipmentNumber=${encodeURIComponent(no)}`;
  return '';
}

export const dayKey = (d) => {
  const x = new Date(d);
  return `${x.getFullYear()}-${String(x.getMonth() + 1).padStart(2, '0')}-${String(x.getDate()).padStart(2, '0')}`;
};

export function ago(d) {
  const s = Math.max(0, (Date.now() - new Date(d).getTime()) / 1000);
  if (s < 90) return 'لحظات';
  if (s < 3600) return `${Math.round(s / 60)} دقيقة`;
  if (s < 86400) return `${Math.round(s / 3600)} ساعة`;
  return `${Math.round(s / 86400)} يوم`;
}

export const slugify = (s) => String(s || '').toLowerCase().trim().replace(/[^a-z0-9؀-ۿ]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 60);

export const GTM_RE = /^GTM-[A-Z0-9]{4,12}$/;
export const safeUrl = (u) => {
  const s = String(u || '').trim();
  if (!s) return '';
  if (s.startsWith('/') || s.startsWith('#')) return s;
  return /^https?:\/\//i.test(s) ? s : '';
};
export const youtubeId = (u) => {
  const m = String(u || '').match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : '';
};


/* ===== صور الخيارات (مثلاً صورة لكل لون): variants[i].images = { القيمة: رابط } ===== */
export const isHttpUrl = (u) => typeof u === 'string' && /^https?:\/\//i.test(u);
/* صورة المنتج بحسب الاختيارات الحالية، أو '' لو مفيش */
export function optionImage(p, opts) {
  for (const g of (p && p.variants) || []) {
    const u = g && g.images && opts ? g.images[opts[g.name]] : '';
    if (isHttpUrl(u)) return u;
  }
  return '';
}
/* أول خيار له صور (غالباً اللون) */
export function swatchGroup(p) {
  return ((p && p.variants) || []).find((g) => g && g.images && (g.values || []).some((v) => isHttpUrl(g.images[v]))) || null;
}

/* الصورة الثانية = ظهر المنتج: لو القلب شغّال بتتشال من المعرض وتظهر بس لما العميل يضغط على المنتج */
export function splitImages(p, flip = true) {
  const im = (p && Array.isArray(p.images) ? p.images : []).filter(Boolean);
  if (flip && im.length >= 2) return { list: [im[0], ...im.slice(2)], back: im[1] };
  return { list: im, back: '' };
}
