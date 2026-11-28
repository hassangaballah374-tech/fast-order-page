import React from 'react';
import ThankYouView from '../../../../components/shop/ThankYouView';
import { getT } from '../../../../lib/i18n/server';

export const dynamic = 'force-dynamic';

export function generateMetadata() {
  return { title: getT().T('تم استلام طلبك'), robots: { index: false, follow: false }  };
}

export default function ThankYouPage() {
  const { T } = getT();
  return <ThankYouView />;
}
