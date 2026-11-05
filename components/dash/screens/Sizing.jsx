'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { useDash, PageHead, Empty, Spin, Field, Tog } from '../ui';
import { useTable, useProducts } from '../hooks';
import { SIZE_TEMPLATES, chartFromTemplate, cleanChart, recommend, isSizeGroup, SIZING_DEFAULT } from '../../../lib/sizeFinder';

const clone = (o) => JSON.parse(JSON.stringify(o));

/* ---------------- محرر جدول واحد ---------------- */
function ChartEditor({ chart, onChange, onRemove }) {
  const shoes = chart.kind === 'shoes';
  const setRow = (i, patch) => onChange({ ...chart, rows: chart.rows.map((r, k) => (k === i ? { ...r, ...patch } : r)) });
  const setRange = (i, key, pos, val) => {
    const cur = Array.isArray(chart.rows[i][key]) ? [...chart.rows[i][key]] : ['', ''];
    cur[pos] = val;
    setRow(i, { [key]: cur });
  };
  const addRow = () => onChange({ ...chart, rows: [...chart.rows, shoes ? { size: '', foot: ['', ''] } : { size: '', h: ['', ''], w: ['', ''] }] });
  const delRow = (i) => onChange({ ...chart, rows: chart.rows.filter((_, k) => k !== i) });
  const setKind = (kind) => {
    if (kind === chart.kind) return;
    const tpl = SIZE_TEMPLATES.find((t) => t.kind === kind);
    onChange({ ...chart, kind, rows: clone(tpl.rows) });
  };
  const rng = (r, key, pos) => (Array.isArray(r[key]) ? r[key][pos] : '');
  return (
    <div className="card" style={{ marginBottom: 14 }}>
      <div className="fgrid">
        <Field l="اسم الجدول"><input className="in" value={chart.name} onChange={(e) => onChange({ ...chart, name: e.target.value })} placeholder="مثلاً: تيشيرتات رجالي" /></Field>
        <Field l="النوع" hint="تغيير النوع بيستبدل الصفوف بقالب جديد">
          <select className="in" value={chart.kind} onChange={(e) => setKind(e.target.value)}>
            <option value="clothes">ملابس (طول ووزن)</option>
            <option value="shoes">أحذية (طول القدم)</option>
          </select>
        </Field>
      </div>
      <div className="tbl-wrap" style={{ overflowX: 'auto', marginTop: 10 }}>
        <table className="tbl" style={{ minWidth: 520 }}>
          <thead>
            <tr>
              <th>المقاس</th>
              {shoes ? <th>طول القدم من - إلى (سم)</th> : (<><th>الطول من - إلى (سم)</th><th>الوزن من - إلى (كجم)</th></>)}
              <th />
            </tr>
          </thead>
          <tbody>
            {chart.rows.map((r, i) => (
              <tr key={i}>
                <td><input className="in" style={{ width: 90 }} value={r.size} onChange={(e) => setRow(i, { size: e.target.value })} placeholder="M" /></td>
                {shoes ? (
                  <td><div style={{ display: 'flex', gap: 6 }}>
                    <input className="in num" style={{ width: 90 }} inputMode="decimal" value={rng(r, 'foot', 0)} onChange={(e) => setRange(i, 'foot', 0, e.target.value)} />
                    <input className="in num" style={{ width: 90 }} inputMode="decimal" value={rng(r, 'foot', 1)} onChange={(e) => setRange(i, 'foot', 1, e.target.value)} />
                  </div></td>
                ) : (
                  <>
                    <td><div style={{ display: 'flex', gap: 6 }}>
                      <input className="in num" style={{ width: 80 }} inputMode="numeric" value={rng(r, 'h', 0)} onChange={(e) => setRange(i, 'h', 0, e.target.value)} />
                      <input className="in num" style={{ width: 80 }} inputMode="numeric" value={rng(r, 'h', 1)} onChange={(e) => setRange(i, 'h', 1, e.target.value)} />
                    </div></td>
                    <td><div style={{ display: 'flex', gap: 6 }}>
                      <input className="in num" style={{ width: 80 }} inputMode="numeric" value={rng(r, 'w', 0)} onChange={(e) => setRange(i, 'w', 0, e.target.value)} />
                      <input className="in num" style={{ width: 80 }} inputMode="numeric" value={rng(r, 'w', 1)} onChange={(e) => setRange(i, 'w', 1, e.target.value)} />
                    </div></td>
                  </>
                )}
                <td><button type="button" className="btn sm" onClick={() => delRow(i)} aria-label="حذف الصف">✕</button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
        <button type="button" className="btn sm" onClick={addRow}>+ إضافة مقاس</button>
        <button type="button" className="btn sm" onClick={onRemove} style={{ marginInlineStart: 'auto', color: 'var(--bad)' }}>حذف الجدول</button>
      </div>
      <Tester chart={chart} />
    </div>
  );
}

/* اختبار سريع: دخّل قياسات وشوف المقاس اللي هيطلع للعميل */
function Tester({ chart }) {
  const shoes = chart.kind === 'shoes';
  const [v, setV] = useState({ h: 172, w: 72, foot: 26 });
  const clean = useMemo(() => cleanChart(chart), [chart]);
  const r = clean.rows.length ? recommend(clean, shoes ? { foot: Number(v.foot), width: 0, fit: 0 } : { h: Number(v.h), w: Number(v.w), chest: 0, stomach: 0, hips: 0, fit: 0 }) : null;
  return (
    <div style={{ marginTop: 14, padding: 12, borderRadius: 12, background: 'var(--s2)' }}>
      <b style={{ fontSize: 13 }}>🧪 اختبر الجدول</b>
      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}>
        {shoes ? (
          <label className="mut" style={{ fontSize: 12.5 }}>طول القدم (سم) <input className="in num" style={{ width: 90 }} inputMode="decimal" value={v.foot} onChange={(e) => setV({ ...v, foot: e.target.value })} /></label>
        ) : (
          <>
            <label className="mut" style={{ fontSize: 12.5 }}>الطول (سم) <input className="in num" style={{ width: 90 }} inputMode="numeric" value={v.h} onChange={(e) => setV({ ...v, h: e.target.value })} /></label>
            <label className="mut" style={{ fontSize: 12.5 }}>الوزن (كجم) <input className="in num" style={{ width: 90 }} inputMode="numeric" value={v.w} onChange={(e) => setV({ ...v, w: e.target.value })} /></label>
          </>
        )}
        <div style={{ fontWeight: 800 }}>{r ? <>المقاس: <span style={{ fontSize: 20 }}>{r.size}</span> <small className="mut">({r.confidence}% — {r.fitText}{r.alt ? ` — أو ${r.alt}` : ''})</small></> : <span className="mut">أكمل بيانات الجدول</span>}</div>
      </div>
    </div>
  );
}

/* ---------------- الشاشة ---------------- */
export function SizingScreen() {
  const { cfg, saveCfg, say } = useDash();
  const prods = useProducts();
  const cats = useTable('store_categories', { order: 'sort_order', asc: true });
  const [draft, setDraft] = useState(() => ({ ...SIZING_DEFAULT, ...(cfg.sizing || {}) }));
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [onlySize, setOnlySize] = useState(true);
  const [q, setQ] = useState('');
  useEffect(() => { setDraft({ ...SIZING_DEFAULT, ...(cfg.sizing || {}) }); setDirty(false); }, [cfg.sizing]);

  const upd = (patch) => { setDraft((d) => ({ ...d, ...patch })); setDirty(true); };
  const charts = Array.isArray(draft.charts) ? draft.charts : [];
  const assign = draft.assign || {};
  const setChart = (i, c) => upd({ charts: charts.map((x, k) => (k === i ? c : x)) });
  const removeChart = (i) => {
    const gone = charts[i];
    const nextAssign = Object.fromEntries(Object.entries(assign).filter(([, v]) => v !== gone.id));
    upd({ charts: charts.filter((_, k) => k !== i), assign: nextAssign, default_chart: draft.default_chart === gone.id ? '' : draft.default_chart });
  };
  const addFromTemplate = (key) => { if (!key) return; upd({ charts: [...charts, chartFromTemplate(key)], enabled: true }); };
  const setAssign = (key, val) => { const a = { ...assign }; if (!val) delete a[key]; else a[key] = val; upd({ assign: a }); };

  const save = async () => {
    const cleaned = charts.map(cleanChart);
    for (const c of cleaned) {
      if (c.rows.length < 2) { say(`الجدول «${c.name}» لازم فيه مقاسين على الأقل بقياسات صحيحة (من ≤ إلى)`); return; }
    }
    const ids = new Set(cleaned.map((c) => c.id));
    const a = Object.fromEntries(Object.entries(assign).filter(([, v]) => v === 'none' || ids.has(v)));
    const value = { enabled: !!draft.enabled, default_chart: ids.has(draft.default_chart) ? draft.default_chart : '', charts: cleaned, assign: a };
    setBusy(true);
    const ok = await saveCfg('sizing', value);
    setBusy(false);
    if (ok) { setDirty(false); say('✅ تم الحفظ — باحث المقاس ظاهر في المتجر'); }
  };

  const plist = (prods.rows || []).filter((p) => (p.status || 'active') !== 'archived')
    .filter((p) => !onlySize || (Array.isArray(p.variants) && p.variants.some((g) => isSizeGroup(g.name))))
    .filter((p) => !q.trim() || String(p.title || '').toLowerCase().includes(q.trim().toLowerCase()));

  if (prods.loading || cats.loading) return <div className="card"><Spin /></div>;

  const chartOptions = charts.map((c) => <option key={c.id} value={c.id}>{c.name || 'جدول'}</option>);

  return (
    <>
      <PageHead title="باحث المقاس" sub="العميل يدخل طوله ووزنه (أو طول قدمه) ويطلعله المقاس الأنسب ويتحدد تلقائياً">
        <button type="button" className="btn p" disabled={!dirty || busy} onClick={save}>{busy ? 'جاري الحفظ...' : dirty ? 'حفظ التغييرات' : 'محفوظ ✓'}</button>
      </PageHead>

      <div className="card" style={{ marginBottom: 14 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
          <Tog on={!!draft.enabled} set={(v) => upd({ enabled: v })} />
          <div>
            <b>تفعيل باحث المقاس في المتجر</b>
            <p className="mut" style={{ margin: '2px 0 0', fontSize: 12.5 }}>بيظهر زر «مش عارف مقاسك؟» تحت خيار المقاس في المنتجات المربوطة بجدول. بيشتغل في صفحة المنتج وعرض المدار.</p>
          </div>
        </div>
        <p className="mut" style={{ marginTop: 10, fontSize: 12.5 }}>ملاحظة: الجداول الجاهزة قيم تقريبية شائعة. عدّلها حسب مقاسات براندك الفعلية، وجرّبها بصندوق الاختبار تحت كل جدول. لازم اسم خيار المنتج يحتوي كلمة «مقاس» (أو Size) والقيم زي ما في الجدول (S, M, 40, 41...).</p>
      </div>

      <h3 style={{ margin: '18px 0 10px' }}>جداول المقاسات</h3>
      {charts.length === 0 && <div className="card" style={{ marginBottom: 14 }}><Empty icon="📏" t="لسه مفيش جداول" d="ابدأ من قالب جاهز واعدّل عليه" /></div>}
      {charts.map((c, i) => <ChartEditor key={c.id} chart={c} onChange={(x) => setChart(i, x)} onRemove={() => removeChart(i)} />)}
      <div className="card" style={{ marginBottom: 14 }}>
        <Field l="إضافة جدول من قالب">
          <select className="in" value="" onChange={(e) => { addFromTemplate(e.target.value); e.target.value = ''; }}>
            <option value="">— اختر قالب —</option>
            {SIZE_TEMPLATES.map((t) => <option key={t.key} value={t.key}>{t.name}</option>)}
          </select>
        </Field>
      </div>

      {charts.length > 0 && (
        <>
          <h3 style={{ margin: '18px 0 10px' }}>ربط الجداول بالمنتجات</h3>
          <div className="card" style={{ marginBottom: 14 }}>
            <div className="fgrid">
              <Field l="الجدول الافتراضي لكل المنتجات" hint="بيتطبق على أي منتج ليه خيار مقاس ومالوش ربط خاص">
                <select className="in" value={draft.default_chart || ''} onChange={(e) => upd({ default_chart: e.target.value })}>
                  <option value="">— بدون —</option>
                  {chartOptions}
                </select>
              </Field>
            </div>
            {(cats.rows || []).length > 0 && (
              <>
                <b style={{ display: 'block', margin: '14px 0 8px', fontSize: 13 }}>حسب القسم</b>
                <div className="fgrid">
                  {cats.rows.map((c) => (
                    <Field key={c.id} l={c.name}>
                      <select className="in" value={assign['cat:' + c.id] || ''} onChange={(e) => setAssign('cat:' + c.id, e.target.value)}>
                        <option value="">افتراضي</option>
                        <option value="none">بدون باحث مقاس</option>
                        {chartOptions}
                      </select>
                    </Field>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="card">
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 }}>
              <b>حسب المنتج</b>
              <input className="in" style={{ maxWidth: 240 }} placeholder="بحث باسم المنتج" value={q} onChange={(e) => setQ(e.target.value)} />
              <label className="mut" style={{ fontSize: 12.5, display: 'flex', gap: 6, alignItems: 'center' }}><input type="checkbox" checked={onlySize} onChange={(e) => setOnlySize(e.target.checked)} /> المنتجات اللي ليها خيار مقاس بس</label>
            </div>
            {plist.length === 0 ? <Empty icon="🛍️" t="مفيش منتجات مطابقة" d="أضف خيار «المقاس» للمنتجات من تبويب الخيارات" /> : (
              <div style={{ display: 'grid', gap: 8 }}>
                {plist.slice(0, 200).map((p) => (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ flex: '1 1 220px', fontWeight: 700, fontSize: 13.5 }}>{p.title}</span>
                    <select className="in" style={{ maxWidth: 260 }} value={assign[String(p.id)] || ''} onChange={(e) => setAssign(String(p.id), e.target.value)}>
                      <option value="">حسب القسم / الافتراضي</option>
                      <option value="none">بدون باحث مقاس</option>
                      {chartOptions}
                    </select>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
