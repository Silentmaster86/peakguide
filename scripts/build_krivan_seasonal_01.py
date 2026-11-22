"""Owner-only correction of one access card; no route/GPX changes."""
import argparse,hashlib,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];F=ROOT/'docs/catalogue/krivan-seasonal-01'
READ="""
 select jsonb_build_object('row',to_jsonb(a),'i18n',(select jsonb_agg(to_jsonb(i) order by lang collate "C") from public.trail_access_i18n i where i.access_id=a.id)) into actual from public.trail_access a where a.id=target_id;
"""
def generate(c):
 assert c['trail']=={'id':10,'slug':'krivan-tri-studnicky-loop','peak_id':150,'peak_slug':'krivan'}
 assert c['before']['row']['id']==6 and c['before']['row']['trail_id']==10
 assert {t['lang'] for t in c['before']['i18n']}==set(c['after']['warnings'])=={'pl','en','ua','zh'}
 assert all(s['status']==200 for s in c['sources'])
 payload=json.dumps(c,ensure_ascii=True,separators=(',',':'));sha=hashlib.sha256(payload.encode()).hexdigest();assert '$change$' not in payload
 h="""-- ASCII-only. Read README.md. Never changes trails, geometry or parking.
begin;
set local timezone='UTC';
set local lock_timeout='5s';
do $patch$
declare change jsonb=$change$PAYLOAD$change$::jsonb; receipt jsonb; actual jsonb; expected jsonb; previous jsonb; result jsonb; txt jsonb;
 target_id bigint;
begin
 if current_user in ('anon','authenticated') then raise exception 'Owner execution required'; end if;
 perform pg_advisory_xact_lock(261122,2);
 lock table public.trail_access,public.trail_access_i18n in share row exclusive mode;
 if not exists(select from pg_class where oid='public.trail_access'::regclass and relrowsecurity) or not exists(select from pg_class where oid='public.trail_access_i18n'::regclass and relrowsecurity) then raise exception 'Practical RLS missing'; end if;
 target_id=(change->'before'->'row'->>'id')::bigint;
 if (select count(*) from public.trail_access where trail_id=10)<>1 then raise exception 'Unexpected access card count'; end if;
 perform 1 from public.trails t join public.peaks p on p.id=t.peak_id where t.id=10 and t.slug='krivan-tri-studnicky-loop' and t.peak_id=150 and t.active and p.slug='krivan' and p.active for update of t,p;
 if not found then raise exception 'Krivan route identity changed'; end if;
 select snapshot into receipt from peakguide_private.catalogue_batch_receipts where batch_key='krivan-seasonal-01' for update;
""".replace('PAYLOAD',payload)+READ
 check="""
 if receipt->>'manifest_sha256'<>'HASH' or receipt->>'version'<>'1' then raise exception 'Different seasonal receipt'; end if;
 if actual is distinct from receipt->'after' then raise exception 'Seasonal card changed since patch'; end if;
""".replace('HASH',sha)
 expected="""
 select jsonb_build_object('row',to_jsonb(jsonb_populate_record(null::public.trail_access,change->'before'->'row')),
 'i18n',(select jsonb_agg(to_jsonb(jsonb_populate_record(null::public.trail_access_i18n,t)) order by (t->>'lang') collate "C") from jsonb_array_elements(change->'before'->'i18n') t)) into expected;
 if actual is distinct from expected then raise exception 'Reviewed access card changed'; end if;
 previous=actual;
 select jsonb_build_object('row',to_jsonb(jsonb_populate_record(null::public.trail_access,(expected->'row')||jsonb_build_object('source_url',change->'after'->>'source_url','last_verified_at',change->'after'->>'last_verified_at'))),
  'i18n',(select jsonb_agg(t||jsonb_build_object('warnings',change->'after'->'warnings'->(t->>'lang')) order by (t->>'lang') collate "C") from jsonb_array_elements(expected->'i18n') t)) into result;
 update public.trail_access set source_url=change->'after'->>'source_url',last_verified_at=(change->'after'->>'last_verified_at')::timestamptz where id=target_id;
 for txt in select value from jsonb_array_elements(result->'i18n') loop
  update public.trail_access_i18n set warnings=txt->>'warnings' where access_id=target_id and lang=txt->>'lang';
 end loop;
"""
 apply=h+" if receipt is not null then\n"+check+" raise notice 'Seasonal patch already applied'; return; end if;\n"+expected+READ+"""
 if actual is distinct from result then raise exception 'Unexpected seasonal patch side effect'; end if;
 insert into peakguide_private.catalogue_batch_receipts(batch_key,snapshot)values('krivan-seasonal-01',jsonb_build_object('version',1,'manifest_sha256','HASH','before',previous,'after',actual));
 raise notice 'Updated four Krivan warning texts and their source/date only';
end $patch$;
commit;
"""
 apply=apply.replace('HASH',sha)
 rollback=h+" if receipt is null then raise notice 'Seasonal patch not applied'; return; end if;\n"+check+"""
 update public.trail_access set source_url=receipt->'before'->'row'->>'source_url',last_verified_at=(receipt->'before'->'row'->>'last_verified_at')::timestamptz where id=target_id;
 for txt in select value from jsonb_array_elements(receipt->'before'->'i18n') loop
  update public.trail_access_i18n set warnings=txt->>'warnings' where access_id=target_id and lang=txt->>'lang';
 end loop;
"""+READ+"""
 if actual is distinct from receipt->'before' then raise exception 'Unexpected seasonal rollback side effect'; end if;
 delete from peakguide_private.catalogue_batch_receipts where batch_key='krivan-seasonal-01';
 raise notice 'Restored the reviewed warning/source/date only';
end $patch$;
commit;
"""
 v=json.dumps(c['after']['warnings'],ensure_ascii=True,separators=(',',':'))
 verify="""-- Read-only before/after. No private personal data.
with expected as(select $warnings$"""+v+"""$warnings$::jsonb texts)
select a.id access_id,a.trail_id,i.lang,i.warnings,
 i.warnings=expected.texts->>i.lang warning_matches_review,a.source_url,a.last_verified_at,
 exists(select from peakguide_private.catalogue_batch_receipts where batch_key='krivan-seasonal-01') patch_applied
from public.trail_access a join public.trail_access_i18n i on i.access_id=a.id cross join expected
where a.trail_id=10 order by i.lang collate "C";
"""
 return {'apply.sql':apply,'rollback.sql':rollback,'verify.sql':verify}
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--check',action='store_true');a=p.parse_args();c=json.loads((F/'change.json').read_text(encoding='utf-8'))
 for name,s in generate(c).items():
  assert s.isascii()
  if a.check:assert (F/name).read_text(encoding='ascii')==s,name
  else:(F/name).write_text(s,encoding='ascii')
 print('Krivan seasonal warning: four languages, typed guards, ASCII SQL reproducible')
