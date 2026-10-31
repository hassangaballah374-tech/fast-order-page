import { NextResponse } from 'next/server';
import { adminClient } from '../../../../lib/supabaseAdmin';
import { getStoreFast, storeKey, rateLimit, clientIp } from '../../../../lib/storeServer';
import { getFlow } from '../../../../lib/storeData';
import { OFFER_TYPES } from '../../../../lib/flowKit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/* إحصائيات خطوات الفانل من المتصفح: view (دخول الخطوة)، pass (ضغط «كمّل» في صفحة مخصصة)، decline (رفض عرض) */
export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false }, { status: 400 }); }
  if (!rateLimit(`flow:${clientIp(req)}`, 120, 60_000)) return NextResponse.json({ ok: false }, { status: 429 });
  const ev = String(body.event || '');
  if (!['view', 'pass', 'decline'].includes(ev)) return NextResponse.json({ ok: false }, { status: 400 });
  let sb;
  try { sb = adminClient(); } catch { return NextResponse.json({ ok: false }, { status: 500 }); }
  const store = await getStoreFast(sb, body.slug);
  if (!store) return NextResponse.json({ ok: false }, { status: 404 });
  if (!store.live) return NextResponse.json({ ok: true, skipped: true });
  const sid = storeKey(store);
  const flow = await getFlow(sb, sid, body.flow);
  const step = flow?.steps.find((s) => s.id === body.step);
  if (!flow || !step) return NextResponse.json({ ok: false }, { status: 404 });
  if (ev === 'pass' && step.type !== 'page') return NextResponse.json({ ok: false }, { status: 400 });
  if (ev === 'decline' && !OFFER_TYPES.includes(step.type)) return NextResponse.json({ ok: false }, { status: 400 });
  await sb.rpc('bump_flow_step', { p_store: String(sid), p_flow: flow.id, p_step: step.id, p_view: ev === 'view' ? 1 : 0, p_pass: ev === 'pass' ? 1 : 0, p_decline: ev === 'decline' ? 1 : 0, p_revenue: 0 });
  return NextResponse.json({ ok: true });
}
