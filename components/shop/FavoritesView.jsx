'use client';
import React from 'react';
import Link from 'next/link';
import { useShop } from './StoreContext';
import { ProductCard } from './ui';
import { useFavs } from './favs';

export default function FavoritesView({ catalog = [] }) {
  const { slug, base } = useShop();
  const { ids, ready } = useFavs(slug);
  const list = ids.map((id) => catalog.find((p) => p.id === id)).filter(Boolean);
  if (!ready) return <div className="wrap empty">...</div>;
  return (
    <div className="wrap">
      <div className="sh"><h2>♥ المفضلة</h2></div>
      {list.length === 0 ? (
        <div className="empty">
          <div style={{ fontSize: 56 }}>🤍</div>
          <h3>لسه ما ضفتش منتجات للمفضلة</h3>
          <p className="mut" style={{ margin: '8px 0 16px' }}>اضغط على القلب في أي منتج وهتلاقيه هنا.</p>
          <Link className="b p" href={`${base}/products`}>تصفح المنتجات</Link>
        </div>
      ) : (
        <div className="grid">{list.map((p) => <ProductCard key={p.id} p={p} />)}</div>
      )}
    </div>
  );
}
