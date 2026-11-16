-- حد معدّل الطلبات المشترك بين كل نسخ السيرفر (بدل العدّاد اللي في ذاكرة كل نسخة).
-- شغّله مرة واحدة في Supabase ← SQL Editor.
drop function if exists public.rl_hit(text, int, int);
drop table if exists public.rate_hits;
create table public.rate_hits (
  k text not null,
  win bigint not null,
  n int not null default 0,
  exp timestamptz not null,
  primary key (k, win)
);
create index rate_hits_exp_idx on public.rate_hits (exp);
alter table public.rate_hits enable row level security;
revoke all on public.rate_hits from anon, authenticated;

create or replace function public.rl_hit(p_key text, p_window_s int, p_max int)
returns boolean language plpgsql security definer set search_path = public as $$
declare ws int := greatest(p_window_s, 1); w bigint; c int;
begin
  w := floor(extract(epoch from now()) / ws);
  insert into public.rate_hits (k, win, n, exp) values (left(p_key, 200), w, 1, to_timestamp((w + 1) * ws))
  on conflict (k, win) do update set n = public.rate_hits.n + 1
  returning n into c;
  if random() < 0.01 then
    delete from public.rate_hits where exp < now() - interval '1 minute';
  end if;
  return c <= p_max;
end;
$$;
revoke all on function public.rl_hit(text, int, int) from public, anon, authenticated;
grant execute on function public.rl_hit(text, int, int) to service_role;
