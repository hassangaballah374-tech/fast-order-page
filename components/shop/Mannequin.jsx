'use client';
import React, { useEffect, useState } from 'react';
import { geometry, geometryBody, bodyFor, layout, shade, GROUND } from '../../lib/mannequin';

/* مانيكان بدون وجه بيتغيّر جسمه حسب المقاس، والقطع بتتركّب عليه (مع ظل وحجم) كأنها لابساها */

function useAspect(src) {
  const [a, setA] = useState(0);
  useEffect(() => {
    let ok = true;
    if (!src) return undefined;
    const im = new Image();
    im.onload = () => { if (ok && im.naturalHeight) setA(im.naturalWidth / im.naturalHeight); };
    im.src = src;
    return () => { ok = false; };
  }, [src]);
  return a;
}

function Garment({ src, slot, g, id }) {
  const aspect = useAspect(src);
  if (!aspect) return null;
  const b = layout(slot, g, aspect);
  const mid = `gm-${id}`;
  return (
    <g>
      <defs>
        <mask id={mid} maskUnits="userSpaceOnUse" x={b.x} y={b.y} width={b.w} height={b.h} style={{ maskType: 'alpha' }}>
          <image href={src} x={b.x} y={b.y} width={b.w} height={b.h} preserveAspectRatio="none" />
        </mask>
        <linearGradient id={`${mid}-s`} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#000" stopOpacity=".34" />
          <stop offset=".18" stopColor="#000" stopOpacity=".07" />
          <stop offset=".5" stopColor="#fff" stopOpacity=".07" />
          <stop offset=".82" stopColor="#000" stopOpacity=".07" />
          <stop offset="1" stopColor="#000" stopOpacity=".34" />
        </linearGradient>
        <linearGradient id={`${mid}-v`} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#000" stopOpacity=".16" />
          <stop offset=".12" stopColor="#000" stopOpacity="0" />
          <stop offset=".88" stopColor="#000" stopOpacity="0" />
          <stop offset="1" stopColor="#000" stopOpacity=".14" />
        </linearGradient>
        <filter id={`${mid}-d`} x="-10%" y="-10%" width="120%" height="125%"><feDropShadow dx="0" dy="3" stdDeviation="4" floodColor="#000" floodOpacity=".28" /></filter>
      </defs>
      <image href={src} x={b.x} y={b.y} width={b.w} height={b.h} preserveAspectRatio="none" filter={`url(#${mid}-d)`} />
      <g mask={`url(#${mid})`}>
        <rect x={b.x} y={b.y} width={b.w} height={b.h} fill={`url(#${mid}-s)`} style={{ mixBlendMode: 'multiply' }} />
        <rect x={b.x} y={b.y} width={b.w} height={b.h} fill={`url(#${mid}-v)`} />
      </g>
    </g>
  );
}

/* body = قياسات الشخص (الجسم الحقيقي)، garmentSize = مقاس القطعة اللي لابسها (عرضها). لو الجسم أكبر من المقاس هتبان القطعة ضيقة وجسمه طالع من حوافها. */
export default function Mannequin({ size = 2, body = null, garmentSize = null, tone = '#d9d4cc', worn = [], zones = {}, onZone = null }) {
  const g = geometryBody(body || bodyFor(size));
  const gg = geometry(garmentSize == null ? size : garmentSize);
  const gx = { ...gg, Y: g.Y, hs: g.hs };           /* عرض القطعة من مقاسها، وأماكنها الرأسية من طول الجسم */
  const { Y } = g;
  const dark = shade(tone, 0.16);
  const darker = shade(tone, 0.3);
  const cx = 200;
  const L = (n) => cx - n; const R = (n) => cx + n;
  const legTop = Y(470); const kneeY = Y(652); const ankleY = Y(838);
  const leg = (s) => {          /* s = -1 يسار، +1 يمين */
    const c = cx + s * g.legGap;
    const o = (d) => c + s * d; const i = (d) => c - s * d;
    return `M ${i(g.thigh * 0.95)} ${legTop} C ${i(g.thigh * 1.02)} ${Y(560)} ${i(g.knee * 1.1)} ${Y(610)} ${i(g.knee)} ${kneeY}
            C ${i(g.knee * 0.85)} ${Y(730)} ${i(g.ankle * 1.35)} ${Y(790)} ${i(g.ankle)} ${ankleY}
            L ${o(g.ankle)} ${ankleY} C ${o(g.ankle * 1.5)} ${Y(790)} ${o(g.knee * 1.1)} ${Y(730)} ${o(g.knee * 1.05)} ${kneeY}
            C ${o(g.knee * 1.5)} ${Y(600)} ${o(g.thigh * 1.15)} ${Y(540)} ${o(g.thigh * 1.1)} ${legTop} Z`;
  };
  const foot = (s) => { const c = cx + s * g.legGap; return <ellipse cx={c + s * 4} cy={Y(866)} rx={g.ankle * 1.7} ry={9} fill={dark} />; };
  const shoulderY = Y(176);
  const torso = `M ${L(g.neck)} ${Y(148)} C ${L(g.neck * 1.8)} ${Y(158)} ${L(g.sh * 0.85)} ${Y(164)} ${L(g.sh)} ${shoulderY + 6}
    C ${L(g.sh + 4)} ${Y(205)} ${L(g.chest + 6)} ${Y(230)} ${L(g.chest)} ${Y(262)}
    C ${L(g.chest - 2)} ${Y(300)} ${L(g.waist)} ${Y(320)} ${L(g.waist)} ${Y(352)}
    C ${L(g.waist + 2)} ${Y(400)} ${L(g.hip)} ${Y(420)} ${L(g.hip)} ${Y(455)}
    C ${L(g.hip - 4)} ${Y(490)} ${L(g.hip * 0.6)} ${Y(508)} ${cx} ${Y(512)}
    C ${R(g.hip * 0.6)} ${Y(508)} ${R(g.hip - 4)} ${Y(490)} ${R(g.hip)} ${Y(455)}
    C ${R(g.hip)} ${Y(420)} ${R(g.waist + 2)} ${Y(400)} ${R(g.waist)} ${Y(352)}
    C ${R(g.waist)} ${Y(320)} ${R(g.chest - 2)} ${Y(300)} ${R(g.chest)} ${Y(262)}
    C ${R(g.chest + 6)} ${Y(230)} ${R(g.sh + 4)} ${Y(205)} ${R(g.sh)} ${shoulderY + 6}
    C ${R(g.sh * 0.85)} ${Y(164)} ${R(g.neck * 1.8)} ${Y(158)} ${R(g.neck)} ${Y(148)} Z`;
  const arm = (s) => {
    const S = [cx + s * (g.sh - g.arm * 0.3), Y(196)];
    const E = [cx + s * (g.chest + g.arm * 0.55), Y(346)];
    const W = [cx + s * (g.hip + g.arm * 0.7 + 8), Y(480)];
    return (
      <g>
        <path d={`M ${S[0]} ${S[1]} Q ${E[0]} ${E[1] - 20} ${E[0]} ${E[1]}`} stroke={tone} strokeWidth={g.arm} strokeLinecap="round" fill="none" />
        <path d={`M ${E[0]} ${E[1]} Q ${E[0] + s * 4} ${E[1] + 60} ${W[0]} ${W[1]}`} stroke={tone} strokeWidth={g.arm * 0.78} strokeLinecap="round" fill="none" />
        <ellipse cx={W[0] + s * 2} cy={W[1] + 22} rx={g.arm * 0.38} ry={g.arm * 0.62} fill={tone} />
      </g>
    );
  };
  const Z = { bottom: 1, shoes: 2, top: 3, outer: 4, acc: 5 };
  const bySlot = [...worn].sort((a, b) => (Z[a.slot] || 3) - (Z[b.slot] || 3));
  return (
    <svg className="fr-man" viewBox="0 0 400 900" role="img" aria-label="الموديل" preserveAspectRatio="xMidYMax meet">
      <defs>
        <linearGradient id="mn-sk" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor={darker} /><stop offset=".28" stopColor={tone} /><stop offset=".6" stopColor={tone} /><stop offset="1" stopColor={dark} />
        </linearGradient>
        <radialGradient id="mn-bl" cx="50%" cy="40%" r="60%"><stop offset="0" stopColor="#fff" stopOpacity=".22" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
        <radialGradient id="mn-sh" cx="50%" cy="50%" r="50%"><stop offset="0" stopColor="#000" stopOpacity=".22" /><stop offset="1" stopColor="#000" stopOpacity="0" /></radialGradient>
      </defs>
      <ellipse cx={cx} cy={GROUND + 6} rx={g.legGap + g.thigh + 40} ry="11" fill="url(#mn-sh)" />
      {[-1, 1].map((s) => <g key={s}><path d={leg(s)} fill="url(#mn-sk)" />{foot(s)}</g>)}
      {[-1, 1].map((s) => <g key={`a${s}`}>{arm(s)}</g>)}
      <path d={torso} fill="url(#mn-sk)" />
      <path d={`M ${L(g.neck)} ${Y(108)} L ${L(g.neck)} ${Y(152)} Q ${cx} ${Y(166)} ${R(g.neck)} ${Y(152)} L ${R(g.neck)} ${Y(108)} Z`} fill={dark} />
      <ellipse cx={cx} cy={Y(70)} rx={g.headRx} ry={g.headRy * g.hs} fill="url(#mn-sk)" />
      {g.stomach > 0.05 && <ellipse cx={cx} cy={Y(338)} rx={g.waist * 0.78} ry={34 * g.hs} fill="url(#mn-bl)" />}
      {bySlot.map((w) => <Garment key={w.id} id={String(w.id).replace(/[^a-z0-9]/gi, '')} src={w.image} slot={w.slot} g={gx} />)}
      {onZone && [
        ['chest', 'الصدر والكتف', `M ${cx - g.sh - 8} ${Y(168)} L ${cx + g.sh + 8} ${Y(168)} L ${cx + g.chest + 10} ${Y(290)} L ${cx - g.chest - 10} ${Y(290)} Z`],
        ['stomach', 'البطن', `M ${cx - g.waist - 4} ${Y(296)} L ${cx + g.waist + 4} ${Y(296)} L ${cx + g.waist + 4} ${Y(400)} L ${cx - g.waist - 4} ${Y(400)} Z`],
        ['hips', 'الجنب والأرداف', `M ${cx - g.hip - 8} ${Y(400)} L ${cx + g.hip + 8} ${Y(400)} L ${cx + g.hip + 8} ${Y(500)} L ${cx - g.hip - 8} ${Y(500)} Z`],
      ].map(([k, t, d]) => (
        <path key={k} d={d} className={'fr-zone' + (zones[k] ? ' on' : '')} fill={zones[k] ? 'rgba(14,143,192,.28)' : 'transparent'} stroke={zones[k] ? '#0E8FC0' : 'none'} strokeWidth="3" strokeDasharray="8 6"
          role="button" tabIndex={0} aria-pressed={!!zones[k]} aria-label={t} style={{ cursor: 'pointer' }} onClick={() => onZone(k)} onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); onZone(k); } }}><title>{t}</title></path>
      ))}
    </svg>
  );
}
