import { NextResponse } from 'next/server';
import { adminClient } from '../../../../lib/supabaseAdmin';
import { getStoreBySlug, storeKey, rateLimit, clientIp } from '../../../../lib/storeServer';
import { normalizePhone, isValidEgPhone } from '../../../../lib/storeKit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function POST(req) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ ok: false, error: 'بيانات غير صالحة' }, { status: 400 }); }
  if (!rateLimit(`news:${clientIp(req)}`, 6, 10 * 60_000)) return NextResponse.json({ ok: false, error: 'محاولات كثيرة' }, { status: 429 });
  if (body.hp) return NextResponse.json({ ok: true });

  const raw = String(body.contact || '').trim().slice(0, 120);
  let contact = '';
  if (/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(raw)) contact = raw.toLowerCase();
  else if (isValidEgPhone(normalizePhone(raw))) contact = normalizePhone(raw);
  if (!contact) return NextResponse.json({ ok: false, error: 'اكتب بريداً إلكترونياً أو رقم موبايل صحيح' });

  let sb;
  try { sb = adminClient(); } catch { return NextResponse.json({ ok: false, error: 'غير متاح' }, { status: 500 }); }
  const store = await getStoreBySlug(sb, body.slug);
  if (!store) return NextResponse.json({ ok: false, error: 'المتجر غير متاح' }, { status: 404 });

  await sb.from('store_newsletter').upsert({ store_id: storeKey(store), contact }, { onConflict: 'store_id,contact', ignoreDuplicates: true });
  return NextResponse.json({ ok: true });
}
