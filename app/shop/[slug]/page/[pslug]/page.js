import React from 'react';
import { notFound } from 'next/navigation';
import { loadStore, getPages } from '../../../../../lib/storeData';

export const dynamic = 'force-dynamic';

const decode = (s) => { try { return decodeURIComponent(s); } catch { return String(s || ''); } };

export async function generateMetadata({ params }) {
  const ctx = await loadStore(params.slug);
  if (!ctx) return {};
  const pages = await getPages(ctx.sb, ctx.sid);
  const p = pages.find((x) => x.slug === decode(params.pslug));
  return p ? { title: p.title } : {};
}

export default async function CustomPage({ params }) {
  const ctx = await loadStore(params.slug);
  if (!ctx) notFound();
  const pages = await getPages(ctx.sb, ctx.sid);
  const p = pages.find((x) => x.slug === decode(params.pslug));
  if (!p) notFound();
  const paras = String(p.content || '').split(/\n\s*\n/).map((x) => x.trim()).filter(Boolean);
  return (
    <section className="wrap sec" style={{ maxWidth: 780 }}>
      <div className="sh"><h2>{p.title}</h2></div>
      <div className="card">
        {paras.length ? paras.map((t, i) => <p key={i} className="desc" style={{ marginBottom: 14 }}>{t}</p>) : <p className="mut">لا يوجد محتوى بعد.</p>}
      </div>
    </section>
  );
}
