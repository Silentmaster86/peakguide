"""Compose existing guarded imports, preserving their receipts and atomicity."""
import argparse,json
from pathlib import Path
parser=argparse.ArgumentParser();parser.add_argument('--check',action='store_true');args=parser.parse_args()
root=Path(__file__).resolve().parents[1];base=root/'docs/catalogue';out=base/'twenty-peaks';out.mkdir(exist_ok=True)
records={b:json.loads((base/f'batch-{b}/records.json').read_text()) for b in ['02','03']}
def compose(name,batches):
 parts=['-- Combined 20-peak package. Read README.md before applying.','begin;']
 for batch in batches:
  parts.append(f'-- Component kgp-{batch}; independent unchanged-record receipt.')
  parts.extend(l for l in (base/f'batch-{batch}/{name}').read_text().splitlines() if l not in ['begin;','commit;'])
 return '\n'.join(parts+['commit;',''])
def verify(rows,label):
 def strings(xs):return ','.join("'"+x.replace("'","''")+"'" for x in xs)
 peaks=strings([r['body']['peak_slug'] for r in rows if r['kind']=='trail']);trails=strings([r['body']['slug'] for r in rows if r['kind']=='trail']);sources=strings([r['body']['source_url'] for r in rows if r['kind']=='poi'])
 return f'''-- Read-only. Run before importing and after importing. No secret values.
select jsonb_build_object(
 'peaks',(select jsonb_agg(to_jsonb(x)) from (
  select p.id,p.slug,p.active,count(distinct t.id) as trails,
   count(distinct t.id) filter(where t.route_geometry is not null) as mapped_trails,
   count(distinct o.id) as pois
  from public.peaks p left join public.trails t on t.peak_id=p.id left join public.pois o on o.peak_id=p.id
  where p.slug in ({peaks}) group by p.id,p.slug,p.active order by p.id
 ) x),
 'package_trails',(select jsonb_agg(to_jsonb(x)) from (
  select t.slug,t.active,t.distance_km,t.elevation_gain_m,t.time_min,
   t.route_geometry is not null as has_geometry,t.gpx_url,
   array_agg(i.lang order by i.lang) as languages
  from public.trails t join public.trails_i18n i on i.trail_id=t.id
  where t.slug in ({trails}) group by t.id order by t.slug
 ) x),
 'package_pois',(select jsonb_agg(to_jsonb(x)) from (
  select o.peak_id,o.source_url,o.active,array_agg(i.lang order by i.lang) as languages
  from public.pois o join public.pois_i18n i on i.poi_id=o.id
  join public.peaks p on p.id=o.peak_id
  where p.slug in ({peaks}) and o.source_url in ({sources})
  group by o.id order by o.peak_id
 ) x)
) as {label};
'''
outputs={out/'apply.sql':compose('apply.sql',['02','03']),out/'rollback.sql':compose('rollback.sql',['03','02']),out/'verify.sql':verify(records['02']+records['03'],'catalogue_twenty_verification'),base/'batch-03/verify.sql':verify(records['03'],'catalogue_batch03_verification')}
for path,text in outputs.items():
 if args.check:
  if not path.exists() or path.read_text()!=text:raise SystemExit(f'Regenerate {path.relative_to(root)}')
 else:path.write_text(text)
print('Checked' if args.check else 'Generated','20-peak bundle')
