import { mergeConfig, applyOffer, effectivePrice } from './storeKit';
import { storeStateOf } from './billing';

export async function getStoreBySlug(sb, slug) {
  const s = String(slug || '').toLowerCase().trim();
  if (!/^[a-z0-9-]{1,60}$/.test(s)) return null;
  const { data } = await sb.from('store_profiles').select('*').eq('store_slug', s).maybeSingle();
  if (!data) return null;
  const { data: kv } = await sb.from('platform_kv').select('value').eq('key', 'commission_usd').maybeSingle();
  const st = storeStatus(data, Number(kv?.value) || 0);
  return { ...data, live: st === 'ok', reason: st };
}

/* حالة البيع: ok = يبيع، inactive = لم يفعّله الأدمن، quota = رصيد التاجر لا يكفي عمولة طلب (إلا لو اشتراكه الشهري ساري) */
export function storeStatus(s, platformCommission) {
  return storeStateOf(s, platformCommission);
}

export const storeKey = (store) => String(store.user_id);

export async function getConfig(sb, storeId) {
  const { data } = await sb.from('store_config').select('config').eq('store_id', storeId).maybeSingle();
  return mergeConfig(data?.config);
}

export async function getZones(sb, storeId) {
  const { data } = await sb.from('store_shipping_zones').select('governorate, price, eta, enabled').eq('store_id', storeId).order('governorate');
  return (data || []).filter((z) => z.enabled !== false);
}

export async function checkCoupon(sb, storeId, code, subtotal) {
  const c = String(code || '').trim().toUpperCase();
  if (!c) return { ok: false, message: '' };
  const { data } = await sb.from('store_coupons').select('*').eq('store_id', storeId).eq('code', c).maybeSingle();
  if (!data || data.enabled === false) return { ok: false, message: 'كود الخصم غير صحيح' };
  const now = new Date();
  if (data.starts_at && new Date(data.starts_at) > now) return { ok: false, message: 'كود الخصم لم يبدأ بعد' };
  if (data.ends_at && new Date(data.ends_at) < now) return { ok: false, message: 'انتهت صلاحية كود الخصم' };
  if (data.max_uses !== null && data.max_uses !== undefined && data.uses >= data.max_uses) return { ok: false, message: 'تم استهلاك كود الخصم بالكامل' };
  if (Number(data.min_order) > 0 && subtotal < Number(data.min_order)) {
    return { ok: false, message: `الحد الأدنى للطلب ${Math.round(data.min_order)} للاستفادة من الكود` };
  }
  let discount = 0;
  let freeShip = false;
  if (data.kind === 'percent') discount = (subtotal * Number(data.value)) / 100;
  else if (data.kind === 'fixed') discount = Math.min(Number(data.value), subtotal);
  else if (data.kind === 'free_ship') freeShip = true;
  discount = Math.round(discount * 100) / 100;
  return { ok: true, code: c, kind: data.kind, value: Number(data.value), discount, freeShip, message: 'تم تطبيق الكود' };
}

/* يسعّر السلة بالكامل من قاعدة البيانات (لا نثق في أي سعر قادم من المتصفح) */
export async function priceCart(sb, store, cfg, { items, bump, governorate, coupon }) {
  const storeId = storeKey(store);
  const errors = [];
  const clean = (Array.isArray(items) ? items : []).slice(0, 20).map((i) => ({
    product_id: String(i?.product_id ?? ''),
    qty: Math.max(1, Math.min(50, parseInt(i?.qty, 10) || 1)),
    options: i?.options && typeof i.options === 'object' ? i.options : {},
  })).filter((i) => i.product_id);
  if (!clean.length) return { errors: ['السلة فارغة'] };

  const ids = [...new Set(clean.map((i) => i.product_id))];
  if (bump?.product_id) ids.push(String(bump.product_id));
  const { data: prods } = await sb.from('products').select('*').eq('store_id', storeId).in('id', [...new Set(ids)]);
  const map = new Map((prods || []).map((p) => [String(p.id), p]));
  const tracked = (p) => p.track_stock !== false;

  const lines = [];
  for (const it of clean) {
    const p = map.get(it.product_id);
    if (!p || (p.status && p.status !== 'active')) { errors.push('منتج غير متاح'); continue; }
    if (tracked(p)) {
      const stock = Number(p.stock_quantity) || 0;
      if (stock < it.qty) {
        errors.push(stock <= 0 ? `نفدت كمية «${p.title}»` : `المتاح من «${p.title}» ${stock} فقط`);
        continue;
      }
    }
    const groups = Array.isArray(p.variants) ? p.variants : [];
    const opts = {};
    let optOk = true;
    for (const g of groups) {
      const chosen = it.options?.[g.name];
      if (!chosen || !Array.isArray(g.values) || !g.values.includes(chosen)) { optOk = false; break; }
      opts[g.name] = chosen;
    }
    if (!optOk) { errors.push(`اختر ${groups.map((g) => g.name).join(' و ')} لـ «${p.title}»`); continue; }
    const price = effectivePrice(p);
    const o = applyOffer(price, it.qty, p.offers);
    lines.push({
      product_id: String(p.id), title: p.title, image: Array.isArray(p.images) ? p.images[0] || '' : '',
      price, qty: it.qty, options: opts, line_total: o.total, offer: o.label, saved: o.saved,
      unit_cost: Number(p.cost_price) || 0, track: tracked(p),
    });
  }

  if (bump?.product_id && !errors.length) {
    const host = clean.map((i) => map.get(i.product_id)).find((p) => p?.upsell && String(p.upsell.product_id) === String(bump.product_id));
    const bp = map.get(String(bump.product_id));
    const groups = Array.isArray(bp?.variants) ? bp.variants : [];
    const okStock = bp && (!tracked(bp) || (Number(bp.stock_quantity) || 0) >= 1);
    if (host && bp && groups.length === 0 && (!bp.status || bp.status === 'active') && okStock) {
      const pct = Math.min(90, Math.max(0, Number(host.upsell.percent) || 0));
      const price = effectivePrice(bp);
      lines.push({
        product_id: String(bp.id), title: bp.title, image: Array.isArray(bp.images) ? bp.images[0] || '' : '',
        price, qty: 1, options: {}, line_total: Math.round(price * (1 - pct / 100) * 100) / 100, offer: pct ? `عرض خاص ${pct}%` : '',
        saved: Math.round(price * (pct / 100) * 100) / 100, unit_cost: Number(bp.cost_price) || 0, track: tracked(bp), bump: true,
      });
    }
  }

  if (errors.length) return { errors: [...new Set(errors)] };

  const subtotal = Math.round(lines.reduce((a, l) => a + l.line_total, 0) * 100) / 100;
  const cp = coupon ? await checkCoupon(sb, storeId, coupon, subtotal) : { ok: false };
  const discount = cp.ok ? cp.discount : 0;

  let shipping = 0;
  let freeOver = Number(cfg.shipping.free_over) || 0;
  if (governorate) {
    const zones = await getZones(sb, storeId);
    if (zones.length) {
      const z = zones.find((x) => x.governorate === governorate);
      if (!z) return { errors: ['التوصيل غير متاح لهذه المحافظة'] };
      shipping = Number(z.price) || 0;
    } else {
      shipping = Number(cfg.shipping.default_price) || 0;
    }
    const after = subtotal - discount;
    if ((freeOver > 0 && after >= freeOver) || cp.freeShip) shipping = 0;
  }

  const codFee = Math.max(0, Number(cfg.payment?.cod_fee) || 0);
  const total = Math.max(0, Math.round((subtotal - discount + shipping + codFee) * 100) / 100);
  const cost = Math.round(lines.reduce((a, l) => a + l.unit_cost * l.qty, 0) * 100) / 100;
  return { lines, subtotal, discount, shipping, codFee, total, cost, freeOver, coupon: cp.ok ? cp : null, errors: [] };
}

/* خصم المخزون للمنتجات المتتبَّعة (مع تراجع كامل لو فشل أي منتج) */
export async function takeStockForLines(sb, lines) {
  const taken = [];
  for (const l of lines) {
    if (!l.track) continue;
    const { data: ok } = await sb.rpc('take_stock', { p_product: l.product_id, p_qty: l.qty });
    if (!ok) {
      for (const t of taken) await sb.rpc('take_stock', { p_product: t.product_id, p_qty: -t.qty });
      return { ok: false, failed: l.title };
    }
    taken.push(l);
  }
  return { ok: true, taken };
}

export async function restoreStockForLines(sb, lines) {
  for (const l of lines) {
    if (l.track) await sb.rpc('take_stock', { p_product: l.product_id, p_qty: -l.qty });
  }
}

export function orderRowItems(lines) {
  return lines.map((l) => ({
    product_id: l.product_id, title: l.title, image: l.image, price: l.price, qty: l.qty, options: l.options,
    line_total: l.line_total, offer: l.offer, bump: !!l.bump, unit_cost: l.unit_cost,
  }));
}

const hits = new Map();
export function rateLimit(key, max, windowMs) {
  const now = Date.now();
  const arr = (hits.get(key) || []).filter((t) => now - t < windowMs);
  arr.push(now);
  hits.set(key, arr);
  if (hits.size > 5000) hits.clear();
  return arr.length <= max;
}

export function clientIp(req) {
  const f = req.headers.get('x-forwarded-for') || '';
  return f.split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown';
}
