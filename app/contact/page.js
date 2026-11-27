import InfoPage, { Sec, kv } from '../../components/InfoPage';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'تواصل معنا | سبايك' };

const mail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v || '');
const wa = (v) => String(v || '').replace(/\D/g, '');

export default async function ContactPage() {
  const o = await kv(['contact_email', 'contact_whatsapp', 'contact_text', 'contact_phone', 'contact_address', 'platform_social']);
  const email = mail(o.contact_email) ? o.contact_email.trim() : '';
  const num = wa(o.contact_whatsapp);
  const waNum = num.length >= 10 ? (num.startsWith('0') ? '2' + num : num) : '';
  const phone = wa(o.contact_phone);
  let soc = {}; try { soc = JSON.parse(o.platform_social || '{}') || {}; } catch { soc = {}; }
  const SL = { facebook: 'فيسبوك', instagram: 'إنستجرام', tiktok: 'تيك توك', youtube: 'يوتيوب', x: 'X' };
  const socs = Object.entries(SL).filter(([k]) => /^https?:\/\//i.test(soc[k] || ''));
  return (
    <InfoPage title="تواصل معنا" current="/contact">
      <Sec h="">{o.contact_text || 'لأي سؤال أو مشكلة في حسابك أو متجرك، أو لطلب حذف بياناتك، تواصل معنا بإحدى الطرق دي وهنرد عليك في أقرب وقت.'}</Sec>
      {email || waNum ? (
        <div className="flex flex-wrap gap-3 mt-2">
          {waNum ? <a href={`https://wa.me/${waNum}`} target="_blank" rel="noopener noreferrer" className="px-4 py-2 rounded-xl bg-[#25D366] text-white font-black text-sm">واتساب</a> : null}
          {email ? <a href={`mailto:${email}`} className="px-4 py-2 rounded-xl bg-[#014D6F] text-white font-black text-sm" dir="ltr">{email}</a> : null}
        </div>
      ) : <p className="text-slate-500">بيانات التواصل هتظهر هنا قريباً.</p>}
      {phone ? <p className="mt-4">الهاتف: <a href={`tel:${phone}`} dir="ltr" className="font-black text-[#014D6F]">{phone}</a></p> : null}
      {o.contact_address ? <p className="mt-1">العنوان: {o.contact_address}</p> : null}
      {socs.length ? <div className="flex flex-wrap gap-2 mt-4">{socs.map(([k, l]) => <a key={k} href={soc[k]} target="_blank" rel="noopener noreferrer nofollow" className="px-3 py-1.5 rounded-full border border-slate-300 text-xs font-bold text-[#014D6F]">{l}</a>)}</div> : null}
    </InfoPage>
  );
}
