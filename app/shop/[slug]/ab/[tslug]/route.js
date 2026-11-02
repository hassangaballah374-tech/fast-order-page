import { NextResponse } from 'next/server';
import { loadStore } from '../../../../../lib/storeData';
import { pickVariant } from '../../../../../lib/abKit';
import { runAfter } from '../../../../../lib/after';

export const dynamic = 'force-dynamic';

/* رابط اختبار A/B: /shop/<متجرك>/ab/<slug-الاختبار>
   بيوزّع الزوار على صفحات الهبوط بالأوزان، ويثبّت النسخة للزائر (cookie 30 يوم) عشان يشوف نفس الصفحة كل مرة. */
export async function GET(req, { params }) {
  const ctx = await loadStore(params.slug);
  if (!ctx) return new NextResponse('Not found', { status: 404 });
  const { data: t } = await ctx.sb.from('store_ab_tests').select('id, enabled, variants').eq('store_id', ctx.sid).eq('slug', params.tslug).maybeSingle();
  const variants = (Array.isArray(t?.variants) ? t.variants : []).filter((v) => v && v.page);
  if (!t || !t.enabled || !variants.length) return new NextResponse('Not found', { status: 404 });

  const ua = req.headers.get('user-agent') || '';
  const bot = /bot|crawl|spider|facebookexternalhit|preview|slurp/i.test(ua);
  const cname = `spk_ab_${String(t.id).slice(0, 8)}`;
  const saved = req.cookies.get(cname)?.value;
  const v = (!bot && variants.find((x) => x.id === saved)) || (bot ? variants[0] : pickVariant(variants));

  if (!bot) await runAfter(ctx.sb.rpc('bump_ab', { p_store: String(ctx.sid), p_test: String(t.id), p_variant: v.id, p_view: 1, p_order: 0, p_revenue: 0 }));

  const dest = new URL(`/shop/${params.slug}/f/${encodeURIComponent(v.page)}`, req.url);
  new URL(req.url).searchParams.forEach((val, k) => { if (k !== 'ab') dest.searchParams.set(k, val); });
  dest.searchParams.set('ab', `${t.id}.${v.id}`);
  const res = NextResponse.redirect(dest, 302);
  if (!bot) res.cookies.set(cname, v.id, { maxAge: 60 * 60 * 24 * 30, path: '/', sameSite: 'lax' });
  res.headers.set('Cache-Control', 'no-store');
  return res;
}
