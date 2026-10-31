import { notFound, redirect } from 'next/navigation';
import { loadStore, getFlow } from '../../../../../lib/storeData';
import { stepHref } from '../../../../../lib/flowKit';

export const dynamic = 'force-dynamic';
export const metadata = { robots: { index: false, follow: false } };

/* رابط الفانل الرئيسي: بيودّي للخطوة الأولى */
export default async function FlowEntry({ params }) {
  const ctx = await loadStore(params.slug);
  if (!ctx) notFound();
  const flow = await getFlow(ctx.sb, ctx.sid, params.fslug);
  const first = flow?.steps[0];
  if (!flow || !first) notFound();
  redirect(stepHref(`/shop/${params.slug}`, flow.slug, first.id));
}
