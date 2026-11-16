-- سجل حالات الطلب: كل تغيير حالة بيتسجل بوقته، وبيظهر للعميل في صفحة التتبع.
-- شغّله مرة واحدة في Supabase ← SQL Editor.
create table if not exists public.order_status_log (
  id bigint generated always as identity primary key,
  store_id text not null,
  order_no bigint not null,
  status text not null,
  at timestamptz not null default now()
);
create index if not exists order_status_log_idx on public.order_status_log (store_id, order_no, at);
alter table public.order_status_log enable row level security;
-- مفيش سياسات = لا قراءة ولا كتابة من المتصفح؛ بنقرأه من السيرفر (service role) بس.

create or replace function public.log_order_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.status is distinct from old.status then
    insert into public.order_status_log (store_id, order_no, status) values (new.store_id::text, new.order_no, coalesce(new.status, 'pending'));
  end if;
  return new;
end;
$$;

drop trigger if exists trg_order_status_log on public.orders;
create trigger trg_order_status_log
  after insert or update of status on public.orders
  for each row execute function public.log_order_status();

-- الطلبات القديمة: نسجّل حالتها الحالية بوقت آخر تحديث (مرة واحدة)
insert into public.order_status_log (store_id, order_no, status, at)
select o.store_id::text, o.order_no, coalesce(o.status, 'pending'), coalesce(o.updated_at, o.created_at)
from public.orders o
where not exists (select 1 from public.order_status_log l where l.store_id = o.store_id::text and l.order_no = o.order_no);
