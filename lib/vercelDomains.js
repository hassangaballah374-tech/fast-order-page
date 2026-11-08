/* ربط الدومينات بمشروع Vercel عبر الـ API. المفاتيح من متغيرات البيئة: VERCEL_API_TOKEN / VERCEL_PROJECT_ID / (اختياري) VERCEL_TEAM_ID */
const API = 'https://api.vercel.com';

export const vercelReady = () => !!(process.env.VERCEL_API_TOKEN && process.env.VERCEL_PROJECT_ID);

const qs = () => (process.env.VERCEL_TEAM_ID ? `?teamId=${encodeURIComponent(process.env.VERCEL_TEAM_ID)}` : '');
const qs2 = (extra) => (process.env.VERCEL_TEAM_ID ? `?teamId=${encodeURIComponent(process.env.VERCEL_TEAM_ID)}&${extra}` : `?${extra}`);

async function call(method, path, body) {
  const res = await fetch(`${API}${path}`, {
    method,
    headers: { Authorization: `Bearer ${process.env.VERCEL_API_TOKEN}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
    signal: AbortSignal.timeout(12000),
  });
  const json = await res.json().catch(() => ({}));
  return { status: res.status, json };
}

const pid = () => encodeURIComponent(process.env.VERCEL_PROJECT_ID);

export async function addDomain(domain) {
  const r = await call('POST', `/v10/projects/${pid()}/domains${qs()}`, { name: domain });
  const code = r.json?.error?.code || '';
  if (r.status === 200 || r.status === 201) return { ok: true, verified: !!r.json.verified, verification: r.json.verification || [] };
  if (code === 'domain_already_in_use' || code === 'domain_already_exists') {
    return { ok: false, error: 'الدومين ده مربوط بمشروع تاني على Vercel. شيله من هناك الأول أو استخدم دومين تاني.' };
  }
  if (r.status === 401 || r.status === 403) return { ok: false, error: 'مفتاح Vercel غير صالح أو صلاحياته ناقصة', fatal: true };
  return { ok: false, error: r.json?.error?.message || `تعذر إضافة الدومين (${r.status})` };
}

export async function domainState(domain) {
  const d = encodeURIComponent(domain);
  const [p, c] = await Promise.all([
    call('GET', `/v9/projects/${pid()}/domains/${d}${qs()}`),
    call('GET', `/v6/domains/${d}/config${qs()}`),
  ]);
  if (p.status === 404) return { found: false };
  return {
    found: true,
    verified: !!p.json.verified,
    verification: p.json.verification || [],
    misconfigured: c.status === 200 ? !!c.json.misconfigured : true,
  };
}

export async function verifyDomain(domain) {
  const r = await call('POST', `/v9/projects/${pid()}/domains/${encodeURIComponent(domain)}/verify${qs()}`);
  return { ok: r.status === 200, verified: !!r.json.verified };
}

export async function removeDomain(domain) {
  const r = await call('DELETE', `/v9/projects/${pid()}/domains/${encodeURIComponent(domain)}${qs()}`);
  return { ok: r.status === 200 || r.status === 404 };
}

/* سجلات DNS اللي التاجر يضيفها عند مزوّد الدومين */
const SLD = new Set(['com', 'co', 'org', 'net', 'gov', 'edu', 'ac']);
export function isApex(domain) {
  const p = String(domain).split('.');
  return p.length === 2 || (p.length === 3 && SLD.has(p[1]) && p[2].length === 2);
}
export function dnsRecords(domain) {
  return isApex(domain)
    ? [{ type: 'A', name: '@', value: '76.76.21.21' }]
    : [{ type: 'CNAME', name: String(domain).split('.')[0], value: 'cname.vercel-dns.com' }];
}
