import { NextResponse } from 'next/server';
import { adminClient } from '../../../../lib/supabaseAdmin';
import { getStoreBySlug, storeKey, rateLimit, clientIp } from '../../../../lib/storeServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* اقتراحات البحث السريعة: أول 6 منتجات نشطة مطابقة للعنوان */
export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, items: [] }, { status: 400 }); }
  if (!rateLimit(`suggest:${clientIp(req)}`, 60, 60_000)) return NextResponse.json({ ok: false, items: [] }, { status: 429 });

  const q = String(body.q || '').replace(/[%,_()]/g, ' ').trim().slice(0, 40);
  if (q.length < 2) return NextResponse.json({ ok: true, items: [] });

  let sb;
  try { sb = adminClient(); } catch { return NextResponse.json({ ok: false, items: [] }, { status: 500 }); }
  const store = await getStoreBySlug(sb, body.slug);
  if (!store) return NextResponse.json({ ok: false, items: [] }, { status: 404 });

  const { data } = await sb.from('products')
    .select('id, title, price, images')
    .eq('store_id', storeKey(store)).eq('status', 'active')
    .ilike('title', `%${q}%`)
    .order('featured', { ascending: false }).limit(6);

  return NextResponse.json({
    ok: true,
    items: (data || []).map((p) => ({
      id: String(p.id), title: p.title || '', price: Number(p.price) || 0,
      image: Array.isArray(p.images) ? p.images.filter(Boolean)[0] || '' : '',
    })),
  });
}
