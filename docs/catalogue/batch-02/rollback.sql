-- Apply migration 014 first. Reviewed sources: README.md.
-- Atomic import; refuses existing conflicting records. Run as project owner.
begin;
set local lock_timeout='5s';
create schema if not exists peakguide_private;
create table if not exists peakguide_private.catalogue_batch_receipts(batch_key text primary key,snapshot jsonb not null,created_at timestamptz not null default now());
alter table peakguide_private.catalogue_batch_receipts enable row level security;
revoke all on peakguide_private.catalogue_batch_receipts from public,anon,authenticated;
do $batch$
declare entry jsonb; body jsonb; peak bigint; saved_id bigint; snapshot jsonb='[]'; receipt jsonb; actual jsonb;
 trail public.trails%rowtype; poi public.pois%rowtype; lang text; tr jsonb;
begin
 if to_regprocedure('public.admin_save_trail(bigint,jsonb,timestamptz)') is null then raise exception 'Apply migration 014 first'; end if;
 perform pg_advisory_xact_lock(251115,2);
 select r.snapshot into receipt from peakguide_private.catalogue_batch_receipts r where batch_key='kgp-02';
 if receipt is null then raise notice 'Batch not applied'; return; end if;

 for entry in select value from jsonb_array_elements(receipt) loop
  if entry->>'kind'='trail' then
   select jsonb_build_object('row',to_jsonb(t),'i18n',coalesce((select jsonb_agg(to_jsonb(i) order by i.lang) from public.trails_i18n i where trail_id=t.id),'[]')) into actual from public.trails t where id=(entry->>'id')::bigint for update of t;
  else
   select jsonb_build_object('row',to_jsonb(p),'i18n',coalesce((select jsonb_agg(to_jsonb(i) order by i.lang) from public.pois_i18n i where poi_id=p.id),'[]')) into actual from public.pois p where id=(entry->>'id')::bigint for update of p;
  end if;
  if actual is distinct from entry->'snapshot' then raise exception 'Imported record changed: % %',entry->>'kind',entry->>'id'; end if;
 end loop;

 for entry in select value from jsonb_array_elements(receipt) loop
  if entry->>'kind'='poi' then delete from public.pois_i18n where poi_id=(entry->>'id')::bigint; delete from public.pois where id=(entry->>'id')::bigint; end if;
 end loop;
 for entry in select value from jsonb_array_elements(receipt) loop
  if entry->>'kind'='trail' then delete from public.trails_i18n where trail_id=(entry->>'id')::bigint; delete from public.trails where id=(entry->>'id')::bigint; end if;
 end loop;
 delete from peakguide_private.catalogue_batch_receipts where batch_key='kgp-02';
end $batch$;
commit;
