'use client';
import React, { useId, useState } from 'react';

export const fmtK = (n) => {
  const v = Number(n || 0);
  if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (Math.abs(v) >= 1e3) return (v / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(Math.round(v * 10) / 10);
};
export const fmtN = (n, d = 0) => Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

const niceMax = (m) => {
  if (!m || m <= 0) return 10;
  const p = Math.pow(10, Math.floor(Math.log10(m)));
  const n = m / p;
  return (n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10) * p;
};

const smooth = (pts) => {
  if (!pts.length) return '';
  if (pts.length === 1) return `M${pts[0][0]},${pts[0][1]}`;
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
    d += ` C${p1[0] + (p2[0] - p0[0]) / 6},${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6},${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]},${p2[1]}`;
  }
  return d;
};

export function Spark({ data = [], color = 'var(--b)' }) {
  const id = useId().replace(/:/g, '');
  const W = 120, H = 34;
  const max = Math.max(...data, 1), min = Math.min(...data, 0), span = max - min || 1;
  const pts = data.map((v, i) => [data.length === 1 ? W / 2 : (i * W) / (data.length - 1), H - 4 - ((v - min) / span) * (H - 8)]);
  const line = smooth(pts);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" width="100%" height={H} aria-hidden="true">
      <defs><linearGradient id={`s${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".28" /><stop offset="100%" stopColor={color} stopOpacity="0" /></linearGradient></defs>
      {line && <path d={`${line} L${W},${H} L0,${H} Z`} fill={`url(#s${id})`} />}
      {line && <path d={line} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" />}
    </svg>
  );
}

export function Area({ labels = [], values = [], color = 'var(--b)', height = 220, unit = '' }) {
  const id = useId().replace(/:/g, '');
  const [hv, setHv] = useState(null);
  const W = 640, H = height, pad = { l: 44, r: 12, t: 12, b: 26 };
  const n = values.length;
  const max = niceMax(Math.max(...values, 0));
  const x = (i) => pad.l + (n <= 1 ? (W - pad.l - pad.r) / 2 : (i * (W - pad.l - pad.r)) / (n - 1));
  const y = (v) => pad.t + (H - pad.t - pad.b) * (1 - v / max);
  const pts = values.map((v, i) => [x(i), y(v)]);
  const line = smooth(pts);
  const step = Math.max(1, Math.ceil(n / 7));
  return (
    <div dir="ltr" style={{ width: '100%' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
        <defs><linearGradient id={`a${id}`} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor={color} stopOpacity=".3" /><stop offset="100%" stopColor={color} stopOpacity=".02" /></linearGradient></defs>
        {[0, 1, 2, 3, 4].map((k) => {
          const tv = (max * k) / 4;
          return (
            <g key={k}>
              <line x1={pad.l} x2={W - pad.r} y1={y(tv)} y2={y(tv)} stroke="var(--ln)" strokeDasharray={k === 0 ? '0' : '4 5'} />
              <text x={pad.l - 8} y={y(tv) + 4} textAnchor="end" fontSize="11" fill="var(--mut)">{fmtK(tv)}</text>
            </g>
          );
        })}
        {line && <path d={`${line} L${x(n - 1)},${H - pad.b} L${x(0)},${H - pad.b} Z`} fill={`url(#a${id})`} />}
        {line && <path d={line} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />}
        {labels.map((l, i) => (i % step === 0 ? <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--mut)">{l}</text> : null))}
        {hv !== null && values[hv] !== undefined && (
          <g>
            <line x1={x(hv)} x2={x(hv)} y1={pad.t} y2={H - pad.b} stroke={color} strokeOpacity=".35" strokeDasharray="3 4" />
            <circle cx={x(hv)} cy={y(values[hv])} r="5" fill="var(--s)" stroke={color} strokeWidth="3" />
            <g>
              <rect x={Math.min(Math.max(x(hv) - 54, pad.l), W - pad.r - 108)} y={Math.max(y(values[hv]) - 50, 2)} width="108" height="40" rx="10" fill="#06494e" />
              <text x={Math.min(Math.max(x(hv) - 54, pad.l), W - pad.r - 108) + 54} y={Math.max(y(values[hv]) - 50, 2) + 16} textAnchor="middle" fontSize="11" fill="#d9ecec">{labels[hv]}</text>
              <text x={Math.min(Math.max(x(hv) - 54, pad.l), W - pad.r - 108) + 54} y={Math.max(y(values[hv]) - 50, 2) + 32} textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff">{fmtN(values[hv])} {unit}</text>
            </g>
          </g>
        )}
        {values.map((_, i) => {
          const w = (W - pad.l - pad.r) / Math.max(n, 1);
          return <rect key={i} x={x(i) - w / 2} y={pad.t} width={w} height={H - pad.t - pad.b} fill="transparent" onMouseEnter={() => setHv(i)} onMouseLeave={() => setHv(null)} />;
        })}
      </svg>
    </div>
  );
}

export function Bars({ labels = [], values = [], color = 'var(--b)', height = 200, unit = '' }) {
  const [hv, setHv] = useState(null);
  const W = 640, H = height, pad = { l: 40, r: 10, t: 14, b: 26 };
  const n = values.length;
  const max = niceMax(Math.max(...values, 0));
  const slot = (W - pad.l - pad.r) / Math.max(n, 1);
  const bw = Math.min(Math.max(slot * 0.58, 4), 26);
  const y = (v) => pad.t + (H - pad.t - pad.b) * (1 - v / max);
  const step = Math.max(1, Math.ceil(n / 8));
  return (
    <div dir="ltr" style={{ width: '100%' }}>
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
        {[0, 1, 2, 3, 4].map((k) => {
          const tv = (max * k) / 4;
          return (
            <g key={k}>
              <line x1={pad.l} x2={W - pad.r} y1={y(tv)} y2={y(tv)} stroke="var(--ln)" strokeDasharray={k === 0 ? '0' : '4 5'} />
              <text x={pad.l - 8} y={y(tv) + 4} textAnchor="end" fontSize="11" fill="var(--mut)">{fmtK(tv)}</text>
            </g>
          );
        })}
        {values.map((v, i) => {
          const cx = pad.l + slot * i + slot / 2;
          const h = Math.max((H - pad.t - pad.b) * (v / max), v > 0 ? 3 : 0);
          return (
            <g key={i} onMouseEnter={() => setHv(i)} onMouseLeave={() => setHv(null)}>
              <rect x={cx - slot / 2} y={pad.t} width={slot} height={H - pad.t - pad.b} fill="transparent" />
              <rect x={cx - bw / 2} y={H - pad.b - h} width={bw} height={h} rx={Math.min(bw / 2, 6)} fill={hv === i ? '#e08f4f' : color} />
              {hv === i && <text x={cx} y={H - pad.b - h - 7} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--ink)">{fmtN(v)} {unit}</text>}
              {i % step === 0 && <text x={cx} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--mut)">{labels[i]}</text>}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

export function HBars({ items = [], unit = '', color = 'var(--b)', empty = 'لا توجد بيانات بعد' }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  if (!items.length) return <div className="mut c">{empty}</div>;
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      {items.map((it, i) => (
        <div key={i}>
          <div className="hbl"><span>{it.label}</span><b className="num" dir="ltr">{fmtN(it.value)} {unit}</b></div>
          <div className="hbt"><i style={{ width: `${(it.value / max) * 100}%`, background: color, opacity: i === 0 ? 1 : 0.75 }} /></div>
        </div>
      ))}
    </div>
  );
}

export function Donut({ segments = [], centerValue = '', centerLabel = '' }) {
  const total = segments.reduce((a, s) => a + s.value, 0);
  const R = 56, C = 2 * Math.PI * R;
  let acc = 0;
  return (
    <div className="dnt">
      <div className="dntc" dir="ltr">
        <svg viewBox="0 0 160 160" width="160" height="160" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="80" cy="80" r={R} fill="none" stroke="var(--s2)" strokeWidth="22" />
          {total > 0 && segments.map((s, i) => {
            const len = (s.value / total) * C;
            const el = <circle key={i} cx="80" cy="80" r={R} fill="none" stroke={s.color} strokeWidth="22" strokeDasharray={`${Math.max(len - 2, 0)} ${C - Math.max(len - 2, 0)}`} strokeDashoffset={-acc} />;
            acc += len;
            return el;
          })}
        </svg>
        <div className="dnti"><b className="num">{centerValue}</b><small>{centerLabel}</small></div>
      </div>
      <div style={{ display: 'grid', gap: 8, flex: 1 }}>
        {segments.map((s, i) => (
          <div key={i} className="dntl"><span><i style={{ background: s.color }} />{s.label}</span><b className="num" dir="ltr">{fmtN(s.value)} · {total ? Math.round((s.value / total) * 100) : 0}%</b></div>
        ))}
      </div>
    </div>
  );
}

export function Funnel({ steps = [] }) {
  const max = Math.max(...steps.map((s) => s.value), 1);
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {steps.map((s, i) => {
        const prev = i > 0 ? steps[i - 1].value : 0;
        const rate = i > 0 && prev > 0 ? Math.round((s.value / prev) * 100) : null;
        return (
          <div key={s.label}>
            <div className="hbl"><span>{s.label}</span><b className="num" dir="ltr">{fmtN(s.value)}{rate !== null ? ` · ${rate}%` : ''}</b></div>
            <div className="hbt big"><i style={{ width: `${Math.max((s.value / max) * 100, s.value > 0 ? 3 : 0)}%`, background: s.color || 'var(--b)' }} /></div>
          </div>
        );
      })}
    </div>
  );
}
