/* ثيمات المجالات: لكل مجال ثيم مقترح بهويته وألوانه، مع نسخة ليلية مشتقة من نفس الألوان.
   كل ثيم يستخدم نظام «هوية سبايك» (pal): بطاقة هيرو فاتحة، شريط مميزات، وفوتر بلون عميق. */

const rgb = (h) => { const m = String(h).replace('#', ''); return [0, 2, 4].map((i) => parseInt(m.slice(i, i + 2), 16)); };
const hex = (a) => `#${a.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('')}`;
const mix = (a, b, t) => { const x = rgb(a); const y = rgb(b); return hex(x.map((v, i) => v + (y[i] - v) * t)); };
const lum = (h) => { const [r, g, b] = rgb(h).map((v) => v / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };

/* [id, الاسم، الوصف، المجال، أيقونة، لون التمييز، الخلفية، الكارت، الحبر، tint، tint2، العميق، الخط، الاستدارة] */
const RAW = [
  ['ind-furniture', 'خشب دافئ', 'جوز وعاجي: دفء الخشب الطبيعي', 'أثاث وفرنتشر', '🛋️', '#8B5E3C', '#FFFDF9', '#F7F1E8', '#4A2F1B', '#EADBC8', '#F5EDE0', '#3B2616', 'Almarai', 14],
  ['ind-fashion', 'أناقة الكامل', 'أسود فحمي مع لمسة جمل: بساطة الموضة', 'ملابس وأزياء', '👗', '#B08968', '#FFFFFF', '#F8F5F2', '#1A1A1A', '#EFE6DD', '#F7F2ED', '#1C1917', 'Cairo', 6],
  ['ind-shoes', 'ستريت', 'برتقالي ناري على أسود: طاقة الشارع', 'أحذية', '👟', '#E4572E', '#FFFFFF', '#F4F4F5', '#111827', '#FDE3DA', '#F4F4F5', '#111827', 'Rubik', 10],
  ['ind-food', 'شهية', 'طماطم وكريمي: يفتح الشهية', 'أكل ومطاعم', '🍕', '#D9480F', '#FFFBF5', '#FFF1E0', '#3A1D0B', '#FFE3C4', '#FFF3E3', '#4A1D0A', 'Changa', 18],
  ['ind-handmade', 'صنعة يدوية', 'تيراكوتا وكتان: دفء الحرفة', 'هاندميد وحرف', '🧶', '#A65E3F', '#FBF7F0', '#F3EADB', '#3F2E22', '#E9DCC6', '#F5EDDF', '#4B3A2A', 'Harmattan', 20],
  ['ind-tech', 'تيك إلكتريك', 'أزرق كهربائي وكحلي: ذكاء وسرعة', 'تكنولوجيا وإلكترونيات', '💻', '#2563EB', '#F5F8FF', '#FFFFFF', '#0B1B3A', '#DCE6FF', '#EAF0FF', '#0B1B3A', 'Rubik', 12],
  ['ind-tools', 'ورشة', 'أصفر تحذير وفحمي: قوة وتحمل', 'معدات وأدوات', '🛠️', '#F5A300', '#F4F4F2', '#FFFFFF', '#1A1A1A', '#FFE7A6', '#FBF3D9', '#1F2327', 'Changa', 4],
  ['ind-beauty', 'بودرة', 'وردي ناعم وعنابي: أنوثة وعناية', 'تجميل وعناية', '💄', '#C2578A', '#FFF8FA', '#FDEBF1', '#4A1D35', '#F9D9E6', '#FDEEF3', '#4A1D35', 'Cairo', 20],
  ['ind-jewelry', 'ذهب وفخامة', 'ذهبي دافئ وأسود: فخامة هادئة', 'مجوهرات وإكسسوار', '💍', '#B8912F', '#FFFDF7', '#F8F1DF', '#2B2312', '#F1E5BE', '#F8F1DF', '#2B2312', 'El Messiri', 2],
  ['ind-kids', 'مرح', 'مرجاني وأصفر وبنفسجي: ألوان الأطفال', 'مستلزمات أطفال', '🧸', '#FF6B6B', '#FFFBF2', '#FFF0D6', '#3A2A6B', '#FFE29A', '#FFF3CF', '#3A2A6B', 'Baloo Bhaijaan 2', 24],
  ['ind-health', 'نقاء', 'أخضر صحي وأبيض: عافية ونظافة', 'صحة ومكملات', '🌿', '#2F9E6E', '#F7FCF9', '#E6F5EC', '#11382A', '#CDEBDA', '#E6F5EC', '#0F3D2E', 'Readex Pro', 16],
  ['ind-home', 'بيت وطبخة', 'تركواز هادئ: راحة المنزل والمطبخ', 'منزل ومطبخ', '🍳', '#1B8A8F', '#F6FBFB', '#E5F3F3', '#12343B', '#CDE9EA', '#E5F3F3', '#12343B', 'Tajawal', 14],
  ['ind-auto', 'سرعة', 'أحمر رياضي وأسود: قوة المحرك', 'سيارات وقطع غيار', '🚗', '#D7263D', '#F5F6F7', '#FFFFFF', '#101418', '#FADADD', '#ECEEF0', '#101418', 'Rubik', 6],
  ['ind-books', 'مكتبة', 'كحلي وورقي: هدوء القراءة', 'كتب وقرطاسية', '📚', '#1E3A8A', '#FBF7EE', '#F1EAD8', '#1F2A44', '#E8DFC6', '#F3ECDA', '#1F2A44', 'Markazi Text', 8],
  ['ind-sports', 'طاقة', 'ليموني وأسود: حيوية ولياقة', 'رياضة ولياقة', '🏋️', '#65A30D', '#F7FAF2', '#FFFFFF', '#111827', '#E1F0C3', '#EDF5DC', '#14210B', 'Changa', 8],
];

/* نسخة ليلية مشتقة: خلفية من اللون العميق، لون التمييز يفتح ليظهر على الخلفية الداكنة */
function nightOf(accent, deep, tint) {
  const bg = mix(deep, '#000000', 0.55);
  const acc = lum(accent) < 0.35 ? mix(accent, '#ffffff', 0.45) : accent;
  return {
    bg, card: mix(bg, '#ffffff', 0.07), ink: mix(tint, '#ffffff', 0.7), mut: mix(tint, bg, 0.45), ln: mix(bg, '#ffffff', 0.16),
    tint: mix(bg, accent, 0.28), tint2: mix(bg, accent, 0.14), deep: mix(bg, '#000000', 0.45), c: acc,
    onc: lum(acc) > 0.4 ? '#111111' : '#ffffff',
  };
}

export const INDUSTRY_THEMES = RAW.map(([id, name, desc, industry, icon, color, bg, card, ink, tint, tint2, deep, font, radius]) => ({
  id, name: `${industry} · ${name}`, desc, cat: 'المجالات', industry, icon, color, bg, card, ink, font, radius,
  mut: mix(ink, bg, 0.4), ln: mix(bg, ink, 0.14), p: 'clean', pat: 'none', dark: false,
  pal: 1, tint, tint2, deep, n: nightOf(color, deep, tint),
}));

export const INDUSTRIES = INDUSTRY_THEMES.map((t) => t.industry);
