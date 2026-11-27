'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';

/* قسم الباقات والأسعار في الصفحة الرئيسية: بيقرأ الباقات الفعلية من المنصة */
const usd = (v) => `$${Number(v || 0).toLocaleString('en-US', { maximumFractionDigits: 2 })}`;

export default function PricingSection({ lang = 'ar', isDark }) {
  const [d, setD] = useState(null);
  const ar = lang === 'ar';
  useEffect(() => { fetch('/api/public/plans').then((r) => r.json()).then(setD).catch(() => setD({ plans: [] })); }, []);
  if (d && !(d.plans || []).length) return <section id="pricing" className="scroll-mt-24" />;
  const c = d?.commission || 0.03;
  return (
    <section id="pricing" className={`scroll-mt-24 py-24 px-6 lg:px-16 ${isDark ? 'bg-[#04141F]' : 'bg-[#F4F8FC]'}`}>
      <div className="max-w-6xl mx-auto space-y-10">
        <div className="text-center space-y-2">
          <h2 className="text-4xl sm:text-5xl font-black tracking-tight">{ar ? 'الباقات والأسعار' : 'Plans & pricing'}</h2>
          <p className={isDark ? 'text-slate-400' : 'text-slate-600'}>{ar ? 'ابدأ بالباقة اللي تناسبك، وجدّد وقت ما تحب.' : 'Pick a plan and renew anytime.'}</p>
        </div>
        {d === null ? <div className="text-center opacity-60">…</div> : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {d.plans.map((p) => {
              const monthly = p.kind === 'monthly';
              const open = !monthly && Number(p.price) <= 0;
              return (
                <div key={p.id} className={`rounded-3xl p-6 border flex flex-col ${p.highlight ? 'border-[#0E8FC0] border-2 shadow-xl' : (isDark ? 'border-slate-800' : 'border-slate-200')} ${isDark ? 'bg-[#0A2A3E]' : 'bg-white'}`}>
                  {p.highlight ? <span className="self-start mb-2 text-[11px] font-black px-3 py-1 rounded-full bg-[#0E8FC0] text-white">{ar ? 'الأكثر اختياراً' : 'Popular'}</span> : null}
                  <h3 className="text-xl font-black">{p.name}</h3>
                  <div className="text-3xl font-black text-[#0E8FC0] my-2">{open ? (ar ? 'مبلغ مفتوح' : 'Custom amount') : usd(p.price)}</div>
                  <p className={`text-sm mb-3 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                    {open ? (ar ? 'اشحن بالمبلغ اللي تختاره' : 'Top up any amount') : monthly ? (ar ? 'طلبات غير محدودة · 30 يوم' : 'Unlimited orders · 30 days') : (ar ? `≈ ${Math.floor(Number(p.price) / c)} طلب (عمولة ${Math.round(c * 1000) / 10} سنت للطلب)` : `≈ ${Math.floor(Number(p.price) / c)} orders`)}
                  </p>
                  <ul className="space-y-1.5 text-sm mb-5 flex-1">
                    {(p.features || []).map((f, i) => <li key={i} className="flex gap-2"><span className="text-[#0E8FC0]">✓</span><span>{String(f).replace(/\{commission\}/g, `${Math.round(c * 1000) / 10} ${ar ? 'سنت' : 'cents'}`)}</span></li>)}
                  </ul>
                  <Link href="/register" className={`text-center font-black rounded-xl py-3 ${p.highlight ? 'bg-[#0E8FC0] text-white' : (isDark ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-900')}`}>{ar ? 'ابدأ الآن' : 'Get started'}</Link>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
