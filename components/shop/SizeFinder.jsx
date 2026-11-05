'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { recommend, matchValue, quickSize } from '../../lib/sizeFinder';
import { useShop } from './StoreContext';
import { lockScroll } from './scrollLock';

/* باحث المقاس: خطوات بسيطة (القياسات ← شكل الجسم ← التفضيل ← النتيجة) وبيرجّع المقاس الأنسب.
   زر «مش عارف مقاسك؟» بيفتحه، واختيار النتيجة بيحدد المقاس في المنتج تلقائياً. */

const pad = (n) => String(n).padStart(2, '0');
const SHAPE = [
  { k: 'chest', t: 'الصدر والكتف', o: [['ضيق', -1], ['متوسط', 0], ['عريض', 1]] },
  { k: 'stomach', t: 'البطن', o: [['مسطّحة', -1], ['متوسطة', 0], ['ممتلئة', 1]] },
  { k: 'hips', t: 'الحوض', o: [['ضيق', -1], ['متوسط', 0], ['عريض', 1]] },
];
const FIT = [
  { v: -1, t: 'ضيّق على الجسم', d: 'قطعة لازقة ومحدّدة' },
  { v: 0, t: 'عادي', d: 'زي ما المصمم عاملها' },
  { v: 1, t: 'واسع ومريح', d: 'مساحة للحركة وطبقات تحتها' },
];
const SHOE_FIT = [
  { v: -1, t: 'مظبوط', d: 'على قد القدم بالظبط' },
  { v: 0, t: 'عادي', d: 'مريح للاستخدام اليومي' },
  { v: 1, t: 'مريح وواسع', d: 'مساحة زيادة للصباع' },
];
const WIDTH = [['ضيقة', -1], ['عادية', 0], ['عريضة', 1]];

function Stepper({ label, unit, value, min, max, step = 1, onChange }) {
  const set = (v) => onChange(Math.min(max, Math.max(min, Math.round(v * 10) / 10)));
  return (
    <div className="sf-st">
      <div className="sf-stl"><span>{label}</span><small>{unit}</small></div>
      <div className="sf-str">
        <button type="button" onClick={() => set(value - step)} aria-label="إنقاص">−</button>
        <b className="num" dir="ltr">{step < 1 ? value.toFixed(1) : value}</b>
        <button type="button" onClick={() => set(value + step)} aria-label="زيادة">+</button>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => set(Number(e.target.value))} aria-label={label} />
    </div>
  );
}

export function SizeFinder({ chart, values = [], onPick, onClose }) {
  const shop = useShop();
  const slug = (shop && shop.slug) || 'store';
  const shoes = chart.kind === 'shoes';
  const key = `spk_fit_${slug}_${shoes ? 's' : 'c'}`;
  const [step, setStep] = useState(0);
  const [inp, setInp] = useState(() => (shoes ? { foot: 26, width: 0, fit: 0 } : { h: 172, w: 72, chest: 0, stomach: 0, hips: 0, fit: 0 }));
  const [table, setTable] = useState(false);

  useEffect(() => {
    try { const raw = localStorage.getItem(key); if (raw) setInp((cur) => ({ ...cur, ...JSON.parse(raw) })); } catch { /* تجاهل */ }
  }, [key]);
  useEffect(() => lockScroll(), []);
  useEffect(() => {
    const k = (e) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);

  const set = (patch) => setInp((c) => ({ ...c, ...patch }));
  const total = 4;
  const live = useMemo(() => quickSize(chart, inp), [chart, inp]);
  const res = useMemo(() => (step === 3 ? recommend(chart, inp) : null), [chart, inp, step]);
  const next = () => {
    if (step === 2) { try { localStorage.setItem(key, JSON.stringify(inp)); } catch { /* تجاهل */ } }
    setStep((s) => Math.min(3, s + 1));
  };
  const matched = res ? matchValue(res.size, values) : null;
  const altMatched = res && res.alt ? matchValue(res.alt, values) : null;
  const choose = (val) => { onPick(val); onClose(); };

  return (
    <div className="sf" role="dialog" aria-modal="true" aria-label="باحث المقاس">
      <button type="button" className="sf-x" onClick={onClose}>إغلاق ✕</button>
      <div className="sf-box">
        <div className="sf-top">
          <span className="sf-k">دليل المقاس</span>
          <span className="num sf-n" dir="ltr">{pad(step + 1)} / {pad(total)}</span>
        </div>
        <div className="sf-bar"><i style={{ width: `${((step + 1) / total) * 100}%` }} /></div>

        {step === 0 && !shoes && (
          <div className="sf-p" key="s0">
            <h2>خلّينا نلاقي مقاسك</h2>
            <p className="sf-d">قياسين بسيطين بس. اسحب أو اضغط +/− للتعديل.</p>
            <Stepper label="الطول" unit="سم" value={inp.h} min={140} max={210} onChange={(v) => set({ h: v })} />
            <Stepper label="الوزن" unit="كجم" value={inp.w} min={35} max={160} onChange={(v) => set({ w: v })} />
            <div className="sf-live"><span>التقدير الحالي</span><b className="num">{live || '—'}</b></div>
          </div>
        )}
        {step === 0 && shoes && (
          <div className="sf-p" key="s0s">
            <h2>طول قدمك كام؟</h2>
            <p className="sf-d">حط ورقة على الأرض، وقف عليها وعلّم من الكعب لأطول صباع، وقيس بالمسطرة.</p>
            <Stepper label="طول القدم" unit="سم" value={inp.foot} min={20} max={32} step={0.1} onChange={(v) => set({ foot: v })} />
            <div className="sf-live"><span>التقدير الحالي</span><b className="num">{live || '—'}</b></div>
          </div>
        )}

        {step === 1 && !shoes && (
          <div className="sf-p" key="s1">
            <h2>شكل جسمك</h2>
            <p className="sf-d">مش أرقام، اختار الأقرب ليك. بيخلّي التوصية أدق.</p>
            {SHAPE.map((r) => (
              <div className="sf-row" key={r.k}>
                <div className="sf-rt">{r.t}</div>
                <div className="sf-3">
                  {r.o.map(([t, v]) => <button type="button" key={v} className={inp[r.k] === v ? 'on' : ''} onClick={() => set({ [r.k]: v })}>{t}</button>)}
                </div>
              </div>
            ))}
          </div>
        )}
        {step === 1 && shoes && (
          <div className="sf-p" key="s1s">
            <h2>عرض قدمك</h2>
            <p className="sf-d">لو الجزمة بتضايقك من الجنب اختار عريضة.</p>
            <div className="sf-row"><div className="sf-3">{WIDTH.map(([t, v]) => <button type="button" key={v} className={inp.width === v ? 'on' : ''} onClick={() => set({ width: v })}>{t}</button>)}</div></div>
          </div>
        )}

        {step === 2 && (
          <div className="sf-p" key="s2">
            <h2>{shoes ? 'تحبها إزاي؟' : 'تحب اللبس إزاي؟'}</h2>
            <p className="sf-d">بنظبط المقاس على ذوقك.</p>
            <div className="sf-opts">
              {(shoes ? SHOE_FIT : FIT).map((f) => (
                <button type="button" key={f.v} className={inp.fit === f.v ? 'on' : ''} onClick={() => set({ fit: f.v })}>
                  <b>{f.t}</b><small>{f.d}</small>
                </button>
              ))}
            </div>
          </div>
        )}

        {step === 3 && res && (
          <div className="sf-p sf-res" key="s3">
            <div className="sf-k2">أنسب مقاس ليك</div>
            <div className="sf-ring"><b>{res.size}</b></div>
            <div className="sf-conf"><span className="num">{res.confidence}%</span> ثقة · <b>{res.fitText}</b></div>
            {res.scale.length > 1 && (
              <div className="sf-scale" dir="ltr">
                <div className="sf-line"><i style={{ left: `${res.position * 100}%` }} /></div>
                <div className="sf-lbls">{res.scale.map((s, i) => <span key={s} className={i === res.bestIndex ? 'on' : ''}>{s}</span>)}</div>
              </div>
            )}
            {res.alt && <p className="sf-d">بين مقاسين: <b>{res.size}</b> و<b>{res.alt}</b>. {inp.fit > 0 ? 'وانت بتحب المريح، ممكن تاخد الأكبر.' : 'لو بتحب مريح أكتر خد الأكبر.'}</p>}
            {res.notes.map((n) => <p className="sf-note" key={n}>• {n}</p>)}
            {matched ? (
              <button type="button" className="sf-go" onClick={() => choose(matched)}>اختار المقاس {matched}</button>
            ) : <p className="sf-note">المقاس {res.size} مش متاح في المنتج ده حاليًا.</p>}
            {altMatched ? <button type="button" className="sf-alt" onClick={() => choose(altMatched)}>أو اختار {altMatched}</button> : null}
            <button type="button" className="sf-tb" onClick={() => setTable((t) => !t)}>{table ? 'إخفاء' : 'عرض'} جدول المقاسات</button>
            {table && (
              <div className="sf-tbl">
                <table>
                  <thead><tr><th>المقاس</th>{shoes ? <th>طول القدم (سم)</th> : <><th>الطول (سم)</th><th>الوزن (كجم)</th></>}</tr></thead>
                  <tbody>
                    {chart.rows.map((r) => (
                      <tr key={r.size} className={r.size === res.size ? 'on' : ''}>
                        <td><b>{r.size}</b></td>
                        {shoes ? <td className="num" dir="ltr">{r.foot[0]} – {r.foot[1]}</td> : <><td className="num" dir="ltr">{r.h ? `${r.h[0]} – ${r.h[1]}` : '—'}</td><td className="num" dir="ltr">{r.w[0]} – {r.w[1]}</td></>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        <div className="sf-ft">
          {step > 0 && <button type="button" className="sf-bk" onClick={() => setStep(step === 3 ? 0 : step - 1)}>{step === 3 ? 'إعادة' : 'رجوع'}</button>}
          {step < 3 && <button type="button" className="sf-nx" onClick={next}>{step === 2 ? 'اعرف مقاسي ←' : 'التالي ←'}</button>}
        </div>
      </div>
    </div>
  );
}

/* زر «مش عارف مقاسك؟» + النافذة */
export default function SizeHelp({ chart, values, onPick, className = '' }) {
  const [open, setOpen] = useState(false);
  if (!chart) return null;
  return (
    <>
      <button type="button" className={'sf-link ' + className} onClick={() => setOpen(true)}>📏 مش عارف مقاسك؟ احسبه</button>
      {open && <SizeFinder chart={chart} values={values} onPick={onPick} onClose={() => setOpen(false)} />}
    </>
  );
}
