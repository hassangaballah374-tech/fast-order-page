'use client';
import React, { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../../lib/supabase';
import { useDash, PageHead, Empty, Spin, Tabs, Field, Tog } from '../ui';
import { useTable, useProducts } from '../hooks';
import { ImageInput } from '../forms';
import { slugify, youtubeId } from '../../../lib/storeKit';
import ThemePicker from '../ThemePicker';
import { FONTS_ALL } from '../../../lib/themes100';
import { lpFromTheme } from '../../../lib/landingThemes';

const uid8 = () => Math.random().toString(36).slice(2, 8);

/* تعريف كل نوع قسم: الاسم، الأيقونة، القيم الافتراضية، الحقول */
const TYPES = {
  hero: { n: 'الغلاف (Hero)', i: '🏁', d: { title: '', subtitle: '', badge: '', cta: 'اطلب الآن', image: '', show_price: true },
    f: [['title', 'العنوان الرئيسي'], ['subtitle', 'عنوان فرعي', 'area'], ['badge', 'شارة (مثل: خصم 30%)'], ['image', 'صورة (اتركها لصورة المنتج)', 'img'], ['cta', 'نص الزر'], ['show_price', 'إظهار السعر', 'tog']] },
  video: { n: 'فيديو يوتيوب', i: '🎬', d: { title: '', url: '' }, f: [['title', 'عنوان (اختياري)'], ['url', 'رابط يوتيوب', 'ltr']] },
  benefits: { n: 'المميزات', i: '⭐', d: { title: 'ليه تختار المنتج ده؟', items: [{ icon: '✔', title: 'ميزة 1', text: '' }, { icon: '✔', title: 'ميزة 2', text: '' }, { icon: '✔', title: 'ميزة 3', text: '' }] },
    f: [['title', 'عنوان القسم']], list: { k: 'items', add: 'ميزة', blank: { icon: '✔', title: '', text: '' }, f: [['icon', 'أيقونة/إيموجي'], ['title', 'العنوان'], ['text', 'وصف', 'area']] } },
  gallery: { n: 'معرض صور', i: '🖼️', d: { title: '', images: [] }, f: [['title', 'عنوان (اختياري)']], imgs: 'images' },
  image: { n: 'صورة', i: '📷', d: { url: '', alt: '' }, f: [['url', 'الصورة', 'img'], ['alt', 'وصف الصورة']] },
  text: { n: 'نص', i: '📝', d: { title: '', body: '', align: 'right' }, f: [['title', 'عنوان'], ['body', 'النص', 'area'], ['align', 'المحاذاة', 'sel', [['right', 'يمين'], ['center', 'وسط']]]] },
  testimonials: { n: 'آراء العملاء', i: '💬', d: { title: 'آراء عملائنا', items: [{ name: 'أحمد', text: 'منتج ممتاز', stars: 5, image: '' }] },
    f: [['title', 'عنوان القسم']], list: { k: 'items', add: 'رأي', blank: { name: '', text: '', stars: 5, image: '' }, f: [['name', 'الاسم'], ['text', 'الرأي', 'area'], ['stars', 'النجوم (1-5)', 'num'], ['image', 'صورة (اختياري)', 'img']] } },
  faq: { n: 'الأسئلة الشائعة', i: '❓', d: { title: 'الأسئلة الشائعة', items: [{ q: 'هل الدفع عند الاستلام؟', a: 'نعم، تدفع عند وصول الطلب.' }] },
    f: [['title', 'عنوان القسم']], list: { k: 'items', add: 'سؤال', blank: { q: '', a: '' }, f: [['q', 'السؤال'], ['a', 'الإجابة', 'area']] } },
  guarantee: { n: 'الضمان', i: '🛡️', d: { icon: '🛡️', title: 'ضمان الاستبدال والاسترجاع', text: 'تقدر تستبدل أو ترجّع المنتج خلال 14 يوم.' }, f: [['icon', 'أيقونة'], ['title', 'العنوان'], ['text', 'النص', 'area']] },
  countdown: { n: 'عدّاد تنازلي', i: '⏳', d: { minutes: 60, label: 'ينتهي العرض خلال' }, f: [['minutes', 'المدة بالدقائق', 'num'], ['label', 'النص فوق العدّاد']] },
  cta: { n: 'زر طلب', i: '👆', d: { title: '', cta: 'اطلب الآن' }, f: [['title', 'عنوان (اختياري)'], ['cta', 'نص الزر']] },
  order: { n: 'نموذج الطلب', i: '🛒', d: { title: 'اطلب الآن · الدفع عند الاستلام', cta: '' }, f: [['title', 'العنوان'], ['cta', 'نص زر التأكيد (اختياري)']] },
};

const mk = (type, data) => ({ id: uid8(), type, on: true, data: { ...JSON.parse(JSON.stringify(TYPES[type].d)), ...(data || {}) } });

const TEMPLATES = {
  basic: { n: 'بسيط وسريع', d: 'غلاف + مميزات + نموذج طلب', make: () => [mk('hero'), mk('benefits'), mk('order')] },
  full: { n: 'كامل (تحويلات عالية)', d: 'غلاف، فيديو، مميزات، آراء، ضمان، أسئلة، عدّاد، طلب', make: () => [mk('hero'), mk('video'), mk('benefits'), mk('testimonials'), mk('guarantee'), mk('countdown'), mk('order'), mk('faq')] },
  video: { n: 'فيديو أولاً', d: 'فيديو + مميزات + طلب', make: () => [mk('video'), mk('hero'), mk('benefits'), mk('order'), mk('faq')] },
  offer: { n: 'عرض محدود', d: 'عدّاد + غلاف + ضمان + طلب', make: () => [mk('countdown', { minutes: 120 }), mk('hero', { badge: 'عرض لفترة محدودة' }), mk('guarantee'), mk('order')] },
};

const THEME_DEF = { primary: '#0a7f86', bg: '#ffffff', text: '#1a1a1a', btn_text: '#ffffff', radius: 14, width: 680, font: '' };
const FONTS = [['', 'الافتراضي'], ...FONTS_ALL.map((f) => [f, f])];
const THEMES = [
  ['تركواز', { primary: '#0a7f86', bg: '#ffffff', text: '#1a1a1a', btn_text: '#ffffff' }],
  ['أحمر جريء', { primary: '#e11d48', bg: '#ffffff', text: '#111827', btn_text: '#ffffff' }],
  ['داكن', { primary: '#f59e0b', bg: '#111827', text: '#f9fafb', btn_text: '#111827' }],
  ['أخضر', { primary: '#16a34a', bg: '#f7fdf9', text: '#14291c', btn_text: '#ffffff' }],
  ['بنفسجي', { primary: '#7c3aed', bg: '#faf8ff', text: '#1e1b4b', btn_text: '#ffffff' }],
];

function Inp({ f, v, set }) {
  const [k, , type, opts] = f;
  if (type === 'area') return <textarea className="in ta" rows={3} value={v ?? ''} onChange={(e) => set(k, e.target.value)} />;
  if (type === 'img') return <ImageInput value={v || ''} onChange={(x) => set(k, x)} folder="landing" />;
  if (type === 'tog') return <div className="tgrow"><Tog on={v !== false && !!v} set={(x) => set(k, x)} /></div>;
  if (type === 'num') return <input className="in num" type="number" value={v ?? ''} onChange={(e) => set(k, e.target.value === '' ? '' : Number(e.target.value))} />;
  if (type === 'ltr') return <input className="in num" dir="ltr" value={v ?? ''} onChange={(e) => set(k, e.target.value)} />;
  if (type === 'sel') return <select className="in" value={v ?? ''} onChange={(e) => set(k, e.target.value)}>{opts.map((o) => <option key={o[0]} value={o[0]}>{o[1]}</option>)}</select>;
  return <input className="in" value={v ?? ''} onChange={(e) => set(k, e.target.value)} />;
}

function SectionEditor({ s, onChange }) {
  const T = TYPES[s.type];
  const d = s.data || {};
  const set = (k, v) => onChange({ ...s, data: { ...d, [k]: v } });
  const items = T.list ? (d[T.list.k] || []) : [];
  const setItem = (i, k, v) => set(T.list.k, items.map((x, j) => (j === i ? { ...x, [k]: v } : x)));
  const imgs = T.imgs ? (d[T.imgs] || []) : [];
  return (
    <div style={{ padding: '10px 0' }}>
      <div className="fgrid">
        {T.f.map((f) => <Field key={f[0]} l={f[1]} full={f[2] === 'area' || f[2] === 'img'}><Inp f={f} v={d[f[0]]} set={set} /></Field>)}
      </div>
      {T.list && (
        <div style={{ marginTop: 10 }}>
          {items.map((it, i) => (
            <div key={i} className="card" style={{ marginBottom: 8, padding: 10 }}>
              <div className="fgrid">{T.list.f.map((f) => <Field key={f[0]} l={f[1]} full={f[2] === 'area' || f[2] === 'img'}><Inp f={f} v={it[f[0]]} set={(k, v) => setItem(i, k, v)} /></Field>)}</div>
              <button type="button" className="btn sm dng" onClick={() => set(T.list.k, items.filter((_, j) => j !== i))}>حذف</button>
            </div>
          ))}
          <button type="button" className="btn sm" onClick={() => set(T.list.k, [...items, { ...T.list.blank }])}>+ إضافة {T.list.add}</button>
        </div>
      )}
      {T.imgs && (
        <div style={{ marginTop: 10 }}>
          <div className="mut" style={{ marginBottom: 6 }}>اتركه فارغاً لعرض صور المنتج تلقائياً</div>
          {imgs.map((u, i) => (
            <div key={i} className="row" style={{ marginBottom: 6 }}>
              <div style={{ flex: 1 }}><ImageInput value={u} onChange={(x) => set(T.imgs, imgs.map((y, j) => (j === i ? x : y)))} folder="landing" /></div>
              <button type="button" className="btn sm dng" onClick={() => set(T.imgs, imgs.filter((_, j) => j !== i))}>حذف</button>
            </div>
          ))}
          <button type="button" className="btn sm" onClick={() => set(T.imgs, [...imgs, ''])}>+ صورة</button>
        </div>
      )}
    </div>
  );
}

function Editor({ page, onSave, onBack, storeUrl, prods }) {
  const { say } = useDash();
  const [tab, setTab] = useState('sections');
  const [name, setName] = useState(page.name);
  const [slug, setSlug] = useState(page.slug);
  const [productId, setProductId] = useState(String(page.product_id || ''));
  const [cta, setCta] = useState(page.cta_text || '');
  const [enabled, setEnabled] = useState(page.enabled !== false);
  const [sections, setSections] = useState(Array.isArray(page.sections) ? page.sections : []);
  const [theme, setTheme] = useState({ ...THEME_DEF, ...(page.theme || {}) });
  const [seo, setSeo] = useState(page.seo || {});
  const [st, setSt] = useState(page.settings || {});
  const [open, setOpen] = useState(null);
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);

  const move = (i, dir) => setSections((a) => { const b = [...a]; const j = i + dir; if (j < 0 || j >= b.length) return a; [b[i], b[j]] = [b[j], b[i]]; return b; });
  const upd = (i, s) => setSections((a) => a.map((x, j) => (j === i ? s : x)));
  const dup = (i) => setSections((a) => { const c = { ...a[i], id: uid8(), data: JSON.parse(JSON.stringify(a[i].data)) }; return [...a.slice(0, i + 1), c, ...a.slice(i + 1)]; });
  const th = (k, v) => setTheme((t) => ({ ...t, [k]: v }));

  const save = async () => {
    const sl = slugify(slug || name);
    if (String(name).trim().length < 2) return say('اكتب اسماً للصفحة');
    if (!sl) return say('اكتب رابطاً صالحاً');
    if (!productId) return say('اختر المنتج');
    for (const s of sections) if (s.type === 'video' && s.data.url && !youtubeId(s.data.url)) return say('رابط يوتيوب غير صحيح في قسم الفيديو');
    setBusy(true);
    const ok = await onSave({ name: String(name).trim(), slug: sl, product_id: productId, cta_text: cta || null, enabled, sections, theme, seo, settings: st });
    setBusy(false);
    if (ok) { setSlug(sl); say('تم حفظ الصفحة ✅'); }
  };

  const url = `${storeUrl}/f/${slugify(slug || name)}`;
  return (
    <>
      <PageHead title={`تعديل: ${page.name}`} sub="كل تغيير يظهر في الصفحة بعد الحفظ">
        <button type="button" className="btn" onClick={onBack}>← رجوع</button>
        <a className="btn" href={url} target="_blank" rel="noreferrer">معاينة ↗</a>
        <button type="button" className="btn p" disabled={busy} onClick={save}>{busy ? '...' : 'حفظ'}</button>
      </PageHead>
      <div className="card">
        <div className="fgrid">
          <Field l="اسم داخلي"><input className="in" value={name} onChange={(e) => setName(e.target.value)} /></Field>
          <Field l="رابط الصفحة"><input className="in num" dir="ltr" value={slug} onChange={(e) => setSlug(e.target.value)} /></Field>
          <Field l="المنتج">
            <select className="in" value={productId} onChange={(e) => setProductId(e.target.value)}>
              <option value="">— اختر المنتج —</option>
              {prods.rows.map((p) => <option key={p.id} value={String(p.id)}>{p.title}</option>)}
            </select>
          </Field>
          <Field l="نص زر الطلب الافتراضي"><input className="in" value={cta} onChange={(e) => setCta(e.target.value)} placeholder="اطلب الآن" /></Field>
          <Field l="الصفحة منشورة"><div className="tgrow"><Tog on={enabled} set={setEnabled} /></div></Field>
        </div>
        <div className="mut num" dir="ltr" style={{ marginTop: 6 }}>{url}</div>
      </div>

      <Tabs tabs={[['sections', 'الأقسام', sections.length], ['design', 'التصميم'], ['extras', 'الإضافات'], ['seo', 'السيو']]} value={tab} onChange={setTab} />

      {tab === 'sections' && (
        <div className="card">
          {sections.length === 0 && <Empty icon="🧱" t="لا توجد أقسام" d="أضف قسماً أو ابدأ من قالب جاهز" />}
          {sections.map((s, i) => (
            <div key={s.id} style={{ borderBottom: '1px solid rgba(127,127,127,.2)', opacity: s.on === false ? .55 : 1 }}>
              <div className="row" style={{ marginBottom: 0, padding: '8px 0' }}>
                <span>{TYPES[s.type]?.i}</span>
                <b style={{ flex: 1, cursor: 'pointer' }} onClick={() => setOpen(open === s.id ? null : s.id)}>{TYPES[s.type]?.n}</b>
                <button type="button" className="btn sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label="لأعلى">↑</button>
                <button type="button" className="btn sm" onClick={() => move(i, 1)} disabled={i === sections.length - 1} aria-label="لأسفل">↓</button>
                <Tog on={s.on !== false} set={(x) => upd(i, { ...s, on: x })} />
                <button type="button" className="btn sm" onClick={() => dup(i)}>نسخ</button>
                <button type="button" className="btn sm" onClick={() => setOpen(open === s.id ? null : s.id)}>{open === s.id ? 'إخفاء' : 'تعديل'}</button>
                <button type="button" className="btn sm dng" onClick={() => setSections((a) => a.filter((_, j) => j !== i))}>حذف</button>
              </div>
              {open === s.id && <SectionEditor s={s} onChange={(x) => upd(i, x)} />}
            </div>
          ))}
          <div style={{ marginTop: 12 }}>
            <button type="button" className="btn p" onClick={() => setAdding(!adding)}>+ إضافة قسم</button>{' '}
            <button type="button" className="btn" onClick={() => { if (!sections.length || window.confirm('هيستبدل الأقسام الحالية بالقالب. متأكد؟')) setAdding('tpl'); }}>قوالب جاهزة</button>
          </div>
          {adding === true && (
            <div className="chips" style={{ marginTop: 10 }}>
              {Object.entries(TYPES).map(([k, t]) => <button type="button" key={k} className="chip" onClick={() => { const s = mk(k); setSections((a) => [...a, s]); setOpen(s.id); setAdding(false); }}>{t.i} {t.n}</button>)}
            </div>
          )}
          {adding === 'tpl' && (
            <div className="grid3" style={{ marginTop: 10 }}>
              {Object.entries(TEMPLATES).map(([k, t]) => (
                <button type="button" key={k} className="card" style={{ textAlign: 'right', cursor: 'pointer' }} onClick={() => { setSections(t.make()); setOpen(null); setAdding(false); }}>
                  <b>{t.n}</b><div className="mut">{t.d}</div>
                </button>
              ))}
            </div>
          )}
          {!sections.some((s) => s.type === 'order') && sections.length > 0 && <p className="mut" style={{ marginTop: 10 }}>ملاحظة: مفيش قسم «نموذج الطلب»، هيتضاف تلقائياً في آخر الصفحة.</p>}
        </div>
      )}

      {tab === 'design' && (
        <div className="card">
        <ThemePicker value={theme.tid} onPick={(t) => setTheme((old) => ({ ...old, ...lpFromTheme(t) }))} />
          <h4 style={{ margin: '18px 0 8px' }}>تخصيص يدوي</h4>
          <div className="chips" style={{ marginBottom: 12 }}>
            {THEMES.map(([n, v]) => <button type="button" key={n} className="chip" onClick={() => setTheme((t) => ({ ...t, ...v }))}><span style={{ display: 'inline-block', width: 12, height: 12, borderRadius: 6, background: v.primary, marginInlineEnd: 6 }} />{n}</button>)}
          </div>
          <div className="fgrid">
            {[['primary', 'اللون الأساسي'], ['bg', 'لون الخلفية'], ['text', 'لون النص'], ['btn_text', 'لون نص الزر']].map(([k, l]) => (
              <Field key={k} l={l}><div className="row" style={{ marginBottom: 0 }}><input type="color" className="clr" value={theme[k]} onChange={(e) => th(k, e.target.value)} /><input className="in num" dir="ltr" style={{ maxWidth: 120 }} value={theme[k]} onChange={(e) => th(k, e.target.value)} /></div></Field>
            ))}
            <Field l="الخط"><select className="in" value={theme.font || ''} onChange={(e) => th('font', e.target.value)}>{FONTS.map((f) => <option key={f[0]} value={f[0]}>{f[1]}</option>)}</select></Field>
            <Field l="استدارة الحواف (px)"><input className="in num" type="number" min="0" max="40" value={theme.radius} onChange={(e) => th('radius', Number(e.target.value))} /></Field>
            <Field l="عرض الصفحة (px)"><input className="in num" type="number" min="480" max="1000" value={theme.width} onChange={(e) => th('width', Number(e.target.value))} /></Field>
          </div>
        </div>
      )}

      {tab === 'extras' && (
        <div className="card">
          <div className="fgrid">
            <Field l="شريط طلب ثابت أسفل الشاشة (Sticky)"><div className="tgrow"><Tog on={!!st.sticky_cta} set={(x) => setSt({ ...st, sticky_cta: x })} /><span>يظهر أثناء التمرير ويوصّل لنموذج الطلب</span></div></Field>
            <Field l="نص الشريط الثابت"><input className="in" value={st.sticky_text || ''} onChange={(e) => setSt({ ...st, sticky_text: e.target.value })} placeholder="اطلب الآن" /></Field>
            <Field l="رقم واتساب (زر عائم)" hint="بالصيغة الدولية، مثال: 201012345678"><input className="in num" dir="ltr" value={st.whatsapp || ''} onChange={(e) => setSt({ ...st, whatsapp: e.target.value })} /></Field>
          </div>
          <p className="mut" style={{ marginTop: 10 }}>تتبع البكسل (ViewContent / Purchase) شغّال تلقائياً بإعدادات «إعدادات البكسل» الخاصة بمتجرك.</p>
        </div>
      )}

      {tab === 'seo' && (
        <div className="card">
          <div className="fgrid">
            <Field l="عنوان الصفحة (Title)" full><input className="in" value={seo.title || ''} onChange={(e) => setSeo({ ...seo, title: e.target.value })} /></Field>
            <Field l="الوصف (Description)" full><textarea className="in ta" rows={3} value={seo.description || ''} onChange={(e) => setSeo({ ...seo, description: e.target.value })} /></Field>
            <Field l="صورة المشاركة (OG)" full><ImageInput value={seo.image || ''} onChange={(x) => setSeo({ ...seo, image: x })} folder="landing" /></Field>
            <Field l="إخفاء من محركات البحث (noindex)"><div className="tgrow"><Tog on={!!seo.noindex} set={(x) => setSeo({ ...seo, noindex: x })} /></div></Field>
          </div>
        </div>
      )}
    </>
  );
}

export function LandingScreen() {
   const { storeUrl, say, uid } = useDash();
  const t = useTable('store_funnels', { order: 'created_at' });
  const prods = useProducts();
  const [edit, setEdit] = useState(null);
  const [creating, setCreating] = useState(false);
  const [nm, setNm] = useState('');
  const [tpl, setTpl] = useState('full');
  const [pid, setPid] = useState('');
  const [orderCounts, setOrderCounts] = useState({});

  useEffect(() => {
    if (!uid) return;
    supabase.from('orders').select('utm').eq('store_id', uid).limit(5000).then(({ data }) => {
      const m = {};
      (data || []).forEach((o) => { const f = o.utm && o.utm.funnel; if (f) m[f] = (m[f] || 0) + 1; });
      setOrderCounts(m);
    });
  }, [uid, t.rows.length]);

  const duplicate = async (r) => {
    const sl = `${r.slug}-copy-${uid8().slice(0, 3)}`;
    const row = await t.insert({
      name: `${r.name} (نسخة)`, slug: sl, product_id: r.product_id, enabled: false, bullets: r.bullets || [], countdown_minutes: r.countdown_minutes || 0,
      cta_text: r.cta_text, video_url: r.video_url, headline: r.headline, subheadline: r.subheadline,
      sections: (r.sections || []).map((s) => ({ ...s, id: uid8() })), theme: r.theme || {}, seo: r.seo || {}, settings: r.settings || {},
    });
    if (row) say('تم نسخ الصفحة (مخفية، انشرها بعد التعديل)');
  };

  if (t.loading) return <Spin />;
  if (edit) {
    const page = t.rows.find((r) => r.id === edit);
    if (!page) { setEdit(null); return null; }
    return (
      <Editor
        key={page.id} page={page} storeUrl={storeUrl} prods={prods} onBack={() => setEdit(null)}
        onSave={async (patch) => {
          const clash = t.rows.find((r) => r.slug === patch.slug && r.id !== page.id);
          if (clash) { say('الرابط ده مستخدم في صفحة تانية'); return false; }
          return !!(await t.update(page.id, patch));
        }}
      />
    );
  }

  const create = async () => {
    if (nm.trim().length < 2) return say('اكتب اسماً للصفحة');
    if (!pid) return say('اختر المنتج');
    let sl = slugify(nm) || `lp-${uid8()}`;
    if (t.rows.some((r) => r.slug === sl)) sl = `${sl}-${uid8().slice(0, 3)}`;
    const row = await t.insert({ name: nm.trim(), slug: sl, product_id: pid, enabled: true, bullets: [], countdown_minutes: 0, sections: TEMPLATES[tpl].make(), theme: THEME_DEF, seo: {}, settings: { sticky_cta: true } });
    if (row) { setCreating(false); setNm(''); setEdit(row.id); }
  };

  return (
    <>
      <PageHead title="منشئ صفحات الهبوط" sub="ابنِ صفحة هبوط احترافية بالأقسام: غلاف، فيديو، مميزات، آراء، ضمان، أسئلة، عدّاد ونموذج طلب.">
        <button type="button" className="btn p" onClick={() => setCreating(!creating)}>+ صفحة جديدة</button>
      </PageHead>
      {creating && (
        <div className="card">
          <div className="fgrid">
            <Field l="اسم الصفحة"><input className="in" value={nm} onChange={(e) => setNm(e.target.value)} /></Field>
            <Field l="المنتج">
              <select className="in" value={pid} onChange={(e) => setPid(e.target.value)}>
                <option value="">— اختر المنتج —</option>
                {prods.rows.map((p) => <option key={p.id} value={String(p.id)}>{p.title}</option>)}
              </select>
            </Field>
          </div>
          <div className="grid3" style={{ margin: '10px 0' }}>
            {Object.entries(TEMPLATES).map(([k, x]) => (
              <button type="button" key={k} className="card" onClick={() => setTpl(k)} style={{ textAlign: 'right', cursor: 'pointer', borderColor: tpl === k ? 'var(--brand, #0a7f86)' : undefined, borderWidth: tpl === k ? 2 : 1 }}>
                <b>{x.n}</b><div className="mut">{x.d}</div>
              </button>
            ))}
          </div>
          <button type="button" className="btn p" onClick={create}>إنشاء وفتح المحرّر</button>
        </div>
      )}
      <div className="card">
        {t.rows.length === 0 ? <Empty icon="🚀" t="لا توجد صفحات هبوط بعد" d="اضغط «صفحة جديدة» واختر قالباً" /> : (
          <div className="tw"><table className="tbl">
            <thead><tr><th>الصفحة</th><th>الرابط</th><th>الأقسام</th><th>المشاهدات</th><th>الطلبات</th><th>التحويل</th><th>الحالة</th><th /></tr></thead>
            <tbody>
              {t.rows.map((r) => (
                <tr key={r.id}>
                  <td><b>{r.name}</b></td>
                  <td><a className="num" dir="ltr" href={`${storeUrl}/f/${r.slug}`} target="_blank" rel="noreferrer">/f/{r.slug}</a></td>
                  <td className="num">{Array.isArray(r.sections) && r.sections.length ? r.sections.length : 'قديمة'}</td>
                  <td className="num">{r.views || 0}</td>
                  <td className="num">{orderCounts[r.slug] || 0}</td>
                  <td className="num">{r.views > 0 ? `${(((orderCounts[r.slug] || 0) / r.views) * 100).toFixed(1)}%` : '—'}</td>
                  <td>{r.enabled === false ? 'مخفية' : 'منشورة'}</td>
                  <td>
                    <button type="button" className="btn sm p" onClick={() => setEdit(r.id)}>تعديل</button>{' '}
                    <button type="button" className="btn sm" onClick={async () => { await t.update(r.id, { enabled: r.enabled === false }); }}>{r.enabled === false ? 'نشر' : 'إخفاء'}</button>{' '}
                    <button type="button" className="btn sm" onClick={() => duplicate(r)}>نسخ</button>{' '}
                    <button type="button" className="btn sm dng" onClick={async () => { if (window.confirm('حذف الصفحة نهائياً؟')) await t.remove(r.id); }}>حذف</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table></div>
        )}
      </div>
    </>
  );
}
