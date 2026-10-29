/* تعريف أقسام صفحة الهبوط: الاسم، الأيقونة، القيم الافتراضية، الحقول (يستخدمها المحرر البصري) */
export const SECTION_DEFS = {
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

  heading: { n: 'عنوان كبير', i: '🔤', d: { title: 'عنوان جذّاب', sub: '', size: 'lg', align: 'center' },
    f: [['title', 'العنوان'], ['sub', 'سطر فرعي', 'area'], ['size', 'الحجم', 'sel', [['md', 'متوسط'], ['lg', 'كبير'], ['xl', 'ضخم']]], ['align', 'المحاذاة', 'sel', [['center', 'وسط'], ['right', 'يمين'], ['left', 'يسار']]]] },
  button: { n: 'زر مخصص', i: '🔘', d: { text: 'اطلب الآن', link: '', variant: 'solid', size: 'lg', align: 'center' },
    f: [['text', 'نص الزر'], ['link', 'الرابط (اتركه فارغاً للنزول لنموذج الطلب)', 'ltr'], ['variant', 'الشكل', 'sel', [['solid', 'مملوء'], ['outline', 'إطار'], ['soft', 'ناعم']]], ['size', 'الحجم', 'sel', [['md', 'متوسط'], ['lg', 'كبير']]], ['align', 'المحاذاة', 'sel', [['center', 'وسط'], ['right', 'يمين'], ['left', 'يسار']]]] },
  split: { n: 'صورة + نص', i: '↔️', d: { title: 'عنوان القسم', body: 'اكتب هنا وصفاً مقنعاً.', image: '', side: 'right', cta: '', points: [] },
    f: [['title', 'العنوان'], ['body', 'النص', 'area'], ['image', 'الصورة', 'img'], ['side', 'مكان الصورة', 'sel', [['right', 'يمين'], ['left', 'يسار']]], ['cta', 'نص زر (اختياري)']],
    list: { k: 'points', add: 'نقطة', blank: { t: '' }, f: [['t', 'النقطة']] } },
  stats: { n: 'أرقام متحركة', i: '📈', d: { title: '', items: [{ num: 5000, suffix: '+', label: 'عميل سعيد' }, { num: 98, suffix: '%', label: 'نسبة الرضا' }, { num: 24, suffix: 'س', label: 'سرعة الرد' }] },
    f: [['title', 'عنوان (اختياري)']], list: { k: 'items', add: 'رقم', blank: { num: 100, suffix: '+', label: '' }, f: [['num', 'الرقم', 'num'], ['suffix', 'رمز بعد الرقم (+ ، % ...)'], ['label', 'الوصف']] } },
  steps: { n: 'خطوات (إزاي بتطلب)', i: '🪜', d: { title: 'إزاي تطلب؟', items: [{ title: 'اختار المنتج', text: 'حدّد الخيارات اللي تناسبك' }, { title: 'املا بياناتك', text: 'الاسم والعنوان بس' }, { title: 'استلم وادفع', text: 'الدفع عند الاستلام' }] },
    f: [['title', 'عنوان القسم']], list: { k: 'items', add: 'خطوة', blank: { title: '', text: '' }, f: [['title', 'العنوان'], ['text', 'الوصف', 'area']] } },
  compare: { n: 'مقارنة (إحنا vs غيرنا)', i: '⚖️', d: { title: 'ليه إحنا الأفضل؟', us: 'منتجنا', them: 'غيرنا', rows: [{ t: 'جودة عالية', us: true, them: false }, { t: 'توصيل سريع', us: true, them: false }, { t: 'ضمان استبدال', us: true, them: false }] },
    f: [['title', 'عنوان القسم'], ['us', 'عنوان عمودنا'], ['them', 'عنوان عمود المنافسين']], list: { k: 'rows', add: 'صف', blank: { t: '', us: true, them: false }, f: [['t', 'الميزة'], ['us', 'عندنا؟', 'tog'], ['them', 'عند غيرنا؟', 'tog']] } },
  logos: { n: 'شريط ثقة / شعارات', i: '🏷️', d: { title: '', items: [{ icon: '🚚', text: 'شحن لكل المحافظات' }, { icon: '💵', text: 'دفع عند الاستلام' }, { icon: '🔄', text: 'استبدال سهل' }, { icon: '⭐', text: 'تقييم 4.9' }] },
    f: [['title', 'عنوان (اختياري)']], list: { k: 'items', add: 'عنصر', blank: { icon: '✔', text: '', image: '' }, f: [['icon', 'أيقونة/إيموجي'], ['text', 'النص'], ['image', 'صورة بدل الأيقونة (اختياري)', 'img']] } },
  marquee: { n: 'شريط متحرك', i: '🎞️', d: { text: 'شحن مجاني ✦ دفع عند الاستلام ✦ ضمان استبدال ✦ عروض لفترة محدودة', speed: 28 },
    f: [['text', 'النص (افصل بين الجمل بـ ✦)', 'area'], ['speed', 'السرعة بالثواني (أقل = أسرع)', 'num']] },
  quote: { n: 'اقتباس كبير', i: '❝', d: { text: 'أفضل قرار شراء اتخذته السنة دي.', name: 'اسم العميل', image: '' },
    f: [['text', 'الاقتباس', 'area'], ['name', 'الاسم'], ['image', 'صورة (اختياري)', 'img']] },
  spacer: { n: 'مسافة فارغة', i: '↕️', d: { h: 40 }, f: [['h', 'الارتفاع (px)', 'num']] },
  divider: { n: 'فاصل', i: '➖', d: { kind: 'line' }, f: [['kind', 'الشكل', 'sel', [['line', 'خط'], ['dots', 'نقاط'], ['wave', 'موجة'], ['star', 'نجوم']]]] },
};

/* مجموعات المكتبة في المحرر */
export const GROUPS = [
  ['الأساسي', ['hero', 'heading', 'text', 'image', 'button', 'spacer', 'divider']],
  ['عرض المنتج', ['gallery', 'video', 'split', 'benefits', 'steps']],
  ['إقناع وثقة', ['testimonials', 'quote', 'stats', 'compare', 'guarantee', 'logos', 'faq']],
  ['حركة وعروض', ['countdown', 'marquee', 'cta']],
  ['الطلب', ['order']],
];

/* خيارات الشكل لكل قسم */
export const STYLE_DEFAULT = { bg: '', bgColor: '', color: '', pad: 'md', align: '', width: '', radius: '', anim: 'drop', hideM: false, hideD: false, anchor: '' };
export const BG_OPTS = [['', 'بدون'], ['soft', 'ناعم'], ['card', 'كارت'], ['primary', 'لون العلامة'], ['dark', 'داكن'], ['grad', 'تدرّج'], ['custom', 'لون مخصص']];
export const PAD_OPTS = [['none', 'بدون'], ['sm', 'صغير'], ['md', 'متوسط'], ['lg', 'كبير'], ['xl', 'ضخم']];
export const ALIGN_OPTS = [['', 'الافتراضي'], ['right', 'يمين'], ['center', 'وسط'], ['left', 'يسار']];
export const WIDTH_OPTS = [['', 'الافتراضي'], ['narrow', 'ضيّق'], ['wide', 'عريض'], ['full', 'كامل']];
export const ANIM_OPTS = [['drop', 'انسدال'], ['fade', 'ظهور'], ['zoom', 'تكبير'], ['slide', 'انزلاق'], ['none', 'بدون']];

const uid8 = () => Math.random().toString(36).slice(2, 8);
export const mkSection = (type, data) => ({ id: uid8(), type, on: true, style: { ...STYLE_DEFAULT }, data: { ...JSON.parse(JSON.stringify(SECTION_DEFS[type].d)), ...(data || {}) } });
export const cloneSection = (s) => ({ ...JSON.parse(JSON.stringify(s)), id: uid8() });
