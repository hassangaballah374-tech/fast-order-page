import crypto from 'crypto';
import { intlPhone } from './storeKit';

const sha = (v) => crypto.createHash('sha256').update(String(v || '').trim().toLowerCase()).digest('hex'); 

async function withTimeout(promise, ms) {
  let t;
  const timeout = new Promise((_, rej) => { t = setTimeout(() => rej(new Error('timeout')), ms); }); 
  try { return await Promise.race([promise, timeout]); } finally { clearTimeout(t); }
}

async function sendFacebook(cfg, ev) {
  const url = `https://graph.facebook.com/v19.0/${encodeURIComponent(cfg.pixel_id)}/events?access_token=${encodeURIComponent(cfg.access_token)}`;
  const names = String(ev.order.customer_name || '').trim().split(/\s+/);
  const body = {
    data: [{
      event_name: ev.name,
      event_time: Math.floor(Date.now() / 1000),
      event_id: ev.eventId,
      action_source: 'website',
      event_source_url: ev.url,
      user_data: {
        ph: [sha(intlPhone(ev.order.customer_phone))],
        fn: [sha(names[0])],
        ...(names.length > 1 ? { ln: [sha(names.slice(1).join(' '))] } : {}),
        country: [sha('eg')],
        client_ip_address: ev.ip,
        client_user_agent: ev.ua,
      },
      custom_data: {
        currency: 'EGP',
        value: Number(ev.order.total_price) || 0,
        content_type: 'product',
        content_ids: (ev.order.items || []).map((i) => String(i.product_id)),
        num_items: (ev.order.items || []).reduce((a, i) => a + (Number(i.qty) || 1), 0),
      },
    }],
    ...(cfg.test_event_code ? { test_event_code: cfg.test_event_code } : {}),
  };
  const res = await withTimeout(fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }), 4000);
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json?.error?.message || `HTTP ${res.status}`);
  return `events_received: ${json.events_received ?? 1}`;
}

async function sendTikTok(cfg, ev) {
  const body = {
    event_source: 'web',
    event_source_id: cfg.pixel_id,
    ...(cfg.test_event_code ? { test_event_code: cfg.test_event_code } : {}),
    data: [{
      event: ev.name === 'Purchase' ? 'CompletePayment' : ev.name,
      event_time: Math.floor(Date.now() / 1000),
      event_id: ev.eventId,
      user: { phone: sha(intlPhone(ev.order.customer_phone)), ip: ev.ip, user_agent: ev.ua },
      page: { url: ev.url },
      properties: {
        currency: 'EGP',
        value: Number(ev.order.total_price) || 0,
        content_type: 'product',
        contents: (ev.order.items || []).map((i) => ({ content_id: String(i.product_id), quantity: Number(i.qty) || 1, price: Number(i.price) || 0 })),
      },
    }],
  };
  const res = await withTimeout(fetch('https://business-api.tiktok.com/open_api/v1.3/event/track/', {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'Access-Token': cfg.access_token }, body: JSON.stringify(body),
  }), 4000);
  const json = await res.json().catch(() => ({}));
  if (!res.ok || (json.code !== undefined && json.code !== 0)) throw new Error(json?.message || `HTTP ${res.status}`);
  return 'ok';
}

/* يرسل حدث الشراء من السيرفر (Conversion API). كل الأخطاء تُسجَّل في آخر حالة ولا توقف الطلب. */
export async function sendCapiPurchase(sb, storeId, { order, ip, ua, url, eventId }) {
  let rows = [];
  try {
    const { data } = await sb.from('store_integrations').select('id, provider, enabled, config').eq('store_id', storeId).in('provider', ['facebook_capi', 'tiktok_capi']);
    rows = (data || []).filter((r) => r.enabled && r.config?.pixel_id && r.config?.access_token);
  } catch { return; }

  await Promise.all(rows.map(async (r) => {
    let status = '';
    try {
      const ev = { name: 'Purchase', order, ip, ua, url, eventId };
      status = r.provider === 'facebook_capi' ? await sendFacebook(r.config, ev) : await sendTikTok(r.config, ev);
      status = `نجح: ${status}`;
    } catch (e) {
      status = `فشل: ${String(e?.message || e).slice(0, 160)}`;
    }
    try {
      await sb.from('store_integrations').update({ config: { ...r.config, last_status: status, last_at: new Date().toISOString() } }).eq('id', r.id);
    } catch { /* تجاهل */ }
  }));
}
