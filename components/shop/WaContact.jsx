'use client';
import React from 'react';
import { useShop } from './StoreContext';
import { normalizePhone, isValidEgPhone, waLink } from '../../lib/storeKit';
import WaIcon from './WaIcon';

/* زرار «كلّم صاحب المتجر على واتساب»: بيظهر لو رقم واتساب المتجر مضبوط ومفعّل. text = رسالة جاهزة بسياق الصفحة */
export function useWa() {
  const { cfg } = useShop();
  const wa = normalizePhone(cfg.contact?.whatsapp);
  return { ok: !!(cfg.whatsapp?.enabled && isValidEgPhone(wa)), wa, msg: cfg.whatsapp?.message || '' };
}

export default function WaContact({ text, label = 'كلّم صاحب المتجر على واتساب', note = '', style }) {
  const { ok, wa, msg } = useWa();
  if (!ok) return null;
  return (
    <div className="wac" style={style}>
      {note ? <span className="mut wac-n">{note}</span> : null}
      <a className="b wa blk" href={waLink(wa, text || msg)} target="_blank" rel="noopener noreferrer"><WaIcon size={18} /> {label}</a>
    </div>
  );
}
