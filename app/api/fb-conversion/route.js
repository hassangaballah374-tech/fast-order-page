import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { adminClient } from '../../../lib/supabaseAdmin';
import { rateLimit, clientIp } from '../../../lib/storeServer';

export const runtime = 'nodejs';

const hashData = (data) => (data ? crypto.createHash('sha256').update(String(data).trim().toLowerCase()).digest('hex') : '');
const str = (v, n = 200) => (typeof v === 'string' ? v.slice(0, n) : '');
const ok = (extra = {}, status = 200) => NextResponse.json({ success: false, ...extra }, { status });

/* مسموح بس لطلبات جاية من نفس الموقع (مش من موقع تاني بيستغل توكنات المتجر) */
function sameOrigin(req) {
  const host = req.headers.get('host') || '';
  for (const h of ['origin', 'referer']) {
    const v = req.headers.get(h);
    if (!v) continue;
    try { return new URL(v).host === host; } catch { return false; }
  }
  return true;
}

export async function POST(req) {
  try {
    if (!sameOrigin(req)) return ok({ message: 'forbidden' }, 403);
    if (!rateLimit(`fbc:${clientIp(req)}`, 60, 60_000)) return ok({ message: 'too many requests' }, 429);

    let body;
    try { body = await req.json(); } catch { return ok({ message: 'invalid' }, 400); }
    if (!body || typeof body !== 'object') return ok({ message: 'invalid' }, 400);
    const event_name = str(body.event_name, 60) || 'PageView';
    const event_id = str(body.event_id, 80);
    const event_source_url = str(body.event_source_url, 500);
    const user_data = body.user_data && typeof body.user_data === 'object' ? body.user_data : {};
    const custom_data = body.custom_data && typeof body.custom_data === 'object' ? body.custom_data : {};

    /* التوكنات تتقرأ بالسيرفر فقط (مش بمفتاح المتصفح) */
    let storeData;
    try {
      ({ data: storeData } = await adminClient().from('store_settings').select('pixel_1, token_1, pixel_2, token_2, pixel_3, token_3, pixel_4, token_4').limit(1).maybeSingle());
    } catch { return ok({ message: 'not configured' }); }
    if (!storeData) return ok({ message: 'Store settings not found' });

    const pairs = [1, 2, 3, 4].map((i) => ({ pixel: storeData[`pixel_${i}`], token: storeData[`token_${i}`] }))
      .filter((p) => p.pixel && p.token && /^\d{5,25}$/.test(String(p.pixel).trim()));
    if (!pairs.length) return ok({ message: 'No valid pixel and token pairs found' });

    let rawPhone = str(user_data.phone, 30).replace(/[^0-9]/g, '');
    if (rawPhone.startsWith('01')) rawPhone = `2${rawPhone}`;
    const fwd = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim();

    await Promise.all(pairs.map(({ pixel, token }) => {
      const payload = {
        data: [{
          event_name,
          event_time: Math.floor(Date.now() / 1000),
          event_id: event_id || `evt_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`,
          event_source_url,
          action_source: 'website',
          user_data: {
            ph: rawPhone ? [hashData(rawPhone)] : [],
            fn: str(user_data.name, 80) ? [hashData(str(user_data.name, 80).split(' ')[0])] : [],
            ct: str(user_data.city, 80) ? [hashData(str(user_data.city, 80))] : [],
            st: str(user_data.governorate, 80) ? [hashData(str(user_data.governorate, 80))] : [],
            country: [hashData('eg')],
            client_ip_address: fwd,
            client_user_agent: str(req.headers.get('user-agent') || '', 300),
          },
          custom_data: { currency: 'EGP', value: Math.max(0, Number(custom_data.value) || 0), content_name: str(custom_data.content_name, 200) },
        }],
        access_token: String(token).trim(),
      };
      return fetch(`https://graph.facebook.com/v19.0/${encodeURIComponent(String(pixel).trim())}/events`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload), signal: AbortSignal.timeout(8000),
      }).then((r) => r.json()).catch(() => null);
    }));

    /* مفيش رد تفصيلي من فيسبوك للمتصفح */
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('CAPI Server Error:', error);
    return ok({ message: 'server error' }, 500);
  }
}
