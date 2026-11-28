'use client';
import { useT } from '../I18n';
import React from 'react';

/* ظبّط جسمك: الطول والوزن وأكتر مكان ممتلئ، والموديل بيتغيّر قدامك، والمقاس الأنسب بيظهر لحظياً */
const ZONES = [['chest', 'الصدر والكتف'], ['stomach', 'البطن'], ['hips', 'الجنب والأرداف']];
const FITS = [[-1, 'ضيّق'], [0, 'عادي'], [1, 'واسع']];

function Slide({ label, unit, value, min, max, onChange }) {
  const tx = useT();
  const set = (v) => onChange(Math.min(max, Math.max(min, v)));
  return (
    <div className="bf-sl">
      <div className="bf-slh"><span>{label}</span><b className="num" dir="ltr">{value} {unit}</b></div>
      <div className="bf-slr">
        <button type="button" onClick={() => set(value - 1)} aria-label={tx('إنقاص {1}', [label])}>−</button>
        <input type="range" min={min} max={max} value={value} onChange={(e) => set(Number(e.target.value))} aria-label={label} />
        <button type="button" onClick={() => set(value + 1)} aria-label={tx('زيادة {1}', [label])}>+</button>
      </div>
    </div>
  );
}

export default function BodyFit({ h, w, zones, fit, rec, custom, onH, onW, onZone, onFit, onApply, onReset, canApply }) {
  const tx = useT();
  return (
    <div className="bf">
      <div className="bf-t"><b>{tx('ظبّط جسمك على الموديل')}</b>{custom ? <button type="button" className="bf-rs" onClick={onReset}>{tx('إعادة ضبط')}</button> : null}</div>
      <Slide label={tx('الطول')} unit={tx('سم')} value={h} min={140} max={210} onChange={onH} />
      <Slide label={tx('الوزن')} unit={tx('كجم')} value={w} min={40} max={160} onChange={onW} />
      <div className="bf-k">{tx('فين أكتر مكان ممتلئ عندك؟')} <small>{tx('(اضغط هنا أو على الموديل نفسه)')}</small></div>
      <div className="bf-zs" role="group" aria-label={tx('أكتر مكان ممتلئ')}>
        {ZONES.map(([k, t]) => <button key={k} type="button" className={zones[k] ? 'on' : ''} aria-pressed={!!zones[k]} onClick={() => onZone(k)}>{tx(t)}</button>)}
        <button type="button" className={!zones.chest && !zones.stomach && !zones.hips ? 'on' : ''} onClick={() => onZone('none')}>{tx('متساوي')}</button>
      </div>
      <div className="bf-k">{tx('بتحب اللبس؟')}</div>
      <div className="bf-zs" role="group" aria-label={tx('اللبس')}>{FITS.map(([v, t]) => <button key={v} type="button" className={fit === v ? 'on' : ''} onClick={() => onFit(v)}>{tx(t)}</button>)}</div>
      {rec ? (
        <div className="bf-rec" role="status">
          <div><span>{tx('المقاس الأنسب لك')}</span><b className="num">{rec.size}</b></div>
          <div className="bf-rf"><span>{rec.fitText}</span><i style={{ width: `${rec.confidence}%` }} /></div>
          {rec.alt ? <small>{tx('ولو بتحب الراحة جرّب {1}', [rec.alt])}</small> : null}
          {(rec.notes || []).slice(0, 2).map((n) => <small key={n}>{n}</small>)}
          {canApply ? <button type="button" className="bf-ap" onClick={onApply}>{tx('✓ استخدم مقاس {1}', [rec.size])}</button> : null}
        </div>
      ) : null}
    </div>
  );
}
