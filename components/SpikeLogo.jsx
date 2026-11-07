import React from 'react';

/* شعار سبايك: نسخة للمود النهاري ونسخة للمود الليلي.
   - لو مرّرت dark (true/false) بيتعرض الشعار المناسب مباشرة (صفحات React-state زي الرئيسية والأدمن).
   - لو ما مرّرتش، بيتعرض الاتنين والـ CSS يختار حسب ثيم الصفحة: لوحة التاجر (.app.dk) والمتجر (.spk[data-dk="1"]). */
export const LOGO_LIGHT = '/brand/spike-light.png';
export const LOGO_NIGHT = '/brand/spike-night.png';

const CSS = `.spk-lg-n{display:none!important}
.app.dk .spk-lg-n,.spk[data-dk="1"] .spk-lg-n{display:block!important}
.app.dk .spk-lg-l,.spk[data-dk="1"] .spk-lg-l{display:none!important}`;

export default function SpikeLogo({ dark, className = '', style, alt = 'سبايك | SPIKE', ...rest }) {
  if (typeof dark === 'boolean') {
    return <img src={dark ? LOGO_NIGHT : LOGO_LIGHT} alt={alt} className={className} style={style} {...rest} />;
  }
  return (
    <>
      <style>{CSS}</style>
      <img src={LOGO_LIGHT} alt={alt} className={`spk-lg-l ${className}`} style={style} {...rest} />
      <img src={LOGO_NIGHT} alt={alt} className={`spk-lg-n ${className}`} style={style} {...rest} />
    </>
  );
}
