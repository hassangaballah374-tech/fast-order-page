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

/* أبعاد الجسم لمقاس معين (idx 0..7). Y(y) بيحوّل الارتفاعات حسب طول الجسم (المقاسات الأكبر أطول شوية). */
export function geometry(idx) {
  const i = Math.max(0, Math.min(7, idx));
  const t = i / 7;
  const hs = lerp(0.93, 1, t);
  const Y = (y) => GROUND - (GROUND - y) * hs;
  return {
    idx: i, t, hs, Y,
    sh: lerp(72, 106, t), chest: lerp(56, 94, t), waist: lerp(46, 98, t), hip: lerp(58, 98, t),
    neck: lerp(14, 21, t), arm: lerp(30, 50, t), thigh: lerp(27, 47, t), knee: lerp(19, 30, t), ankle: lerp(11, 15, t),
    headRx: lerp(31, 37, t), headRy: 41,
    legGap: lerp(30, 50, t),
  };
}

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
