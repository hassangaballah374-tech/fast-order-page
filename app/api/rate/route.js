import { NextResponse } from 'next/server';
import { adminClient } from '../../../lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

let cache = { rate: 0, at: 0, source: '' };
const TTL = 10 * 60 * 1000; // نحدّث من المصدر كل 10 دقائق كحد أقصى

async function fetchLive() {
  const urls = [
    ['https://open.er-api.com/v6/latest/USD', (j) => j?.rates?.EGP],
    ['https://api.frankfurter.app/latest?from=USD&to=EGP', (j) => j?.rates?.EGP],
  ];
  for (const [u, pick] of urls) {
    try {
      const r = await fetch(u, { cache: 'no-store', signal: AbortSignal.timeout(5000) });
      if (!r.ok) continue;
      const v = Number(pick(await r.json()));
      if (v > 1) return { rate: v, source: new URL(u).hostname };
    } catch { /* جرّب المصدر التالي */ }
  }
  return null;
}

/* سعر الدولار بالجنيه: سعر الأدمن اليدوي لو موجود، وإلا السعر الحي، وإلا آخر سعر محفوظ */
export async function GET() {
  let manual = 0;
  try {
    const { data } = await adminClient().from('platform_kv').select('value').eq('key', 'usd_egp_manual').maybeSingle();
    manual = Number(data?.value) || 0;
  } catch { /* تجاهل */ }
  if (manual > 0) return NextResponse.json({ rate: manual, source: 'manual', at: new Date().toISOString() }, { headers: { 'Cache-Control': 'no-store' } });

  if (!cache.rate || Date.now() - cache.at > TTL) {
    const live = await fetchLive();
    if (live) cache = { ...live, at: Date.now() };
  }
  if (!cache.rate) return NextResponse.json({ rate: 50, source: 'fallback', at: new Date().toISOString() }, { headers: { 'Cache-Control': 'no-store' } });
  return NextResponse.json({ rate: cache.rate, source: cache.source, at: new Date(cache.at).toISOString() }, { headers: { 'Cache-Control': 'no-store' } });
}
