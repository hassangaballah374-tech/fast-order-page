/* إزالة خلفية صورة قطعة الملابس داخل المتصفح (بدون ذكاء اصطناعي ولا خدمة خارجية):
   بتشتغل على الصور اللي خلفيتها لون واحد متجانس (أبيض/رمادي فاتح استوديو). بتمسح الخلفية المتصلة بحواف الصورة،
   تنعّم الحافة، وتقص الصورة على حدود القطعة نفسها عشان تتركب على الموديل بحجمها الحقيقي.
   لو الخلفية مش متجانسة (صورة على شخص أو مشهد) بترجع reason = 'busy' ومبنغيّرش حاجة. */

const loadImg = (src, cors) => new Promise((res, rej) => {
  const im = new Image();
  if (cors) im.crossOrigin = 'anonymous';
  im.onload = () => res(im);
  im.onerror = () => rej(new Error('تعذر قراءة الصورة'));
  im.src = src;
});

const dist = (d, i, r, g, b) => {
  const dr = d[i] - r; const dg = d[i + 1] - g; const db = d[i + 2] - b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
};

/* source: File/Blob أو رابط. الناتج: { blob, reason } — blob = PNG مقصوص وشفاف، أو null لو مش مناسب */
export async function cutoutImage(source, { tol = 34, maxSide = 1400 } = {}) {
  const isUrl = typeof source === 'string';
  const url = isUrl ? source : URL.createObjectURL(source);
  try {
    const im = await loadImg(url, isUrl);
    const k = Math.min(1, maxSide / Math.max(im.naturalWidth, im.naturalHeight));
    const w = Math.max(1, Math.round(im.naturalWidth * k)); const h = Math.max(1, Math.round(im.naturalHeight * k));
    const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
    const cx = cv.getContext('2d', { willReadFrequently: true });
    cx.drawImage(im, 0, 0, w, h);
    const img = cx.getImageData(0, 0, w, h);
    const d = img.data;

    /* لون الخلفية = متوسط بكسلات الحواف، ولازم تكون متجانسة */
    const edge = [];
    for (let x = 0; x < w; x += 2) { edge.push((0 * w + x) * 4, ((h - 1) * w + x) * 4); }
    for (let y = 0; y < h; y += 2) { edge.push((y * w) * 4, (y * w + (w - 1)) * 4); }
    let tr = 0; let tg = 0; let tb = 0; let ta = 0;
    for (const i of edge) { tr += d[i]; tg += d[i + 1]; tb += d[i + 2]; ta += d[i + 3]; }
    const n = edge.length;
    if (ta / n < 40) {                     /* شفافة أصلاً: نقص بس */
      return { blob: await trim(cv, cx, w, h), reason: 'already' };
    }
    const br = tr / n; const bg = tg / n; const bb = tb / n;
    let near = 0;
    for (const i of edge) if (dist(d, i, br, bg, bb) < tol * 1.2) near += 1;
    if (near / n < 0.85) return { blob: null, reason: 'busy' };

    /* ملء من الحواف: كل بكسل قريب من لون الخلفية ومتصل بالحافة يتمسح */
    const bgMask = new Uint8Array(w * h);
    const stack = [];
    const push = (x, y) => {
      if (x < 0 || y < 0 || x >= w || y >= h) return;
      const p = y * w + x;
      if (bgMask[p]) return;
      if (dist(d, p * 4, br, bg, bb) > tol) return;
      bgMask[p] = 1; stack.push(p);
    };
    for (let x = 0; x < w; x += 1) { push(x, 0); push(x, h - 1); }
    for (let y = 0; y < h; y += 1) { push(0, y); push(w - 1, y); }
    while (stack.length) {
      const p = stack.pop(); const x = p % w; const y = (p - x) / w;
      push(x + 1, y); push(x - 1, y); push(x, y + 1); push(x, y - 1);
    }
    let cleared = 0;
    for (let p = 0; p < bgMask.length; p += 1) if (bgMask[p]) cleared += 1;
    if (cleared / (w * h) < 0.08) return { blob: null, reason: 'busy' };
    if (cleared / (w * h) > 0.97) return { blob: null, reason: 'empty' };

    /* تنعيم الحافة: بكسل ملاصق للخلفية بياخد شفافية حسب قربه من لونها */
    for (let y = 1; y < h - 1; y += 1) {
      for (let x = 1; x < w - 1; x += 1) {
        const p = y * w + x;
        if (bgMask[p]) { d[p * 4 + 3] = 0; continue; }
        if (bgMask[p - 1] || bgMask[p + 1] || bgMask[p - w] || bgMask[p + w]) {
          const t = dist(d, p * 4, br, bg, bb);
          const a = Math.max(0, Math.min(1, (t - tol * 0.5) / (tol * 1.6)));
          d[p * 4 + 3] = Math.round(255 * a);
        }
      }
    }
    for (let x = 0; x < w; x += 1) { d[x * 4 + 3] = bgMask[x] ? 0 : d[x * 4 + 3]; d[((h - 1) * w + x) * 4 + 3] = bgMask[(h - 1) * w + x] ? 0 : d[((h - 1) * w + x) * 4 + 3]; }
    for (let y = 0; y < h; y += 1) { d[(y * w) * 4 + 3] = bgMask[y * w] ? 0 : d[(y * w) * 4 + 3]; d[(y * w + w - 1) * 4 + 3] = bgMask[y * w + w - 1] ? 0 : d[(y * w + w - 1) * 4 + 3]; }
    cx.putImageData(img, 0, 0);
    return { blob: await trim(cv, cx, w, h), reason: 'ok' };
  } finally {
    if (!isUrl) URL.revokeObjectURL(url);
  }
}

async function trim(cv, cx, w, h) {
  const d = cx.getImageData(0, 0, w, h).data;
  let x0 = w; let y0 = h; let x1 = -1; let y1 = -1;
  for (let y = 0; y < h; y += 1) for (let x = 0; x < w; x += 1) {
    if (d[(y * w + x) * 4 + 3] > 16) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
  }
  if (x1 < 0) return null;
  const pad = 2;
  x0 = Math.max(0, x0 - pad); y0 = Math.max(0, y0 - pad); x1 = Math.min(w - 1, x1 + pad); y1 = Math.min(h - 1, y1 + pad);
  const out = document.createElement('canvas'); out.width = x1 - x0 + 1; out.height = y1 - y0 + 1;
  out.getContext('2d').drawImage(cv, x0, y0, out.width, out.height, 0, 0, out.width, out.height);
  return new Promise((res) => out.toBlob((b) => res(b), 'image/png'));
}
