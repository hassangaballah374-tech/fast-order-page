-- ربط الدومين الخاص بالمتجر: دومين واحد لكل متجر، والدومين نفسه فريد على مستوى المنصة
-- شغّله مرة واحدة في Supabase → SQL Editor (آمن لو اتشغّل أكتر من مرة)
create table if not exists public.store_domains (
  domain     text primary key,
  store_id   uuid not null unique,
  slug       text not null,
  status     text not null default 'pending',   -- pending | active | manual
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
alter table public.store_domains enable row level security;
-- مفيش سياسات عمداً: الجدول بيتقرأ ويتكتب من السيرفر فقط (service role)
revoke all on public.store_domains from anon, authenticated;
