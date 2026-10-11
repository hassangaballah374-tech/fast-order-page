'use client';
import React, { useId, useState } from 'react';

/* ============ Helpers ============ */
export const fmt = (n, d = 0) =>
  Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: d, maximumFractionDigits: d });

export const fmtK = (n) => {
  const v = Number(n || 0);
  if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(1).replace(/\.0$/, '') + 'M';
  if (Math.abs(v) >= 1e3) return (v / 1e3).toFixed(1).replace(/\.0$/, '') + 'K';
  return String(Math.round(v * 10) / 10);
};

const niceMax = (m) => {
  if (!m || m <= 0) return 10;
  const p = Math.pow(10, Math.floor(Math.log10(m)));
  const n = m / p;
  const s = n <= 1 ? 1 : n <= 2 ? 2 : n <= 5 ? 5 : 10;
  return s * p;
};

const smoothPath = (pts) => {
  if (!pts.length) return '';
  if (pts.length === 1) return `M${pts[0][0]},${pts[0][1]}`;
  let d = `M${pts[0][0]},${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[i - 1] || pts[i];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[i + 2] || p2;
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C${c1x},${c1y} ${c2x},${c2y} ${p2[0]},${p2[1]}`;
  }
  return d;
};

/* ============ Card wrapper (نفس شكل الصورة: عنوان + وصف + خيارات) ============ */
export function ChartCard({ title, subtitle, right, children, className = '' }) {
  return (
    <div className={`p-6 rounded-2xl border flex flex-col ${className}`}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h3 className="text-base font-black">{title}</h3>
          {subtitle && <p className="text-xs text-slate-400 mt-0.5">{subtitle}</p>}
        </div>
        {right}
      </div>
      <div className="flex-1 min-h-0">{children}</div>
    </div>
  );
}

/* ============ Segmented options (Option 1 / Option 2) ============ */
export function Segmented({ options, value, onChange }) {
  return (
    <div className="flex items-center gap-1 shrink-0">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            onClick={() => onChange(o.value)}
            className={active ? 'bg-[#00B050] text-white' : 'border'}
            style={{ minHeight: 30, padding: '0 12px', fontSize: 12, borderRadius: 999 }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

/* ============ Sparkline ============ */
export function Sparkline({ data = [], color = 'var(--teal)', height = 36 }) {
  const id = useId().replace(/:/g, '');
  const W = 120;
  const H = height;
  const max = Math.max(...data, 1);
  const min = Math.min(...data, 0);
  const span = max - min || 1;
  const pts = data.map((v, i) => [
    data.length === 1 ? W / 2 : (i * W) / (data.length - 1),
    H - 4 - ((v - min) / span) * (H - 8),
  ]);
  const line = smoothPath(pts);
  const area = pts.length ? `${line} L${W},${H} L0,${H} Z` : '';
  return (
    <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none" width="100%" height={H} aria-hidden="true">
      <defs>
        <linearGradient id={`sp${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.28" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      {area && <path d={area} fill={`url(#sp${id})`} />}
      {line && <path d={line} fill="none" stroke={color} strokeWidth="2" vectorEffect="non-scaling-stroke" strokeLinecap="round" />}
    </svg>
  );
}

/* ============ Area / Line chart ============ */
export function AreaChart({ labels = [], values = [], color = 'var(--teal)', height = 260, name = '', unit = '' }) {
  const id = useId().replace(/:/g, '');
  const [hover, setHover] = useState(null);
  const W = 640;
  const H = height;
  const pad = { l: 46, r: 14, t: 14, b: 28 };
  const n = values.length;
  const max = niceMax(Math.max(...values, 0));
  const x = (i) => pad.l + (n <= 1 ? (W - pad.l - pad.r) / 2 : (i * (W - pad.l - pad.r)) / (n - 1));
  const y = (v) => pad.t + (H - pad.t - pad.b) * (1 - v / max);
  const pts = values.map((v, i) => [x(i), y(v)]);
  const line = smoothPath(pts);
  const area = pts.length ? `${line} L${x(n - 1)},${H - pad.b} L${x(0)},${H - pad.b} Z` : '';
  const step = Math.max(1, Math.ceil(n / 7));
  const ticks = [0, 1, 2, 3, 4].map((k) => (max * k) / 4);

  return (
    <div dir="ltr" className="w-full relative">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }} role="img" aria-label={name}>
        <defs>
          <linearGradient id={`ar${id}`} x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={color} stopOpacity="0.30" />
            <stop offset="100%" stopColor={color} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {ticks.map((tv, i) => (
          <g key={i}>
            <line x1={pad.l} x2={W - pad.r} y1={y(tv)} y2={y(tv)} stroke="var(--line)" strokeDasharray={i === 0 ? '0' : '4 5'} />
            <text x={pad.l - 8} y={y(tv) + 4} textAnchor="end" fontSize="11" fill="var(--muted)" fontFamily="Inter, sans-serif">
              {fmtK(tv)}
            </text>
          </g>
        ))}
        {area && <path d={area} fill={`url(#ar${id})`} />}
        {line && <path d={line} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" />}
        {labels.map((l, i) =>
          i % step === 0 ? (
            <text key={i} x={x(i)} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--muted)" fontFamily="Inter, sans-serif">
              {l}
            </text>
          ) : null
        )}
        {hover !== null && values[hover] !== undefined && (
          <g>
            <line x1={x(hover)} x2={x(hover)} y1={pad.t} y2={H - pad.b} stroke={color} strokeOpacity="0.35" strokeDasharray="3 4" />
            <circle cx={x(hover)} cy={y(values[hover])} r="5.5" fill="var(--surface)" stroke={color} strokeWidth="3" />
            {(() => {
              const bw = 112;
              const bx = Math.min(Math.max(x(hover) - bw / 2, pad.l), W - pad.r - bw);
              const by = Math.max(y(values[hover]) - 54, 2);
              return (
                <g>
                  <rect x={bx} y={by} width={bw} height="42" rx="10" fill="var(--teal-deep, #06494e)" />
                  <text x={bx + bw / 2} y={by + 17} textAnchor="middle" fontSize="11" fill="#d9ecec" fontFamily="Inter, sans-serif">
                    {labels[hover]}
                  </text>
                  <text x={bx + bw / 2} y={by + 34} textAnchor="middle" fontSize="13" fontWeight="700" fill="#fff" fontFamily="Inter, sans-serif">
                    {fmt(values[hover], 0)} {unit}
                  </text>
                </g>
              );
            })()}
          </g>
        )}
        {values.map((_, i) => {
          const w = (W - pad.l - pad.r) / Math.max(n, 1);
          return (
            <rect
              key={i}
              x={x(i) - w / 2}
              y={pad.t}
              width={w}
              height={H - pad.t - pad.b}
              fill="transparent"
              onMouseEnter={() => setHover(i)}
              onMouseMove={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onTouchStart={() => setHover(i)}
            />
          );
        })}
      </svg>
    </div>
  );
}

/* ============ Vertical bars ============ */
export function BarChart({ labels = [], values = [], color = 'var(--teal)', height = 220, unit = '' }) {
  const [hover, setHover] = useState(null);
  const W = 640;
  const H = height;
  const pad = { l: 40, r: 10, t: 14, b: 26 };
  const n = values.length;
  const max = niceMax(Math.max(...values, 0));
  const slot = (W - pad.l - pad.r) / Math.max(n, 1);
  const bw = Math.min(Math.max(slot * 0.58, 4), 26);
  const y = (v) => pad.t + (H - pad.t - pad.b) * (1 - v / max);
  const step = Math.max(1, Math.ceil(n / 8));
  const ticks = [0, 1, 2, 3, 4].map((k) => (max * k) / 4);
  return (
    <div dir="ltr" className="w-full">
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ display: 'block' }}>
        {ticks.map((tv, i) => (
          <g key={i}>
            <line x1={pad.l} x2={W - pad.r} y1={y(tv)} y2={y(tv)} stroke="var(--line)" strokeDasharray={i === 0 ? '0' : '4 5'} />
            <text x={pad.l - 8} y={y(tv) + 4} textAnchor="end" fontSize="11" fill="var(--muted)" fontFamily="Inter, sans-serif">
              {fmtK(tv)}
            </text>
          </g>
        ))}
        {values.map((v, i) => {
          const cx = pad.l + slot * i + slot / 2;
          const h = Math.max((H - pad.t - pad.b) * (v / max), v > 0 ? 3 : 0);
          return (
            <g key={i} onMouseEnter={() => setHover(i)} onMouseLeave={() => setHover(null)}>
              <rect x={cx - slot / 2} y={pad.t} width={slot} height={H - pad.t - pad.b} fill="transparent" />
              <rect
                x={cx - bw / 2}
                y={H - pad.b - h}
                width={bw}
                height={h}
                rx={Math.min(bw / 2, 6)}
                fill={hover === i ? 'var(--orange)' : color}
                style={{ transition: 'fill .15s' }}
              />
              {hover === i && (
                <text x={cx} y={H - pad.b - h - 7} textAnchor="middle" fontSize="12" fontWeight="700" fill="var(--ink)" fontFamily="Inter, sans-serif">
                  {fmt(v)} {unit}
                </text>
              )}
              {i % step === 0 && (
                <text x={cx} y={H - 8} textAnchor="middle" fontSize="11" fill="var(--muted)" fontFamily="Inter, sans-serif">
                  {labels[i]}
                </text>
              )}
            </g>
          );
        })}
      </svg>
    </div>
  );
}

/* ============ Horizontal bars (زي الصورة) ============ */
export function HBarList({ items = [], unit = '', color = 'var(--teal)', empty = '—' }) {
  const max = Math.max(...items.map((i) => i.value), 1);
  if (!items.length) return <div className="text-center py-10 text-slate-400 text-xs">{empty}</div>;
  return (
    <div className="space-y-3.5">
      {items.map((it, i) => (
        <div key={i}>
          <div className="flex justify-between items-center text-xs mb-1.5">
            <span className="font-bold truncate">{it.label}</span>
            <span className="font-mono font-bold" dir="ltr">
              {fmt(it.value)} {unit}
            </span>
          </div>
          <div className="h-2.5 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)' }}>
            <div
              className="h-full rounded-full"
              style={{ width: `${(it.value / max) * 100}%`, background: i === 0 ? 'var(--teal)' : color, opacity: i === 0 ? 1 : 0.78, transition: 'width .5s ease' }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

/* ============ Donut ============ */
export function Donut({ segments = [], centerLabel = '', centerValue = '' }) {
  const total = segments.reduce((a, s) => a + s.value, 0);
  const R = 58;
  const C = 2 * Math.PI * R;
  let acc = 0;
  return (
    <div className="flex flex-col sm:flex-row items-center gap-5">
      <div className="relative shrink-0" style={{ width: 168, height: 168 }} dir="ltr">
        <svg viewBox="0 0 168 168" width="168" height="168" style={{ transform: 'rotate(-90deg)' }}>
          <circle cx="84" cy="84" r={R} fill="none" stroke="var(--surface-2)" strokeWidth="22" />
          {total > 0 &&
            segments.map((s, i) => {
              const len = (s.value / total) * C;
              const el = (
                <circle
                  key={i}
                  cx="84"
                  cy="84"
                  r={R}
                  fill="none"
                  stroke={s.color}
                  strokeWidth="22"
                  strokeDasharray={`${Math.max(len - 2, 0)} ${C - Math.max(len - 2, 0)}`}
                  strokeDashoffset={-acc}
                />
              );
              acc += len;
              return el;
            })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-2xl font-black font-mono">{centerValue}</span>
          <span className="text-[11px] text-slate-400">{centerLabel}</span>
        </div>
      </div>
      <div className="w-full space-y-2.5">
        {segments.map((s, i) => (
          <div key={i} className="flex items-center justify-between text-xs gap-3">
            <span className="flex items-center gap-2 font-bold">
              <span style={{ width: 10, height: 10, borderRadius: 4, background: s.color, display: 'inline-block' }} />
              {s.label}
            </span>
            <span className="font-mono text-slate-400" dir="ltr">
              {fmt(s.value)} · {total ? Math.round((s.value / total) * 100) : 0}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ============ Progress ============ */
export function ProgressBar({ value = 0, color = 'var(--teal)' }) {
  return (
    <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--surface-2)', minWidth: 70 }}>
      <div className="h-full rounded-full" style={{ width: `${Math.min(Math.max(value, 0), 100)}%`, background: color, transition: 'width .5s' }} />
    </div>
  );
}
