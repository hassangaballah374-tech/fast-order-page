import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminClient } from '../../../../lib/supabaseAdmin';
import { sendTemplate } from '../../../../lib/waCloud';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

const same = (a, b) => { const x = Buffer.from(String(a || '')), y = Buffer.from(String(b || '')); return x.length > 0 && x.length === y.length && crypto.timingSafeEqual(x, y); };
const PER_STORE = 30;

/* استرجاع السلات المتروكة تلقائياً بواتساب كلاود (قالب معتمد). يُستدعى من مجدول خارجي كل 10-15 دقيقة.
   الحماية: CRON_SECRET في الهيدر Authorization: Bearer <secret> (أو ?key= كحل أخير). */
export async function GET(req) {
  const secret = process.env.CRON_SECRET || '';
  const auth = String(req.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  const key = new URL(req.url).searchParams.get('key') || '';
  if (!secret || !(same(secret, auth) || same(secret, key))) return NextResponse.json({ ok: false }, { status: 401 });

  let sb; try { sb = adminClient(); } catch { return NextResponse.json({ ok: false }, { status: 500 }); }
  const { data: integs } = await sb.from('store_integrations').select('store_id, config').eq('provider', 'whatsapp_cloud').eq('enabled', true);
  const platform = (process.env.PLATFORM_HOST || 'fast-order-page.vercel.app').toLowerCase();
  let sent = 0, failed = 0;

  for (const it of integs || []) {
    const c = it.config || {};
    if (!c.auto_recover || !c.recover_template || !c.phone_number_id || !c.access_token) continue;
    const mins = Math.min(1440, Math.max(15, parseInt(c.recover_after_min, 10) || 60));
    const before = new Date(Date.now() - mins * 60000).toISOString();
    const after = new Date(Date.now() - 3 * 86400000).toISOString();

    const { data: carts } = await sb.from('abandoned_carts').select('id, phone, customer_name, updated_at')
      .eq('store_id', it.store_id).eq('recovered', false).is('wa_sent_at', null)
      .lte('updated_at', before).gte('updated_at', after).order('updated_at', { ascending: true }).limit(PER_STORE);
    if (!carts || !carts.length) continue;

    const [{ data: store }, { data: dom }] = await Promise.all([
      sb.from('store_profiles').select('store_name, store_slug').eq('user_id', it.store_id).maybeSingle(),
      sb.from('store_domains').select('domain').eq('store_id', it.store_id).maybeSingle(),
    ]);
    if (!store?.store_slug) continue;
    const link = dom?.domain ? `https://${dom.domain}/cart` : `https://${platform}/shop/${store.store_slug}/cart`;

    for (const a of carts) {
      /* لو العميل عمل طلب بعد ما ترك السلة: نعلّمها مسترجعة ومنبعتش */
      const { data: ord } = await sb.from('orders').select('id').eq('store_id', it.store_id).eq('customer_phone', a.phone).gte('created_at', a.updated_at).limit(1);
      if (ord && ord.length) { await sb.from('abandoned_carts').update({ recovered: true }).eq('id', a.id); continue; }
      const r = await sendTemplate(c, a.phone, c.recover_template, c.recover_lang || 'ar',
        [String(a.customer_name || '').split(' ')[0] || 'عميلنا', store.store_name || 'متجرنا', link]);
      if (r.ok) {
        sent++;
        await sb.from('abandoned_carts').update({ wa_sent_at: new Date().toISOString() }).eq('id', a.id);
        await sb.from('store_wa_log').insert([{ store_id: it.store_id, phone: a.phone, template: 'abandoned' }]);
      } else {
        failed++;
        console.error('WA_RECOVER_FAIL', r.error);
        if (/token|expired|permission|OAuth/i.test(String(r.error))) break; // مفتاح التاجر مش شغال، نوقف باقي سلاته
        await sb.from('abandoned_carts').update({ wa_sent_at: new Date().toISOString() }).eq('id', a.id); // منكررش المحاولة على رقم فاشل
      }
    }
  }
  return NextResponse.json({ ok: true, sent, failed });
}
