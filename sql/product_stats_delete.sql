-- يسمح للتاجر (والأدمن) بحذف إحصائيات المنتجات من تاريخ لتاريخ + قراءة الأدمن
grant select, delete on public.store_product_stats to authenticated;
drop policy if exists store_product_stats_owner_del on public.store_product_stats;
create policy store_product_stats_owner_del on public.store_product_stats for delete to authenticated using (store_id = auth.uid()::text);
drop policy if exists store_product_stats_admin on public.store_product_stats;
create policy store_product_stats_admin on public.store_product_stats for all to authenticated using (is_spike_admin()) with check (is_spike_admin());
