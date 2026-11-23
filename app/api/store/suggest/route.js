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
  const recs = Array.isArray(body.recs) ? body.recs.map((x) => String(x).slice(0, 60)).slice(0, 30) : null;
  const q = String(body.q || '').replace(/[%,_()]/g, ' ').trim().slice(0, 40);
  if (q.length < 2 && !popular && !recs) return NextResponse.json({ ok: true, items: [] });

  let sb;
  try { sb = adminClient(); } catch { return NextResponse.json({ ok: false, items: [] }, { status: 500 }); }
  const store = await getStoreBySlug(sb, body.slug);
  if (!store) return NextResponse.json({ ok: false, items: [] }, { status: 404 });

  const shape = (p) => ({
    id: String(p.id), title: p.title || '', price: Number(p.price) || 0,
    image: Array.isArray(p.images) ? p.images.filter(Boolean)[0] || '' : '',
  });


  /* «قد يعجبك» في السلة: منتجات من نفس أقسام اللي في السلة أولاً، وبعدين الأكثر طلباً. من غير اللي في السلة والنافد. */
  if (recs) {
    const key = storeKey(store);
    const cols = 'id, title, price, compare_price, sale_ends_at, images, variants, track_stock, stock_quantity, category_id';
    const inStock = (p) => p.track_stock === false || (Number(p.stock_quantity) || 0) > 0;
    const skip = new Set(recs);
    const out = [];
    const push = (rows) => (rows || []).forEach((p) => { if (out.length < 6 && !skip.has(String(p.id)) && inStock(p)) { skip.add(String(p.id)); out.push(p); } });
    try {
      if (recs.length) {
        const { data: inCart } = await sb.from('products').select('category_id').eq('store_id', key).in('id', recs);
        const cats = [...new Set((inCart || []).map((r) => r.category_id).filter(Boolean))];
        if (cats.length) {
          const { data } = await sb.from('products').select(cols).eq('store_id', key).eq('status', 'active').in('category_id', cats).order('featured', { ascending: false }).limit(20);
          push(data);
        }
      }
    } catch { /* نكمّل بالاحتياطي */ }
    if (out.length < 6) {
      const since = new Date(Date.now() - 30 * 86400000).toISOString().slice(0, 10);
      let ids = [];
      try {
        const { data: st } = await sb.from('store_product_stats').select('product_id, purchases, carts').eq('store_id', key).gte('day', since).limit(5000);
        const agg = {};
        (st || []).forEach((r) => { agg[r.product_id] = (agg[r.product_id] || 0) + (Number(r.purchases) || 0) * 10 + (Number(r.carts) || 0) * 3; });
        ids = Object.entries(agg).filter(([id, v]) => v > 0 && !skip.has(String(id))).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([id]) => id);
      } catch { /* تجاهل */ }
      if (ids.length) { const { data } = await sb.from('products').select(cols).eq('store_id', key).eq('status', 'active').in('id', ids); const m = new Map((data || []).map((p) => [String(p.id), p])); push(ids.map((i) => m.get(String(i))).filter(Boolean)); }
    }
    if (out.length < 6) {
      const { data } = await sb.from('products').select(cols).eq('store_id', key).eq('status', 'active').order('featured', { ascending: false }).order('created_at', { ascending: false }).limit(20);
      push(data);
    }
    return NextResponse.json({
      ok: true,
      items: out.map((p) => {
        const groups = (Array.isArray(p.variants) ? p.variants : []).filter((g) => g && Array.isArray(g.values) && g.values.length);
        const cmp = Number(p.compare_price) || 0; const pr = Number(p.price) || 0;
        const price = p.sale_ends_at && cmp > pr && new Date(p.sale_ends_at).getTime() < Date.now() ? cmp : pr;
        return { ...shape(p), price, needs: groups.length > 0 };
      }),
    });
  }

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
