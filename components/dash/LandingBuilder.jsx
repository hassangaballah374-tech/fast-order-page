'use client';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Field, Tog, useDash } from './ui';
import ThemePicker from './ThemePicker';
import { SECTION_DEFS, mkSection, cloneSection } from '../../lib/lpSections';
import { FONTS_ALL } from '../../lib/themes100';
import { lpFromTheme } from '../../lib/landingThemes';
import { SectionFields, StyleForm } from './lpb/fields';
import Library from './lpb/Library';

const FONTS = [['', 'الافتراضي'], ...FONTS_ALL.map((f) => [f, f])];
const DEVICES = [['m', '📱', 390], ['d', '🖥️', 0]];

const CSS = `
.lpb{position:fixed;inset:0;z-index:9999;display:flex;flex-direction:column;background:var(--bg);color:var(--ink);font-family:'Cairo',sans-serif}
.lpb-top{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:8px 14px;background:var(--s);border-bottom:1px solid var(--ln)}
.lpb-top b{font-size:15px}.lpb-sp{flex:1}
.lpb-main{flex:1;display:flex;min-height:0}
.lpb-side{width:380px;max-width:44vw;display:flex;flex-direction:column;background:var(--s);border-inline-end:1px solid var(--ln);min-height:0}
.lpb-tabs{display:flex;border-bottom:1px solid var(--ln)}
.lpb-tabs button{flex:1;border:0;background:none;padding:11px 6px;font:800 13px 'Cairo',sans-serif;color:var(--mut);cursor:pointer;border-bottom:3px solid transparent}
.lpb-tabs button.on{color:var(--ink);border-bottom-color:var(--b)}
.lpb-body{flex:1;overflow:auto;padding:12px}
.lpb-stage{flex:1;display:flex;justify-content:center;align-items:stretch;padding:14px;min-width:0;background:repeating-conic-gradient(rgba(127,127,127,.08) 0 25%,transparent 0 50%) 0 0/20px 20px}
.lpb-frame{background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 18px 50px -20px rgba(0,0,0,.45);border:1px solid var(--ln);transition:width .25s;height:100%}
.lpb-frame iframe{width:100%;height:100%;border:0;display:block}
.lpb-row{display:flex;align-items:center;gap:6px;padding:8px 8px;border:1px solid var(--ln);border-radius:12px;margin-bottom:6px;background:var(--bg);cursor:pointer}
.lpb-row.on{border-color:var(--b);box-shadow:0 0 0 2px color-mix(in srgb,var(--b) 25%,transparent)}
.lpb-row.off{opacity:.5}.lpb-row.ov{outline:2px dashed var(--b)}
.lpb-row .gr{cursor:grab;color:var(--mut);padding:0 4px;user-select:none}
.lpb-row b{flex:1;font-size:13.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.lpb-row .btn{padding:3px 8px}
.lpb-mini{display:flex;gap:4px}
.lpb-lib{position:fixed;inset:0;z-index:10000;background:rgba(0,0,0,.5);display:grid;place-items:center;padding:14px}
.lpb-lib-box{background:var(--s);color:var(--ink);border-radius:18px;width:min(760px,100%);max-height:88vh;display:flex;flex-direction:column;overflow:hidden}
.lpb-lib-h{display:flex;justify-content:space-between;align-items:center;padding:14px 18px;border-bottom:1px solid var(--ln)}
.lpb-lib-b{overflow:auto;padding:6px 18px 18px}
.lpb-lib-g{font-weight:900;margin:16px 0 8px;color:var(--mut);font-size:13px}
.lpb-lib-grid{display:grid;gap:8px;grid-template-columns:repeat(auto-fill,minmax(150px,1fr))}
.lpb-lib-i{display:flex;flex-direction:column;align-items:center;gap:6px;padding:14px 8px;border:1px solid var(--ln);border-radius:14px;background:var(--bg);color:var(--ink);cursor:pointer;font-family:inherit;transition:transform .15s,border-color .15s}
.lpb-lib-i:hover{transform:translateY(-3px);border-color:var(--b)}
.lpb-lib-i span{font-size:26px}.lpb-lib-i b{font-size:12.5px;text-align:center}
.lpb-sub{display:flex;gap:6px;margin-bottom:12px}
@media(max-width:900px){.lpb-main{flex-direction:column-reverse}.lpb-side{width:100%;max-width:none;height:48vh;border-inline-end:0;border-top:1px solid var(--ln)}.lpb-stage{padding:8px}}
`;

export default function LandingBuilder({ page, storeUrl, sections, setSections, theme, setTheme, st, setSt, onSave, onClose }) {
  const { say } = useDash();
  const [tab, setTab] = useState('sections');
  const [sel, setSel] = useState('');
  const [sub, setSub] = useState('content');
  const [lib, setLib] = useState(false);
  const [dev, setDev] = useState('m');
  const [busy, setBusy] = useState(false);
  const [nonce, setNonce] = useState(0);
  const [over, setOver] = useState(-1);
  const [, tick] = useState(0);
  const frame = useRef(null);
  const ready = useRef(false);
  const drag = useRef(-1);
  const hist = useRef({ past: [], future: [], last: null, t: 0, skip: false });
  const snap = () => JSON.stringify({ sections, theme, st });
  const saved = useRef(snap());

  const send = useCallback((m) => { try { frame.current?.contentWindow?.postMessage(m, window.location.origin); } catch { /* تجاهل */ } }, []);

  /* رسائل الـ iframe: ready و pick */
  useEffect(() => {
    const h = (e) => {
      if (e.origin !== window.location.origin || !e.data || !e.data.spk) return;
      if (e.data.spk === 'ready') { ready.current = true; tick((x) => x + 1); }
      if (e.data.spk === 'pick') { setSel(e.data.id); setTab('sections'); setSub('content'); }
    };
    window.addEventListener('message', h);
    return () => window.removeEventListener('message', h);
  }, []);

  /* إرسال المسودة للمعاينة (بتأخير بسيط) */
  useEffect(() => {
    const t = setTimeout(() => { if (ready.current) send({ spk: 'draft', sections, theme, settings: st }); }, 120);
    return () => clearTimeout(t);
  });
  useEffect(() => { if (ready.current && sel) send({ spk: 'select', id: sel }); }, [sel, send]);

  /* سجل التراجع */
  useEffect(() => {
    const cur = snap(); const h = hist.current;
    if (h.skip) { h.skip = false; h.last = cur; return; }
    if (h.last == null) { h.last = cur; return; }
    if (cur === h.last) return;
    const now = Date.now();
    if (now - h.t > 700) { h.past.push(h.last); if (h.past.length > 60) h.past.shift(); }
    h.t = now; h.last = cur; h.future = []; tick((x) => x + 1);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sections, theme, st]);
  const apply = (s) => { const o = JSON.parse(s); hist.current.skip = true; hist.current.t = 0; setSections(o.sections); setTheme(o.theme); setSt(o.st); };
  const undo = () => { const h = hist.current; if (!h.past.length) return; h.future.push(snap()); apply(h.past.pop()); };
  const redo = () => { const h = hist.current; if (!h.future.length) return; h.past.push(snap()); apply(h.future.pop()); };
  useEffect(() => {
    const k = (e) => {
      if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
    };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  });

  const dirty = snap() !== saved.current;
  const idx = sections.findIndex((s) => s.id === sel);
  const cur = idx >= 0 ? sections[idx] : null;
  const upd = (s) => setSections((a) => a.map((x) => (x.id === s.id ? s : x)));
  const move = (i, to) => setSections((a) => { if (to < 0 || to >= a.length || i === to) return a; const b = [...a]; const [x] = b.splice(i, 1); b.splice(to, 0, x); return b; });
  const add = (type) => {
    const s = mkSection(type);
    setSections((a) => { const at = idx >= 0 ? idx + 1 : a.length; return [...a.slice(0, at), s, ...a.slice(at)]; });
    setLib(false); setSel(s.id); setSub('content');
  };
  const dup = (i) => { const c = cloneSection(sections[i]); setSections((a) => [...a.slice(0, i + 1), c, ...a.slice(i + 1)]); setSel(c.id); };
  const del = (i) => { setSections((a) => a.filter((_, j) => j !== i)); setSel(''); };
  const th = (k, v) => setTheme((t) => ({ ...t, [k]: v }));

  const save = async () => {
    setBusy(true);
    const ok = await onSave();
    setBusy(false);
    if (ok !== false) { saved.current = snap(); setNonce((n) => n + 1); ready.current = false; }
  };
  const close = () => { if (dirty && !window.confirm('فيه تعديلات لسه ما اتحفظتش. تقفل من غير حفظ؟')) return; onClose(); };

  const slug = page.slug;
  const src = `${storeUrl}/f/${slug}?builder=1`;
  const w = DEVICES.find((x) => x[0] === dev)[2];
  const h = hist.current;

  return (
    <div className="lpb" dir="rtl">
      <style dangerouslySetInnerHTML={{ __html: CSS }} />
      <div className="lpb-top">
        <button type="button" className="btn sm" onClick={close}>✕ إغلاق</button>
        <b>{page.name}</b>
        {dirty ? <span className="mut">• تعديلات غير محفوظة</span> : <span className="mut">✓ محفوظ</span>}
        <span className="lpb-sp" />
        <button type="button" className="btn sm" onClick={undo} disabled={!h.past.length} title="تراجع (Ctrl+Z)">↶</button>
        <button type="button" className="btn sm" onClick={redo} disabled={!h.future.length} title="إعادة (Ctrl+Shift+Z)">↷</button>
        {DEVICES.map(([k, ic]) => <button type="button" key={k} className={`btn sm ${dev === k ? 'p' : ''}`} onClick={() => setDev(k)}>{ic}</button>)}
        <a className="btn sm" href={`${storeUrl}/f/${slug}`} target="_blank" rel="noreferrer">فتح الصفحة ↗</a>
        <button type="button" className="btn p" disabled={busy} onClick={save}>{busy ? '...' : 'حفظ'}</button>
      </div>

      <div className="lpb-main">
        <div className="lpb-side">
          {!cur && (
            <div className="lpb-tabs">
              {[['sections', 'الأقسام'], ['design', 'التصميم'], ['settings', 'إعدادات']].map(([k, l]) => <button type="button" key={k} className={tab === k ? 'on' : ''} onClick={() => setTab(k)}>{l}</button>)}
            </div>
          )}
          {cur && (
            <div className="lpb-tabs">
              <button type="button" onClick={() => setSel('')}>← الأقسام</button>
              <button type="button" className={sub === 'content' ? 'on' : ''} onClick={() => setSub('content')}>المحتوى</button>
              <button type="button" className={sub === 'style' ? 'on' : ''} onClick={() => setSub('style')}>الشكل</button>
            </div>
          )}

          <div className="lpb-body">
            {!cur && tab === 'sections' && (
              <>
                <button type="button" className="btn p" style={{ width: '100%', marginBottom: 10 }} onClick={() => setLib(true)}>+ إضافة قسم</button>
                {sections.length === 0 && <p className="mut">مفيش أقسام. اضغط «إضافة قسم».</p>}
                {sections.map((s, i) => (
                  <div
                    key={s.id} className={`lpb-row ${sel === s.id ? 'on' : ''} ${s.on === false ? 'off' : ''} ${over === i ? 'ov' : ''}`}
                    draggable onDragStart={() => { drag.current = i; }} onDragOver={(e) => { e.preventDefault(); setOver(i); }}
                    onDragLeave={() => setOver(-1)} onDrop={() => { move(drag.current, i); setOver(-1); drag.current = -1; }}
                    onClick={() => { setSel(s.id); setSub('content'); }}
                  >
                    <span className="gr" title="اسحب للترتيب">⋮⋮</span>
                    <span>{SECTION_DEFS[s.type]?.i}</span>
                    <b>{SECTION_DEFS[s.type]?.n || s.type}</b>
                    <span className="lpb-mini" onClick={(e) => e.stopPropagation()}>
                      <button type="button" className="btn sm" onClick={() => move(i, i - 1)} disabled={i === 0} aria-label="لأعلى">↑</button>
                      <button type="button" className="btn sm" onClick={() => move(i, i + 1)} disabled={i === sections.length - 1} aria-label="لأسفل">↓</button>
                      <button type="button" className="btn sm" onClick={() => upd({ ...s, on: s.on === false })} title={s.on === false ? 'إظهار' : 'إخفاء'}>{s.on === false ? '🙈' : '👁'}</button>
                      <button type="button" className="btn sm" onClick={() => dup(i)} title="نسخ">⧉</button>
                      <button type="button" className="btn sm dng" onClick={() => del(i)} title="حذف">🗑</button>
                    </span>
                  </div>
                ))}
                {!sections.some((s) => s.type === 'order') && sections.length > 0 && <p className="mut">مفيش «نموذج الطلب»، هيتضاف تلقائياً في آخر الصفحة.</p>}
              </>
            )}

            {cur && sub === 'content' && (
              <>
                <h4 style={{ margin: '0 0 10px' }}>{SECTION_DEFS[cur.type]?.i} {SECTION_DEFS[cur.type]?.n}</h4>
                <SectionFields s={cur} onChange={upd} />
              </>
            )}
            {cur && sub === 'style' && <StyleForm s={cur} onChange={upd} />}

            {!cur && tab === 'design' && (
              <>
                <ThemePicker value={theme.tid} onPick={(t) => setTheme((old) => ({ ...old, ...lpFromTheme(t) }))} />
                <h4 style={{ margin: '18px 0 8px' }}>تخصيص يدوي</h4>
                <div className="fgrid">
                  {[['primary', 'اللون الأساسي'], ['bg', 'لون الخلفية'], ['text', 'لون النص'], ['btn_text', 'لون نص الزر']].map(([k, l]) => (
                    <Field key={k} l={l} full><div className="row" style={{ marginBottom: 0 }}><input type="color" className="clr" value={theme[k]} onChange={(e) => th(k, e.target.value)} /><input className="in num" dir="ltr" style={{ maxWidth: 120 }} value={theme[k]} onChange={(e) => th(k, e.target.value)} /></div></Field>
                  ))}
                  <Field l="الخط" full><select className="in" value={theme.font || ''} onChange={(e) => th('font', e.target.value)}>{FONTS.map((f) => <option key={f[0]} value={f[0]}>{f[1]}</option>)}</select></Field>
                  <Field l="استدارة الحواف (px)"><input className="in num" type="number" min="0" max="40" value={theme.radius} onChange={(e) => th('radius', Number(e.target.value))} /></Field>
                  <Field l="عرض الصفحة (px)"><input className="in num" type="number" min="480" max="1000" value={theme.width} onChange={(e) => th('width', Number(e.target.value))} /></Field>
                </div>
              </>
            )}

            {!cur && tab === 'settings' && (
              <div className="fgrid">
                <Field l="شريط طلب ثابت أسفل الشاشة" full><div className="tgrow"><Tog on={!!st.sticky_cta} set={(x) => setSt({ ...st, sticky_cta: x })} /><span>يظهر أثناء التمرير</span></div></Field>
                <Field l="نص الشريط الثابت" full><input className="in" value={st.sticky_text || ''} onChange={(e) => setSt({ ...st, sticky_text: e.target.value })} placeholder="اطلب الآن" /></Field>
                <Field l="رقم واتساب (زر عائم)" hint="بالصيغة الدولية، مثال: 201012345678" full><input className="in num" dir="ltr" value={st.whatsapp || ''} onChange={(e) => setSt({ ...st, whatsapp: e.target.value })} /></Field>
                <p className="mut" style={{ gridColumn: '1/-1' }}>اسم الصفحة والرابط والمنتج والسيو بتتعدل من الشاشة الرئيسية بعد إغلاق المحرر.</p>
              </div>
            )}
          </div>
        </div>

        <div className="lpb-stage">
          <div className="lpb-frame" style={{ width: w ? `${w}px` : '100%', maxWidth: '100%' }}>
            <iframe key={nonce} ref={frame} src={src} title="معاينة" />
          </div>
        </div>
      </div>
      {page.enabled === false && <div className="mut" style={{ padding: '6px 14px', background: 'var(--s)', borderTop: '1px solid var(--ln)' }}>⚠️ الصفحة «مخفية»، والمعاينة ممكن تظهر 404. فعّل «الصفحة منشورة» واحفظ عشان تظهر المعاينة.</div>}
      {lib && <Library onPick={add} onClose={() => setLib(false)} />}
    </div>
  );
}
