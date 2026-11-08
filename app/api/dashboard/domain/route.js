import { NextResponse } from 'next/server';
import { adminClient, userFromRequest, isAdminUser } from '../../../../lib/supabaseAdmin';
import { rateLimit, clientIp, readJson } from '../../../../lib/storeServer';
import { vercelReady, addDomain, domainState, verifyDomain, removeDomain, dnsRecords } from '../../../../lib/vercelDomains';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const RX = /^(?!-)([a-z0-9-]{1,63}\.)+[a-z]{2,24}$/;
const BLOCKED = /(^|\.)(vercel\.app|vercel\.com|localhost|local|internal)$/;
const bad = (error, status = 400) => NextResponse.json({ ok: false, error }, { status });

const clean = (v) => String(v || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '').replace(/^www\./, '');

/* ربط دومين خاص بمتجر التاجر. action: get | connect | verify | remove */
export async function POST(req) {
  let sb;
  try { sb = adminClient(); } catch { return bad('السيرفر غير مهيأ', 500); }
  const user = await userFromRequest(req, sb);
  if (!user) return bad('غير مصرح', 401);
  if (!rateLimit(`dom:${user.id}`, 30, 60_000) || !rateLimit(`domip:${clientIp(req)}`, 60, 60_000)) return bad('محاولات كثيرة، استنى شوية', 429);
  let body;
  try { body = await readJson(req); } catch { return bad('بيانات غير صالحة'); }

  const storeId = isAdminUser(user) && body.uid ? String(body.uid) : user.id;
  const { data: store } = await sb.from('store_profiles').select('user_id, store_slug').eq('user_id', storeId).maybeSingle();
  if (!store?.store_slug) return bad('أنشئ متجرك الأول', 404);

  const { data: row } = await sb.from('store_domains').select('domain, status').eq('store_id', storeId).maybeSingle();
  const live = vercelReady();

  const report = async (r) => {
    if (!r) return NextResponse.json({ ok: true, live, domain: '' });
    let st = null;
    if (live) { try { st = await domainState(r.domain); } catch { st = null; } }
    const verified = st ? st.found && st.verified : false;
    const connected = st ? st.found && st.verified && !st.misconfigured : false;
    if (live && st?.found && connected && r.status !== 'active') {
      await sb.from('store_domains').update({ status: 'active', updated_at: new Date().toISOString() }).eq('domain', r.domain);
      r.status = 'active';
    }
    return NextResponse.json({
      ok: true, live, domain: r.domain, status: r.status,
      verified, connected,
      verification: st?.verification || [],
      records: dnsRecords(r.domain),
    });
  };

  if (body.action === 'get') return report(row);

  if (body.action === 'remove') {
    if (!row) return NextResponse.json({ ok: true });
    if (live) { try { await removeDomain(row.domain); } catch { /* نكمّل ونمسح من عندنا */ } }
    await sb.from('store_domains').delete().eq('domain', row.domain);
    return NextResponse.json({ ok: true });
  }

  if (body.action === 'verify') {
    if (!row) return bad('مفيش دومين مربوط');
    if (live) { try { await verifyDomain(row.domain); } catch { /* */ } }
    return report(row);
  }

  if (body.action === 'connect') {
    const d = clean(body.domain);
    if (!RX.test(d) || BLOCKED.test(d)) return bad('اكتب دومين صحيح مثل shop.example.com');
    if (row && row.domain === d) return report(row);
    const { data: taken } = await sb.from('store_domains').select('store_id').eq('domain', d).maybeSingle();
    if (taken && String(taken.store_id) !== String(storeId)) return bad('الدومين ده مستخدم في متجر تاني');

    if (live) {
      let r;
      try { r = await addDomain(d); } catch { return bad('تعذر الاتصال بـ Vercel، جرّب بعد شوية', 502); }
      if (!r.ok) { if (r.fatal) console.error('VERCEL_DOMAIN_AUTH'); return bad(r.error, r.fatal ? 502 : 400); }
      if (row) { try { await removeDomain(row.domain); } catch { /* */ } }
    }
    if (row) await sb.from('store_domains').delete().eq('domain', row.domain);
    const rec = { domain: d, store_id: storeId, slug: store.store_slug, status: live ? 'pending' : 'manual', updated_at: new Date().toISOString() };
    const { error } = await sb.from('store_domains').insert(rec);
    if (error) { console.error('STORE_DOMAIN_SAVE', error.message); return bad('تعذر حفظ الدومين. تأكد من تشغيل ملف store_domains.sql', 500); }
    return report(rec);
  }

  return bad('طلب غير معروف');
}
