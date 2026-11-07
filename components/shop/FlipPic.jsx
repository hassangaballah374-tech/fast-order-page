'use client';
import React, { useEffect, useState } from 'react';

/* صورة بتلف لما تتضغط: الوجه ← الظهر ← الوجه. لو مفيش ظهر بتتعرض صورة عادية. */
export default function FlipPic({ front, back, alt = '', className = '', children, fetchPriority }) {
  const [on, setOn] = useState(false);
  useEffect(() => { setOn(false); }, [front, back]);
  if (!back) {
    return (
      <div className={className}>
        {front ? <img src={front} alt={alt} decoding="async" fetchPriority={fetchPriority} /> : null}
        {children}
      </div>
    );
  }
  const toggle = () => setOn((v) => !v);
  return (
    <div className={`${className} pc-flip fp${on ? ' on' : ''}`} role="button" tabIndex={0} aria-pressed={on}
      aria-label={on ? `${alt} - اضغط لعرض الوجه` : `${alt} - اضغط لعرض الظهر`}
      onClick={toggle} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } }}>
      <span className="pc-face"><img src={front} alt={alt} decoding="async" fetchPriority={fetchPriority} /></span>
      <span className="pc-face pc-back"><img src={back} alt={`${alt} - الظهر`} decoding="async" /></span>
      <i className="pc-hint" aria-hidden="true">{on ? 'الوجه ⟲' : 'الظهر ⟳'}</i>
      {children}
    </div>
  );
}
