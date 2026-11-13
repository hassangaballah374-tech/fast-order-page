import { redirect } from 'next/navigation';
import { adminClient } from '../../../lib/supabaseAdmin';

export const dynamic = 'force-dynamic';

/* رابط المنتج القديم /p/رقم: بنوجّه لصفحة المنتج في المتجر الجديد /shop/اسم-المتجر/p/رقم (لو المنتج موجود) */
export default async function LegacyProductRedirect({ params }) {
  const id = String(params.id || '');
  if (/^[A-Za-z0-9_-]{1,64}$/.test(id)) {
    try {
      const sb = adminClient();
      const { data: p } = await sb.from('products').select('store_id').eq('id', id).maybeSingle();
      if (p?.store_id) {
        const { data: s } = await sb.from('store_profiles').select('store_slug').eq('user_id', p.store_id).maybeSingle();
        if (s?.store_slug) redirect(`/shop/${s.store_slug}/p/${id}`);
      }
    } catch (e) {
      if (e && typeof e === 'object' && 'digest' in e) throw e; // redirect() بيرمي استثناء داخلي لازم يعدّي
    }
  }
  redirect('/');
}
