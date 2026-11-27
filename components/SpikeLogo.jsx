'use client';
import React from 'react';
import { useBrand } from './BrandContext';
import { withV } from '../lib/brand';

/* شعار المنصة: نسخة للمود النهاري ونسخة للمود الليلي. لو الأدمن رفع شعار من «إعدادات المنصة» بيتعرض بدل الافتراضي.
   - لو مرّرت dark (true/false) بيتعرض الشعار المناسب مباشرة.
   - لو ما مرّرتش، بيتعرض الاتنين والـ CSS يختار حسب ثيم الصفحة: لوحة التاجر (.app.dk) والمتجر (.spk[data-dk="1"]). */
export const LOGO_LIGHT = '/brand/spike-light.png';
export const LOGO_NIGHT = '/brand/spike-night.png';

const CSS = `.spk-lg-n{display:none!important}
.app.dk .spk-lg-n,.spk[data-dk="1"] .spk-lg-n{display:block!important}
.app.dk .spk-lg-l,.spk[data-dk="1"] .spk-lg-l{display:none!important}`;

export default function SpikeLogo({ dark, className = '', style, alt, ...rest }) {
  const { brand } = useBrand();
  const light = withV(brand.logo_light, brand.v) || LOGO_LIGHT;
  const night = withV(brand.logo_night || brand.logo_light, brand.v) || LOGO_NIGHT;
  const a = alt || `${brand.name} | ${brand.name_en}`;
  if (typeof dark === 'boolean') {
    return <img src={dark ? night : light} alt={a} className={className} style={style} {...rest} />;
  }
  return (
    <>
      <style>{CSS}</style>
      <img src={light} alt={a} className={`spk-lg-l ${className}`} style={style} {...rest} />
      <img src={night} alt={a} className={`spk-lg-n ${className}`} style={style} {...rest} />
    </>
  );
}
