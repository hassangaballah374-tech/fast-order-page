import { NextResponse } from 'next/server';
import { adminClient } from '../../../../lib/supabaseAdmin';
import { getStoreBySlug, storeKey, rateLimit, clientIp, readJson } from '../../../../lib/storeServer';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* اقتراحات البحث السريعة: أول 6 منتجات نشطة مطابقة للعنوان */
export async function POST(req) {
  let body;
  try { body = await readJson(req); } catch { return NextResponse.json({ ok: false, items: [] }, { status: 400 }); }
  if (!rateLimit(`suggest:${clientIp(req)}`, 60, 60_000)) return NextResponse.json({ ok: false, items: [] }, { status: 429 });

  const popular = body.popular === true;
  const q = String(body.q || '').replace(/[%,_()]/g, ' ').trim().slice(0, 40);
  if (q.length < 2 && !popular) return NextResponse.json({ ok: true, items: [] });

  let sb;
  try { sb = adminClient(); } catch { return NextResponse.json({ ok: false, items: [] }, { status: 500 }); }
  const store = await getStoreBySlug(sb, body.slug);
  if (!store) return NextResponse.json({ ok: false, items: [] }, { status: 404 });

  const shape = (p) => ({
    id: String(p.id), title: p.title || '', price: Number(p.price) || 0,
    image: Array.isArray(p.images) ? p.images.filter(Boolean)[0] || '' : '',
  });

  /* «الأكثر طلباً»: أكتر المنتجات مبيعاً آخر 30 يوم (من إحصائيات المنتجات)، ولو مفيش بيانات كفاية نكمّل بالمميّز/الأحدث */
  if (popular) {
    const key = storeKey(store);
    const since = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
    let ids = [];
    try {
      const { data: st } = await sb.from('store_product_stats').select('product_id, purchases, carts, views').eq('store_id', key).gte('day', since).limit(5000);
      const agg = {};
      (st || []).forEach((r) => { const a = (agg[r.product_id] = agg[r.product_id] || { s: 0 }); a.s += (Number(r.purchases) || 0) * 10 + (Number(r.carts) || 0) * 3 + (Number(r.views) || 0) * 0.1; });
      ids = Object.entries(agg).filter(([, a]) => a.s > 0).sort((x, y) => y[1].s - x[1].s).slice(0, 8).map(([id]) => id);
    } catch { /* نكمّل بالاحتياطي */ }
    let list = [];
    if (ids.length) {
      const { data } = await sb.from('products').select('id, title, price, images').eq('store_id', key).eq('status', 'active').in('id', ids);
      const byId = new Map((data || []).map((p) => [String(p.id), p]));
      list = ids.map((id) => byId.get(String(id))).filter(Boolean);
    }
    if (list.length < 4) {
      const { data } = await sb.from('products').select('id, title, price, images').eq('store_id', key).eq('status', 'active').order('featured', { ascending: false }).order('created_at', { ascending: false }).limit(8);
      const have = new Set(list.map((p) => String(p.id)));
      (data || []).forEach((p) => { if (list.length < 8 && !have.has(String(p.id))) list.push(p); });
    }
    return NextResponse.json({ ok: true, items: list.map(shape) });
  }

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
