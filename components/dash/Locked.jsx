'use client';
import React from 'react';

/* تظهر مكان أي شاشة قفلها الأدمن */
export default function Locked({ title, onBypass }) {
  return (
    <div className="card" style={{ maxWidth: 520, margin: '40px auto', textAlign: 'center' }}>
      <div style={{ fontSize: 48 }}>🔒</div>
      <h3 style={{ margin: '8px 0' }}>{title ? `«${title}» غير مفعّلة` : 'الميزة غير مفعّلة'}</h3>
      {onBypass ? <button type="button" className="btn" style={{ marginBottom: 12 }} onClick={onBypass}>👁️ عرضها كأدمن (التاجر لسه مش شايفها)</button> : null}
      <p className="mut" style={{ lineHeight: 1.8 }}>الميزة دي مقفولة على متجرك حالياً. تواصل مع إدارة سبايك لتفعيلها، أو شوف الباقات من «الباقات والاشتراك».</p>
    </div>
  );
}
