import React from 'react';
import TrackView from '../../../../components/shop/TrackView';
import { getT } from '../../../../lib/i18n/server';

export const dynamic = 'force-dynamic';

export function generateMetadata() {
  return { title: getT().T('تتبع طلبك')  };
}
 
export default function TrackPage() {
  const { T } = getT();
  return <TrackView />;
}
