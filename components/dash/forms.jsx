'use client';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDash, Tog, Field, Modal, PageHead, Empty, Spin } from './ui';
import { useTable, uploadAsset } from './hooks';

export const toLocalInput = (iso) => {
  if (!iso) return '';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '';
  const p = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};
export const fromLocalInput = (s) => {
  if (!s) return null;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};

export function ImageInput({ value, onChange, folder = 'misc', ph = 'رابط الصورة أو ارفع ملفاً' }) {
  const { uid, say } = useDash();
  const [busy, setBusy] = useState(false);
  const ref = useRef(null);
  const pick = async (e) => {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (!f) return;
    if (!/^image\//.test(f.type)) { say('اختر ملف صورة'); return; }
    setBusy(true);
    try { const r = await uploadAsset(uid, f, folder); onChange(r.url); say('تم رفع الصورة'); } catch (err) { say(err.message || 'تعذر الرفع'); }
    setBusy(false);
  };
  return (
    <div className="imgin">
      {value ? <img src={value} alt="" className="thumb" /> : <span className="thumb ph">🖼️</span>}
      <input className="in num" dir="ltr" placeholder={ph} value={value || ''} onChange={(e) => onChange(e.target.value)} />
      <button type="button" className="btn sm" disabled={busy} onClick={() => ref.current?.click()}>{busy ? '...' : 'رفع'}</button>
      {value ? <button type="button" className="btn sm" onClick={() => onChange('')}>✕</button> : null}
      <input ref={ref} type="file" accept="image/*" hidden onChange={pick} />
    </div>
  );
}

export function FieldInput({ f, value, onChange, draft }) {
  const v = value === undefined || value === null ? '' : value;
  switch (f.type) {
    case 'toggle':
      return <div className="tgrow"><Tog on={!!value} set={onChange} /><span>{f.text || ''}</span></div>;
    case 'textarea':
      return <textarea className="in ta" rows={f.rows || 4} placeholder={f.ph} value={v} onChange={(e) => onChange(e.target.value)} />;
    case 'lines':
      return (
        <textarea
          className="in ta" rows={f.rows || 4} placeholder={f.ph}
          value={Array.isArray(value) ? value.join('\n') : v}
          onChange={(e) => onChange(e.target.value.split('\n'))}
          onBlur={(e) => onChange(e.target.value.split('\n').map((s) => s.trim()).filter(Boolean))}
        />
      );
    case 'number':
      return <input className="in num" type="number" min={f.min} max={f.max} step={f.step || 'any'} placeholder={f.ph} value={v} onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))} />;
    case 'select':
      return (
        <select className="in" value={v} onChange={(e) => onChange(e.target.value)}>
          {(f.options || []).map((o) => (Array.isArray(o) ? <option key={o[0]} value={o[0]}>{o[1]}</option> : <option key={o} value={o}>{o}</option>))}
        </select>
      );
    case 'color':
      return <div className="row" style={{ marginBottom: 0 }}><input type="color" className="clr" value={v || '#0a7f86'} onChange={(e) => onChange(e.target.value)} /><input className="in num" dir="ltr" style={{ maxWidth: 130 }} value={v} onChange={(e) => onChange(e.target.value)} /></div>;
    case 'image':
      return <ImageInput value={v} onChange={onChange} folder={f.folder} />;
    case 'datetime':
      return <input className="in num" type="datetime-local" value={toLocalInput(value)} onChange={(e) => onChange(fromLocalInput(e.target.value))} />;
    case 'date':
      return <input className="in num" type="date" value={v} onChange={(e) => onChange(e.target.value)} />;
    case 'ltr':
      return <input className="in num" dir="ltr" placeholder={f.ph} value={v} onChange={(e) => onChange(f.upper ? e.target.value.toUpperCase() : e.target.value)} />;
    default:
      return <input className="in" placeholder={f.ph} value={v} onChange={(e) => onChange(e.target.value)} />;
  }
}

export function FieldsGrid({ fields, draft, set }) {
  return (
    <div className="fgrid">
      {fields.filter((f) => !f.showIf || f.showIf(draft)).map((f) => (
        <Field key={f.k} l={f.l} hint={f.hint} full={f.full || f.type === 'textarea' || f.type === 'lines' || f.type === 'image' || f.type === 'toggle'}>
          <FieldInput f={f} value={draft[f.k]} onChange={(v) => set(f.k, v)} draft={draft} />
        </Field>
      ))}
    </div>
  );
}

/* نموذج إعدادات يتحفظ في store_config (قسم واحد). كل ما يتغير يتحفظ بزر الحفظ ويظهر فوراً في المتجر. */
export function ConfigForm({ section, title, sub, desc, fields, preview, children, validate }) {
  const { cfg, saveCfg, say } = useDash();
  const [draft, setDraft] = useState(cfg[section] || {});
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  useEffect(() => { setDraft(cfg[section] || {}); setDirty(false); }, [cfg[section]]);
  const set = (k, v) => { setDraft((d) => ({ ...d, [k]: v })); setDirty(true); };
  const save = async () => {
    const msg = validate ? validate(draft) : '';
    if (msg) { say(msg); return; }
    setBusy(true);
    const ok = await saveCfg(section, draft);
    setBusy(false);
    if (ok) { setDirty(false); say('✅ تم الحفظ وسيظهر في المتجر فوراً'); }
  };
  return (
    <>
      <PageHead title={title} sub={sub}>
        <button type="button" className="btn p" disabled={!dirty || busy} onClick={save}>{busy ? 'جاري الحفظ...' : dirty ? 'حفظ التغييرات' : 'محفوظ ✓'}</button>
      </PageHead>
      {desc && <p className="mut dsc">{desc}</p>}
      <div className={preview ? 'two' : ''}>
        <div className="card">
          <FieldsGrid fields={fields} draft={draft} set={set} />
          {typeof children === 'function' ? children({ draft, set }) : children}
        </div>
        {preview && <div className="card">{preview(draft)}</div>}
      </div>
    </>
  );
}

/* جدول CRUD عام: إضافة/تعديل/حذف/تفعيل. كله على جدول Supabase مرتبط بالمتجر. */
export function Crud({
  table, title, sub, desc, filter, defaults = {}, columns, fields, order, asc, noun = 'عنصر',
  validate, transform, toggleKey, search, extraActions, toolbar, emptyText, canAdd = true, canEdit = true, canDelete = true, rowKey = 'id',
}) {
  const { say } = useDash();
  const t = useTable(table, { order, asc, filter });
  const [edit, setEdit] = useState(null);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState(false);

  const shown = useMemo(() => {
    if (!q || !search) return t.rows;
    const s = q.toLowerCase();
    return t.rows.filter((r) => String(search(r) || '').toLowerCase().includes(s));
  }, [t.rows, q, search]);

  const save = async () => {
    const msg = validate ? validate(edit) : '';
    if (msg) { say(msg); return; }
    setBusy(true);
    let row = { ...edit };
    if (transform) row = transform(row);
    const { _new, ...clean } = row;
    delete clean.id; delete clean.created_at; delete clean.store_id;
    const res = _new ? await t.insert({ ...(filter || {}), ...clean }) : await t.update(edit.id, clean);
    setBusy(false);
    if (res) { setEdit(null); say('✅ تم الحفظ'); }
  };

  const del = async (r) => {
    if (!window.confirm('هل تريد الحذف نهائياً؟')) return;
    if (await t.remove(r.id)) say('تم الحذف');
  };

  return (
    <>
      <PageHead title={title} sub={sub ?? `${t.rows.length} ${noun}`}>
        {toolbar && toolbar(t)}
        {search && <input className="in" style={{ maxWidth: 200 }} placeholder="بحث..." value={q} onChange={(e) => setQ(e.target.value)} />}
        {canAdd && <button type="button" className="btn p" onClick={() => setEdit({ _new: true, ...defaults })}>+ إضافة</button>}
      </PageHead>
      {desc && <p className="mut dsc">{desc}</p>}
      {t.err && <div className="card errbox">⚠️ {t.err}<br /><small>تأكد من تشغيل ملف spike_store_all.sql في Supabase.</small></div>}
      <div className="card tw">
        {t.loading ? <div className="c"><Spin /></div> : shown.length === 0 ? (
          <Empty t={emptyText || `لا يوجد ${noun} بعد`} d="اضغط «إضافة» للبدء" />
        ) : (
          <table className="tbl">
            <thead><tr>{columns.map((c) => <th key={c.l}>{c.l}</th>)}{toggleKey && <th>مفعّل</th>}<th /></tr></thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r[rowKey]}>
                  {columns.map((c) => <td key={c.l} className={c.cls}>{c.render ? c.render(r, t) : String(r[c.k] ?? '')}</td>)}
                  {toggleKey && <td><Tog on={r[toggleKey] !== false} set={(v) => t.update(r.id, { [toggleKey]: v })} /></td>}
                  <td className="acts">
                    {extraActions && extraActions(r, t)}
                    {canEdit && <button type="button" className="btn sm" onClick={() => setEdit({ ...r })}>تعديل</button>}
                    {canDelete && <button type="button" className="btn sm dng" onClick={() => del(r)}>حذف</button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {edit && (
        <Modal
          t={edit._new ? `إضافة ${noun}` : `تعديل ${noun}`}
          x={() => setEdit(null)}
          foot={<><button type="button" className="btn" onClick={() => setEdit(null)}>إلغاء</button><button type="button" className="btn p" disabled={busy} onClick={save}>{busy ? '...' : 'حفظ'}</button></>}
        >
          <FieldsGrid fields={fields} draft={edit} set={(k, v) => setEdit((d) => ({ ...d, [k]: v }))} />
        </Modal>
      )}
    </>
  );
}
