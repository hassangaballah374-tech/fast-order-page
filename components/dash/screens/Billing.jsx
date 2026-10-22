'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useDash, PageHead, Field, Empty, Spin, Badge, Stat } from '../ui';
import { useTable, uploadAsset } from '../hooks';
import { fdate } from '../shared';
import { storeStateOf, commissionOf, ordersLeft, freeLeft, ordersCovered, monthlyActive, toEgp, egpFmt, setPlatformCommission } from '../../../lib/billing';
import { useUsdRate } from '../../useUsdRate';
import { supabase } from '../../../lib/supabase';

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
        <Stat label="رصيدك" value={usd(store?.wallet_balance_usd)} hint={rate ? `≈ ${egpFmt(toEgp(store?.wallet_balance_usd, rate))}` : ''} color="#0a7f86" />
        <Stat label="إجمالي ما شحنته" value={usd(store?.wallet_topped_usd)} hint={`يغطي ${covered} طلب`} />
        <Stat label="الطلبات المتبقية" value={left == null ? 'غير محدود' : left} hint={monthly ? `الباقة الشهرية حتى ${new Date(store.subscription_ends_at).toLocaleDateString('ar-EG')}` : `عمولة الطلب ${usd(c)}${free ? ` · منها ${free} مجاني 🎁` : ''} color={left === 0 ? '#dc2626' : '#0a7f86'} />
        <Stat label="الطلبات المستخدمة" value={n(store?.orders_used)} />
      </div>
      {!monthly && covered > 0 && (
        <div className="card" style={{ marginBottom: 16 }}>
          <div style={{ height: 10, background: '#e2e8f0', borderRadius: 8, overflow: 'hidden' }}>
            <div style={{ width: `${Math.max(0, Math.min(100, Math.round(((left || 0) / covered) * 100)))}%`, height: '100%', background: (left || 0) / covered < 0.1 ? '#dc2626' : '#0a7f86' }} />
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

/* ====================== الباقات والاشتراك ====================== */
export function PlansScreen() {
  const { store, uid, say } = useDash();
  const [plans, setPlans] = useState(null);
  const reqs = useTable('plan_requests', { order: 'created_at', limit: 50, filter: { store_id: uid } });
  const note = usePaymentNote();
  const pc = usePlatformCommission();
  const { rate } = useUsdRate();
  const [sel, setSel] = useState(null);
  const [proof, setProof] = useState('');
  const [txt, setTxt] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => { supabase.from('platform_plans').select('*').eq('enabled', true).order('sort_order').then(({ data }) => setPlans(data || [])); }, []);

  const st = storeState(store);
  const c = commissionOf(store, pc);
  const hasPending = reqs.rows.some((r) => r.status === 'pending');

  const send = async () => {
    if (!sel) return;
    if (n(sel.price) > 0 && !proof) { say('ارفع صورة إثبات التحويل أولاً'); return; }
    setBusy(true);
    const egp = rate ? toEgp(sel.price, rate) : 0;
    const auto = egp ? `المبلغ المحوَّل بالجنيه: ${egp} (سعر الدولار ${rate})` : '';
    const noteAll = [auto, txt.trim()].filter(Boolean).join(' | ').slice(0, 300);
    const { error } = await supabase.from('plan_requests').insert([{ store_id: String(uid), plan_id: sel.id, amount: n(sel.price), proof_url: proof || null, note: noteAll || null, status: 'pending' }]);
    if (!error) await supabase.from('platform_notifications').insert([{ audience: 'admin', kind: 'plan', title: 'طلب شحن/اشتراك جديد', body: `${store?.store_name || uid} · ${sel.name}${egp ? ` · ${egp} ج.م` : ''}` }]).then(() => {});
    setBusy(false);
    if (error) { say(error.message); return; }
    setSel(null); setProof(''); setTxt('');
    reqs.reload();
    say('✅ تم إرسال طلبك وسيُراجع من الإدارة');
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
              <div key={p.id} className="card" style={{ borderColor: p.highlight ? '#0a7f86' : undefined, borderWidth: p.highlight ? 2 : 1 }}>
                <b style={{ fontSize: 17 }}>{p.name}</b>
                <div style={{ fontSize: 26, fontWeight: 900, color: '#0a7f86', margin: '6px 0 0' }}>{usd(p.price)}</div>
                {rate ? <div className="mut dsc" style={{ margin: '0 0 6px' }}>≈ {egpFmt(toEgp(p.price, rate))}</div> : null}
                <p className="mut dsc">{monthly ? 'طلبات غير محدودة · 30 يوم' : `≈ ${Math.floor(n(p.price) / c)} طلب (عمولة ${usd(c)} للطلب)`}</p>
                <ul style={{ margin: '8px 0 12px', paddingInlineStart: 18, fontSize: 13 }}>{(p.features || []).map((f, i) => <li key={i}>{f}</li>)}</ul>
                <button type="button" className={'btn ' + (p.highlight ? 'p' : '')} style={{ width: '100%' }} disabled={hasPending} onClick={() => { setSel(p); setProof(''); }}>{hasPending ? 'لديك طلب قيد المراجعة' : (monthly ? 'اشترك شهرياً' : 'اشحن الآن')}</button>
              </div>
            );
          })}
        </div>
      )}

      {sel && (
        <div className="card" style={{ marginBottom: 16, borderColor: '#0a7f86' }}>
          <h3>{sel.name} — {usd(sel.price)}{rate ? ` ≈ ${egpFmt(toEgp(sel.price, rate))}` : ''}</h3>
          <p className="mut dsc">حوّل المبلغ بالجنيه المصري بحسب سعر الدولار الحالي ثم ارفع صورة التحويل.</p>
          {note ? <p className="mut dsc" style={{ whiteSpace: 'pre-line' }}>{note}</p> : null}
          <Field l="صورة إثبات التحويل"><ImagePick value={proof} onChange={setProof} uid={uid} folder="proofs" /></Field>
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
  const pc = usePlatformCommission();
  const { rate } = useUsdRate();
  const [amount, setAmount] = useState('');
  const [txt, setTxt] = useState('');
  const [proof, setProof] = useState('');
  const [busy, setBusy] = useState(false);
  const pending = t.rows.filter((x) => x.status === 'pending');

  const request = async () => {
    const a = Number(amount);
    if (!(a >= 1 && a <= 10000)) { say('المبلغ بالدولار من 1 إلى 10000'); return; }
    if (!proof) { say('ارفع صورة إثبات التحويل'); return; }
    setBusy(true);
    const res = await t.insert({ kind: 'topup', amount_usd: a, status: 'pending', note: String(txt).trim().slice(0, 300), proof_url: proof });
    if (res) {
      await supabase.from('platform_notifications').insert([{ audience: 'admin', kind: 'plan', title: 'طلب شحن رصيد', body: `${store?.store_name || uid} · ${usd(a)}` }]);
      setAmount(''); setTxt(''); setProof(''); say('✅ تم إرسال طلب الشحن وسيُراجع من الإدارة');
    }
    setBusy(false);
  };

  return (
    <>
      <PageHead title="رصيدك" sub="محفظة سبايك" />
      <WalletStats store={store} rate={rate} pc={pc} />
      {pending.length > 0 && <div className="card" style={{ marginBottom: 16 }}>طلبات شحن قيد المراجعة: <b>{pending.length}</b> ({usd(pending.reduce((a, x) => a + n(x.amount_usd), 0))})</div>}
      <div className="card">
        <h3>طلب شحن رصيد</h3>
        {note ? <p className="mut dsc" style={{ whiteSpace: 'pre-line' }}>{note}</p> : <p className="mut dsc">حوّل المبلغ ثم ارفع صورة التحويل. يُضاف الرصيد بعد تأكيد الإدارة.</p>}
        <div className="fgrid">
          <Field l="المبلغ (دولار)" hint={n(amount) > 0 && rate ? `≈ ${egpFmt(toEgp(amount, rate))} · يغطي ${Math.floor(n(amount) / commissionOf(store, pc))} طلب` : 'مثال: 10'}><input className="in num" type="number" min="1" max="10000" value={amount} onChange={(e) => setAmount(e.target.value)} /></Field>
          <Field l="ملاحظات (اختياري)" hint="مثال: رقم العملية"><input className="in" value={txt} maxLength={300} onChange={(e) => setTxt(e.target.value)} /></Field>
        </div>
        <Field l="صورة إثبات التحويل"><ImagePick value={proof} onChange={setProof} uid={uid} folder="proofs" /></Field>
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
