import Link from 'next/link';
import { adminClient } from '../lib/supabaseAdmin';

/* قالب موحّد لصفحات المنصة (من نحن، الخصوصية، التواصل). النص بيتقري من platform_kv لو الإدارة غيّرته. */
export async function kv(keys) {
  const out = {};
  try {
    const sb = adminClient();
    const { data } = await sb.from('platform_kv').select('key, value').in('key', keys);
    for (const r of data || []) if (r.value && String(r.value).trim()) out[r.key] = String(r.value);
  } catch { /* نستخدم الافتراضي */ }
  return out;
}

export const NAV = [['/about', 'من نحن'], ['/privacy', 'سياسة الخصوصية'], ['/terms', 'الشروط والأحكام'], ['/contact', 'تواصل معنا']];

export default function InfoPage({ title, children, current }) {
  return (
    <div dir="rtl" className="min-h-screen bg-[#ECF3FD] font-sans px-4 py-10">
      <div className="max-w-2xl mx-auto">
        <nav className="flex flex-wrap gap-2 mb-4 text-xs font-bold" aria-label="صفحات المنصة">
          <Link href="/" className="px-3 py-1.5 rounded-full bg-white border border-slate-200 text-[#014D6F]">الرئيسية</Link>
          {NAV.map(([h, l]) => <Link key={h} href={h} aria-current={h === current ? 'page' : undefined} className={'px-3 py-1.5 rounded-full border ' + (h === current ? 'bg-[#014D6F] border-[#014D6F] text-white' : 'bg-white border-slate-200 text-[#014D6F]')}>{l}</Link>)}
        </nav>
        <main className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
          <h1 className="text-xl font-black mb-4 text-slate-900">{title}</h1>
          <div className="text-sm leading-7 text-slate-700">{children}</div>
        </main>
      </div>
    </div>
  );
}

export function Sec({ h, children }) {
  return <section className="mb-5"><h2 className="font-black text-slate-900 mb-1">{h}</h2><div className="whitespace-pre-line">{children}</div></section>;
}
