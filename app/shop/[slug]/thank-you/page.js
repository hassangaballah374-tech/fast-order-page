import React from 'react';
import ThankYouView from '../../../../components/shop/ThankYouView';

export const dynamic = 'force-dynamic';

export const metadata = { title: 'تم استلام طلبك', robots: { index: false, follow: false } };

export default function ThankYouPage() {
  return <ThankYouView />;
}
