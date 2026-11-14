/* الموديل المدمج (مانيكان بدون وجه): جسم بيتغيّر حسب المقاس (طول، عرض أكتاف، صدر، وسط، أرداف، أرجل)،
   والقطع بتتركّب عليه بنفس مقاسه. كل الأرقام في مساحة رسم 400×900. */
export const SIZES = ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'];
export const GROUND = 872;
export const TONES = [['#d9d4cc', 'مانيكان'], ['#f1cfb3', 'فاتح'], ['#cf9a68', 'قمحي'], ['#8a5a3b', 'أسمر']];

const lerp = (a, b, t) => a + (b - a) * t;

/* نص المقاس (S, XL, 2XL, XXL, 3XL, XXXL...) → رقم 0..7، أو -1 لو مش مقاس حروف */
export function parseSize(v) {
  const s = String(v || '').toUpperCase().replace(/[\s\-_.]/g, '');
  if (!s) return -1;
  const m = /^(X{1,4}|\d)?(S|M|L)$/.exec(s) || /^(\d)?XL$/.exec(s);
  if (!m && !/^(X+L|X+S|\dXL|\dXS)$/.test(s)) return -1;
  if (s === 'XS' || s === 'XXS') return 0;
  if (s === 'S') return 1;
  if (s === 'M') return 2;
  if (s === 'L') return 3;
  if (s === 'XL') return 4;
  const xl = /^(X+)L$/.exec(s);
  if (xl) return Math.min(7, 3 + xl[1].length);          /* XXL=5, XXXL=6, XXXXL=7 */
  const n = /^(\d)XL$/.exec(s);
  if (n) return Math.min(7, 3 + Number(n[1]));            /* 2XL=5, 3XL=6, 4XL=7 */
  return -1;
}

/* جسم نموذجي لكل مقاس (طول سم، وزن كجم) */
export const bodyFor = (idx) => { const i = Math.max(0, Math.min(7, idx)); return { h: Math.round(168 + i * 1.6), w: Math.round(58 + i * 9), chest: 0, stomach: 0, hips: 0 }; };

const cl = (n, a, b) => Math.min(b, Math.max(a, n));

/* أبعاد الجسم من القياسات: body = { h (سم), w (كجم), chest, stomach, hips (0..1 = قد إيه ممتلئ) }.
   Y(y) بيحوّل الارتفاعات حسب الطول. */
export function geometryBody(body) {
  const h = cl(Number(body?.h) || 170, 140, 210);
  const w = cl(Number(body?.w) || 70, 40, 160);
  const bmi = w / ((h / 100) * (h / 100));
  const t = cl((bmi - 17) / 21, 0, 1);
  const hs = lerp(0.84, 1, (h - 140) / 70);
  const Y = (y) => GROUND - (GROUND - y) * hs;
  const st = cl(Number(body?.stomach) || 0, 0, 1); const ch = cl(Number(body?.chest) || 0, 0, 1); const hp = cl(Number(body?.hips) || 0, 0, 1);
  return {
    t, hs, Y, stomach: st, chest0: ch, hips0: hp,
    sh: lerp(72, 106, t) + ch * 8, chest: lerp(56, 94, t) + ch * 12, waist: lerp(46, 98, t) + st * 22 * (0.6 + 0.4 * t), hip: lerp(58, 98, t) + hp * 18,
    neck: lerp(14, 21, t), arm: lerp(30, 50, t), thigh: lerp(27, 47, t) + hp * 5, knee: lerp(19, 30, t), ankle: lerp(11, 15, t),
    headRx: lerp(31, 37, t), headRy: 41,
    legGap: lerp(30, 50, t) + hp * 3,
  };
}

/* أبعاد الجسم لمقاس معين (idx 0..7) */
export function geometry(idx) { return { ...geometryBody(bodyFor(idx)), idx: Math.max(0, Math.min(7, idx)) }; }

/* مكان كل قطعة على الجسم: صندوق (x, y, w, h) حسب نسبة صورة القطعة aspect = عرض/ارتفاع */
export function layout(slot, g, aspect) {
  const a = aspect > 0.1 && aspect < 10 ? aspect : 1;
  const fit = (W, top, wantH, minK, maxK) => {
    let H = W / a;
    if (H < wantH) H = Math.min(wantH, H * maxK);
    if (H > wantH * 1.35) H = wantH * 1.35;
    return { x: 200 - W / 2, y: top, w: W, h: Math.max(H, wantH * minK) };
  };
  if (slot === 'outer') return fit(2 * (g.chest + g.arm * 1.1 + 34), g.Y(144), g.Y(540) - g.Y(144), 0.7, 1.3);
  if (slot === 'bottom') {            /* البنطلون بيتمدّ على طول الرجل، وعرضه حوالين مقاس الأرداف */
    const W0 = 2 * (g.hip + 10); const H = g.Y(850) - g.Y(346);
    const W = Math.min(Math.max(H * a, W0), W0 * 1.4);
    return { x: 200 - W / 2, y: g.Y(346), w: W, h: H };
  }
  if (slot === 'shoes') { const W = 2 * (g.legGap + g.thigh * 0.7) + 36; const H = W / a; return { x: 200 - W / 2, y: GROUND + 8 - H, w: W, h: H }; }
  if (slot === 'acc') { const W = g.headRx * 2 * 1.5; const H = W / a; return { x: 200 - W / 2, y: g.Y(20), w: W, h: H }; }
  return fit(2 * (g.chest + g.arm * 1.1 + 24), g.Y(146), g.Y(446) - g.Y(146), 0.7, 1.3);       /* top */
}

/* تغميق لون hex بنسبة k (0..1) */
export function shade(hex, k) {
  const h = String(hex).replace('#', '');
  const n = parseInt(h.length === 3 ? h.split('').map((c) => c + c).join('') : h, 16);
  const f = (v) => Math.max(0, Math.round(v * (1 - k)));
  return `rgb(${f((n >> 16) & 255)},${f((n >> 8) & 255)},${f(n & 255)})`;
}
