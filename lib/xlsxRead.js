/* قارئ ملفات Excel (.xlsx) خفيف بدون أي مكتبة خارجية: الملف عبارة عن zip فيه XML.
   بيشتغل في المتصفح (DecompressionStream + DOMParser). بيرجع صفوف الورقة الأولى كمصفوفة نصوص. */

const td = new TextDecoder('utf-8');

async function inflateRaw(bytes) {
  const ds = new DecompressionStream('deflate-raw');
  const out = new Response(new Blob([bytes]).stream().pipeThrough(ds));
  return new Uint8Array(await out.arrayBuffer());
}

function zipEntries(buf) {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  let eocd = -1;
  for (let i = buf.length - 22; i >= Math.max(0, buf.length - 65557); i--) {
    if (dv.getUint32(i, true) === 0x06054b50) { eocd = i; break; }
  }
  if (eocd < 0) throw new Error('الملف مش xlsx صحيح');
  const count = dv.getUint16(eocd + 10, true);
  let p = dv.getUint32(eocd + 16, true);
  const map = {};
  for (let k = 0; k < count; k++) {
    if (dv.getUint32(p, true) !== 0x02014b50) break;
    const method = dv.getUint16(p + 10, true);
    const csize = dv.getUint32(p + 20, true);
    const nlen = dv.getUint16(p + 28, true);
    const elen = dv.getUint16(p + 30, true);
    const clen = dv.getUint16(p + 32, true);
    const off = dv.getUint32(p + 42, true);
    const name = td.decode(buf.subarray(p + 46, p + 46 + nlen));
    map[name] = { method, csize, off };
    p += 46 + nlen + elen + clen;
  }
  const read = async (name) => {
    const e = map[name];
    if (!e) return null;
    const n = dv.getUint16(e.off + 26, true);
    const x = dv.getUint16(e.off + 28, true);
    const start = e.off + 30 + n + x;
    const raw = buf.subarray(start, start + e.csize);
    const data = e.method === 0 ? raw : await inflateRaw(raw);
    return td.decode(data);
  };
  return { names: Object.keys(map), read };
}

const xml = (s) => new DOMParser().parseFromString(s, 'application/xml');
const colIndex = (ref) => {
  const m = /^([A-Z]+)/i.exec(ref || '');
  if (!m) return 0;
  let n = 0;
  for (const ch of m[1].toUpperCase()) n = n * 26 + (ch.charCodeAt(0) - 64);
  return n - 1;
};
const textOf = (el) => Array.from(el.getElementsByTagName('t')).map((t) => t.textContent || '').join('');

export async function readXlsxRows(arrayBuffer) {
  const zip = zipEntries(new Uint8Array(arrayBuffer));

  let sheetPath = '';
  try {
    const wb = xml(await zip.read('xl/workbook.xml'));
    const rels = xml(await zip.read('xl/_rels/workbook.xml.rels'));
    const first = wb.getElementsByTagName('sheet')[0];
    const rid = first && (first.getAttribute('r:id') || first.getAttributeNS('http://schemas.openxmlformats.org/officeDocument/2006/relationships', 'id'));
    for (const r of Array.from(rels.getElementsByTagName('Relationship'))) {
      if (r.getAttribute('Id') === rid) { const t = r.getAttribute('Target') || ''; sheetPath = t.startsWith('/') ? t.slice(1) : `xl/${t}`; }
    }
  } catch { /* نكمّل بالاسم الافتراضي */ }
  if (!sheetPath || !zip.names.includes(sheetPath)) {
    sheetPath = zip.names.filter((n) => /^xl\/worksheets\/sheet\d+\.xml$/.test(n)).sort()[0] || '';
  }
  if (!sheetPath) throw new Error('مفيش ورقة بيانات في الملف');

  const shared = [];
  const ssXml = await zip.read('xl/sharedStrings.xml');
  if (ssXml) for (const si of Array.from(xml(ssXml).getElementsByTagName('si'))) shared.push(textOf(si));

  const sheet = xml(await zip.read(sheetPath));
  const rows = [];
  for (const row of Array.from(sheet.getElementsByTagName('row'))) {
    const arr = [];
    for (const c of Array.from(row.getElementsByTagName('c'))) {
      const idx = colIndex(c.getAttribute('r'));
      const t = c.getAttribute('t');
      let val = '';
      if (t === 'inlineStr') val = textOf(c);
      else {
        const v = c.getElementsByTagName('v')[0];
        const raw = v ? v.textContent || '' : '';
        if (t === 's') val = shared[parseInt(raw, 10)] ?? '';
        else if (t === 'b') val = raw === '1' ? 'TRUE' : 'FALSE';
        else val = raw;
      }
      arr[idx] = String(val).trim();
    }
    for (let i = 0; i < arr.length; i++) if (arr[i] === undefined) arr[i] = '';
    if (arr.some((x) => x !== '')) rows.push(arr);
  }
  return rows;
}

/* CSV لمصفوفات (يدعم , و ; و Tab، وعلامات الاقتباس) */
export function csvRows(text) {
  const s = String(text || '').replace(/^﻿/, '');
  const first = s.split(/\r?\n/, 1)[0] || '';
  const count = (ch) => first.split(ch).length - 1;
  const delim = count('\t') > count(',') && count('\t') > count(';') ? '\t' : count(';') > count(',') ? ';' : ',';
  const rows = [];
  let row = [], cell = '', q = false;
  for (let i = 0; i < s.length; i++) {
    const c = s[i];
    if (q) {
      if (c === '"' && s[i + 1] === '"') { cell += '"'; i++; } else if (c === '"') q = false; else cell += c;
    } else if (c === '"') q = true;
    else if (c === delim) { row.push(cell.trim()); cell = ''; }
    else if (c === '\n' || c === '\r') {
      if (c === '\r' && s[i + 1] === '\n') i++;
      row.push(cell.trim()); cell = '';
      if (row.some((x) => x !== '')) rows.push(row);
      row = [];
    } else cell += c;
  }
  row.push(cell.trim());
  if (row.some((x) => x !== '')) rows.push(row);
  return rows;
}

/* يقرأ ملف المستخدم (xlsx أو csv) ويرجع مصفوفة صفوف */
export async function readTableFile(file) {
  if (file.size > 5 * 1024 * 1024) throw new Error('الملف أكبر من 5 ميجا');
  const buf = await file.arrayBuffer();
  const head = new Uint8Array(buf.slice(0, 4));
  if (head[0] === 0x50 && head[1] === 0x4b) return readXlsxRows(buf);
  if (head[0] === 0xd0 && head[1] === 0xcf) throw new Error('ده ملف Excel قديم (.xls). افتحه واحفظه كـ .xlsx أو CSV وجرّب تاني');
  let text;
  try { text = new TextDecoder('utf-8', { fatal: true }).decode(buf); } catch { text = new TextDecoder('windows-1256').decode(buf); }
  return csvRows(text);
}
