-- مخزون لكل مقاس/لون: خصم وإرجاع آمن (بيقفل صف المنتج أثناء التعديل)
-- شغّله مرة واحدة في Supabase → SQL Editor (آمن لو اتشغّل أكتر من مرة)
create or replace function public.take_option_stock(p_product text, p_group text, p_value text, p_qty int)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  v jsonb;
  i int;
  cur int;
begin
  select variants into v from public.products where id::text = p_product for update;
  if v is null or jsonb_typeof(v) <> 'array' then return true; end if;
  for i in 0 .. jsonb_array_length(v) - 1 loop
    if (v -> i ->> 'name') = p_group and jsonb_typeof(v -> i -> 'stock') = 'object' and (v -> i -> 'stock') ? p_value then
      cur := coalesce((v -> i -> 'stock' ->> p_value)::int, 0);
      if p_qty > 0 and cur < p_qty then return false; end if;
      v := jsonb_set(v, array[i::text, 'stock', p_value], to_jsonb(greatest(cur - p_qty, 0)));
      update public.products set variants = v where id::text = p_product;
      return true;
    end if;
  end loop;
  return true;
end;
$$;
revoke all on function public.take_option_stock(text, text, text, int) from public, anon, authenticated;
grant execute on function public.take_option_stock(text, text, text, int) to service_role;
