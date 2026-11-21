'use client';
import React, { useCallback, useEffect, useState } from 'react';
import { useDash, PageHead, Empty, Spin } from '../ui';
import { supabase } from '../../../lib/supabase';
import { fday } from '../shared';

/* فريق العمل: موظف بإيميله وصلاحيات محدودة (طلبات / منتجات) من غير ما يعرف باسورد حسابك. */
const PERMS = [['orders', 'الطلبات', 'يشوف الطلبات ويغيّر حالتها ويكتب ملاحظات'], ['products', 'المنتجات والمخزون', 'يشوف المنتجات ويعدّل المخزون والبيانات (من غير حذف أو إضافة)']];
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function TeamScreen() {
  const { uid, origin, say } = useDash();
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const load = useCallback(async () => {
    if (!uid) return;
    const { data, error } = await supabase.from('store_staff').select('*').eq('owner_id', uid).order('created_at', { ascending: false });
    if (error) say(`تعذر التحميل: ${error.message}`);
    setRows(data || []); setLoading(false);
  }, [uid, say]);
  useEffect(() => { load(); }, [load]);
  const t = {
    rows, loading,
    insert: async (row) => { const { data, error } = await supabase.from('store_staff').insert([row]).select().single(); if (error) { say(`تعذر الحفظ: ${error.message}`); return null; } setRows((r) => [data, ...r]); return data; },
    update: async (id, patch) => { const { data, error } = await supabase.from('store_staff').update(patch).eq('id', id).eq('owner_id', uid).select().single(); if (error) { say(`تعذر الحفظ: ${error.message}`); return null; } setRows((r) => r.map((x) => (x.id === id ? data : x))); return data; },
    remove: async (id) => { const { error } = await supabase.from('store_staff').delete().eq('id', id).eq('owner_id', uid); if (error) { say(`تعذر الحذف: ${error.message}`); return; } setRows((r) => r.filter((x) => x.id !== id)); },
  };
  const [email, setEmail] = useState('');
  const [perms, setPerms] = useState(['orders']);
  const [busy, setBusy] = useState(false);
  const link = origin ? `${origin}/dashboard?staff=${uid}` : '';

  const add = async () => {
    const e = email.trim().toLowerCase();
    if (!EMAIL.test(e)) { say('اكتب إيميل صحيح'); return; }
    if (!perms.length) { say('اختار صلاحية واحدة على الأقل'); return; }
    if (t.rows.some((r) => r.staff_email === e)) { say('الإيميل ده مضاف قبل كده'); return; }
    setBusy(true);
    const r = await t.insert({ staff_email: e, perms, owner_id: uid, active: true });
    setBusy(false);
    if (r) { setEmail(''); say('تمت إضافة الموظف ✓'); }
  };
  const copy = async () => { try { await navigator.clipboard.writeText(link); say('تم نسخ الرابط'); } catch { say(link); } };
  const toggle = (r, k) => t.update(r.id, { perms: r.perms.includes(k) ? r.perms.filter((x) => x !== k) : [...r.perms, k] });

  return (
    <>
      <PageHead title="فريق العمل" sub="ضيف موظف بإيميله وحدّد يشوف إيه بالظبط. مش هيعرف باسورد حسابك." />
      <div className="card" style={{ marginBottom: 14, lineHeight: 1.9, fontSize: 13 }}>
        <b>إزاي بيشتغل؟</b>
        <ol style={{ margin: '6px 0 0', paddingInlineStart: 18 }}>
          <li>اكتب إيميل الموظف واختار صلاحياته واضغط «إضافة».</li>
          <li>الموظف يعمل حساب في سبايك بنفس الإيميل ويؤكد الإيميل (ضروري).</li>
          <li>ابعتله رابط الدخول اللي تحت، ويفتحه وهو مسجّل دخول.</li>
        </ol>
      </div>
      <div className="card" style={{ marginBottom: 14, display: 'grid', gap: 10 }}>
        <input className="in" dir="ltr" type="email" placeholder="employee@example.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-label="إيميل الموظف" />
        <div style={{ display: 'grid', gap: 6 }}>
          {PERMS.map(([k, l, h]) => (
            <label key={k} style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <input type="checkbox" checked={perms.includes(k)} onChange={() => setPerms((p) => (p.includes(k) ? p.filter((x) => x !== k) : [...p, k]))} />
              <span><b>{l}</b><br /><small className="mut">{h}</small></span>
            </label>
          ))}
        </div>
        <button className="btn p" type="button" disabled={busy} onClick={add}>{busy ? '...' : 'إضافة موظف'}</button>
      </div>
      <div className="card" style={{ marginBottom: 14, display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <b>رابط دخول الموظف:</b>
        <code dir="ltr" style={{ flex: 1, minWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>{link}</code>
        <button className="btn" type="button" onClick={copy}>نسخ</button>
      </div>
      {t.loading ? <Spin /> : !t.rows.length ? <div className="card"><Empty icon="👥" t="لسه ما ضفتش موظفين" /></div> : (
        <div style={{ display: 'grid', gap: 10 }}>
          {t.rows.map((r) => (
            <div key={r.id} className="card" style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap', opacity: r.active ? 1 : 0.55 }}>
              <div style={{ flex: 1, minWidth: 180 }}><b dir="ltr">{r.staff_email}</b><br /><small className="mut">أُضيف {fday(r.created_at)}{r.active ? '' : ' · موقوف'}</small></div>
              {PERMS.map(([k, l]) => <label key={k} style={{ display: 'flex', gap: 6, alignItems: 'center', fontSize: 13 }}><input type="checkbox" checked={r.perms.includes(k)} onChange={() => toggle(r, k)} />{l}</label>)}
              <button className="btn" type="button" onClick={() => t.update(r.id, { active: !r.active })}>{r.active ? 'إيقاف' : 'تفعيل'}</button>
              <button className="btn" type="button" onClick={() => { if (window.confirm('حذف الموظف؟')) t.remove(r.id); }}>حذف</button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
export default TeamScreen;
