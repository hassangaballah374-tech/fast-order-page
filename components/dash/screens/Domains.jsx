'use client';
import React, { useState } from 'react';
import { useDash, PageHead, Field, Empty, Spin, Badge } from '../ui';
import { useTable } from '../hooks';
import { fdate } from '../shared';

const ST = { pending: ['قيد المراجعة', '#d97706'], processing: ['جاري التنفيذ', '#2563eb'], done: ['تم التسجيل', '#16a34a'], rejected: ['مرفوض', '#dc2626'] };
const RX = /^(?!-)([a-z0-9-]+\.)+[a-z]{2,}$/i;

/* طلب شراء دومين: الطلب يوصل للإدارة وتنفذه وتتواصل معاك. */
export function DomainsScreen() {
  const { say } = useDash();
  const { rows, loading, insert } = useTable('domain_requests');
  const [domain, setDomain] = useState('');
  const [years, setYears] = useState(1);
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);

  const send = async () => {
    const d = domain.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    if (!RX.test(d)) { say('اكتب دومين صحيحاً مثل mystore.com'); return; }
    setBusy(true);
    const r = await insert({ domain: d, years: Number(years) || 1, note: note.trim() || null, status: 'pending' });
    setBusy(false);
    if (r) { setDomain(''); setNote(''); say('تم إرسال طلب الدومين للإدارة ✅'); }
  };

  return (
    <div>
      <PageHead title="شراء دومين" sub="اطلب الدومين الذي تريده وستقوم الإدارة بتسجيله وربطه بمتجرك." />
      <div className="card" style={{ marginBottom: 16 }}>
        <div className="fgrid">
          <Field l="الدومين المطلوب" hint="مثال: mystore.com"><input dir="ltr" value={domain} onChange={(e) => setDomain(e.target.value)} placeholder="mystore.com" /></Field>
          <Field l="المدة"><select value={years} onChange={(e) => setYears(e.target.value)}>{[1, 2, 3, 5].map((y) => <option key={y} value={y}>{y} سنة</option>)}</select></Field>
          <Field l="ملاحظات (اختياري)" full><textarea rows={2} value={note} onChange={(e) => setNote(e.target.value)} /></Field>
        </div>
        <button className="btn p" onClick={send} disabled={busy}>{busy ? 'جاري الإرسال...' : 'إرسال الطلب'}</button>
        <p className="mut" style={{ marginTop: 8 }}>السعر والدفع تحددهما الإدارة عند التواصل معك. بعد التسجيل يظهر الدومين هنا بحالة «تم التسجيل».</p>
      </div>
      {loading ? <Spin /> : rows.length === 0 ? <Empty icon="🌐" t="لا توجد طلبات دومين" /> : (
        <div className="card tw"><table className="tbl"><thead><tr><th>الدومين</th><th>المدة</th><th>الحالة</th><th>رد الإدارة</th><th>التاريخ</th></tr></thead><tbody>
          {rows.map((r) => { const s = ST[r.status] || ST.pending; return (
            <tr key={r.id}><td dir="ltr">{r.domain}</td><td>{r.years} سنة</td><td><Badge c={s[1]}>{s[0]}</Badge></td><td>{r.admin_note || '—'}</td><td>{fdate(r.created_at)}</td></tr>
          ); })}
        </tbody></table></div>
      )}
    </div>
  );
}
