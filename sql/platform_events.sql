-- سجل أحداث المنصة (أخطاء الطلبات، فشل الـ webhooks، أخطاء الذكاء الاصطناعي...) للأدمن فقط.
-- شغّله مرة واحدة في Supabase ← SQL Editor.
create table if not exists public.platform_events (
  id bigint generated always as identity primary key,
  at timestamptz not null default now(),
  level text not null default 'error' check (level in ('error', 'warn', 'info')),
  source text not null,
  message text not null default '',
  store_id text,
  meta jsonb not null default '{}'::jsonb
);
create index if not exists platform_events_at_idx on public.platform_events (at desc);
create index if not exists platform_events_src_idx on public.platform_events (source, at desc);
alter table public.platform_events enable row level security;
revoke all on public.platform_events from anon, authenticated;
-- مفيش سياسات: الكتابة والقراءة من السيرفر (service role) بس.
