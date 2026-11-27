import InfoPage, { LegalBody, kv } from '../../components/InfoPage';
import { getBrand } from '../../lib/brandServer';
import { brandText } from '../../lib/brand';
import { TERMS_DEFAULT, fillLegal, parseLegal } from '../../lib/legalText';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'شروط الاستخدام' };

export default async function TermsPage() {
  const o = await kv(['terms_text', 'contact_email', 'contact_whatsapp']);
  const brand = await getBrand();
  const text = brandText(fillLegal(o.terms_text || TERMS_DEFAULT, { email: o.contact_email, whatsapp: o.contact_whatsapp }), brand);
  return (
    <InfoPage title={brandText('شروط استخدام منصة سبايك', brand)} current="/terms">
      <LegalBody sections={parseLegal(text)} />
    </InfoPage>
  );
}
