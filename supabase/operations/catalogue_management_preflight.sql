-- Read-only schema/access report. Does not expose secrets or user records.
begin read only;
select table_name,column_name,data_type,udt_schema,udt_name,is_nullable,column_default
from information_schema.columns where table_schema='public'
and table_name in ('trails','trails_i18n','pois','pois_i18n','poi_types') order by table_name,ordinal_position;
select c.relname,c.relrowsecurity,c.relforcerowsecurity from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in ('trails','trails_i18n','pois','pois_i18n');
select tablename,policyname,roles,cmd,qual,with_check from pg_policies
where schemaname='public' and tablename in ('trails','trails_i18n','pois','pois_i18n') order by tablename,policyname;
select p.proname,pg_get_function_identity_arguments(p.oid) as arguments,p.prosecdef,
 has_function_privilege('anon',p.oid,'execute') as anon_execute,
 has_function_privilege('authenticated',p.oid,'execute') as authenticated_execute
from pg_proc p join pg_namespace n on n.oid=p.pronamespace
where n.nspname='public' and p.proname in ('admin_save_trail','admin_save_poi');
select e.extname,e.extversion,n.nspname as extension_schema from pg_extension e join pg_namespace n on n.oid=e.extnamespace where e.extname='postgis';
select t.relname as table_name,c.conname,pg_get_constraintdef(c.oid) as definition from pg_constraint c join pg_class t on t.oid=c.conrelid join pg_namespace n on n.oid=t.relnamespace where n.nspname='public' and t.relname in ('trails','trails_i18n','pois','pois_i18n') order by t.relname,c.conname;
commit;
