'use client';
import React, { createContext, useContext, useState, useMemo } from 'react';
import { DEFAULT_BRAND, brandText } from '../lib/brand';

const Ctx = createContext({ brand: DEFAULT_BRAND, setBrand: () => {} });
export function BrandProvider({ initial, children }) {
  const [brand, setBrand] = useState(initial || DEFAULT_BRAND);
  const val = useMemo(() => ({ brand, setBrand }), [brand]);
  return <Ctx.Provider value={val}>{children}</Ctx.Provider>;
}
export const useBrand = () => useContext(Ctx);
/* نص بالاسم الحالي للمنصة */
export const useBt = () => { const { brand } = useContext(Ctx); return (t) => brandText(t, brand); };
