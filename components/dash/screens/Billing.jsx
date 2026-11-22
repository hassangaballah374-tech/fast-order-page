'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDash, PageHead, Field, Empty, Spin, Badge, Stat } from '../ui';
import { useTable, uploadAsset } from '../hooks';
import { fdate } from '../shared';
import { storeStateOf, commissionOf, ordersLeft, freeLeft, ordersCovered, monthlyActive, toEgp, egpFmt, setPlatformCommission } from '../../../lib/billing';
import { useUsdRate } from '../../useUsdRate';
import { supabase } from '../../../lib/supabase';
import { waLink } from '../../../lib/storeKit'; 

const n = (v) => Number(v) || 0;
const usd = (v) => `$${n(v).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const TX_STATUS = { pending: ['قيد المراجعة', '#d97706'], done: ['تم', '#16a34a'], rejected: ['مرفوض', '#dc2626'], approved: ['تمت الموافقة', '#16a34a'] };

export const storeState = (s) => storeStateOf(s);
const STATE_MSG = {
  ok: ['متجرك يعمل ✅', '#16a34a'],
  inactive: ['متجرك لم يُفعَّل بعد من الإدارة. يمكنك بناء متجرك وبياناتك، لكن البيع والبكسل متوقفان لحين التفعيل.', '#d97706'],
  quota: ['رصيدك خلص. المتجر متوقف عن البيع حتى تشحن رصيدك أو تشترك في الباقة الشهرية.', '#dc2626'],
  expired: ['انتهى اشتراكك. المتجر متوقف عن البيع حتى التجديد.', '#dc2626'],
};

/* عمولة المنصة من الإعدادات */
function usePlatformCommission() {
  const [c, setC] = useState(0);
  useEffect(() => {
    supabase.from('platform_kv').select('value').eq('key', 'commission_usd').maybeSingle().then(({ data }) => {
      const v = Number(data?.value) || 0;
      setPlatformCommission(v); setC(v);
    });
  }, []);
  return c;
}

/* رفع صورة من الجهاز مع معاينة */
function ImagePick({ value, onChange, uid, folder }) {
  const [busy, setBusy] = useState(false);
  const { say } = useDash();
  const pick = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (!/^image\//.test(f.type)) { say('اختر ملف صورة'); return; }
    setBusy(true);
    try { const r = await uploadAsset(uid, f, folder); onChange(r.url); } catch (er) { say(er.message || 'تعذر رفع الصورة'); }
    setBusy(false);
  };
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
      {value ? <a href={value} target="_blank" rel="noreferrer"><img src={value} alt="" style={{ width: 84, height: 84, objectFit: 'cover', borderRadius: 12, border: '1px solid #e2e8f0' }} /></a> : <div style={{ width: 84, height: 84, borderRadius: 12, background: '#f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8' }}>📷</div>}
      <label className="btn">
        {busy ? 'جاري الرفع...' : value ? 'تغيير الصورة' : 'رفع صورة من الجهاز'}
        <input type="file" accept="image/*" style={{ display: 'none' }} onChange={pick} disabled={busy} />
      </label>
      {value ? <button type="button" className="btn sm" onClick={() => onChange('')}>إزالة</button> : null}
    </div>
  );
}

function usePaymentNote() {
  const [t, setT] = useState('');
  useEffect(() => { supabase.from('platform_kv').select('value').eq('key', 'payment_instructions').maybeSingle().then(({ data }) => setT(data?.value || '')); }, []);
  return t;
}

/* أرقام التحويل اللي حطّتها الإدارة (فودافون كاش / إنستا باي) */
const PAY_LABEL = { vodafone: 'فودافون كاش', instapay: 'إنستا باي' };
function usePaymentNumbers() {
  const [rows, setRows] = useState([]);
  const [wa, setWa] = useState('');
  useEffect(() => {
    supabase.from('platform_kv').select('value').eq('key', 'payment_whatsapp').maybeSingle().then(({ data }) => setWa(data?.value || ''));
    supabase.from('platform_kv').select('value').eq('key', 'payment_numbers').maybeSingle().then(({ data }) => {
      try { const j = JSON.parse(data?.value || '[]'); setRows(Array.isArray(j) ? j.filter((r) => r && r.number) : []); } catch { setRows([]); }
    });
  }, []);
  rows.wa = wa;
  return rows;
}

/* بعد إنشاء الطلب: زرار يفتح واتساب الإدارة برسالة جاهزة، والتاجر يبعت صورة التحويل هناك */
function WaLogo({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true"><path fill="#fff" d="M16.04 4C9.4 4 4 9.37 4 15.98c0 2.12.55 4.18 1.6 6L4 28l6.2-1.6a12.1 12.1 0 0 0 5.84 1.49h.01C22.68 27.9 28 22.53 28 15.92 28 9.33 22.68 4 16.04 4Zm0 21.8h-.01a10 10 0 0 1-5.1-1.4l-.37-.22-3.68.95.98-3.58-.24-.37a9.9 9.9 0 0 1-1.52-5.2c0-5.5 4.5-9.97 10.04-9.97 5.52 0 10.02 4.47 10.02 9.97 0 5.5-4.5 9.82-10.12 9.82Zm5.5-7.45c-.3-.15-1.78-.88-2.06-.98-.28-.1-.48-.15-.68.15-.2.3-.78.98-.95 1.18-.18.2-.35.22-.65.07-.3-.15-1.27-.47-2.42-1.5-.9-.8-1.5-1.78-1.67-2.08-.18-.3-.02-.46.13-.6.14-.13.3-.35.45-.52.15-.18.2-.3.3-.5.1-.2.05-.38-.02-.53-.08-.15-.68-1.64-.93-2.24-.25-.58-.5-.5-.68-.5h-.58c-.2 0-.53.08-.8.38-.28.3-1.05 1.02-1.05 2.5s1.08 2.9 1.23 3.1c.15.2 2.1 3.2 5.1 4.48.7.3 1.26.48 1.7.62.72.23 1.37.2 1.88.12.57-.08 1.78-.72 2.03-1.42.25-.7.25-1.3.18-1.42-.08-.13-.28-.2-.58-.35Z"/></svg>
  );
}
function WaSend({ wa, text, onDone }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, []);
  if (!wa) return <div ref={ref} className="card" style={{ marginBottom: 16, borderColor: '#d97706' }}>✅ تم تسجيل طلبك. رقم واتساب الإدارة لسه مش مضبوط في النظام، فتواصل مع الإدارة وابعت لها صورة التحويل.<div style={{ marginTop: 8 }}><button type="button" className="btn" onClick={onDone}>تمام</button></div></div>;
  const href = waLink(wa, text);
  return (
    <div ref={ref} className="card" style={{ marginBottom: 16, borderColor: '#25D366', borderWidth: 2, textAlign: 'center' }}>
      <b>✅ تم تسجيل طلبك. الخطوة الأخيرة:</b>
      <p className="mut dsc">دوس على علامة واتساب وابعت صورة التحويل للإدارة عشان نفعّل طلبك.</p>
      <a href={href} target="_blank" rel="noopener noreferrer" aria-label="ابعت صورة التحويل على واتساب" title="ابعت صورة التحويل على واتساب"
        style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 76, height: 76, borderRadius: '50%', background: '#25D366', boxShadow: '0 6px 18px rgba(37,211,102,.45)' }}>
        <WaLogo size={44} />
      </a>
      <div style={{ marginTop: 10 }}><button type="button" className="btn sm" onClick={onDone}>تم</button></div>
    </div>
  );
}
function PayNumbers({ rows }) {
  const [done, setDone] = useState('');
  if (!rows.length) return null;
  const copy = (num) => { try { navigator.clipboard.writeText(num); setDone(num); setTimeout(() => setDone(''), 1500); } catch { /* تجاهل */ } };
  return (
    <div style={{ margin: '8px 0 12px' }}>
      <b style={{ fontSize: 13 }}>حوّل على أحد الأرقام دي:</b>
      {rows.map((r, i) => (
        <div key={i} className="row" style={{ margin: '6px 0 0', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Badge c={r.method === 'instapay' ? '#6b46c1' : '#e53e3e'}>{PAY_LABEL[r.method] || 'تحويل'}</Badge>
          <span className="num" dir="ltr" style={{ fontWeight: 800, fontSize: 16 }}>{r.number}</span>
          {r.name ? <span className="mut dsc" style={{ margin: 0 }}>{r.name}</span> : null}
          <button type="button" className="btn sm" onClick={() => copy(r.number)}>{done === r.number ? 'تم النسخ ✓' : 'نسخ'}</button>
        </div>
      ))}
    </div>
  );
}

/* بطاقات الرصيد: بالدولار والجنيه + الطلبات الكلية والمتبقية */
function WalletStats({ store, rate, pc }) {
  const c = commissionOf(store, pc);
  const left = ordersLeft(store, pc);
  const covered = ordersCovered(store, pc);
  const monthly = monthlyActive(store);
  const free = freeLeft(store);
  return (
    <>
      <div className="grid4" style={{ marginBottom: 12 }}>
        <Stat label="رصيدك" value={usd(store?.wallet_balance_usd)} hint={rate ? `≈ ${egpFmt(toEgp(store?.wallet_balance_usd, rate))}` : ''} color="var(--b)" />
        <Stat label="إجمالي ما شحنته" value={usd(store?.wallet_topped_usd)} hint={`يغطي ${covered} طلب`} />
        <Stat label="الطلبات المتبقية" value={left == null ? 'غير محدود' : left} hint={monthly ? `الباقة الشهرية حتى ${new Date(store.subscription_ends_at).toLocaleDateString('ar-EG')}` : `عمولة الطلب ${usd(c)}${free ? ` · منها ${free} مجاني 🎁` : ''}`} color={left === 0 ? '#dc2626' : 'var(--b)'} />
        <Stat label="الطلبات المستخدمة" value={n(store?.orders_used)} />
      </div>
      {!monthly && covered > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ height: 10, background: '#e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ width: `${Math.max(0, Math.min(100, Math.round(((left || 0) / covered) * 100)))}%`, height: '100%', background: (left || 0) / covered < 0.1 ? '#dc2626' : 'var(--b)' }} />
          </div>
          <p className="mut dsc" style={{ marginTop: 6 }}>
            باقي {left} طلب من أصل {covered}{left > 0 && left <= 10 ? ' — اشحن رصيدك قبل ما المتجر يقف' : ''}
            {rate ? ` · سعر الدولار الآن ${rate} ج.م (يتحدّث تلقائياً)` : ''}
          </p>
        </div>
      )}
    </>
  );
}

/* كود ترحيبي: يضيف طلبات مجانية */
function PromoBox() {
  const { say, reloadStore } = useDash();
  const [code, setCode] = useState('');
  const [busy, setBusy] = useState(false);
  const redeem = async () => {
    const c = code.trim();
    if (!c) { say('اكتب الكود'); return; }
    setBusy(true);
    const { data, error } = await supabase.rpc('redeem_promo', { p_code: c });
    setBusy(false);
    if (error) { say(error.message); return; }
    if (!data?.ok) { say(data?.error || 'الكود غير صالح'); return; }
    setCode(''); reloadStore();
    say(`🎁 تمت إضافة ${data.free_orders} طلب مجاني لمتجرك`);
  };
  return (
    <div className="card" style={{ marginBottom: 16 }}>
      <h3>🎁 عندك كود؟</h3>
      <div className="row" style={{ marginBottom: 0 }}>
        <input className="in num" dir="ltr" style={{ maxWidth: 240 }} placeholder="WELCOME" value={code} onChange={(e) => setCode(e.target.value.toUpperCase())} />
        <button type="button" className="btn p" disabled={busy} onClick={redeem}>{busy ? '...' : 'تفعيل الكود'}</button>
      </div>
    </div>
  );
}

/* باقة «مبلغ مفتوح»: شحن رصيد وسعرها 0 → التاجر هو اللي يكتب المبلغ */
const isOpen = (p) => p && p.kind !== 'monthly' && n(p.price) <= 0;

/* ====================== الباقات والاشتراك ====================== */
export function PlansScreen() {
  const { store, uid, say } = useDash();
  const [plans, setPlans] = useState(null);
  const reqs = useTable('plan_requests', { order: 'created_at', limit: 50, filter: { store_id: uid } });
  const note = usePaymentNote();
  const payNums = usePaymentNumbers();
  const pc = usePlatformCommission();
  const { rate } = useUsdRate();
  const [sel, setSel] = useState(null);
  const [proof, setProof] = useState('');
  const [txt, setTxt] = useState('');
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(null);
  const [custom, setCustom] = useState('');
  const selRef = useRef(null);
  useEffect(() => { if (sel && selRef.current) selRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' }); }, [sel]);

  useEffect(() => { supabase.from('platform_plans').select('*').eq('enabled', true).order('sort_order').then(({ data }) => setPlans(data || [])); }, []);

  const st = storeState(store);
  const c = commissionOf(store, pc);
  const hasPending = reqs.rows.some((r) => r.status === 'pending');

  const send = async () => {
    if (!sel) return;
    const amt = isOpen(sel) ? Math.round(n(custom) * 100) / 100 : n(sel.price);
    if (isOpen(sel) && !(amt >= 1 && amt <= 10000)) { say('اكتب المبلغ بالدولار من 1 إلى 10000'); return; }
    setBusy(true);
    const egp = rate ? toEgp(amt, rate) : 0;
    const auto = egp ? `المبلغ المحوَّل بالجنيه: ${egp} (سعر الدولار ${rate})` : '';
    const noteAll = [auto, txt.trim()].filter(Boolean).join(' | ').slice(0, 300);
    const { error } = await supabase.from('plan_requests').insert([{ store_id: String(uid), plan_id: sel.id, amount: amt, proof_url: null, note: noteAll || null, status: 'pending' }]);
    if (!error) await supabase.from('platform_notifications').insert([{ audience: 'admin', kind: 'plan', title: 'طلب شحن/اشتراك جديد', body: `${store?.store_name || uid} · ${sel.name}${egp ? ` · ${egp} ج.م` : ''}` }]).then(() => {});
    setBusy(false);
    if (error) { say(error.message); return; }
    setSent({ text: `أهلاً، أنا ${store?.store_name || ''}. حوّلت ${usd(amt)}${egp ? ` (${egp} ج.م)` : ''} لباقة «${sel.name}». دي صورة التحويل:` });
    setSel(null); setProof(''); setTxt(''); setCustom('');
    reqs.reload();
  };

  return (
    <>
      <PageHead title="الباقات والشحن" sub="اشحن رصيدك أو اشترك في الباقة الشهرية" />
      <div className="card" style={{ marginBottom: 16, borderColor: STATE_MSG[st][1] }}>
        <b style={{ color: STATE_MSG[st][1] }}>{STATE_MSG[st][0]}</b>
      </div>
      <WalletStats store={store} rate={rate} pc={pc} />
      <PromoBox />

      <h3 style={{ margin: '8px 0' }}>اختر باقتك</h3>
      {plans === null ? <div className="c"><Spin /></div> : plans.length === 0 ? <Empty icon="💎" t="لا توجد باقات متاحة حالياً" /> : (
        <div className="grid3" style={{ marginBottom: 16 }}>
          {plans.map((p) => {
            const monthly = p.kind === 'monthly';
            return (
              <div key={p.id} className="card" style={{ borderColor: p.highlight ? 'var(--b)' : undefined, borderWidth: p.highlight ? 2 : 1 }}>
                <b style={{ fontSize: 17 }}>{p.name}</b>
                <div style={{ fontSize: 26, fontWeight: 900, color: 'var(--b)', margin: '6px 0 0' }}>{isOpen(p) ? 'مبلغ مفتوح' : usd(p.price)}</div>
                {rate && !isOpen(p) ? <div className="mut dsc" style={{ margin: '0 0 6px' }}>≈ {egpFmt(toEgp(p.price, rate))}</div> : null}
                <p className="mut dsc">{isOpen(p) ? 'اكتب المبلغ اللي هتشحنه بنفسك (بالدولار)' : monthly ? 'طلبات غير محدودة · 30 يوم' : `≈ ${Math.floor(n(p.price) / c)} طلب (عمولة ${usd(c)} للطلب المُسلَّم)`}</p>
                <ul style={{ margin: '8px 0 12px', paddingInlineStart: 18, fontSize: 13 }}>{(p.features || []).map((f, i) => <li key={i}>{String(f).replace(/\{commission\}/g, `${Math.round(c * 1000) / 10} سنت`)}</li>)}</ul>
                <button type="button" className={'btn ' + (p.highlight ? 'p' : '')} style={{ width: '100%' }} disabled={hasPending} onClick={() => { setSel(p); setProof(''); setCustom(''); }}>{hasPending ? 'لديك طلب قيد المراجعة' : (monthly ? 'اشترك شهرياً' : 'اشحن الآن')}</button>
              </div>
            );
          })}
        </div>
      )}

      {sent && <WaSend wa={payNums.wa} text={sent.text} onDone={() => setSent(null)} />}
      {sel && (
        <div ref={selRef} className="card" style={{ marginBottom: 16, borderColor: 'var(--b)' }}>
          <h3>{sel.name}{isOpen(sel) ? '' : ` — ${usd(sel.price)}`}{rate && !isOpen(sel) ? ` ≈ ${egpFmt(toEgp(sel.price, rate))}` : ''}</h3>
          {isOpen(sel) && (
            <Field l="المبلغ اللي هتشحنه (دولار)" hint={n(custom) > 0 && rate ? `≈ ${egpFmt(toEgp(custom, rate))} · يغطي ${Math.floor(n(custom) / c)} طلب` : 'مثال: 25'}><input className="in num" type="number" min="1" max="10000" value={custom} onChange={(e) => setCustom(e.target.value)} /></Field>
          )}
          <p className="mut dsc">حوّل المبلغ بالجنيه المصري بحسب سعر الدولار الحالي ثم ارفع صورة التحويل.</p>
          <PayNumbers rows={payNums} />
          {note ? <p className="mut dsc" style={{ whiteSpace: 'pre-line' }}>{note}</p> : null}
          <p className="mut dsc">بعد ما تدوس «إرسال الطلب» هيظهرلك زرار تبعت منه صورة التحويل على واتساب الإدارة.</p>
          <Field l="ملاحظات (اختياري)"><input className="in" maxLength={200} value={txt} onChange={(e) => setTxt(e.target.value)} /></Field>
          <div className="row" style={{ marginBottom: 0 }}>
            <button type="button" className="btn p" disabled={busy} onClick={send}>{busy ? '...' : 'إرسال الطلب'}</button>
            <button type="button" className="btn" onClick={() => setSel(null)}>إلغاء</button>
          </div>
        </div>
      )}

      <div className="card tw">
        <h3 style={{ padding: '12px 14px 0' }}>طلباتي السابقة</h3>
        {reqs.rows.length === 0 ? <Empty icon="🧾" t="لا توجد طلبات بعد" /> : (
          <table className="tbl">
            <thead><tr><th>الباقة</th><th>المبلغ</th><th>الحالة</th><th>ملاحظة</th><th>التاريخ</th></tr></thead>
            <tbody>
              {reqs.rows.map((r) => {
                const [l, cc] = TX_STATUS[r.status] || [r.status, '#718096'];
                return <tr key={r.id}><td>{(plans || []).find((p) => p.id === r.plan_id)?.name || '—'}</td><td className="num">{usd(r.amount)}</td><td><Badge c={cc}>{l}</Badge></td><td>{r.note}</td><td>{fdate(r.created_at)}</td></tr>;
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

/* ====================== رصيدك (مع صورة إثبات التحويل) ====================== */
export function BalanceScreen() {
  const { store, uid, say, go } = useDash();
  const t = useTable('store_wallet_tx', { order: 'created_at', limit: 50 });
  const note = usePaymentNote();
  const payNums = usePaymentNumbers();
  const pc = usePlatformCommission();
  const { rate } = useUsdRate();
  const [amount, setAmount] = useState('');
  const [txt, setTxt] = useState('');
  const [proof, setProof] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = t.rows.filter((x) => x.status === 'pending');
  const [sent, setSent] = useState(null);

  const request = async () => {
    const a = Number(amount);
    if (!(a >= 1 && a <= 10000)) { say('المبلغ بالدولار من 1 إلى 10000'); return; }
    setBusy(true);
    const res = await t.insert({ kind: 'topup', amount_usd: a, status: 'pending', note: String(txt).trim().slice(0, 300), proof_url: null });
    if (res) {
      await supabase.from('platform_notifications').insert([{ audience: 'admin', kind: 'plan', title: 'طلب شحن رصيد', body: `${store?.store_name || uid} · ${usd(a)}` }]);
      setSent({ text: `أهلاً، أنا ${store?.store_name || ''}. حوّلت لشحن رصيد ${usd(a)}${rate ? ` (${egpFmt(toEgp(a, rate))})` : ''}. دي صورة التحويل:` });
      setAmount(''); setTxt(''); setProof('');
    }
    setBusy(false);
  };

  return (
    <>
      <PageHead title="رصيدك" sub="محفظة سبايك" />
      <WalletStats store={store} rate={rate} pc={pc} />
      {pending.length > 0 && <div className="card" style={{ marginBottom: 16 }}>طلبات شحن قيد المراجعة: <b>{pending.length}</b> ({usd(pending.reduce((a, x) => a + n(x.amount_usd), 0))})</div>}
      {sent && <WaSend wa={payNums.wa} text={sent.text} onDone={() => setSent(null)} />}
      <div className="card">
        <h3>طلب شحن رصيد</h3>
        <PayNumbers rows={payNums} />
        {note ? <p className="mut dsc" style={{ whiteSpace: 'pre-line' }}>{note}</p> : <p className="mut dsc">حوّل المبلغ ثم ارفع صورة التحويل. يُضاف الرصيد بعد تأكيد الإدارة.</p>}
        <div className="fgrid">
          <Field l="المبلغ (دولار)" hint={n(amount) > 0 && rate ? `≈ ${egpFmt(toEgp(amount, rate))} · يغطي ${Math.floor(n(amount) / commissionOf(store, pc))} طلب` : 'مثال: 10'}><input className="in num" type="number" min="1" max="10000" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
          <Field l="ملاحظات (اختياري)" hint="مثال: رقم العملية"><input className="in" value={txt} maxLength={300} onChange={(e) => setTxt(e.target.value)} /></Field>
        </div>
        <p className="mut dsc">بعد إرسال الطلب هيظهرلك زرار تبعت منه صورة التحويل على واتساب الإدارة.</p>
        <div className="row" style={{ marginBottom: 0 }}>
          <button type="button" className="btn p" disabled={busy} onClick={request}>{busy ? '...' : 'إرسال الطلب'}</button>
          <button type="button" className="btn" onClick={() => go('tx')}>سجل المعاملات</button>
        </div>
      </div>
    </>
  );
}

/* ====================== المعاملات (مع عرض صورة الإثبات) ====================== */
export function TxScreen() {
  const { isAdmin, say, reloadStore } = useDash();
  const t = useTable('store_wallet_tx', { order: 'created_at', limit: 300 });
  const [queue, setQueue] = useState(null);
  const [busy, setBusy] = useState(0);

  const loadQueue = async () => {
    if (!isAdmin) return;
    const { data, error } = await supabase.from('store_wallet_tx').select('*').eq('status', 'pending').order('created_at', { ascending: true }).limit(200);
    if (error) { say(error.message); setQueue([]); return; }
    const ids = [...new Set((data || []).map((x) => x.store_id))];
    const names = {};
    if (ids.length) {
      const { data: st } = await supabase.from('store_profiles').select('user_id, store_name, owner_name').in('user_id', ids);
      (st || []).forEach((s) => { names[String(s.user_id)] = s.store_name || s.owner_name; });
    }
    setQueue((data || []).map((x) => ({ ...x, store_name: names[x.store_id] || x.store_id })));
  };
  useEffect(() => { loadQueue(); }, [isAdmin]);

  const decide = async (x, ok) => {
    if (!window.confirm(ok ? `تأكيد إضافة ${usd(x.amount_usd)} لرصيد «${x.store_name}»؟` : 'رفض هذا الطلب؟')) return;
    setBusy(x.id);
    const { data, error } = await supabase.rpc('approve_wallet_tx', { p_id: x.id, p_ok: ok });
    setBusy(0);
    if (error || data === false) { say(error?.message || 'تعذر التنفيذ (ربما تمت معالجته)'); } else { say(ok ? '✅ تمت إضافة الرصيد' : 'تم الرفض'); }
    loadQueue(); t.refresh(); reloadStore();
  };

  const Proof = ({ u }) => (u ? <a href={u} target="_blank" rel="noreferrer"><img src={u} alt="إثبات" style={{ width: 44, height: 44, objectFit: 'cover', borderRadius: 8 }} /></a> : <span className="mut">—</span>);

  return (
    <>
      <PageHead title="المعاملات" sub={`${t.rows.length} معاملة`} />
      {isAdmin && (
        <div className="card tw" style={{ marginBottom: 16 }}>
          <h3 style={{ padding: '12px 14px 0' }}>👑 طلبات الشحن المعلّقة (الأدمن)</h3>
          {queue === null ? <div className="c"><Spin /></div> : queue.length === 0 ? <Empty icon="✅" t="لا توجد طلبات معلّقة" /> : (
            <table className="tbl">
              <thead><tr><th>المتجر</th><th>المبلغ</th><th>الإثبات</th><th>ملاحظة</th><th>التاريخ</th><th /></tr></thead>
              <tbody>
                {queue.map((x) => (
                  <tr key={x.id}>
                    <td><b>{x.store_name}</b></td><td className="num"><b>{usd(x.amount_usd)}</b></td><td><Proof u={x.proof_url} /></td><td>{x.note}</td><td>{fdate(x.created_at)}</td>
                    <td className="acts">
                      <button type="button" className="btn p sm" disabled={busy === x.id} onClick={() => decide(x, true)}>قبول</button>
                      <button type="button" className="btn sm dng" disabled={busy === x.id} onClick={() => decide(x, false)}>رفض</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}
      <div className="card tw">
        {t.loading ? <div className="c"><Spin /></div> : t.rows.length === 0 ? <Empty icon="🧾" t="لا توجد معاملات بعد" d="طلبات شحن الرصيد تظهر هنا" /> : (
          <table className="tbl">
            <thead><tr><th>النوع</th><th>المبلغ</th><th>الحالة</th><th>الإثبات</th><th>ملاحظة</th><th>التاريخ</th></tr></thead>
            <tbody>
              {t.rows.map((x) => {
                const [lbl, c] = TX_STATUS[x.status] || [x.status, '#718096'];
                return <tr key={x.id}><td>شحن رصيد</td><td className="num">{usd(x.amount_usd)}</td><td><Badge c={c}>{lbl}</Badge></td><td><Proof u={x.proof_url} /></td><td>{x.note}</td><td>{fdate(x.created_at)}</td></tr>;
              })}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}

/* ====================== الإشعارات ====================== */
export function NotifsScreen() {
  const { uid } = useDash();
  const [rows, setRows] = useState(null);
  const [perm, setPerm] = useState('default');
  const load = async () => {
    const { data } = await supabase.from('platform_notifications').select('*').eq('audience', String(uid)).order('created_at', { ascending: false }).limit(100);
    setRows(data || []);
  };
  useEffect(() => { load(); try { if (typeof Notification !== 'undefined') setPerm(Notification.permission); } catch { /* تجاهل */ } }, [uid]);
  const markAll = async () => { await supabase.from('platform_notifications').update({ read: true }).eq('audience', String(uid)).eq('read', false); load(); };
  const enable = async () => { try { setPerm(await Notification.requestPermission()); } catch { /* تجاهل */ } };
  return (
    <>
      <PageHead title="الإشعارات" sub="طلباتك الجديدة وحالة اشتراكك">
        <button type="button" className="btn" onClick={markAll}>تعليم الكل كمقروء</button>
      </PageHead>
      {typeof Notification !== 'undefined' && perm !== 'granted' && (
        <div className="card" style={{ marginBottom: 14 }}>
          {perm === 'denied' ? <span className="mut">إشعارات المتصفح مرفوضة، فعّلها من إعدادات الموقع في المتصفح.</span> : (
            <div className="row" style={{ marginBottom: 0 }}><span>فعّل إشعارات المتصفح لتصلك الطلبات الجديدة فوراً (والصفحة مفتوحة)</span><button type="button" className="btn p" onClick={enable}>تفعيل الإشعارات</button></div>
          )}
        </div>
      )}
      <div className="card">
        {rows === null ? <div className="c"><Spin /></div> : rows.length === 0 ? <Empty icon="🔔" t="لا توجد إشعارات بعد" /> : rows.map((r) => (
          <div key={r.id} style={{ padding: '10px 0', borderBottom: '1px solid #edf2f7', opacity: r.read ? 0.65 : 1 }}>
            <b>{r.kind === 'new_order' ? '📦 ' : '💳 '}{r.title}</b>
            {r.body ? <div className="mut dsc">{r.body}</div> : null}
            <small className="mut">{fdate(r.created_at)}</small>
          </div>
        ))}
      </div>
    </>
  );
}
