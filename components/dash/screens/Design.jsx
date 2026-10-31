'use client';
import React, { useRef, useState } from 'react';
import { useDash, PageHead, Modal, Field, Empty, Spin, Badge, Tog, CopyBtn } from '../ui';
import { useTable, uploadAsset, removeAsset } from '../hooks';
import { Crud, ConfigForm, FieldsGrid } from '../forms';
import { useSection, SaveBtn, LinkBox } from '../bits';
import { fday } from '../shared';
import {
  THEMES, themeById, FONTS, HOME_SECTION_TYPES, DEFAULT_HOME_SECTIONS, BLOCK_KINDS, BLOCK_PLACEMENTS, slugify, safeUrl, youtubeId,
} from '../../../lib/storeKit';

const sizeText = (n) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round((n || 0) / 1024))} KB`);

/* ====================== الثيمات والهوية ====================== */
function ThemePreview({ d }) {
  const { store, cfg } = useDash();
  const th = themeById(d.theme);
  const color = d.color || th.color;
  const r = Number(d.radius) || th.radius;
  return (
    <div style={{ maxWidth: '100%', overflow: 'hidden', background: th.bg, color: th.ink, borderRadius: 18, padding: 12, fontFamily: `'${d.font || 'Cairo'}', sans-serif`, border: `1px solid ${th.ln}` }}>
      {d.announcement && <div style={{ background: color, color: '#fff', textAlign: 'center', fontSize: 12, padding: '6px 8px', borderRadius: 8, marginBottom: 8 }}>{d.announcement}</div>}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
        {d.logo ? <img src={d.logo} alt="" style={{ width: 30, height: 30, borderRadius: 8, objectFit: 'cover' }} /> : <span style={{ width: 30, height: 30, borderRadius: 8, background: color, display: 'inline-block' }} />}
        <b>{store?.store_name || 'متجري'}</b>
      </div>
      {d.tagline && <p style={{ margin: '0 0 10px', fontSize: 12, color: th.mut }}>{d.tagline}</p>}
      <div style={{ display: 'grid', gridTemplateColumns: `repeat(${Math.min(3, Number(d.columns) || 2)}, 1fr)`, gap: 8 }}>
        {[1, 2, 3].slice(0, Math.min(3, Number(d.columns) || 2)).map((i) => (
          <div key={i} style={{ background: th.card, border: d.card_style === 'outline' ? `2px solid ${th.ln}` : `1px solid ${th.ln}`, borderRadius: r, padding: 8, boxShadow: d.card_style === 'soft' ? '0 6px 16px -10px rgba(0,0,0,.3)' : 'none' }}>
            <div style={{ height: 54, borderRadius: Math.max(4, r - 6), background: th.ln, marginBottom: 6 }} />
            <div style={{ fontSize: 11, fontWeight: 700 }}>منتج {i}</div>
            <div style={{ fontSize: 11, color: th.mut }}>199 {cfg.currency}</div>
            <div style={{ marginTop: 6, background: color, color: '#fff', borderRadius: Math.max(4, r - 6), textAlign: 'center', fontSize: 11, padding: '4px 0' }}>اطلب الآن</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ThemesScreen() {
  return (
    <ConfigForm
      section="brand" title="الثيمات والهوية" desc="اختر شكل متجرك. التغيير يظهر للعملاء فور الحفظ."
      preview={(d) => <ThemePreview d={d} />}
      fields={[
        { k: 'color', l: 'اللون الأساسي', type: 'color' },
        { k: 'font', l: 'الخط', type: 'select', options: FONTS },
        { k: 'radius', l: 'استدارة الزوايا (px)', type: 'number', min: 0, max: 30 },
        { k: 'columns', l: 'عدد أعمدة المنتجات (موبايل: عمودان دائماً)', type: 'select', options: [['2', '2'], ['3', '3'], ['4', '4']] },
        { k: 'card_style', l: 'شكل كارت المنتج', type: 'select', options: [['soft', 'ظل ناعم'], ['flat', 'مسطح'], ['outline', 'إطار']] },
        { k: 'tagline', l: 'شعار نصي قصير', ph: 'أفضل المنتجات بأفضل سعر' },
        { k: 'logo', l: 'الشعار (Logo)', type: 'image', folder: 'brand' },
        { k: 'favicon', l: 'أيقونة المتصفح (Favicon)', type: 'image', folder: 'brand' },
        { k: 'banner', l: 'صورة غلاف افتراضية', type: 'image', folder: 'brand' },
        { k: 'announcement', l: 'شريط إعلان أعلى المتجر', ph: 'شحن مجاني فوق 500 جنيه 🚚', full: true },
        { k: 'announcement_link', l: 'رابط الإعلان (اختياري)', type: 'ltr' },
      ]}
      validate={(d) => (d.announcement_link && !safeUrl(d.announcement_link) ? 'رابط الإعلان لازم يبدأ بـ https:// أو /' : '')}
    >
      {({ draft, set }) => (
        <div style={{ marginTop: 16 }}>
          <h3>🎨 اختر الثيم</h3>
          <div className="grid2" style={{ marginBottom: 0 }}>
            {THEMES.map((t) => (
              <button
                key={t.id} type="button" className={'thm' + (draft.theme === t.id ? ' act' : '')}
                onClick={() => { set('theme', t.id); set('color', t.color); set('radius', t.radius); }}
              >
                <div className="pvw" style={{ background: t.bg, border: `1px solid ${t.ln}` }}>
                  <i style={{ background: t.color, width: '45%' }} />
                  <i style={{ background: t.card, width: '80%', border: `1px solid ${t.ln}` }} />
                  <i style={{ background: t.ln, width: '60%' }} />
                </div>
                <b>{t.name}</b>
                <small className="mut" style={{ display: 'block' }}>{t.desc}</small>
              </button>
            ))}
          </div>
        </div>
      )}
    </ConfigForm>
  );
}

/* ====================== تعديل الصفحة الرئيسية ====================== */
const UNIQUE_TYPES = ['hero', 'trust', 'categories', 'testimonials', 'newsletter'];
const SECTION_FIELDS = {
  hero: [{ k: 'title', l: 'العنوان الرئيسي' }, { k: 'subtitle', l: 'عنوان فرعي' }, { k: 'image', l: 'صورة الغلاف', type: 'image', folder: 'home' }, { k: 'button_text', l: 'نص الزر' }, { k: 'button_link', l: 'رابط الزر', type: 'ltr', ph: '#products' }],
  banner: [{ k: 'title', l: 'العنوان' }, { k: 'subtitle', l: 'نص فرعي' }, { k: 'image', l: 'صورة البانر', type: 'image', folder: 'home' }, { k: 'button_text', l: 'نص الزر' }, { k: 'button_link', l: 'رابط الزر', type: 'ltr' }],
  trust: [{ k: 'title', l: 'العنوان (اختياري)' }, { k: 'items', l: 'المميزات: سطر لكل ميزة بصيغة رمز|عنوان|وصف (اتركه فارغاً للاستخدام الافتراضي)', type: 'lines', rows: 5, ph: '🚚|شحن سريع|لكل المحافظات' }],
  categories: [{ k: 'title', l: 'العنوان' }, { k: 'subtitle', l: 'نص فرعي' }],
  featured: [{ k: 'title', l: 'العنوان' }, { k: 'subtitle', l: 'نص فرعي' }, { k: 'limit', l: 'عدد المنتجات', type: 'number', min: 2, max: 24 }],
  bestsellers: [{ k: 'title', l: 'العنوان' }, { k: 'subtitle', l: 'نص فرعي' }, { k: 'limit', l: 'عدد المنتجات', type: 'number', min: 2, max: 24 }],
  newest: [{ k: 'title', l: 'العنوان' }, { k: 'subtitle', l: 'نص فرعي' }, { k: 'limit', l: 'عدد المنتجات', type: 'number', min: 2, max: 24 }],
  testimonials: [{ k: 'title', l: 'العنوان' }, { k: 'subtitle', l: 'نص فرعي' }, { k: 'limit', l: 'عدد التقييمات', type: 'number', min: 2, max: 12 }],
  blocks: [{ k: 'title', l: 'عنوان (اختياري)' }, { k: 'placement', l: 'عرض عناصر الـ UI Blocks التي موضعها', type: 'select', options: [['home_top', 'أعلى الرئيسية'], ['home_bottom', 'أسفل الرئيسية']] }],
  newsletter: [{ k: 'title', l: 'العنوان' }, { k: 'subtitle', l: 'نص فرعي' }],
};

export function HomeScreen() {
  const { say } = useDash();
  const s = useSection('home');
  const sections = Array.isArray(s.draft.sections) ? s.draft.sections : [];
  const [edit, setEdit] = useState(null);
  const [adding, setAdding] = useState(false);
  const setSections = (arr) => s.set('sections', arr);

  const move = (i, d) => {
    const a = [...sections];
    const j = i + d;
    if (j < 0 || j >= a.length) return;
    [a[i], a[j]] = [a[j], a[i]];
    setSections(a);
  };
  const toggle = (i, v) => setSections(sections.map((x, k) => (k === i ? { ...x, enabled: v } : x)));
  const remove = (i) => { if (window.confirm('حذف هذا القسم من الصفحة الرئيسية؟')) setSections(sections.filter((_, k) => k !== i)); };
  const add = (type) => {
    const id = UNIQUE_TYPES.includes(type) ? type : `${type}-${Date.now().toString(36)}`;
    if (UNIQUE_TYPES.includes(type) && sections.some((x) => x.type === type)) { say('هذا القسم موجود بالفعل'); return; }
    const base = DEFAULT_HOME_SECTIONS.find((x) => x.type === type) || { title: HOME_SECTION_TYPES[type].ar, subtitle: '', limit: 8 };
    setSections([...sections, { ...base, id, type, enabled: true }]);
    setAdding(false);
  };
  const saveEdit = () => {
    setSections(sections.map((x, k) => (k === edit.i ? { ...edit.v } : x)));
    setEdit(null);
  };
  const reset = () => { if (window.confirm('إرجاع الصفحة الرئيسية للترتيب الافتراضي؟')) setSections(DEFAULT_HOME_SECTIONS); };

  return (
    <>
      <PageHead title="تعديل الصفحة الرئيسية" sub={`${sections.filter((x) => x.enabled).length} قسم ظاهر`}>
        <button type="button" className="btn" onClick={reset}>إعادة الافتراضي</button>
        <button type="button" className="btn" onClick={() => setAdding(true)}>+ إضافة قسم</button>
        <SaveBtn s={s} />
      </PageHead>
      <p className="mut dsc">رتّب أقسام صفحتك الرئيسية، أخفِ أو أظهر أي قسم، وعدّل نصوصه وصوره.</p>
      <div className="card">
        {sections.length === 0 && <Empty icon="🧱" t="لا توجد أقسام" d="اضغط «إضافة قسم»" />}
        {sections.map((x, i) => {
          const meta = HOME_SECTION_TYPES[x.type] || { ar: x.type, icon: '🧩' };
          return (
            <div key={x.id || i} className={'sec' + (x.enabled ? ' act' : '')}>
              <span style={{ fontSize: 20 }}>{meta.icon}</span>
              <b>{meta.ar}<small className="mut" style={{ display: 'block', fontWeight: 600 }}>{x.title || '—'}</small></b>
              <button type="button" className="btn sm" disabled={i === 0} onClick={() => move(i, -1)} aria-label="أعلى">↑</button>
              <button type="button" className="btn sm" disabled={i === sections.length - 1} onClick={() => move(i, 1)} aria-label="أسفل">↓</button>
              <Tog on={!!x.enabled} set={(v) => toggle(i, v)} />
              <button type="button" className="btn sm" onClick={() => setEdit({ i, v: { ...x } })}>تعديل</button>
              <button type="button" className="btn sm dng" onClick={() => remove(i)}>✕</button>
            </div>
          );
        })}
      </div>

      {adding && (
        <Modal t="إضافة قسم" x={() => setAdding(false)}>
          <div style={{ display: 'grid', gap: 8 }}>
            {Object.entries(HOME_SECTION_TYPES).map(([k, v]) => {
              const used = UNIQUE_TYPES.includes(k) && sections.some((x) => x.type === k);
              return <button key={k} type="button" className="btn" disabled={used} style={{ justifyContent: 'flex-start' }} onClick={() => add(k)}>{v.icon} {v.ar}{used ? ' (موجود)' : ''}</button>;
            })}
          </div>
        </Modal>
      )}
      {edit && (
        <Modal
          t={`تعديل: ${(HOME_SECTION_TYPES[edit.v.type] || {}).ar || ''}`} x={() => setEdit(null)}
          foot={<><button type="button" className="btn" onClick={() => setEdit(null)}>إلغاء</button><button type="button" className="btn p" onClick={saveEdit}>تم</button></>}
        >
          <FieldsGrid fields={SECTION_FIELDS[edit.v.type] || []} draft={edit.v} set={(k, v) => setEdit((e) => ({ ...e, v: { ...e.v, [k]: v } }))} />
          <small className="hint">اضغط «حفظ التغييرات» أعلى الصفحة بعد الانتهاء.</small>
        </Modal>
      )}
    </>
  );
}

/* ====================== الصفحات ====================== */
const PAGE_TEMPLATES = [
  { title: 'سياسة الاسترجاع والاستبدال', slug: 'returns', content: 'يحق لك معاينة الطلب عند الاستلام قبل الدفع.\nيمكن استبدال أو استرجاع المنتج خلال 14 يوماً من الاستلام بشرط أن يكون بحالته الأصلية.\nللتواصل بخصوص أي طلب راسلنا على واتساب.' },
  { title: 'من نحن', slug: 'about', content: 'نحن متجر مصري نقدم منتجات مختارة بعناية بأفضل سعر مع خدمة الدفع عند الاستلام والشحن لكل المحافظات.' },
  { title: 'سياسة الشحن', slug: 'shipping', content: 'نشحن لجميع محافظات مصر. مدة التوصيل من 2 إلى 5 أيام عمل حسب المحافظة. الدفع نقداً عند الاستلام.' },
];

export function PagesScreen() {
  const { storeUrl, say } = useDash();
  const base = storeUrl ? `${storeUrl}/page/` : '';
  return (
    <Crud
      table="store_pages" noun="صفحة" title="الصفحات" order="sort_order" asc
      desc="صفحات ثابتة مثل سياسة الاسترجاع و«من نحن». تظهر روابطها في أسفل المتجر."
      search={(r) => `${r.title} ${r.slug}`}
      defaults={{ enabled: true, in_footer: true, sort_order: 0 }}
      toggleKey="enabled"
      toolbar={(t) => (
        <button type="button" className="btn" onClick={async () => {
          let n = 0;
          for (const p of PAGE_TEMPLATES) {
            if (t.rows.some((r) => r.slug === p.slug)) continue;
            if (await t.insert({ ...p, enabled: true, in_footer: true, sort_order: n })) n += 1;
          }
          say(n ? `✅ تمت إضافة ${n} صفحة جاهزة` : 'الصفحات الجاهزة موجودة بالفعل');
        }}
        >📄 إضافة صفحات جاهزة</button>
      )}
      columns={[
        { l: 'الصفحة', render: (r) => <b>{r.title}</b> },
        { l: 'الرابط', render: (r) => <a className="num" dir="ltr" href={`${base}${r.slug}`} target="_blank" rel="noreferrer">/page/{r.slug}</a> },
        { l: 'في الفوتر', render: (r) => (r.in_footer ? '✓' : '—') },
      ]}
      fields={[
        { k: 'title', l: 'عنوان الصفحة', full: true },
        { k: 'slug', l: 'الرابط المختصر', type: 'ltr', ph: 'returns', hint: 'حروف إنجليزية أو عربية وشرطة. اتركه فارغاً ليُنشأ من العنوان' },
        { k: 'sort_order', l: 'الترتيب', type: 'number' },
        { k: 'content', l: 'المحتوى', type: 'textarea', rows: 10, hint: 'كل سطر فارغ يبدأ فقرة جديدة' },
        { k: 'in_footer', l: 'الفوتر', type: 'toggle', text: 'إظهار رابط الصفحة في أسفل المتجر' },
      ]}
      validate={(e) => (String(e.title || '').trim().length < 2 ? 'اكتب عنوان الصفحة' : !slugify(e.slug || e.title) ? 'اكتب رابطاً صالحاً' : '')}
      transform={(e) => ({ ...e, title: String(e.title).trim(), slug: slugify(e.slug || e.title), sort_order: Number(e.sort_order) || 0 })}
    />
  );
}

/* ====================== نموذج الشراء ====================== */
export function CheckoutScreen() {
  const { cfg } = useDash();
  return (
    <ConfigForm
      section="checkout" title="نموذج الشراء" desc="اختر الحقول التي تظهر للعميل في صفحة الطلب. كلما قلّت الحقول زادت نسبة التحويل."
      fields={[
        { k: 'phone2', l: 'رقم هاتف إضافي', type: 'toggle', text: 'إظهار حقل رقم بديل' },
        { k: 'email', l: 'البريد الإلكتروني', type: 'toggle', text: 'إظهار حقل البريد' },
        { k: 'address2', l: 'عنوان إضافي', type: 'toggle', text: 'إظهار حقل علامة مميزة/عنوان ثانٍ' },
        { k: 'note', l: 'ملاحظات', type: 'toggle', text: 'إظهار حقل ملاحظات الطلب' },
        { k: 'show_images', l: 'صور المنتجات', type: 'toggle', text: 'إظهار صور المنتجات في ملخص الطلب' },
        { k: 'one_page', l: 'نموذج مبسط', type: 'toggle', text: 'نموذج الطلب السريع داخل صفحة المنتج' },
        { k: 'button_text', l: 'نص زر الطلب', full: true },
        { k: 'trust_text', l: 'نص الثقة تحت الزر', full: true },
        { k: 'terms_text', l: 'نص الشروط (اختياري)', type: 'textarea', rows: 3 },
      ]}
      preview={(d) => (
        <div className="pv">
          <b>معاينة النموذج</b>
          <input className="in" disabled placeholder="الاسم بالكامل" />
          <input className="in" disabled placeholder="رقم الموبايل" />
          {d.phone2 && <input className="in" disabled placeholder="رقم إضافي" />}
          {d.email && <input className="in" disabled placeholder="البريد الإلكتروني" />}
          <input className="in" disabled placeholder="المحافظة" />
          <input className="in" disabled placeholder="العنوان بالتفصيل" />
          {d.address2 && <input className="in" disabled placeholder="علامة مميزة" />}
          {d.note && <input className="in" disabled placeholder="ملاحظات (اختياري)" />}
          <button type="button" className="btn p" disabled style={{ opacity: 1 }}>{d.button_text || 'اطلب الآن'}</button>
          <small className="mut" style={{ textAlign: 'center' }}>{d.trust_text}</small>
          <small className="mut">العملة: {cfg.currency}</small>
        </div>
      )}
    />
  );
}

/* ====================== صفحة الشكر ====================== */
export function ThankYouScreen() {
  return (
    <ConfigForm
      section="thankyou" title="تعديل صفحة الشكر" desc="الصفحة التي يراها العميل بعد تأكيد الطلب. حدث الشراء للبكسل يُرسل من هنا."
      fields={[
        { k: 'title', l: 'العنوان', full: true },
        { k: 'message', l: 'رسالة الشكر', type: 'textarea', rows: 4 },
        { k: 'show_wa_confirm', l: 'تأكيد واتساب', type: 'toggle', text: 'زر «أكّد طلبك على واتساب»' },
        { k: 'show_track', l: 'تتبع الطلب', type: 'toggle', text: 'إظهار رابط تتبع الطلب' },
        { k: 'show_share', l: 'المشاركة', type: 'toggle', text: 'زر مشاركة المتجر' },
        { k: 'redirect_url', l: 'تحويل بعد الطلب (اختياري)', type: 'ltr', ph: 'https://...', hint: 'لو كتبت رابطاً يتحول إليه العميل بعد 4 ثوانٍ من ظهور الشكر' },
      ]}
      validate={(d) => (d.redirect_url && !/^https?:\/\//i.test(d.redirect_url) ? 'رابط التحويل لازم يبدأ بـ https://' : '')}
      preview={(d) => (
        <div className="pv" style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 40 }}>✅</div>
          <b style={{ fontSize: 18 }}>{d.title}</b>
          <p style={{ margin: 0 }}>{d.message}</p>
          <small className="mut">طلب رقم #1024 · الإجمالي 350 ج.م</small>
          {d.show_wa_confirm && <span className="btn wa">تأكيد على واتساب</span>}
          {d.show_track && <span className="btn">تتبع طلبك</span>}
          {d.show_share && <span className="btn">شارك المتجر</span>}
        </div>
      )}
    />
  );
}

/* ====================== UI Blocks ====================== */
const KIND_FIELDS = {
  announcement: [{ k: 'text', l: 'نص الإعلان', full: true }, { k: 'link', l: 'رابط (اختياري)', type: 'ltr' }, { k: 'bg', l: 'لون الخلفية', type: 'color' }, { k: 'fg', l: 'لون النص', type: 'color' }],
  countdown: [{ k: 'title', l: 'عنوان العرض', full: true }, { k: 'ends_at', l: 'ينتهي في', type: 'datetime' }, { k: 'button_text', l: 'نص الزر' }, { k: 'link', l: 'رابط الزر', type: 'ltr' }],
  trust: [{ k: 'items', l: 'المميزات: سطر لكل ميزة بصيغة رمز|عنوان|وصف', type: 'lines', rows: 5, ph: '🚚|شحن سريع|لكل المحافظات' }],
  faq: [{ k: 'items', l: 'سطر لكل سؤال بصيغة السؤال|الجواب', type: 'lines', rows: 6, ph: 'هل الدفع عند الاستلام؟|نعم، تدفع للمندوب' }],
  image: [{ k: 'image', l: 'الصورة', type: 'image', folder: 'blocks' }, { k: 'link', l: 'رابط (اختياري)', type: 'ltr' }, { k: 'alt', l: 'وصف الصورة' }],
  video: [{ k: 'url', l: 'رابط فيديو يوتيوب', type: 'ltr', full: true }, { k: 'title', l: 'عنوان (اختياري)' }],
  text: [{ k: 'title', l: 'العنوان' }, { k: 'body', l: 'النص', type: 'textarea', rows: 6 }],
};

export function BlocksScreen() {
  const { say } = useDash();
  const t = useTable('store_blocks', { order: 'sort_order', asc: true, limit: 300 });
  const [edit, setEdit] = useState(null);
  const [busy, setBusy] = useState(false);

  const open = (b) => setEdit(b ? { ...b, content: { ...(b.content || {}) } } : { _new: true, name: '', kind: 'announcement', placement: 'home_top', enabled: true, sort_order: 0, content: { bg: '#0a7f86', fg: '#ffffff' } });

  const save = async () => {
    const c = { ...edit.content };
    const name = String(edit.name || '').trim();
    if (name.length < 2) { say('اكتب اسماً للعنصر (للتمييز فقط)'); return; }
    const k = edit.kind;
    if (k === 'announcement' && !String(c.text || '').trim()) { say('اكتب نص الإعلان'); return; }
    if (k === 'countdown' && !(c.ends_at && new Date(c.ends_at).getTime() > Date.now())) { say('اختر وقت انتهاء في المستقبل'); return; }
    if (k === 'image' && !c.image) { say('اختر صورة'); return; }
    if (k === 'video' && !youtubeId(c.url)) { say('رابط يوتيوب غير صحيح'); return; }
    if (k === 'text' && !String(c.body || '').trim()) { say('اكتب النص'); return; }
    if (c.link && !safeUrl(c.link)) { say('الرابط لازم يبدأ بـ https:// أو /'); return; }
    if (k === 'trust' || k === 'faq') {
      c.items = (Array.isArray(c.items) ? c.items : String(c.items || '').split('\n')).map((x) => String(x).trim()).filter(Boolean);
      if (!c.items.length) { say('أضف سطراً واحداً على الأقل'); return; }
    }
    setBusy(true);
    const row = { name, kind: k, placement: edit.placement, enabled: edit.enabled !== false, sort_order: Number(edit.sort_order) || 0, content: c };
    const res = edit._new ? await t.insert(row) : await t.update(edit.id, row);
    setBusy(false);
    if (res) { setEdit(null); say('✅ تم الحفظ'); }
  };
  const del = async (b) => { if (window.confirm('حذف هذا العنصر؟') && await t.remove(b.id)) say('تم الحذف'); };

  return (
    <>
      <PageHead title="UI Blocks" sub={`${t.rows.length} عنصر`}>
        <button type="button" className="btn p" onClick={() => open(null)}>+ عنصر جديد</button>
      </PageHead>
      <p className="mut dsc">عناصر جاهزة (إعلان، عدّاد، أسئلة شائعة...) تضعها في أي مكان بالمتجر بدون برمجة.</p>
      {t.err && <div className="card errbox">⚠️ {t.err}</div>}
      <div className="card tw">
        {t.loading ? <div className="c"><Spin /></div> : t.rows.length === 0 ? <Empty icon="🧱" t="لا توجد عناصر بعد" d="أضف شريط إعلان أو عدّاداً تنازلياً للعروض" /> : (
          <table className="tbl">
            <thead><tr><th>العنصر</th><th>النوع</th><th>المكان</th><th>مفعّل</th><th /></tr></thead>
            <tbody>
              {t.rows.map((b) => (
                <tr key={b.id}>
                  <td><b>{b.name}</b></td>
                  <td>{(BLOCK_KINDS[b.kind] || {}).icon} {(BLOCK_KINDS[b.kind] || {}).ar || b.kind}</td>
                  <td>{BLOCK_PLACEMENTS[b.placement] || b.placement}</td>
                  <td><Tog on={b.enabled !== false} set={(v) => t.update(b.id, { enabled: v })} /></td>
                  <td className="acts">
                    <button type="button" className="btn sm" onClick={() => open(b)}>تعديل</button>
                    <button type="button" className="btn sm dng" onClick={() => del(b)}>حذف</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
      {edit && (
        <Modal
          wide t={edit._new ? 'عنصر جديد' : 'تعديل العنصر'} x={() => setEdit(null)}
          foot={<><button type="button" className="btn" onClick={() => setEdit(null)}>إلغاء</button><button type="button" className="btn p" disabled={busy} onClick={save}>{busy ? '...' : 'حفظ'}</button></>}
        >
          <div className="fgrid">
            <Field l="اسم داخلي"><input className="in" value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></Field>
            <Field l="النوع">
              <select className="in" value={edit.kind} onChange={(e) => setEdit({ ...edit, kind: e.target.value, content: e.target.value === 'announcement' ? { bg: '#0a7f86', fg: '#ffffff' } : {} })}>
                {Object.entries(BLOCK_KINDS).map(([k, v]) => <option key={k} value={k}>{v.icon} {v.ar}</option>)}
              </select>
            </Field>
            <Field l="مكان الظهور">
              <select className="in" value={edit.placement} onChange={(e) => setEdit({ ...edit, placement: e.target.value })}>
                {Object.entries(BLOCK_PLACEMENTS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
            </Field>
            <Field l="الترتيب"><input className="in num" type="number" value={edit.sort_order} onChange={(e) => setEdit({ ...edit, sort_order: e.target.value })} /></Field>
          </div>
          <FieldsGrid fields={KIND_FIELDS[edit.kind] || []} draft={edit.content} set={(k, v) => setEdit((e) => ({ ...e, content: { ...e.content, [k]: v } }))} />
        </Modal>
      )}
    </>
  );
}

/* ====================== رفع ملفات التصاميم ====================== */
export function AssetsScreen() {
  const { uid, say } = useDash();
  const t = useTable('store_assets', { order: 'created_at', limit: 500 });
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);

  const pick = async (e) => {
    const files = Array.from(e.target.files || []);
    e.target.value = '';
    if (!files.length) return;
    setBusy(true);
    let ok = 0;
    for (const f of files.slice(0, 10)) {
      try {
        const r = await uploadAsset(uid, f, 'designs');
        if (await t.insert({ name: f.name, url: r.url, path: r.path, kind: f.type || 'file', size: f.size })) ok += 1;
      } catch (err) { say(`${f.name}: ${err.message || 'تعذر الرفع'}`); }
    }
    setBusy(false);
    if (ok) say(`✅ تم رفع ${ok} ملف`);
  };
  const del = async (a) => {
    if (!window.confirm(`حذف «${a.name}»؟ لو كان مستخدماً في المتجر سيتوقف ظهوره.`)) return;
    await removeAsset(a.path);
    if (await t.remove(a.id)) say('تم الحذف');
  };

  return (
    <>
      <PageHead title="رفع ملفات التصاميم" sub={`${t.rows.length} ملف`}>
        <button type="button" className="btn p" disabled={busy} onClick={() => ref.current?.click()}>{busy ? 'جاري الرفع...' : '⬆️ رفع ملفات'}</button>
        <input ref={ref} type="file" multiple hidden onChange={pick} />
      </PageHead>
      <p className="mut dsc">ارفع صورك وتصاميمك (حتى 8MB للملف) وانسخ الرابط لاستخدامه في أي مكان بالمتجر.</p>
      {t.err && <div className="card errbox">⚠️ {t.err}</div>}
      {t.loading ? <div className="c"><Spin /></div> : t.rows.length === 0 ? <div className="card"><Empty icon="🗃️" t="لا توجد ملفات بعد" /></div> : (
        <div className="grid4">
          {t.rows.map((a) => (
            <div className="card" key={a.id} style={{ padding: 12 }}>
              {/^image\//.test(a.kind || '') || /\.(png|jpe?g|webp|gif|svg)$/i.test(a.name) ? (
                <img src={a.url} alt={a.name} style={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: 12, marginBottom: 8 }} />
              ) : <div className="thumb ph" style={{ width: '100%', height: 120, marginBottom: 8, fontSize: 34 }}>📄</div>}
              <b style={{ display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.name}</b>
              <small className="mut num">{sizeText(a.size)} · {fday(a.created_at)}</small>
              <div className="row" style={{ marginTop: 8, marginBottom: 0 }}>
                <CopyBtn text={a.url} label="نسخ الرابط" />
                <button type="button" className="btn sm dng" onClick={() => del(a)}>حذف</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
