"""Offline generator of a guarded, coordinates-only catalogue correction."""
import argparse,json
from pathlib import Path
root=Path(__file__).resolve().parents[1];folder=root/'docs/catalogue/coordinate-review'
rows=json.loads((folder/'changes.json').read_text());assert {r['before']['id'] for r in rows}=={2,4,23}
for r in rows:
 assert {k for k in r['before'] if r['before'][k]!=r['after'][k]}=={'latitude','longitude','geom'}
def build(reverse=False):
 changes=[{'before':r['after'] if reverse else r['before'],'after':r['before'] if reverse else r['after']} for r in rows]
 return '''-- Reviewed coordinates only; read README.md and take a fresh backup.
begin;
set local lock_timeout='5s';
do $coordinates$
declare change jsonb; actual jsonb; comparable jsonb; changed integer=0;
begin
 perform pg_advisory_xact_lock(251117,100);
 for change in select value from jsonb_array_elements($changes$'''+json.dumps(changes,ensure_ascii=False)+'''$changes$::jsonb) loop
  select to_jsonb(p) into actual from public.peaks p where p.id=(change->'before'->>'id')::bigint for update;
  if actual is null then raise exception 'Reviewed peak missing: %',change->'before'->>'id'; end if;
  select jsonb_object_agg(k,actual->k) into comparable from jsonb_object_keys(change->'before') as keys(k);
  if comparable=change->'after' then continue; end if;
  if comparable is distinct from change->'before' then raise exception 'Reviewed coordinates or identity changed: %',change->'before'->>'slug'; end if;
  update public.peaks set latitude=(change->'after'->>'latitude')::numeric,longitude=(change->'after'->>'longitude')::numeric,
   geom=public.st_setsrid(public.st_makepoint((change->'after'->>'longitude')::double precision,(change->'after'->>'latitude')::double precision),4326)::public.geography
  where id=(change->'before'->>'id')::bigint;
  changed=changed+1;
 end loop;
 raise notice 'Peak coordinate records changed: %',changed;
end $coordinates$;
commit;
'''
parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true');args=parser.parse_args()
for name,reverse in [('apply.sql',False),('rollback.sql',True)]:
 path=folder/name;text=build(reverse)
 if args.check:
  if not path.exists() or path.read_text()!=text:raise SystemExit(f'Regenerate {path}')
 else:path.write_text(text)
print('Checked' if args.check else 'Generated','three coordinate corrections')
