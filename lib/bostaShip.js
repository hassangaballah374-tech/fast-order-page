import { BOSTA_CITY } from './storeKit';

/* شحن الطلبات عبر بوسطة: مشترك بين الإرسال اليدوي (من الطلبات) والتلقائي (بعد تسجيل الطلب أو تأكيد العميل) */
const BOSTA_URL = 'https://app.bosta.co/api/v2/deliveries';
 
export async function sendToBosta(apiKey, order) {
  const full = String(order.customer_name || '').trim().split(/\s+/);
  const items = Array.isArray(order.items) ? order.items : [];
  const desc = items.map((i) => `${i.title} x${i.qty}`).join(', ').slice(0, 200) || 'Order';
  const body = {
    type: 10,
    specs: { packageType: 'Parcel', size: 'SMALL', packageDetails: { itemsCount: items.reduce((a, i) => a + (Number(i.qty) || 1), 0) || 1, description: desc } },
    cod: Math.round(Number(order.total_price) || 0),
    dropOffAddress: { city: BOSTA_CITY[order.governorate] || order.governorate, firstLine: String(order.address || '').slice(0, 250) },
    receiver: { firstName: full[0] || 'Customer', lastName: full.slice(1).join(' ') || '-', phone: order.customer_phone, ...(order.email ? { email: order.email } : {}) },
    businessReference: String(order.order_no || order.id),
    ...(order.notes ? { notes: String(order.notes).slice(0, 200) } : {}),
  };
  const res = await fetch(BOSTA_URL, { method: 'POST', headers: { Authorization: apiKey, 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  let data = {};
  try { data = await res.json(); } catch { /* ignore */ }
  if (!res.ok) return { ok: false, error: data?.message || data?.error || `Bosta HTTP ${res.status}` };
  const d = data?.data || data;
  const tracking = d?.trackingNumber || d?.tracking_number;
  if (!tracking) return { ok: false, error: 'لم يرجع رقم تتبع من بوسطة' };
  return { ok: true, tracking: String(tracking), ref: d?._id || d?.id || '' };
}


/* وضع الشحن التلقائي المحفوظ في إعدادات بوسطة: off | immediate | after_confirm */
export async function bostaIntegration(sb, storeId) {
  const { data } = await sb.from('store_integrations').select('enabled, config').eq('store_id', storeId).eq('provider', 'bosta').maybeSingle();
  if (!data?.enabled || !data?.config?.api_key) return null;
  return data.config;
}

async function noteAutoError(sb, storeId, order, msg) {
  try {
    const { data } = await sb.from('store_integrations').select('config').eq('store_id', storeId).eq('provider', 'bosta').maybeSingle();
    const config = { ...(data?.config || {}), last_auto_error: { at: new Date().toISOString(), order_no: order.order_no || '', msg: String(msg || '').slice(0, 200) } };
    await sb.from('store_integrations').update({ config }).eq('store_id', storeId).eq('provider', 'bosta');
  } catch { /* مش مهم */ }
}

/* شحن تلقائي: when = 'immediate' (طلب جديد) أو 'after_confirm' (العميل أكد من واتساب). لو فشل الطلب بيفضل زي ما هو والتاجر يشحنه يدوي. */
export async function autoShipBosta(sb, storeId, order, when) {
  try {
    const cfg = await bostaIntegration(sb, storeId);
    if (!cfg || cfg.auto_ship !== when) return { ok: false, skipped: true };
    if (order.tracking_number || order.hold_until) return { ok: false, skipped: true };
    /* الطلبات المشبوهة (أي علامة مخاطر) ماتتشحنش تلقائي */
    if (when === 'immediate' && ((Array.isArray(order.flags) && order.flags.length) || Number(order.risk_score) > 0)) return { ok: false, skipped: true };
    const r = await sendToBosta(String(cfg.api_key), order);
    if (!r.ok) { console.error('BOSTA_AUTO_FAIL', r.error); await noteAutoError(sb, storeId, order, r.error); return r; }
    await sb.from('orders').update({ courier: 'bosta', tracking_number: r.tracking, courier_ref: r.ref, status: 'shipped', updated_at: new Date().toISOString() }).eq('id', order.id).is('tracking_number', null);
    return r;
  } catch (e) { console.error('BOSTA_AUTO_ERR', e?.message); return { ok: false }; }
}
