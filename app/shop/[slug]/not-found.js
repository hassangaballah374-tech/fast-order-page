'use client';
import Link from 'next/link';
import { useShop } from '../../../components/shop/StoreContext';

export default function PageNotFound() {
  const { base } = useShop();
  return (
    <div className="wrap empty">
      <div style={{ fontSize: 56 }}>🔎</div>
      <h2>الصفحة غير موجودة</h2>
      <p style={{ margin: '8px 0 18px' }}>ربما تم حذفها أو تغيّر رابطها.</p>
      <Link href={base} className="b p">العودة للمتجر</Link>
    </div>
  );
}
