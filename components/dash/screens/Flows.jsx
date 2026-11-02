'use client';
import React, { useMemo, useState } from 'react';
import { useDash, PageHead, Empty, Spin, Tabs, Field, Tog, Stat, CopyBtn } from '../ui';
import { useTable, useProducts } from '../hooks';
import { useRange, RangeBar } from '../shared';
import { slugify, money, dayKey } from '../../../lib/storeKit';
import { STEP_TYPES, OFFER_TYPES, mkStep, cleanSteps, checkFlow } from '../../../lib/flowKit';

const pct = (a, b) => (b > 0 ? Math.round((a / b) * 1000) / 10 : 0);
const sum = (a) => a.reduce((x, y) => x + y, 0);
const uid6 = () => Math.random().toString(36).slice(2, 6);

/* ---------------- محرر خطوة واحدة ---------------- */
function StepEditor({ step, onChange, pages, products }) {
  const set = (k, v) => onChange({ ...step, [k]: v });
  const isPage = step.type === 'landing' || step.type === 'page';
  const isOffer = OFFER_TYPES.includes(step.type);
  const simpleProducts = products.filter((p) => p.status !== 'archived' && !(Array.isArray(p.variants) && p.variants.length));
  return (
    <div className="fgrid" style={{ marginTop: 10 }}>
      <Field l="اسم الخطوة (للتاجر بس)"><input className="in" value={step.name || ''} onChange={(e) => set('name', e.target.value)} placeholder={STEP_TYPES[step.type].n} /></Field>
      {isPage && (
        <Field l="صفحة الهبوط" hint="أي صفحة هبوط عملتها من «صفحات الهبوط»">
          <select className="in" value={step.page || ''} onChange={(e) => set('page', e.target.value)}>
            <option value="">— اختر —</option>
            {pages.map((p) => <option key={p.id} value={p.slug}>{p.name || p.slug}{p.enabled === false ? ' (غير منشورة)' : ''}</option>)}
          </select>
        </Field>
      )}
      {isOffer && (
        <>
          <Field l="المنتج المعروض" hint="منتج بدون مقاسات/ألوان (عشان القبول بضغطة واحدة)">
            <select className="in" value={step.product_id || ''} onChange={(e) => set('product_id', e.target.value)}>
              <option value="">— اختر —</option>
              {simpleProducts.map((p) => <option key={p.id} value={String(p.id)}>{p.title}</option>)}
            </select>
          </Field>
          <Field l="نسبة الخصم %"><input className="in num" type="number" min="0" max="90" value={step.percent ?? 20} onChange={(e) => set('percent', e.target.value)} /></Field>
          <Field l="الكمية"><input className="in num" type="number" min="1" max="10" value={step.qty ?? 1} onChange={(e) => set('qty', e.target.value)} /></Field>
          <Field l="مدة العدّاد بالدقائق (0 = بدون عدّاد)"><input className="in num" type="number" min="0" max="120" value={step.minutes ?? 0} onChange={(e) => set('minutes', e.target.value)} /></Field>
          <Field l="العنوان الرئيسي" full><input className="in" value={step.headline || ''} onChange={(e) => set('headline', e.target.value)} /></Field>
          <Field l="نص فرعي" full><input className="in" value={step.subheadline || ''} onChange={(e) => set('subheadline', e.target.value)} /></Field>
          <Field l="نقاط المميزات (سطر لكل نقطة)" full>
            <textarea className="in" rows={3} value={(step.points || []).join('\n')} onChange={(e) => set('points', e.target.value.split('\n'))} />
          </Field>
          <Field l="نص زر القبول"><input className="in" value={step.accept_text || ''} onChange={(e) => set('accept_text', e.target.value)} /></Field>
          <Field l="نص زر الرفض"><input className="in" value={step.decline_text || ''} onChange={(e) => set('decline_text', e.target.value)} /></Field>
          <Field l="صورة العرض (رابط، اختياري)" full><input className="in" dir="ltr" value={step.image || ''} onChange={(e) => set('image', e.target.value)} placeholder="https://..." /></Field>
        </>
      )}
      {step.type === 'thanks' && <p className="mut" style={{ gridColumn: '1 / -1' }}>صفحة الشكر ثابتة: بتأكد الطلب وبتعرض العروض اللي العميل قبلها.</p>}
    </div>
  );
}

/* ---------------- محرر الفانل ---------------- */
function FlowEditor({ flow, pages, products, onSave, onBack, storeUrl }) {
  const [name, setName] = useState(flow.name || '');
  const [slug, setSlug] = useState(flow.slug || '');
  const [enabled, setEnabled] = useState(flow.enabled !== false);
  const [steps, setSteps] = useState(() => (Array.isArray(flow.steps) ? flow.steps : []));
  const [open, setOpen] = useState('');
  const [busy, setBusy] = useState(false);
  const clean = useMemo(() => cleanSteps(steps), [steps]);
  const warns = useMemo(() => checkFlow(clean, { pages, products }), [clean, pages, products]);

  const upd = (i, s) => setSteps((a) => a.map((x, j) => (j === i ? s : x)));
  const move = (i, d) => setSteps((a) => { const j = i + d; if (j < 0 || j >= a.length) return a; const b = [...a]; [b[i], b[j]] = [b[j], b[i]]; return b; });
  const del = (i) => setSteps((a) => a.filter((_, j) => j !== i));
  const add = (type) => { const s = mkStep(type); setSteps((a) => [...a, s]); setOpen(s.id); };

  const save = async () => {
    const sl = slugify(slug || name);
    if (!String(name).trim()) return;
    setBusy(true);
    await onSave({ name: String(name).trim(), slug: sl, enabled, steps: cleanSteps(steps) });
    setBusy(false);
    setSlug(sl);
  };
  const url = `${storeUrl}/flow/${slugify(slug || name)}`;

  return (
    <>
      <PageHead title={flow.id ? 'تعديل الفانل' : 'فانل جديد'} sub={name || ''}>
        <button type="button" className="btn" onClick={onBack}>← رجوع</button>
        <button type="button" className="btn p" disabled={busy || !String(name).trim()} onClick={save}>{busy ? 'جاري الحفظ...' : 'حفظ الفانل'}</button>
      </PageHead>

      <div className="card">
        <div className="fgrid">
          <Field l="اسم الفانل"><input className="in" value={name} onChange={(e) => setName(e.target.value)} placeholder="مثال: فانل التيشرت" /></Field>
          <Field l="رابط الفانل (إنجليزي)"><input className="in num" dir="ltr" value={slug} onChange={(e) => setSlug(e.target.value)} placeholder={slugify(name) || 'my-flow'} /></Field>
          <Field l="الفانل شغّال"><div className="tgrow"><Tog on={enabled} set={setEnabled} /></div></Field>
        </div>
        {flow.id && (
          <div className="lnk" style={{ marginTop: 12 }}>
            <code dir="ltr">{url}</code>
            <CopyBtn text={url} />
          </div>
        )}
      </div>

      <div className="card">
        <h3>خطوات الفانل <small>بالترتيب اللي العميل هيمشي عليه</small></h3>
        {steps.length === 0 && <Empty icon="🧲" t="لسه مفيش خطوات" d="ابدأ بخطوة «صفحة هبوط + نموذج الطلب»، وبعدها ضيف عروض الـ Upsell." />}
        <div style={{ display: 'grid', gap: 10 }}>
          {steps.map((s, i) => {
            const T = STEP_TYPES[s.type];
            const isOpen = open === s.id;
            return (
              <div key={s.id} className="card" style={{ margin: 0, padding: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <b className="num">{i + 1}</b>
                  <span style={{ fontSize: 20 }}>{T.i}</span>
                  <div style={{ flex: 1, minWidth: 140 }}>
                    <b>{s.name || T.n}</b>
                    <small className="mut" style={{ display: 'block' }}>{T.n}</small>
                  </div>
                  <button type="button" className="btn sm" disabled={i === 0} onClick={() => move(i, -1)} aria-label="فوق">↑</button>
                  <button type="button" className="btn sm" disabled={i === steps.length - 1} onClick={() => move(i, 1)} aria-label="تحت">↓</button>
                  <button type="button" className="btn sm" onClick={() => setOpen(isOpen ? '' : s.id)}>{isOpen ? 'إغلاق' : 'تعديل'}</button>
                  <button type="button" className="btn sm dng" onClick={() => { if (window.confirm('حذف الخطوة دي؟')) del(i); }}>حذف</button>
                </div>
                {isOpen && <StepEditor step={s} onChange={(x) => upd(i, x)} pages={pages} products={products} />}
              </div>
            );
          })}
        </div>
        <div style={{ marginTop: 14 }}>
          <small className="mut">إضافة خطوة:</small>
          <div className="chips" style={{ marginTop: 6 }}>
            {Object.entries(STEP_TYPES).map(([k, t]) => (
              <button key={k} type="button" className="chip" title={t.d} onClick={() => add(k)}>{t.i} {t.n}</button>
            ))}
          </div>
        </div>
      </div>

      {warns.length > 0 && (
        <div className="card errbox">
          <b>⚠️ لازم تظبط الحاجات دي عشان الفانل يشتغل صح:</b>
          <ul style={{ margin: '8px 0 0', paddingInlineStart: 20 }}>{warns.map((w, i) => <li key={i}>{w}</li>)}</ul>
        </div>
      )}
    </>
  );
}

/* ---------------- إحصائيات الفانل ---------------- */
function FlowStats({ flow, cur }) {
  const r = useRange('30');
  const st = useTable('store_flow_stats', { order: 'day', asc: true, limit: 5000, filter: { flow_id: flow.id } });
  const steps = Array.isArray(flow.steps) ? flow.steps : [];
  const rows = useMemo(() => {
    const fromKey = r.from ? dayKey(r.from) : '';
    const toKey = r.to ? dayKey(r.to) : '';
    const by = {};
    st.rows.forEach((x) => {
      const d = String(x.day).slice(0, 10);
      if ((fromKey && d < fromKey) || (toKey && d > toKey)) return;
      const o = by[x.step_id] || (by[x.step_id] = { views: 0, passes: 0, declines: 0, revenue: 0 });
      o.views += Number(x.views) || 0; o.passes += Number(x.passes) || 0; o.declines += Number(x.declines) || 0; o.revenue += Number(x.revenue) || 0;
    });
    return steps.map((s, i) => {
      const o = by[s.id] || { views: 0, passes: 0, declines: 0, revenue: 0 };
      return { s, i, ...o, drop: Math.max(0, o.views - o.passes - o.declines) };
    });
  }, [st.rows, r.key, r.from, r.to, steps]);
  const totalRev = sum(rows.map((x) => x.revenue));
  const first = rows[0]?.views || 0;
  const orders = sum(rows.filter((x) => x.s.type === 'landing').map((x) => x.passes));
  const accepts = sum(rows.filter((x) => OFFER_TYPES.includes(x.s.type)).map((x) => x.passes));

  return (
    <>
      <div style={{ margin: '12px 0' }}><RangeBar r={r} custom /></div>
      {st.err && <div className="card errbox">⚠️ {st.err}<br /><small>شغّل ملف sql/flow.sql في Supabase ثم أعد تحميل الصفحة.</small></div>}
      <div className="grid3 kpis">
        <Stat label="زيارات أول خطوة" value={st.loading ? '-' : first} />
        <Stat label="طلبات الفانل" value={st.loading ? '-' : orders} hint={`تحويل ${pct(orders, first)}%`} color="#2f855a" />
        <Stat label="عروض اتقبلت" value={st.loading ? '-' : accepts} />
        <Stat label="إيراد الفانل" value={st.loading ? '-' : money(totalRev, cur)} color="var(--b)" hint="الطلب + العروض المقبولة" />
      </div>
      <div className="card">
        <h3>أداء كل خطوة</h3>
        {st.loading ? <Spin /> : rows.length === 0 ? <Empty icon="📊" t="مفيش خطوات" /> : (
          <div className="tw">
            <table className="tbl">
              <thead><tr><th>#</th><th>الخطوة</th><th>زيارات</th><th>عدّوا</th><th>تحويل</th><th>رفضوا</th><th>سابوا الصفحة</th><th>الإيراد</th></tr></thead>
              <tbody>
                {rows.map((x) => (
                  <tr key={x.s.id}>
                    <td className="num">{x.i + 1}</td>
                    <td>{STEP_TYPES[x.s.type].i} {x.s.name || STEP_TYPES[x.s.type].n}</td>
                    <td className="num">{x.views}</td>
                    <td className="num">{x.passes}</td>
                    <td className="num"><b>{pct(x.passes, x.views)}%</b></td>
                    <td className="num">{OFFER_TYPES.includes(x.s.type) ? x.declines : '—'}</td>
                    <td className="num">{x.s.type === 'thanks' ? '—' : x.drop}</td>
                    <td className="num">{x.revenue ? money(x.revenue, cur) : '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <small className="mut" style={{ display: 'block', marginTop: 8 }}>«عدّوا» = العميل كمّل للخطوة اللي بعدها (طلب أو قبول عرض). «سابوا الصفحة» = شافوا الخطوة ومكمّلوش ولا رفضوا.</small>
      </div>
    </>
  );
}

/* ---------------- الشاشة الرئيسية ---------------- */
export function FlowsScreen() {
  const { storeUrl, say, cur } = useDash();
  const t = useTable('store_flows', { order: 'created_at' });
  const pagesT = useTable('store_funnels', { order: 'created_at' });
  const prods = useProducts();
  const [edit, setEdit] = useState(null);
  const [view, setView] = useState('list');
  const [statsFor, setStatsFor] = useState('');
  const [nm, setNm] = useState('');

  const saveFlow = async (id, patch) => {
    const clash = t.rows.find((r) => r.slug === patch.slug && r.id !== id);
    if (clash) { say('الرابط ده مستخدم في فانل تاني'); return null; }
    if (patch.slug.length < 2) { say('اكتب رابط إنجليزي للفانل'); return null; }
    const body = { ...patch, updated_at: new Date().toISOString() };
    const r = id ? await t.update(id, body) : await t.insert(body);
    if (r) { say('✅ تم حفظ الفانل'); if (!id) setEdit(r); }
    return r;
  };

  const create = async () => {
    const name = nm.trim();
    if (!name) return;
    const sl = slugify(name) || `flow-${uid6()}`;
    const steps = [mkStep('landing'), mkStep('upsell'), mkStep('downsell'), mkStep('thanks')];
    const r = await saveFlow(null, { name, slug: t.rows.some((x) => x.slug === sl) ? `${sl}-${uid6()}` : sl, enabled: false, steps });
    if (r) setNm('');
  };

  if (t.loading) return <Spin />;
  if (edit) {
    const cur2 = t.rows.find((x) => x.id === edit.id) || edit;
    return (
      <FlowEditor
        key={cur2.id || 'new'} flow={cur2} pages={pagesT.rows} products={prods.rows} storeUrl={storeUrl}
        onSave={(patch) => saveFlow(cur2.id, patch)} onBack={() => setEdit(null)}
      />
    );
  }

  const sf = t.rows.find((x) => x.id === statsFor) || t.rows[0];
  return (
    <>
      <PageHead title="الفانل الكامل" sub="طلب ← Upsell بضغطة واحدة ← Downsell ← شكراً" />
      {t.err && <div className="card errbox">⚠️ {t.err}<br /><small>شغّل ملف sql/flow.sql في Supabase ثم أعد تحميل الصفحة.</small></div>}
      <Tabs tabs={[['list', 'الفانلات', t.rows.length], ['stats', 'الإحصائيات']]} value={view} onChange={setView} />

      {view === 'list' ? (
        <>
          <div className="card">
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <input className="in" style={{ flex: 1, minWidth: 200 }} value={nm} onChange={(e) => setNm(e.target.value)} placeholder="اسم الفانل الجديد" onKeyDown={(e) => { if (e.key === 'Enter') create(); }} />
              <button type="button" className="btn p" onClick={create} disabled={!nm.trim()}>+ فانل جديد</button>
            </div>
            <small className="mut" style={{ display: 'block', marginTop: 6 }}>بيتعمل بخطوات جاهزة (طلب، Upsell، Downsell، شكراً) وتعدّلها براحتك.</small>
          </div>
          {t.rows.length === 0 ? <Empty icon="🧲" t="لسه معندكش فانلات" d="اعمل أول فانل من فوق." /> : (
            <div style={{ display: 'grid', gap: 10 }}>
              {t.rows.map((f) => {
                const link = `${storeUrl}/flow/${f.slug}`;
                const n = Array.isArray(f.steps) ? f.steps.length : 0;
                return (
                  <div key={f.id} className="card" style={{ margin: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 160 }}>
                        <b>{f.name}</b>
                        <small className="mut" style={{ display: 'block' }}>{n} خطوات · {f.enabled ? 'شغّال' : 'متوقف'}</small>
                      </div>
                      <Tog on={f.enabled !== false} set={(v) => t.update(f.id, { enabled: v })} />
                      <CopyBtn text={link} label="نسخ الرابط" />
                      <button type="button" className="btn sm" onClick={() => { setStatsFor(f.id); setView('stats'); }}>📊 إحصائيات</button>
                      <button type="button" className="btn sm p" onClick={() => setEdit(f)}>تعديل</button>
                      <button type="button" className="btn sm dng" onClick={async () => { if (window.confirm(`حذف فانل «${f.name}»؟`)) { await t.remove(f.id); } }}>حذف</button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      ) : (
        <>
          {t.rows.length === 0 ? <Empty icon="📊" t="مفيش فانلات لعرض إحصائياتها" /> : (
            <>
              <div className="card" style={{ marginTop: 12 }}>
                <select className="in" value={sf?.id || ''} onChange={(e) => setStatsFor(e.target.value)}>
                  {t.rows.map((f) => <option key={f.id} value={f.id}>{f.name}</option>)}
                </select>
              </div>
              {sf && <FlowStats key={sf.id} flow={sf} cur={cur} />}
            </>
          )}
        </>
      )}
    </>
  );
}
