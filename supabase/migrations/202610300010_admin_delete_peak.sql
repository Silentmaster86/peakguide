begin;

create or replace function public.admin_delete_peak(p_peak_id bigint)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not public.is_peakguide_admin() then
    raise exception 'Admin access required';
  end if;

  delete from public.peaks
  where id = p_peak_id;

  if not found then
    raise exception 'Peak not found';
  end if;
end;
$$;

revoke all on function public.admin_delete_peak(bigint) from public;
revoke all on function public.admin_delete_peak(bigint) from anon;
grant execute on function public.admin_delete_peak(bigint) to authenticated;

commit;