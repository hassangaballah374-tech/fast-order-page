'use client';
import React from 'react';
import { SECTION_DEFS, GROUPS } from '../../../lib/lpSections';

/* مكتبة الأقسام: نافذة بتجمّع الأنواع في مجموعات، والضغط على أي نوع يضيفه */
export default function Library({ onPick, onClose }) {
  return (
    <div className="lpb-lib" onClick={onClose} role="dialog" aria-label="إضافة قسم">
      <div className="lpb-lib-box" onClick={(e) => e.stopPropagation()}>
        <div className="lpb-lib-h">
          <b>إضافة قسم</b>
          <button type="button" className="btn sm" onClick={onClose}>إغلاق ✕</button>
        </div>
        <div className="lpb-lib-b">
          {GROUPS.map(([g, keys]) => (
            <div key={g}>
              <div className="lpb-lib-g">{g}</div>
              <div className="lpb-lib-grid">
                {keys.filter((k) => SECTION_DEFS[k]).map((k) => (
                  <button type="button" key={k} className="lpb-lib-i" onClick={() => onPick(k)}>
                    <span>{SECTION_DEFS[k].i}</span>
                    <b>{SECTION_DEFS[k].n}</b>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
