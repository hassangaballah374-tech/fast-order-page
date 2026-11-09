/* استيراد المنتجات من Excel/CSV: ربط الأعمدة (عربي/إنجليزي) وتنظيف القيم وتصنيف الصفوف (جديد/تحديث/تخطي/خطأ) */

const norm = (h) => String(h || '').toLowerCase()
  .replace(/[ً-ْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ى/g, 'ي').replace(/ة/g, 'ه')
  .replace(/[\s_\-/\\()*:.]+/g, '');

const ALIASES = {
  title: ['title', 'name', 'product', 'productname', 'اسم', 'الاسم', 'اسم المنتج', 'المنتج', 'اسم الصنف', 'الصنف'],
  price: ['price', 'sellingprice', 'saleprice', 'السعر', 'سعر البيع', 'سعر المنتج', 'سعر'],
  compare_price: ['compareprice', 'compareatprice', 'oldprice', 'originalprice', 'السعر قبل الخصم', 'سعر قبل الخصم', 'السعر القديم', 'السعر الاصلي'],
  cost_price: ['costprice', 'cost', 'سعر التكلفة', 'التكلفة', 'سعر الشراء', 'تكلفة'],
  stock: ['stock', 'quantity', 'qty', 'stockquantity', 'الكمية', 'المخزون', 'الكمية المتاحة', 'العدد', 'كمية'],
  sku: ['sku', 'code', 'productcode', 'barcode', 'الكود', 'كود المنتج', 'كود', 'الباركود', 'باركود'],
  category: ['category', 'القسم', 'التصنيف', 'الفئة', 'قسم', 'تصنيف'],
  images: ['image', 'images', 'imageurl', 'photo', 'photos', 'الصورة', 'الصور', 'رابط الصورة', 'روابط الصور', 'صورة'],
  description: ['description', 'desc', 'الوصف', 'وصف المنتج', 'التفاصيل', 'وصف'],
  status: ['status', 'الحالة', 'حالة المنتج', 'حالة'],
};
const ALIAS_MAP = {};
for (const [k, list] of Object.entries(ALIASES)) for (const a of list) ALIAS_MAP[norm(a)] = k;

export const FIELD_LABELS = { title: 'الاسم', price: 'السعر', compare_price: 'السعر قبل الخصم', cost_price: 'سعر التكلفة', stock: 'الكمية', sku: 'الكود', category: 'القسم', images: 'الصور', description: 'الوصف', status: 'الحالة' };

export const TEMPLATE_HEAD = ['الاسم', 'السعر', 'السعر قبل الخصم', 'سعر التكلفة', 'الكمية', 'الكود', 'القسم', 'الصور', 'الوصف', 'الحالة'];
export const TEMPLATE_ROWS = [
  ['قميص قطن', '250', '300', '120', '50', 'SH-01', 'ملابس', 'https://example.com/a.jpg', 'قميص قطن 100%', 'نشط'],
  ['حذاء رياضي', '599', '', '350', '20', 'SN-02', 'أحذية', 'https://example.com/b.jpg | https://example.com/c.jpg', '', 'نشط'],
];

const AR_DIGITS = { '٠': '0', '١': '1', '٢': '2', '٣': '3', '٤': '4', '٥': '5', '٦': '6', '٧': '7', '٨': '8', '٩': '9', '۰': '0', '۱': '1', '۲': '2', '۳': '3', '۴': '4', '۵': '5', '۶': '6', '۷': '7', '۸': '8', '۹': '9' };

/* رقم من نص: بيفهم الأرقام العربية والفواصل وكلمة جنيه/EGP. بيرجع null لو فاضي أو مش رقم */
export function parseNum(v) {
  let s = String(v ?? '').trim();
  if (!s) return null;
  s = s.replace(/[٠-٩۰-۹]/g, (d) => AR_DIGITS[d]).replace(/[٫]/g, '.').replace(/[٬,\s]/g, '').replace(/[^\d.\-]/g, '');
  if (!s || s === '.' || s === '-') return null;
  const n = Number(s);
  return Number.isFinite(n) ? Math.round(n * 100) / 100 : null;
}

const DRAFT = new Set(['draft', 'hidden', 'inactive', 'off', 'no', '0', 'false', 'مسودة', 'مسوده', 'مخفي', 'مخفى', 'غيرنشط', 'غيرمفعل', 'متوقف']);
const parseStatus = (v) => {
  const s = norm(v);
  if (!s) return null;
  return DRAFT.has(s) ? 'draft' : 'active';
};

const parseImages = (v) => String(v || '').split(/[\s,|;\n]+/).map((x) => x.trim()).filter((x) => /^https?:\/\/\S+$/i.test(x)).slice(0, 10);

export const MAX_ROWS = 2000;

/* rows: مصفوفة صفوف (الأول هو العناوين). */
export function parseProductRows(rows) {
  if (!rows || rows.length < 2) return { error: 'الملف فاضي أو مفيهوش بيانات تحت صف العناوين', items: [], mapped: [], ignored: [] };
  const head = rows[0].map((h) => ALIAS_MAP[norm(h)] || null);
  const mapped = [...new Set(head.filter(Boolean))];
  const ignored = rows[0].filter((h, i) => !head[i] && String(h || '').trim());
  if (!mapped.includes('title')) return { error: 'ماقدرتش ألاقي عمود اسم المنتج. اسم العمود لازم يكون «الاسم» أو «اسم المنتج» أو title', items: [], mapped, ignored };
  if (rows.length - 1 > MAX_ROWS) return { error: `الملف فيه أكتر من ${MAX_ROWS} صف. قسّمه على أكتر من ملف`, items: [], mapped, ignored };

  const get = (r, key) => { const i = head.indexOf(key); return i >= 0 ? String(r[i] ?? '').trim() : ''; };
  const seen = new Set();
  const items = rows.slice(1).map((r, idx) => {
    const sku = get(r, 'sku').slice(0, 60);
    const it = {
      line: idx + 2,
      title: get(r, 'title').slice(0, 150),
      price: parseNum(get(r, 'price')),
      compare: parseNum(get(r, 'compare_price')),
      cost: parseNum(get(r, 'cost_price')),
      stock: (() => { const n = parseNum(get(r, 'stock')); return n === null ? null : Math.max(0, Math.floor(n)); })(),
      sku,
      category: get(r, 'category').slice(0, 80),
      images: parseImages(get(r, 'images')),
      description: get(r, 'description').slice(0, 5000),
      status: parseStatus(get(r, 'status')),
      errors: [],
    };
    if (get(r, 'price') && it.price === null) it.errors.push('السعر مش رقم');
    if (it.price !== null && it.price < 0) it.errors.push('السعر سالب');
    if (sku) { const k = sku.toLowerCase(); if (seen.has(k)) it.errors.push('كود مكرر في الملف'); seen.add(k); }
    return it;
  }).filter((it) => it.title || it.sku || it.price !== null);
  return { items, mapped, ignored, error: '' };
}

/* mode: 'update' (يحدّث الموجود بنفس الكود) | 'skip' (يتخطاه) | 'add' (يضيف دايماً)
   existing: منتجات المتجر الحالية. cats: الأقسام الحالية. */
export function planImport(items, existing, cats, mode) {
  const bySku = new Map();
  for (const p of existing || []) if (p.sku) bySku.set(String(p.sku).trim().toLowerCase(), p);
  const catByName = new Map((cats || []).map((c) => [String(c.name).trim().toLowerCase(), c]));

  return items.map((it) => {
    const out = { ...it, action: 'invalid', target: null, missingCat: '' };
    if (it.errors.length) return out;
    const found = it.sku && mode !== 'add' ? bySku.get(it.sku.toLowerCase()) : null;
    if (found) {
      if (mode === 'skip') { out.action = 'skip'; out.target = found; out.note = 'الكود موجود'; return out; }
      out.action = 'update'; out.target = found;
    } else {
      if (!it.title) { out.errors.push('بدون اسم'); return out; }
      if (!(it.price > 0)) { out.errors.push('السعر مطلوب وأكبر من صفر'); return out; }
      out.action = 'insert';
    }
    if (it.category) {
      const c = catByName.get(it.category.toLowerCase());
      if (c) out.category_id = String(c.id); else out.missingCat = it.category;
    }
    return out;
  });
}

/* صف جاهز للإدخال في جدول products */
export function insertPayload(p, uid, catId) {
  const price = p.price;
  return {
    store_id: uid, title: p.title, price,
    compare_price: p.compare && p.compare > price ? p.compare : null,
    cost_price: p.cost || 0,
    stock_quantity: p.stock ?? 100, track_stock: true,
    sku: p.sku || null, category_id: catId || null,
    images: p.images, description: p.description, status: p.status || 'active',
  };
}

/* تحديث: بنغيّر بس الحقول اللي اتكتبت فعلاً في الملف (الخلايا الفاضية ماتمسحش حاجة) */
export function updatePatch(p, catId) {
  const o = {};
  if (p.title) o.title = p.title;
  if (p.price > 0) o.price = p.price;
  if (p.compare !== null) o.compare_price = p.compare && p.compare > (p.price > 0 ? p.price : Number(p.target?.price) || 0) ? p.compare : null;
  if (p.cost !== null) o.cost_price = p.cost;
  if (p.stock !== null) { o.stock_quantity = p.stock; o.track_stock = true; }
  if (catId) o.category_id = catId;
  if (p.images.length) o.images = p.images;
  if (p.description) o.description = p.description;
  if (p.status) o.status = p.status;
  return o;
}
