-- Read-only operational checks. Run as postgres in Supabase SQL Editor.
-- No addresses, user IDs, message bodies, secrets, or cron command text returned.
begin read only;
select q.state, count(*) as total,
       min(q.created_at) as oldest_created_at, max(q.sent_at) as latest_sent_at
from peakguide_private.welcome_email_queue q group by q.state order by q.state;

select count(*) filter (where u.email_confirmed_at is null) as awaiting_confirmation,
       count(*) filter (where u.email_confirmed_at is not null and q.available_at <= now()
                        and q.attempts < 3) as eligible_now,
       min(q.available_at) filter (where u.email_confirmed_at is not null
                        and q.available_at <= now() and q.attempts < 3) as oldest_eligible_at
from peakguide_private.welcome_email_queue q
join auth.users u on u.id=q.user_id where q.state='pending';

select count(*) as expired_processing_leases
from peakguide_private.welcome_email_queue
where state='processing' and claimed_at < now()-interval '5 minutes';

select jobid, jobname, schedule, active from cron.job
where jobname ilike '%welcome%' or command ilike '%welcome%';

select d.jobid, d.status, d.start_time, d.end_time
from cron.job_run_details d join cron.job j using(jobid)
where j.jobname ilike '%welcome%' or j.command ilike '%welcome%'
order by d.start_time desc limit 20;
commit;
