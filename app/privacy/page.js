import InfoPage, { LegalBody, kv } from '../../components/InfoPage';
import { PRIVACY_DEFAULT, fillLegal, parseLegal } from '../../lib/legalText';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'سياسة الخصوصية | سبايك' };

export default async function PrivacyPage() {
  const o = await kv(['privacy_text', 'contact_email', 'contact_whatsapp']);
  const text = fillLegal(o.privacy_text || PRIVACY_DEFAULT, { email: o.contact_email, whatsapp: o.contact_whatsapp });
  return (
    <InfoPage title="سياسة الخصوصية" current="/privacy">
      <LegalBody sections={parseLegal(text)} />
    </InfoPage>
  );
}
