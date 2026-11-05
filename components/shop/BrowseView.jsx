'use client';
import React from 'react';
import OrbitView from './OrbitView';
import RailView from './RailView';
import ShuffleView from './ShuffleView';
import { ProductCard } from './ui';

export const BROWSE_STYLES = {
  orbit: 'مدار',
  rail: 'رف الشماعات',
  shuffle: 'شبكة الخلط',
  grid: 'شبكة كلاسيك',
};

/* يختار التخطيط حسب الاسم؛ أي اسم غير معروف يرجع للمدار */
export default function BrowseView({ style = 'orbit', list = [] }) {
  if (style === 'rail') return <div className="wrap"><RailView list={list} /></div>;
  if (style === 'shuffle') return <div className="wrap"><ShuffleView list={list} /></div>;
  if (style === 'grid') return <div className="wrap">{list.length ? <div className="grid">{list.map((p) => <ProductCard key={p.id} p={p} />)}</div> : <div className="empty">لا توجد منتجات مطابقة</div>}</div>;
  return <div className="ob-full"><OrbitView list={list} /></div>;
}

export const pickStyle = (cfg, catId, view) => {
  if (view && BROWSE_STYLES[view]) return view;
  const b = (cfg && cfg.browse) || {};
  const byCat = (catId && b.by_cat && b.by_cat[catId]) || '';
  const s = byCat || b.style || 'orbit';
  return BROWSE_STYLES[s] ? s : 'orbit';
};
