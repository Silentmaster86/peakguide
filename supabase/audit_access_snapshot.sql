-- Read-only metadata only. No account rows, passwords or changes.
-- Run as project owner in Supabase SQL Editor; returns one result cell.
with target_tables as (
 select c.oid, c.relname, c.relrowsecurity, c.relforcerowsecurity,
        pg_get_userbyid(c.relowner) as owner
 from pg_class c join pg_namespace n on n.oid=c.relnamespace
 where n.nspname='public' and c.relkind in ('r','p')
   and c.relname in ('profiles','peaks','peaks_i18n','mountain_ranges','subranges')
), api_roles as (
 select oid,rolname,rolsuper,rolbypassrls from pg_roles where rolname in ('anon','authenticated')
)
select jsonb_pretty(jsonb_build_object(
 'tables', (select jsonb_agg(to_jsonb(t)) from target_tables t),
 'columns', (
  select jsonb_agg(jsonb_build_object(
   'table',t.relname,'name',a.attname,'type',format_type(a.atttypid,a.atttypmod),
   'not_null',a.attnotnull,'identity',a.attidentity,'generated',a.attgenerated,
   'default',pg_get_expr(d.adbin,d.adrelid)
  ) order by t.relname,a.attnum)
  from target_tables t join pg_attribute a on a.attrelid=t.oid
  left join pg_attrdef d on d.adrelid=t.oid and d.adnum=a.attnum
  where a.attnum>0 and not a.attisdropped
 ),
 'constraints', (
  select jsonb_agg(jsonb_build_object('table',t.relname,'name',c.conname,
     'definition',pg_get_constraintdef(c.oid),'validated',c.convalidated))
  from pg_constraint c join target_tables t on t.oid=c.conrelid
 ),
 'indexes', (
  select jsonb_agg(jsonb_build_object('table',t.relname,'definition',pg_get_indexdef(i.indexrelid)))
  from pg_index i join target_tables t on t.oid=i.indrelid
 ),
 'policies', (
  select jsonb_agg(to_jsonb(p)) from pg_policies p
  where p.schemaname='public' and p.tablename in (select relname from target_tables)
 ),
 'effective_table_privileges', (
  select jsonb_agg(jsonb_build_object('role',r.rolname,'table',t.relname,
   'superuser',r.rolsuper,'bypass_rls',r.rolbypassrls,
   'schema_usage',has_schema_privilege(r.oid,'public','USAGE'),
   'select',has_table_privilege(r.oid,t.oid,'SELECT'),
   'insert',has_table_privilege(r.oid,t.oid,'INSERT'),
   'update',has_table_privilege(r.oid,t.oid,'UPDATE'),
   'delete',has_table_privilege(r.oid,t.oid,'DELETE')))
  from api_roles r cross join target_tables t
 ),
 'effective_column_privileges', (
  select jsonb_agg(jsonb_build_object('role',r.rolname,'table',t.relname,'column',a.attname,
   'select',has_column_privilege(r.oid,t.oid,a.attnum,'SELECT'),
   'insert',has_column_privilege(r.oid,t.oid,a.attnum,'INSERT'),
   'update',has_column_privilege(r.oid,t.oid,a.attnum,'UPDATE')))
  from api_roles r cross join target_tables t join pg_attribute a on a.attrelid=t.oid
  where a.attnum>0 and not a.attisdropped
 ),
 'peak_sequence', (
  select jsonb_agg(jsonb_build_object('role',r.rolname,
   'name',pg_get_serial_sequence('public.peaks','id'),
   'usage',has_sequence_privilege(r.oid,pg_get_serial_sequence('public.peaks','id'),'USAGE')))
  from api_roles r
 ),
 'functions', (
  select jsonb_agg(jsonb_build_object('name',p.oid::regprocedure::text,
   'owner',pg_get_userbyid(p.proowner),'security_definer',p.prosecdef,
   'settings',p.proconfig,'role',r.rolname,'execute',has_function_privilege(r.oid,p.oid,'EXECUTE')))
  from pg_proc p join pg_namespace n on n.oid=p.pronamespace cross join api_roles r
  where n.nspname='public' and p.proname in
   ('is_peakguide_admin','protect_peakguide_admin','handle_new_user','set_peak_geom','admin_save_peak','admin_delete_peak')
 )
)) as audit_access_snapshot;
