/* واتساب كلاود (Meta Cloud API): إرسال رسالة تأكيد الطلب تلقائياً بقالب معتمد + زرّين (تأكيد / إلغاء).
   كل تاجر بيربط حسابه هو (Phone number ID + Access token) من «التطبيقات»، فالتكلفة على حسابه عند Meta. */
const GRAPH = 'https://graph.facebook.com/v21.0';

export function toIntl(phone) {
  const d = String(phone || '').replace(/\D/g, '');
  if (d.startsWith('20') && d.length >= 12) return d;
  if (d.startsWith('0') && d.length === 11) return `20${d.slice(1)}`;
  if (d.length === 10 && d.startsWith('1')) return `20${d}`;
  return d;
}

async function call(cfg, body) {
  const res = await fetch(`${GRAPH}/${cfg.phone_number_id}/messages`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${cfg.access_token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ messaging_product: 'whatsapp', ...body }),
  });
  let data = {};
  try { data = await res.json(); } catch { /* ignore */ }
  if (!res.ok) return { ok: false, error: data?.error?.message || `HTTP ${res.status}` };
  return { ok: true, id: data?.messages?.[0]?.id || '' };
}

export function sendTemplate(cfg, to, name, lang, params, payloads) {
  const components = [{ type: 'body', parameters: params.map((t) => ({ type: 'text', text: String(t ?? '').slice(0, 200) || '-' })) }];
  (payloads || []).forEach((p, i) => components.push({ type: 'button', sub_type: 'quick_reply', index: String(i), parameters: [{ type: 'payload', payload: p }] }));
  return call(cfg, { to: toIntl(to), type: 'template', template: { name, language: { code: lang || 'ar' }, components } });
}

export function sendText(cfg, to, text) {
  return call(cfg, { to: toIntl(to), type: 'text', text: { body: String(text).slice(0, 1000) } });
}

/* يُستدعى بعد إنشاء الطلب. لو التكامل مش مفعّل أو ناقص بيرجع من غير أي أثر. */
export async function sendWaConfirm(sb, storeId, order) {
  try {
    const { data: integ } = await sb.from('store_integrations').select('enabled, config').eq('store_id', storeId).eq('provider', 'whatsapp_cloud').maybeSingle();
    const c = integ?.config || {};
    if (!integ?.enabled || !c.auto_confirm || !c.phone_number_id || !c.access_token || !c.template_name) return;
    const r = await sendTemplate(c, order.customer_phone, c.template_name, c.template_lang || 'ar',
      [String(order.customer_name || '').split(' ')[0] || 'عميلنا', order.order_no, Math.round(Number(order.total_price) || 0)],
      [`confirm:${order.id}`, `cancel:${order.id}`]);
    if (r.ok) await sb.from('store_wa_log').insert([{ store_id: storeId, phone: order.customer_phone, template: 'confirm' }]);
    else console.error('WA_CLOUD_SEND_FAIL', r.error);
  } catch (e) { console.error('WA_CLOUD_ERR', e?.message); }
}
