-- Run AFTER deploying welcome-email and setting its secrets.
-- Enable pg_cron and pg_net in the Supabase dashboard first.
-- Store these two values in Supabase Vault (never commit the worker secret):
-- peakguide_project_url: your https://PROJECT_REF.supabase.co
-- peakguide_welcome_worker_secret: same random value as WELCOME_WORKER_SECRET
do $$
begin
 if not exists(select 1 from vault.decrypted_secrets where name='peakguide_project_url')
 or not exists(select 1 from vault.decrypted_secrets where name='peakguide_welcome_worker_secret' and length(decrypted_secret)>=32) then
  raise exception 'Configure the project URL and worker secret in Vault first';
 end if;
end $$;

select cron.schedule('peakguide-welcome-email','*/5 * * * *', $job$
 select net.http_post(
  url := (select decrypted_secret from vault.decrypted_secrets where name='peakguide_project_url') || '/functions/v1/welcome-email',
  headers := jsonb_build_object(
   'Content-Type','application/json',
   'x-welcome-secret',(select decrypted_secret from vault.decrypted_secrets where name='peakguide_welcome_worker_secret')
  ),
  body := '{}'::jsonb,
  timeout_milliseconds := 60000
 );
$job$);
