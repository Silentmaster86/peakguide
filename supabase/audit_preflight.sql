-- Read-only inventory. Run in the SQL editor on staging and retain the output
-- privately. This file does not establish that policies are secure.
select extname, nspname as extension_schema
from pg_extension join pg_namespace on pg_namespace.oid = extnamespace
where extname = 'postgis';

select table_name, column_name, data_type, udt_schema, udt_name, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name in
  ('peaks','peaks_i18n','subranges','profiles','contact_messages','trail_access','trail_parking')
order by table_name, ordinal_position;

select tablename, policyname, roles, cmd, qual, with_check
from pg_policies where schemaname = 'public' order by tablename, policyname;

select relname, relrowsecurity, relforcerowsecurity
from pg_class join pg_namespace n on n.oid = relnamespace
where n.nspname = 'public' and relkind = 'r' order by relname;

select routine_name, grantee, privilege_type from information_schema.routine_privileges
where routine_schema = 'public' and routine_name in
  ('is_peakguide_admin', 'admin_save_peak', 'admin_delete_peak');

select conrelid::regclass as source_table, conname, pg_get_constraintdef(oid) as definition
from pg_constraint where contype = 'f' and connamespace = 'public'::regnamespace;

select event_object_table, trigger_name, action_timing, event_manipulation
from information_schema.triggers where trigger_schema = 'public';
