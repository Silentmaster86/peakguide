"""Generate an offline, reversible unpublishing patch; never connect to production."""
import argparse,json
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1];DIR=ROOT/'docs/catalogue/lysica-review'
def build(reverse=False):
 data=json.loads((DIR/'change.json').read_text());before,after=data['before'],data['after']
 assert before['id']==83 and before['slug']=='lysica-skarpowa' and before['is_korona'] is False
 assert before['active'] is True and after=={**before,'active':False}
 if reverse:before,after=after,before
 payload=json.dumps({'before':before,'after':after,'translations':data['translations']},ensure_ascii=False)
 return '''-- Reviewed unverified record; read README.md and take a fresh backup first.
-- Only toggles peaks.active for id 83. No deletion or reassignment.
begin;
set local lock_timeout='5s';
do $review$
declare
 payload jsonb=$payload$'''+payload+'''$payload$::jsonb;
 actual jsonb; comparable jsonb; texts jsonb;
begin
 perform pg_advisory_xact_lock(251117,83);
 -- Anchor both identities and prevent concurrent changes during this patch.
 perform 1 from public.mountain_ranges where id=28 and slug='gory-swietokrzyskie' for update;
 if not found then raise exception 'Range identity changed; review required'; end if;
 perform 1 from public.peaks where id=28 and slug='lysica' and range_id=28 and active=true and is_korona=true for update;
 if not found then raise exception 'Main Lysica identity changed; review required'; end if;
 select to_jsonb(p) into actual from public.peaks p where id=83 for update;
 if actual is null then raise exception 'Missing reviewed peak 83'; end if;
 select jsonb_object_agg(k,actual->k) into comparable from jsonb_object_keys(payload->'before') as keys(k);
 if comparable is distinct from payload->'before' and comparable is distinct from payload->'after' then
  raise exception 'Reviewed peak changed; review required';
 end if;
 perform 1 from public.peaks_i18n where peak_id=83 order by lang for update;
 select coalesce(jsonb_agg(to_jsonb(t) order by t.lang),'[]'::jsonb) into texts from public.peaks_i18n t where peak_id=83;
 if texts is distinct from payload->'translations' then raise exception 'Reviewed translations changed; review required'; end if;
 -- No existing trail/POI should silently become hidden with this record.
 if exists(select from public.trails where peak_id=83) or exists(select from public.pois where peak_id=83) then
  raise exception 'Reviewed peak now has linked trails or POIs; review required';
 end if;
 if comparable=payload->'after' then raise notice 'Already in the requested state; nothing changed'; return; end if;
 update public.peaks set active=(payload->'after'->>'active')::boolean where id=83;
 raise notice 'Reviewed peak 83 active=%; all records retained',payload->'after'->>'active';
end $review$;
commit;
'''
if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true');args=parser.parse_args()
 for name,reverse in [('apply.sql',False),('rollback.sql',True)]:
  path=DIR/name;text=build(reverse)
  if args.check:
   if not path.exists() or path.read_text()!=text:raise SystemExit(f'Regenerate {path.relative_to(ROOT)}')
  else:path.write_text(text)
 print('Checked' if args.check else 'Generated','guarded Lysica review')
