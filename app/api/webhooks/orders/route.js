// app/api/webhooks/orders/route.js
// يستقبل طلبات من Shopify / WooCommerce / أي نظام ويكتبها في جدول orders للمتجر.
// يحتاج متغيرين في .env.local وفي Vercel:
//   NEXT_PUBLIC_SUPABASE_URL 
//   SUPABASE_SERVICE_ROLE_KEY   (سري — لا تضعه أبداً في كود المتصفح)
import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const admin = () =>
  createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false },
  });

// تحويل شكل Shopify / WooCommerce / عام إلى شكل جدول orders عندك
function normalize(body) {
  // Shopify: orders/create
  if (body?.shipping_address || body?.total_price !== undefined && body?.line_items) {
    const a = body.shipping_address || body.billing_address || {};
    return {
      customer_name: [a.first_name, a.last_name].filter(Boolean).join(' ') || body.customer?.first_name || 'عميل',
      customer_phone: a.phone || body.phone || body.customer?.phone || '',
      governorate: a.province || a.city || '',
      address: [a.address1, a.address2].filter(Boolean).join(' '),
      total_price: Number(body.total_price) || 0,
      external_id: String(body.id ?? body.name ?? ''),
      source: 'shopify',
    };
  }
  // WooCommerce
  if (body?.billing) {
    const b = body.billing;
    return {
      customer_name: [b.first_name, b.last_name].filter(Boolean).join(' ') || 'عميل',
      customer_phone: b.phone || '',
      governorate: b.state || b.city || '',
      address: [b.address_1, b.address_2].filter(Boolean).join(' '),
      total_price: Number(body.total) || 0,
      external_id: String(body.id ?? ''),
      source: 'woocommerce',
    };
  }
  // عام / EasyOrders / أي نظام
  return {
    customer_name: body.customer_name || body.name || 'عميل',
    customer_phone: body.customer_phone || body.phone || '',
    governorate: body.governorate || body.city || '',
    address: body.address || '',
    total_price: Number(body.total_price ?? body.total) || 0,
    external_id: String(body.id ?? body.order_id ?? ''),
    source: body.source || 'webhook',
  };
}

export async function POST(req) {
  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get('store');
  const key = searchParams.get('key');
  if (!storeId || !key) return NextResponse.json({ error: 'missing params' }, { status: 400 });

  const sb = admin();
  const { data: integ } = await sb
    .from('store_integrations')
    .select('enabled, config')
    .eq('store_id', storeId)
    .eq('provider', 'webhook')
    .maybeSingle();

  if (!integ?.enabled || !integ.config?.secret || integ.config.secret !== key) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }); }

  const o = normalize(body);

  // منع التكرار لو النظام المصدر أعاد إرسال نفس الطلب
  if (o.external_id) {
    const { data: dup } = await sb.from('orders').select('id').eq('store_id', storeId).eq('external_id', o.external_id).maybeSingle();
    if (dup) return NextResponse.json({ ok: true, duplicate: true });
  }

  const { error } = await sb.from('orders').insert([{ ...o, store_id: storeId, status: 'pending' }]);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
