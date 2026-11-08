// app/api/webhooks/orders/route.js
// يستقبل طلبات من Shopify / WooCommerce / أي نظام ويكتبها في جدول orders للمتجر.
// يحتاج متغيرين في .env.local وفي Vercel:
//   NEXT_PUBLIC_SUPABASE_URL 
//   SUPABASE_SERVICE_ROLE_KEY   (سري — لا تضعه أبداً في كود المتصفح)
import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { rateLimit, clientIp } from '../../../../lib/storeServer';

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

const safeEq = (a, b) => {
  const x = Buffer.from(String(a)); const y = Buffer.from(String(b));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};
const clip = (v, n) => String(v ?? '').replace(/[\u0000-\u001f]/g, ' ').trim().slice(0, n);

export async function POST(req) {
  /* حد للتخمين على المفتاح السري + حجم الطلب */
  if (!rateLimit(`wh-orders:${clientIp(req)}`, 120, 60_000)) return NextResponse.json({ error: 'too many requests' }, { status: 429 });
  if (Number(req.headers.get('content-length') || 0) > 200_000) return NextResponse.json({ error: 'payload too large' }, { status: 413 });
  const { searchParams } = new URL(req.url);
  const storeId = searchParams.get('store');
  const key = searchParams.get('key');
  if (!storeId || !key || !/^[0-9a-fA-F-]{32,40}$/.test(storeId)) return NextResponse.json({ error: 'missing params' }, { status: 400 });

  const sb = admin();
  const { data: integ } = await sb
    .from('store_integrations')
    .select('enabled, config')
    .eq('store_id', storeId)
    .eq('provider', 'webhook')
    .maybeSingle();

  if (!integ?.enabled || !integ.config?.secret || !safeEq(integ.config.secret, key)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }); }

  const n = normalize(body || {});
  const o = {
    customer_name: clip(n.customer_name, 120) || 'عميل',
    customer_phone: clip(n.customer_phone, 30),
    governorate: clip(n.governorate, 60),
    address: clip(n.address, 400),
    total_price: Math.min(Math.max(Number(n.total_price) || 0, 0), 10_000_000),
    external_id: clip(n.external_id, 80),
    source: clip(n.source, 30) || 'webhook',
  };

  // منع التكرار لو النظام المصدر أعاد إرسال نفس الطلب
  if (o.external_id) {
    const { data: dup } = await sb.from('orders').select('id').eq('store_id', storeId).eq('external_id', o.external_id).maybeSingle();
    if (dup) return NextResponse.json({ ok: true, duplicate: true });
  }

  const { error } = await sb.from('orders').insert([{ ...o, store_id: storeId, status: 'pending' }]);
  if (error) { console.error('WEBHOOK_ORDER_ERROR', error.message); return NextResponse.json({ error: 'could not save order' }, { status: 500 }); }
  return NextResponse.json({ ok: true });
}
