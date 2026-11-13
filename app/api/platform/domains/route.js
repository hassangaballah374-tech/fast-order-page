import { NextResponse } from 'next/server';
import { adminClient, userFromRequest, isAdminUser } from '../../../../lib/supabaseAdmin';
import { rateLimit } from '../../../../lib/storeServer';
import { vercelReady, domainState, removeDomain, verifyDomain, dnsRecords } from '../../../../lib/vercelDomains';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const bad = (error, status = 400) => NextResponse.json({ ok: false, error }, { status });

/* الأدمن: كل الدومينات المربوطة بالمتاجر + حالتها الحية على Vercel + فصل/إعادة تحقق.
   action: list (مع live:true لفحص Vercel) | verify | remove */
export async function POST(req) {
  let sb;
  try { sb = adminClient(); } catch { return bad('السيرفر غير مهيأ', 500); }
  const user = await userFromRequest(req, sb);
  if (!user) return bad('غير مصرح', 401);
  if (!isAdminUser(user)) return bad('للأدمن فقط', 403);
  if (!rateLimit(`pdom:${user.id}`, 40, 60_000)) return bad('محاولات كثيرة، استنى شوية', 429);
  let body;
  try { body = await req.json(); } catch { return bad('بيانات غير صالحة'); }
  const live = vercelReady();

  if (body.action === 'remove' || body.action === 'verify') {
    const domain = String(body.domain || '').toLowerCase();
    const { data: row } = await sb.from('store_domains').select('domain').eq('domain', domain).maybeSingle();
    if (!row) return bad('الدومين غير موجود', 404);
    if (body.action === 'verify') {
      if (live) { try { await verifyDomain(domain); } catch { /* نكمّل */ } }
      return NextResponse.json({ ok: true });
    }
    if (live) { try { await removeDomain(domain); } catch { /* نكمّل ونمسح من عندنا */ } }
    await sb.from('store_domains').delete().eq('domain', domain);
    return NextResponse.json({ ok: true });
  }

  if (body.action !== 'list') return bad('طلب غير معروف');
  const { data: rows, error } = await sb.from('store_domains').select('domain, store_id, slug, status, created_at').order('created_at', { ascending: false }).limit(500);
  if (error) { console.error('PDOM_LIST', error.message); return NextResponse.json({ ok: true, live, rows: [], missingTable: /store_domains|relation/i.test(error.message) }); }

  const ids = [...new Set((rows || []).map((r) => r.store_id))];
  const names = {};
  if (ids.length) {
    const { data: sp } = await sb.from('store_profiles').select('user_id, store_name, store_slug').in('user_id', ids);
    (sp || []).forEach((s) => { names[String(s.user_id)] = s.store_name || s.store_slug; });
  }

  let out = (rows || []).map((r) => ({ ...r, domain_name: r.domain, store_name: names[String(r.store_id)] || r.slug, records: dnsRecords(r.domain) }));
  if (body.live && live) {
    const head = out.slice(0, 40);
    const states = await Promise.all(head.map((r) => domainState(r.domain).catch(() => null)));
    out = out.map((r, i) => {
      const st = i < 40 ? states[i] : null;
      return st ? { ...r, verified: !!(st.found && st.verified), connected: !!(st.found && st.verified && !st.misconfigured), missingOnVercel: !st.found } : r;
    });
  }
  return NextResponse.json({ ok: true, live, rows: out });
}
