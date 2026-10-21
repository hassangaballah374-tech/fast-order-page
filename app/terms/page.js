import Link from 'next/link';
import { adminClient } from '../../lib/supabaseAdmin';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'الشروط والسياسات | سبايك' };

const DEFAULT_TEXT = `شروط استخدام منصة سبايك

1) الخدمة: سبايك منصة تتيح للتاجر إنشاء متجر إلكتروني يعمل بنظام الدفع عند الاستلام وإدارة طلباته ومنتجاته.

2) التفعيل: يتم إنشاء المتجر غير مفعّل، ولا يبدأ البيع أو ربط البكسل إلا بعد تفعيله من إدارة المنصة. يحق للإدارة تعطيل أي متجر يخالف هذه الشروط.

3) الباقات: لكل متجر عدد طلبات حسب باقته. عند انتهاء الطلبات أو الاشتراك يتوقف المتجر عن استقبال الطلبات حتى التجديد.

4) مسؤولية التاجر: التاجر مسؤول عن صحة بيانات منتجاته وأسعاره والوفاء بطلبات عملائه وعن التزامه بالقوانين المعمول بها.

5) الخصوصية: نحفظ بيانات الحساب والطلبات لتشغيل الخدمة فقط، ولا نبيعها لأي طرف ثالث.

6) التعديلات: يجوز تحديث هذه الشروط من وقت لآخر، واستمرارك في استخدام المنصة يعني موافقتك على النسخة المحدثة.

(هذا نص افتراضي، يمكن للإدارة استبداله من جدول platform_kv بالمفتاح terms_text.)`;

export default async function TermsPage() {
  let text = DEFAULT_TEXT;
  try {
    const sb = adminClient();
    const { data } = await sb.from('platform_kv').select('value').eq('key', 'terms_text').maybeSingle();
    if (data?.value && data.value.trim()) text = data.value;
  } catch { /* نستخدم النص الافتراضي */ }
  return (
    <div dir="rtl" className="min-h-screen bg-[#F4F6F9] font-sans px-4 py-10">
      <div className="max-w-2xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
        <h1 className="text-xl font-black mb-4 text-slate-900">الشروط والسياسات</h1>
        <div className="text-sm leading-7 text-slate-700 whitespace-pre-line">{text}</div>
        <div className="mt-6"><Link href="/register" className="text-[#00B050] font-black underline">العودة للتسجيل</Link></div>
      </div>
    </div>
  );
}
