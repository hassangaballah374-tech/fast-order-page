import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { supabase } from '../../../lib/supabase';

// دالة تشفير البيانات بنظام SHA256 وفقاً لمعايير فيسبوك
function hashData(data) {
  if (!data) return '';
  const cleaned = String(data).trim().toLowerCase();
  return crypto.createHash('sha256').update(cleaned).digest('hex');
}

export async function POST(req) {
  try {
    const body = await req.json();
    const { event_name, event_id, event_source_url, user_data, custom_data } = body;

    // جلب الـ Pixel ID و Access Token من قاعدة البيانات
    const { data: storeData } = await supabase.from('store_settings').select('facebook_pixel_id, facebook_api_token').limit(1).maybeSingle();

    if (!storeData || !storeData.facebook_pixel_id || !storeData.facebook_api_token) {
      return NextResponse.json({ success: false, message: 'Facebook CAPI settings missing' }, { status: 200 });
    }

    const pixelId = storeData.facebook_pixel_id.trim();
    const accessToken = storeData.facebook_api_token.trim();

    // تنسيق رقم الهاتف (إزالة المسافات وإضافة كود مصر +2)
    let rawPhone = user_data?.phone ? String(user_data.phone).replace(/[^0-9]/g, '') : '';
    if (rawPhone.startsWith('01')) rawPhone = '2' + rawPhone;

    const payload = {
      data: [
        {
          event_name: event_name || 'Purchase',
          event_time: Math.floor(Date.now() / 1000),
          event_id: event_id || `evt_${Date.now()}`,
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
      access_token: accessToken,
    };

    // إرسال مباشر لخوادم فيسبوك الرسمية
    const fbRes = await fetch(`https://graph.facebook.com/v19.0/${pixelId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const fbData = await fbRes.json();
    return NextResponse.json({ success: true, fbData });
  } catch (error) {
    console.error('CAPI Server Error:', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
