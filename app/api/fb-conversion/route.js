import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase } from '../../../lib/supabase';

function hashData(data) {
  if (!data) return '';
  const cleaned = String(data).trim().toLowerCase();
  return crypto.createHash('sha256').update(cleaned).digest('hex');
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { event_name, event_id, event_source_url, user_data, custom_data } = body;

    // جلب جميع البيكسلات ورموز الوصول المستقلة من قاعدة البيانات
    const { data: storeData } = await supabase.from('store_settings').select('pixel_1, token_1, pixel_2, token_2, pixel_3, token_3, pixel_4, token_4').limit(1).maybeSingle();

    if (!storeData) {
      return NextResponse.json({ success: false, message: 'Store settings not found' }, { status: 200 });
    }

    const pairs = [
      { pixel: storeData.pixel_1, token: storeData.token_1 },
      { pixel: storeData.pixel_2, token: storeData.token_2 },
      { pixel: storeData.pixel_3, token: storeData.token_3 },
      { pixel: storeData.pixel_4, token: storeData.token_4 },
    ].filter(p => p.pixel && p.token);

    if (pairs.length === 0) {
      return NextResponse.json({ success: false, message: 'No valid pixel and token pairs found' }, { status: 200 });
    }

    let rawPhone = user_data?.phone ? String(user_data.phone).replace(/[^0-9]/g, '') : '';
    if (rawPhone.startsWith('01')) rawPhone = '2' + rawPhone;

    // إرسال الأحداث لكل بيكسل برمز الوصول المستقل الخاص به من السيرفر (يعمل في الخلفية دائماً)
    const promises = pairs.map(({ pixel, token }) => {
      const payload = {
        data: [
          {
            event_name: event_name || 'PageView',
            event_time: Math.floor(Date.now() / 1000),
            event_id: event_id || `evt_${Date.now()}_${Math.random()}`,
            event_source_url: event_source_url || '',
            action_source: 'website',
            user_data: {
              ph: rawPhone ? [hashData(rawPhone)] : [],
              fn: user_data?.name ? [hashData(user_data.name.split(' ')[0])] : [],
              ct: user_data?.city ? [hashData(user_data.city)] : [],
              st: user_data?.governorate ? [hashData(user_data.governorate)] : [],
              country: [hashData('eg')],
              client_ip_address: req.headers.get('x-forwarded-for') || '',
              client_user_agent: req.headers.get('user-agent') || '',
            },
            custom_data: {
              currency: 'EGP',
              value: Number(custom_data?.value) || 0,
              content_name: custom_data?.content_name || '',
            }
          }
        ],
        access_token: token.trim(),
      };

      return fetch(`https://graph.facebook.com/v19.0/${pixel.trim()}/events`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }).then(res => res.json()).catch(err => ({ error: err.message }));
    });

    const results = await Promise.all(promises);

    return NextResponse.json({ success: true, results });
  } catch (error) {
    console.error('CAPI Server Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
