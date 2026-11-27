import InfoPage, { LegalBody, kv } from '../../components/InfoPage';
import { TERMS_DEFAULT, fillLegal, parseLegal } from '../../lib/legalText';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'شروط الاستخدام | سبايك' };

export default async function TermsPage() {
  const o = await kv(['terms_text', 'contact_email', 'contact_whatsapp']);
  const text = fillLegal(o.terms_text || TERMS_DEFAULT, { email: o.contact_email, whatsapp: o.contact_whatsapp });
  return (
    <InfoPage title="شروط استخدام منصة سبايك" current="/terms">
      <LegalBody sections={parseLegal(text)} />
    </InfoPage>
  );
}
