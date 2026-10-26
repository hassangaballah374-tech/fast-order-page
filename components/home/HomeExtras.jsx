'use client';
import React, { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

const AR = {
  kicker: 'ليه سبايك؟',
  title: 'منصة واحدة تبيع وتشحن وتتابع',
  sub: 'كل اللي التاجر المصري محتاجه عشان يشتغل بالدفع عند الاستلام، من غير تعقيد ولا مبرمجين.',
  feats: [
    ['🛍️', 'متجر جاهز في دقايق', 'اختار ثيم، ارفع منتجاتك، وابدأ تستقبل طلبات بدومين فرعي مجاني.'],
    ['💵', 'مصمم للدفع عند الاستلام', 'نموذج شراء سريع بالمحافظات وأسعار الشحن، وتأكيد للطلبات قبل الشحن.'],
    ['🚀', 'صفحات هبوط وفانلز', 'ابني صفحة منتج واحد بتحوّل، مع عروض الكمية وOrder Bump.'],
    ['🎯', 'تتبع وبكسل متكامل', 'فيسبوك وتيك توك وجوجل وسناب، مع تتبع حملاتك ونتايجها.'],
    ['🛡️', 'حماية من الطلبات الوهمية', 'تقييم مخاطر الطلب وحظر الأرقام وتوثيق الطلبات قبل ما تشحن.'],
    ['📊', 'أرقام حقيقية يومياً', 'مبيعات وربح وتحويل ومخزون، وتنبيهات بالحاجات اللي محتاجة تصرف.'],
  ],
  stepsT: 'ابدأ في 3 خطوات',
  steps: [['1', 'سجّل حسابك', 'بالإيميل في أقل من دقيقة.'], ['2', 'جهّز متجرك', 'منتجات، شحن، وهوية.'], ['3', 'استقبل الطلبات', 'وأكّدها واشحنها من نفس اللوحة.']],
  faqT: 'أسئلة شائعة',
  faq: [
    ['هل محتاج خبرة برمجة؟', 'لأ خالص. كل حاجة من لوحة تحكم بالعربي: المنتجات والتصميم والشحن والتتبع.'],
    ['إزاي بتتحاسب؟', 'في عمولة صغيرة على كل طلب أو اشتراك شهري، وفي طلبات مجانية للبداية. التفاصيل بتظهر في صفحة الباقات داخل حسابك.'],
    ['هل أقدر أربط دومين بتاعي؟', 'أيوه، تقدر تطلب ربط دومين مخصص من لوحة التاجر.'],
    ['وبالنسبة لشركات الشحن؟', 'اللوحة بتدعم إرسال الطلبات لشركات الشحن المتاحة، وتقدر تتابع حالة كل طلب.'],
  ],
  ctaT: 'جاهز تبدأ تجارتك؟',
  ctaS: 'افتح متجرك دلوقتي وجرّب بنفسك.',
  cta: 'ابدأ مجاناً',
};
const EN = {
  kicker: 'Why SPIKE?',
  title: 'One platform to sell, ship and track',
  sub: 'Everything a cash-on-delivery merchant needs, with no developers and no hassle.',
  feats: [
    ['🛍️', 'Store ready in minutes', 'Pick a theme, add products and start taking orders on a free subdomain.'],
    ['💵', 'Built for cash on delivery', 'Fast checkout with governorates, shipping rates and order confirmation.'],
    ['🚀', 'Landing pages & funnels', 'Build one-product pages that convert, with quantity offers and order bumps.'],
    ['🎯', 'Pixels & tracking', 'Facebook, TikTok, Google and Snap, plus campaign tracking.'],
    ['🛡️', 'Fake-order protection', 'Risk scoring, blocked numbers and order verification before you ship.'],
    ['📊', 'Real numbers daily', 'Sales, profit, conversion and stock, with alerts on what needs action.'],
  ],
  stepsT: 'Start in 3 steps',
  steps: [['1', 'Create your account', 'With email in under a minute.'], ['2', 'Set up your store', 'Products, shipping and brand.'], ['3', 'Receive orders', 'Confirm and ship from one dashboard.']],
  faqT: 'FAQ',
  faq: [
    ['Do I need coding skills?', 'No. Everything is managed from the dashboard.'],
    ['How does billing work?', 'A small commission per order or a monthly subscription, with free orders to start. Details are in the plans page in your account.'],
    ['Can I use my own domain?', 'Yes, request a custom domain from the merchant dashboard.'],
    ['What about shipping companies?', 'The dashboard can send orders to supported couriers and track each order.'],
  ],
  ctaT: 'Ready to start selling?',
  ctaS: 'Open your store now and try it yourself.',
  cta: 'Start free',
};

function Reveal({ children, delay = 0 }) {
  const ref = useRef(null);
  const [on, setOn] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || typeof IntersectionObserver === 'undefined') { setOn(true); return undefined; }
    const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setOn(true); io.disconnect(); } }, { threshold: 0.15 });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  return <div ref={ref} style={{ opacity: on ? 1 : 0, transform: on ? 'none' : 'translateY(22px)', transition: `opacity .7s ${delay}ms, transform .7s ${delay}ms` }}>{children}</div>;
}

export default function HomeExtras({ lang = 'ar', isDark = false }) {
  const t = lang === 'en' ? EN : AR;
  const card = isDark ? 'bg-[#0E1E38] border-slate-800' : 'bg-white border-slate-200';
  const mut = isDark ? 'text-slate-400' : 'text-slate-500';
  return (
    <div dir={lang === 'en' ? 'ltr' : 'rtl'} className="px-6 lg:px-16 py-20 space-y-24">
      <section className="max-w-6xl mx-auto">
        <Reveal>
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="inline-block text-xs font-black tracking-wider px-3 py-1 rounded-full bg-[#00B050]/10 text-[#00B050]">{t.kicker}</span>
            <h2 className="mt-4 text-3xl sm:text-5xl font-black leading-tight">{t.title}</h2>
            <p className={`mt-3 text-sm sm:text-base ${mut}`}>{t.sub}</p>
          </div>
        </Reveal>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {t.feats.map(([ic, h, d], i) => (
            <Reveal key={h} delay={i * 70}>
              <div className={`group h-full rounded-3xl border p-6 transition duration-300 hover:-translate-y-1.5 hover:shadow-2xl hover:border-[#00B050]/60 ${card}`}>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#00B050]/20 to-[#00d4c8]/20 flex items-center justify-center text-2xl mb-4 transition group-hover:scale-110">{ic}</div>
                <h3 className="font-black text-base mb-1.5">{h}</h3>
                <p className={`text-sm leading-relaxed ${mut}`}>{d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="max-w-5xl mx-auto">
        <Reveal><h2 className="text-center text-2xl sm:text-4xl font-black mb-10">{t.stepsT}</h2></Reveal>
        <div className="grid sm:grid-cols-3 gap-4">
          {t.steps.map(([n, h, d], i) => (
            <Reveal key={n} delay={i * 90}>
              <div className={`relative rounded-3xl border p-6 text-center ${card}`}>
                <div className="w-11 h-11 mx-auto rounded-full bg-[#00B050] text-white font-black flex items-center justify-center mb-3 shadow-lg shadow-[#00B050]/30">{n}</div>
                <b className="block mb-1">{h}</b>
                <p className={`text-sm ${mut}`}>{d}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="max-w-3xl mx-auto">
        <Reveal><h2 className="text-center text-2xl sm:text-4xl font-black mb-8">{t.faqT}</h2></Reveal>
        <div className="space-y-3">
          {t.faq.map(([q, a]) => (
            <Reveal key={q}>
              <details className={`group rounded-2xl border px-5 py-4 ${card}`}>
                <summary className="flex items-center justify-between gap-3 cursor-pointer font-bold text-sm list-none">
                  <span>{q}</span><span className="text-[#00B050] text-xl transition group-open:rotate-45">+</span>
                </summary>
                <p className={`mt-3 text-sm leading-relaxed ${mut}`}>{a}</p>
              </details>
            </Reveal>
          ))}
        </div>
      </section>

      <Reveal>
        <section className="max-w-4xl mx-auto rounded-[2rem] p-8 sm:p-12 text-center text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#06494e,#0a7f86 55%,#00B050)' }}>
          <h2 className="text-2xl sm:text-4xl font-black">{t.ctaT}</h2>
          <p className="mt-2 opacity-90 text-sm sm:text-base">{t.ctaS}</p>
          <Link href="/register" className="inline-block mt-6 px-8 py-3.5 rounded-2xl bg-white text-[#06494e] font-black text-sm shadow-xl transition hover:scale-105 active:scale-95">{t.cta}</Link>
        </section>
      </Reveal>
    </div>
  );
}
