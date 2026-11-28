'use client';
import Link from 'next/link';
import { useT } from '../../../components/I18n';
import { useShop } from '../../../components/shop/StoreContext';

export default function PageNotFound() {
  const { base } = useShop();
  const tx = useT();
  return (
    <div className="wrap empty">
      <div style={{ fontSize: 56 }}>🔎</div>
      <h2>{tx('الصفحة غير موجودة')}</h2>
      <p style={{ margin: '8px 0 18px' }}>{tx('ربما تم حذفها أو تغيّر رابطها.')}</p>
      <Link href={base} className="b p">{tx('العودة للمتجر')}</Link>
    </div>
  );
}
