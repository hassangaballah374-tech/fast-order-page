'use client';
import React, { useMemo, useState } from 'react';
import { useDash, PageHead, Empty, Spin, Field, Tog, Stat, CopyBtn } from '../ui';
import { useTable } from '../hooks';
import { useRange, RangeBar } from '../shared';
import { slugify, money, dayKey } from '../../../lib/storeKit';
import { VARIANT_IDS, cleanVariants, verdict } from '../../../lib/abKit';
import { supabase } from '../../../lib/supabase';

const sum = (a) => a.reduce((x, y) => x + y, 0);
const pct = (a, b) => (b > 0 ? Math.round((a / b) * 1000) / 10 : 0);
const uid6 = () => Math.random().toString(36).slice(2, 6);
const L = (i) => VARIANT_IDS[i].toUpperCase();

function Results({ test, pages, cur }) {
  const { uid, say } = useDash();
  const r = useRange('30');
  const st = useTable('store_ab_stats', { order: 'day', asc: true, limit: 5000, filter: { test_id: test.id } });
  const vs = Array.isArray(test.variants) ? test.variants : [];
  const rows = useMemo(() => {
    const fromKey = r.from ? dayKey(r.from) : '';
    const toKey = r.to ? dayKey(r.to) : '';
    const by = {};
    st.rows.forEach((x) => {
      const d = String(x.day).slice(0, 10);
      if ((fromKey && d < fromKey) || (toKey && d > toKey)) return;
      const o = by[x.variant] || (by[x.variant] = { views: 0, orders: 0, revenue: 0 });
      o.views += Number(x.views) || 0; o.orders += Number(x.orders) || 0; o.revenue += Number(x.revenue) || 0;
    });
    return vs.map((v, i) => ({ v, i, ...(by[v.id] || { views: 0, orders: 0, revenue: 0 }) }));
  }, [st.rows, r.key, r.from, r.to, test.variants]);
  const vd = verdict(rows.map((x) => ({ id: x.v.id, views: x.views, orders: x.orders })));
  const pageName = (slug) => pages.find((p) => p.slug === slug)?.name || slug;

  const reset = async () => {
    if (!window.confirm('مسح كل إحصائيات الاختبار ده والبدء من جديد؟')) return;
    const { error } = await supabase.from('store_ab_stats').delete().eq('store_id', uid).eq('test_id', test.id);
    if (error) { say(error.message); return; }
    say('تم مسح الإحصائيات'); st.reload();
  };

  if (st.loading) return <Spin />;
  return (
    <div className="card">
      <RangeBar r={r} custom />
      <div className="grid3 kpis" style={{ marginTop: 10 }}>
        <Stat label="إجمالي الزيارات" value={sum(rows.map((x) => x.views))} />
        <Stat label="إجمالي الطلبات" value={sum(rows.map((x) => x.orders))} />
        <Stat label="إجمالي الإيراد" value={money(sum(rows.map((x) => x.revenue)), cur)} />
      </div>
      <div className="tw" style={{ marginTop: 10 }}>
        <table className="tbl">
          <thead><tr><th>النسخة</th><th>الصفحة</th><th>زيارات</th><th>طلبات</th><th>التحويل</th><th>الإيراد</th><th>إيراد/زيارة</th></tr></thead>
          <tbody>
            {rows.map((x) => (
              <tr key={x.v.id}>
                <td><b>{L(x.i)}</b>{vd.leader === x.v.id && x.views > 0 ? <span title={vd.note}> {vd.sure ? '🏆' : '⬆️'}</span> : null}</td>
                <td>{pageName(x.v.page)}</td>
                <td className="num">{x.views}</td>
                <td className="num">{x.orders}</td>
                <td className="num"><b>{pct(x.orders, x.views)}%</b></td>
                <td className="num">{money(x.revenue, cur)}</td>
                <td className="num">{x.views ? money(x.revenue / x.views, cur) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="pv" style={{ marginTop: 10 }}>
        <b>{vd.sure ? `🏆 الفائز: النسخة ${vd.leader.toUpperCase()}` : vd.leader ? `⬆️ الأعلى حالياً: النسخة ${vd.leader.toUpperCase()}` : 'لسه بدري'}</b>
        <span>{vd.note}. التحويل = الطلبات ÷ الزيارات، والزيارة بتتحسب مع كل فتح للرابط (مش زائر فريد).</span>
      </div>
      <div className="row" style={{ marginTop: 10 }}><button type="button" className="btn sm dng" onClick={reset}>مسح الإحصائيات</button></div>
    </div>
  );
}

function Editor({ test, pages, onSave, onBack }) {
  const [name, setName] = useState(test.name || '');
  const [slug, setSlug] = useState(test.slug || '');
  const [enabled, setEnabled] = useState(test.enabled !== false);
  const [vs, setVs] = useState(() => (Array.isArray(test.variants) && test.variants.length ? test.variants : [{ page: '', weight: 50 }, { page: '', weight: 50 }]).map((v) => ({ page: v.page || '', weight: v.weight || 50 })));
  const [busy, setBusy] = useState(false);
  const { say, storeUrl } = useDash();
  const set = (i, k, v) => setVs(vs.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const total = sum(vs.map((v) => Number(v.weight) || 0));
  const link = `${storeUrl}/ab/${slug || '...'}`;

  const save = async () => {
    const clean = cleanVariants(vs);
    if (!name.trim()) { say('اكتب اسم الاختبار'); return; }
    if (clean.length < 2 || clean.some((v) => !v.page)) { say('اختار صفحة هبوط لكل نسخة (نسختين على الأقل)'); return; }
    if (new Set(clean.map((v) => v.page)).size !== clean.length) { say('كل نسخة لازم تكون صفحة مختلفة'); return; }
    if (slug.length < 2) { say('اكتب رابط إنجليزي للاختبار'); return; }
    setBusy(true);
    await onSave({ name: name.trim(), slug, enabled, variants: clean });
    setBusy(false);
  };

  return (
    <>
      <PageHead title={test.id ? `تعديل: ${test.name}` : 'اختبار جديد'} sub="وزّع الزوار على صفحات هبوط مختلفة وشوف أيهم بيبيع أكتر">
        <button type="button" className="btn" onClick={onBack}>← رجوع</button>
        <button type="button" className="btn p" disabled={busy} onClick={save}>{busy ? '...' : 'حفظ الاختبار'}</button>
      </PageHead>
      <div className="card">
        <div className="fgrid">
          <Field l="اسم الاختبار"><input className="in" value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: عنوان الخصم vs عنوان الجودة" /></Field>
          <Field l="رابط الاختبار (إنجليزي)"><input className="in num" dir="ltr" value={slug} onChange={(e) => setSlug(slugify(e.target.value))} /></Field>
          <Field l="التفعيل" full><div className="tgrow"><Tog on={enabled} set={setEnabled} /><span>الاختبار شغّال</span></div></Field>
        </div>
        <div className="row" style={{ gap: 8 }}><input className="in num" dir="ltr" readOnly value={link} onFocus={(e) => e.target.select()} /><CopyBtn text={link} label="نسخ الرابط" /></div>
        <small className="hint">ده الرابط اللي تحطه في إعلانك. لو غيّرت الصفحات بعد ما الاختبار بدأ، امسح الإحصائيات عشان النتايج متتلخبطش.</small>
      </div>
      <div className="card">
        <h3>النسخ</h3>
        {vs.map((v, i) => (
          <div className="pls" key={i} style={{ gap: 8, flexWrap: 'wrap' }}>
            <b style={{ minWidth: 22 }}>{L(i)}</b>
            <select className="in" style={{ flex: 1, minWidth: 180 }} value={v.page} onChange={(e) => set(i, 'page', e.target.value)}>
              <option value="">— اختار صفحة هبوط —</option>
              {pages.map((p) => <option key={p.id} value={p.slug}>{p.name || p.slug}{p.enabled === false ? ' (متوقفة)' : ''}</option>)}
            </select>
            <label className="mut" style={{ whiteSpace: 'nowrap' }}>النسبة <input className="in num" type="number" min="1" max="100" style={{ width: 70 }} value={v.weight} onChange={(e) => set(i, 'weight', e.target.value)} /></label>
            <span className="mut num">{total ? Math.round(((Number(v.weight) || 0) / total) * 100) : 0}%</span>
            {vs.length > 2 && <button type="button" className="btn sm dng" onClick={() => setVs(vs.filter((_, j) => j !== i))}>حذف</button>}
          </div>
        ))}
        {vs.length < 4 && <button type="button" className="btn sm" onClick={() => setVs([...vs, { page: '', weight: 50 }])}>+ نسخة جديدة</button>}
        {pages.length < 2 && <div className="errbox" style={{ marginTop: 10 }}>محتاج صفحتين هبوط على الأقل. اعملهم من «صفحات الهبوط».</div>}
      </div>
    </>
  );
}

export function AbScreen() {
  const { storeUrl, say, cur } = useDash();
  const t = useTable('store_ab_tests', { order: 'created_at' });
  const pagesT = useTable('store_funnels', { order: 'created_at' });
  const [edit, setEdit] = useState(null);
  const [open, setOpen] = useState('');

  const save = async (id, patch) => {
    if (t.rows.some((r) => r.slug === patch.slug && r.id !== id)) { say('الرابط ده مستخدم في اختبار تاني'); return; }
    const r = id ? await t.update(id, patch) : await t.insert(patch);
    if (r) { say('✅ تم حفظ الاختبار'); setEdit(null); }
  };

  if (t.loading || pagesT.loading) return <Spin />;
  if (edit) {
    const cur2 = edit.id ? (t.rows.find((x) => x.id === edit.id) || edit) : edit;
    return <Editor key={cur2.id || 'new'} test={cur2} pages={pagesT.rows} onSave={(p) => save(cur2.id, p)} onBack={() => setEdit(null)} />;
  }
  return (
    <>
      <PageHead title="اختبارات A/B" sub="جرّب أكتر من صفحة هبوط على نفس الإعلان وخلّي الأرقام تقرر">
        <button type="button" className="btn p" onClick={() => setEdit({ slug: `test-${uid6()}`, enabled: true })}>+ اختبار جديد</button>
      </PageHead>
      {t.err && <div className="card errbox">⚠️ {t.err}<br /><small>شغّل ملف sql/ab.sql في Supabase ثم أعد تحميل الصفحة.</small></div>}
      {t.rows.length === 0 ? <Empty icon="🧪" t="لسه معندكش اختبارات" d="اعمل أول اختبار بين صفحتين هبوط." /> : (
        <div style={{ display: 'grid', gap: 10 }}>
          {t.rows.map((x) => {
            const link = `${storeUrl}/ab/${x.slug}`;
            const n = Array.isArray(x.variants) ? x.variants.length : 0;
            return (
              <div key={x.id} style={{ display: 'grid', gap: 8 }}>
                <div className="card" style={{ margin: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: 160 }}><b>{x.name}</b><small className="mut" style={{ display: 'block' }}>{n} نسخ · {x.enabled ? 'شغّال' : 'متوقف'}</small></div>
                    <Tog on={x.enabled !== false} set={(v) => t.update(x.id, { enabled: v })} />
                    <CopyBtn text={link} label="نسخ الرابط" />
                    <button type="button" className="btn sm" onClick={() => setOpen(open === x.id ? '' : x.id)}>📊 النتائج</button>
                    <button type="button" className="btn sm p" onClick={() => setEdit(x)}>تعديل</button>
                    <button type="button" className="btn sm dng" onClick={async () => { if (window.confirm(`حذف اختبار «${x.name}»؟`)) await t.remove(x.id); }}>حذف</button>
                  </div>
                </div>
                {open === x.id && <Results test={x} pages={pagesT.rows} cur={cur} />}
              </div>
            );
          })}
        </div>
      )}
    </>
  );
}
