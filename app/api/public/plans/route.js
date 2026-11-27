import { NextResponse } from 'next/server';
import { adminClient } from '../../../../lib/supabaseAdmin';

export const runtime = 'nodejs';
export const revalidate = 300;

/* الباقات المفعّلة + العمولة للصفحة الرئيسية (بيانات عامة بس) */
export async function GET() {
  try {
    const sb = adminClient();
    const [{ data: plans }, { data: kv }] = await Promise.all([
      sb.from('platform_plans').select('id,name,price,kind,features,highlight,sort_order').eq('enabled', true).order('sort_order'),
      sb.from('platform_kv').select('value').eq('key', 'commission_usd').maybeSingle(),
    ]);
    const c = Number(kv?.value);
    return NextResponse.json({ ok: true, commission: Number.isFinite(c) && c > 0 ? c : 0.03, plans: plans || [] });
  } catch {
    return NextResponse.json({ ok: false, plans: [] });
  }
}
