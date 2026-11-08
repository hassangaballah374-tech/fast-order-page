// app/api/webhooks/whatsapp/route.js
// يستقبل ردود العملاء من واتساب كلاود (ضغطة زر «تأكيد» أو «إلغاء» على رسالة التأكيد) ويحدّث الطلب.
// الرابط لكل متجر: /api/webhooks/whatsapp?s=<store_id>  — و Verify token = المفتاح السري اللي في «التطبيقات».
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminClient } from '../../../../lib/supabaseAdmin';
import { restoreStockForLines, rateLimit } from '../../../../lib/storeServer';
import { sendText, toIntl } from '../../../../lib/waCloud';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const same = (a, b) => { const x = Buffer.from(String(a || '')), y = Buffer.from(String(b || '')); return x.length > 0 && x.length === y.length && crypto.timingSafeEqual(x, y); };
const ok = (x = {}) => NextResponse.json({ ok: true, ...x });

async function integ(sb, sid) {
  const { data } = await sb.from('store_integrations').select('enabled, config').eq('store_id', sid).eq('provider', 'whatsapp_cloud').maybeSingle();
  return data?.enabled ? data.config || {} : null;
}

// تحقق Meta عند ربط الـ Webhook
export async function GET(req) {
  const u = new URL(req.url);
  const sid = String(u.searchParams.get('s') || '');
  let sb; try { sb = adminClient(); } catch { return new NextResponse('server', { status: 500 }); }
  const c = sid ? await integ(sb, sid) : null;
  if (c && u.searchParams.get('hub.mode') === 'subscribe' && same(c.webhook_secret, u.searchParams.get('hub.verify_token'))) {
    return new NextResponse(String(u.searchParams.get('hub.challenge') || ''), { status: 200 });
  }
  return new NextResponse('forbidden', { status: 403 });
}

export async function POST(req) {
  let sb; try { sb = adminClient(); } catch { return NextResponse.json({ ok: false }, { status: 500 }); }
  const sid = String(new URL(req.url).searchParams.get('s') || '');
  if (!sid) return NextResponse.json({ ok: false }, { status: 400 });
  if (!rateLimit(`wa:${sid}`, 600, 60_000)) return NextResponse.json({ ok: false }, { status: 429 });
  const c = await integ(sb, sid);
  if (!c) return ok({ ignored: 'off' });

  /* توقيع Meta (X-Hub-Signature-256): لو التاجر حط App Secret بنرفض أي طلب مش موقّع منها (يمنع تزوير ضغطات «تأكيد/إلغاء») */
  let raw = '';
  try { raw = await req.text(); } catch { return ok(); }
  if (raw.length > 500_000) return NextResponse.json({ ok: false }, { status: 413 });
  if (c.app_secret) {
    const sig = String(req.headers.get('x-hub-signature-256') || '').replace(/^sha256=/, '');
    const exp = crypto.createHmac('sha256', String(c.app_secret)).update(raw).digest('hex');
    if (!same(exp, sig)) return NextResponse.json({ ok: false, error: 'bad signature' }, { status: 401 });
  }
  let body; try { body = JSON.parse(raw); } catch { return ok(); }
  const msgs = [];
  for (const e of body?.entry || []) for (const ch of e?.changes || []) {
    // نتأكد إن الرسالة وصلت على رقم هذا التاجر
    if (ch?.value?.metadata?.phone_number_id && String(ch.value.metadata.phone_number_id) !== String(c.phone_number_id)) continue;
    for (const m of ch?.value?.messages || []) msgs.push(m);
  }

  for (const m of msgs.slice(0, 20)) {
    const payload = String(m?.button?.payload || m?.interactive?.button_reply?.id || '');
    const [action, id] = payload.split(':');
    if (!['confirm', 'cancel'].includes(action) || !id) continue;

    const { data: o } = await sb.from('orders').select('id, store_id, status, items, customer_phone').eq('id', id).eq('store_id', sid).maybeSingle();
    if (!o) continue;
    if (toIntl(o.customer_phone) !== toIntl(m.from)) continue; // لازم الرد يجي من نفس رقم العميل
    const prev = o.status || 'pending';
    if (prev !== 'pending') continue; // نغيّر الطلبات الجديدة بس

    if (action === 'confirm') {
      await sb.from('orders').update({ status: 'confirmed', verified: true, verified_at: new Date().toISOString(), updated_at: new Date().toISOString() }).eq('id', o.id);
      await sendText(c, m.from, 'تم تأكيد طلبك ✅ شكراً لك، هنتواصل معاك لتجهيز الشحن.');
    } else {
      const items = Array.isArray(o.items) ? o.items : [];
      const ids = [...new Set(items.map((i) => String(i.product_id)))];
      const tracked = new Set();
      if (ids.length) { const { data: p } = await sb.from('products').select('id, track_stock').in('id', ids); (p || []).forEach((x) => { if (x.track_stock !== false) tracked.add(String(x.id)); }); }
      await restoreStockForLines(sb, items.map((i) => ({ product_id: String(i.product_id), qty: Number(i.qty) || 1, options: i.options || {}, track: tracked.has(String(i.product_id)) })));
      await sb.from('orders').update({ status: 'cancelled', updated_at: new Date().toISOString() }).eq('id', o.id);
      await sendText(c, m.from, 'تم إلغاء طلبك. لو غيّرت رأيك تقدر تطلب تاني في أي وقت 🌷');
    }
  }
  return ok();
}
