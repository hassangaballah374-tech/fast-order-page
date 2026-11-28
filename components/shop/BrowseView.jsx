'use client';
import { useT } from '../I18n';
import React from 'react';
import OrbitView from './OrbitView';
import RailView from './RailView';
import ShuffleView from './ShuffleView';
import ArcView from './ArcView';
import RunwayView from './RunwayView';
import StudioView from './StudioView';
import StoreGridView from './StoreGridView';
import { ProductCard } from './ui';

/* يختار التخطيط حسب الاسم؛ أي اسم غير معروف يرجع للمدار */
export default function BrowseView({ style = 'orbit', list = [] }) {
  const tx = useT();
  if (style === 'store') return <StoreGridView list={list} />;
  if (style === 'studio') return <StudioView list={list} />;
  if (style === 'runway') return <RunwayView list={list} />;
  if (style === 'arc') return <ArcView list={list} />;
  if (style === 'rail') return <div className="wrap"><RailView list={list} /></div>;
  if (style === 'shuffle') return <div className="wrap"><ShuffleView list={list} /></div>;
  if (style === 'grid') return <div className="wrap">{list.length ? <div className="grid">{list.map((p) => <ProductCard key={p.id} p={p} />)}</div> : <div className="empty">{tx('لا توجد منتجات مطابقة')}</div>}</div>;
  return <div className="ob-full"><OrbitView list={list} /></div>;
}
