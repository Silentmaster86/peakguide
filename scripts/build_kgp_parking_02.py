"""Generate additive parking SQL; existing practical cards and receipts are immutable."""
import argparse
import hashlib
import json
from pathlib import Path
from build_kgp_practical_01 import HEADER, SCHEMA, READ, IDENTITY

ROOT=Path(__file__).resolve().parents[1]
FOLDER=ROOT/'docs/catalogue/kgp-parking-02'
LANGS={'pl','en','ua','zh'}

def load():
 rows=json.loads((FOLDER/'records.json').read_text(encoding='utf-8'))
 unresolved=json.loads((FOLDER/'unresolved.json').read_text(encoding='utf-8'))
 original=json.loads((ROOT/'docs/catalogue/kgp-practical-01/records.json').read_text(encoding='utf-8'))
 targets={r['peak_slug'] for r in original if not r['parking']}
 assert len(rows)==16 and len(unresolved)==3
 assert {r['peak_slug'] for r in rows}.isdisjoint({r['peak_slug'] for r in unresolved})
 assert {r['peak_slug'] for r in rows+unresolved}==targets
 assert len({r['expected_trail']['id'] for r in rows})==16
 for r in rows:
  p=r['parking'];assert set(p['i18n'])==LANGS and r['before']['parking']==[] and len(r['before']['access'])==1
  assert p['row']['active'] is True
  assert all(p['row'][k] is None for k in ['capacity','toilets','overnight_allowed','latitude','longitude'])
  assert p['row']['source_url'] in {e['resolved_url'] for e in r['evidence']}
  assert all(e['status']==200 for e in r['evidence'])
  if r['evidence_level']=='route_reports':assert p['row']['paid'] is None
  for t in p['i18n'].values():
   assert all(isinstance(t[k],str) and t[k].strip() for k in ['name','description','notes','fee_info'])
   assert not any(bad in ''.join(v for v in t.values() if v) for bad in ['BiaÅ','Ð','ä»','ï¼','\ufffd'])
 return rows

NORMALIZE="""
 select jsonb_build_object('access',(select jsonb_agg(jsonb_build_object(
  'row',to_jsonb(jsonb_populate_record(null::public.trail_access,v->'row')),
  'i18n',(select jsonb_agg(to_jsonb(jsonb_populate_record(null::public.trail_access_i18n,i)) order by (i->>'lang') collate "C") from jsonb_array_elements(v->'i18n') i)) order by (v->'row'->>'id')::bigint)
  from jsonb_array_elements(item->'before'->'access') v),'parking','[]'::jsonb) into expected;
"""

def generate(rows):
 payload=json.dumps(rows,ensure_ascii=True,separators=(',',':'));sha=hashlib.sha256(payload.encode()).hexdigest()
 assert '$data$' not in payload and '$practical$' not in payload
 header=HEADER.replace('PAYLOAD',payload).replace("actual jsonb;","actual jsonb; expected jsonb;")+SCHEMA+"\n select snapshot into receipt from peakguide_private.catalogue_batch_receipts where batch_key='kgp-parking-02' for update;\n"
 check="""
 if receipt->>'manifest_sha256'<>'HASH' or receipt->>'version'<>'1'
  or jsonb_typeof(receipt->'records')<>'array' or jsonb_array_length(receipt->'records')<>16
  or (select count(distinct v->>'trail_id') from jsonb_array_elements(receipt->'records') v)<>16 then raise exception 'Different or incomplete parking receipt'; end if;
 for item in select value from jsonb_array_elements(changes) loop
 tid=(item->'expected_trail'->>'id')::bigint;
 select value into entry from jsonb_array_elements(receipt->'records') where (value->>'trail_id')::bigint=tid;
 if entry is null then raise exception 'Missing parking receipt identity'; end if;
"""+IDENTITY+READ+"""
 if actual is distinct from entry->'after' then raise exception 'Parking package records changed: %',tid; end if;
 end loop;
"""
 check=check.replace('HASH',sha)
 apply=header+" if receipt is not null then\n"+check+" raise notice 'Parking package already applied; unchanged'; return; end if;\n for item in select value from jsonb_array_elements(changes) loop\n tid=(item->'expected_trail'->>'id')::bigint;\n"+IDENTITY+READ+NORMALIZE+"""
 -- Includes all active and inactive cards; never overwrite owner changes or drafts.
 if actual is distinct from expected then raise exception 'Reviewed practical baseline changed: %',tid; end if;
 p=item->'parking';
 insert into public.trail_parking(trail_id,slug,address,postcode,latitude,longitude,map_url,source_url,is_primary,paid,toilets,overnight_allowed,capacity,last_verified_at,active)
 select tid,x.slug,x.address,x.postcode,x.latitude,x.longitude,x.map_url,x.source_url,x.is_primary,x.paid,x.toilets,x.overnight_allowed,x.capacity,x.last_verified_at,x.active
 from jsonb_populate_record(null::public.trail_parking,p->'row') x returning id into pid;
 for txt in select jsonb_build_object('lang',key)||value from jsonb_each(p->'i18n') loop
  insert into public.trail_parking_i18n(parking_id,lang,name,description,notes,fee_info,opening_info)
  values(pid,txt->>'lang',txt->>'name',txt->>'description',txt->>'notes',txt->>'fee_info',txt->>'opening_info');
 end loop;
"""+READ+"""
 if actual->'access' is distinct from expected->'access' or jsonb_array_length(actual->'parking')<>1 then raise exception 'Unexpected practical side effect'; end if;
 if (actual->'parking'->0->'row')-array['id','trail_id','created_at','updated_at'] is distinct from
  to_jsonb(jsonb_populate_record(null::public.trail_parking,p->'row'))-array['id','trail_id','created_at','updated_at'] or
  (select jsonb_object_agg(v->>'lang',v-array['lang','parking_id','created_at','updated_at']) from jsonb_array_elements(actual->'parking'->0->'i18n') v) is distinct from p->'i18n' then raise exception 'Unexpected parking content: %',tid; end if;
 result=result||jsonb_build_array(jsonb_build_object('trail_id',tid,'before',expected,'after',actual));
 end loop;
 insert into peakguide_private.catalogue_batch_receipts(batch_key,snapshot)values('kgp-parking-02',jsonb_build_object('version',1,'manifest_sha256','HASH','records',result));
 raise notice 'Added 16 parking cards / 64 translations; three reviewed cases remain unpublished';
end $practical$;
commit;
"""
 apply=apply.replace('HASH',sha)
 rollback=header+" if receipt is null then raise notice 'Parking package not applied'; return; end if;\n"+check+"""
 select array_agg((v->'row'->>'id')::bigint) into ids from jsonb_array_elements(receipt->'records') r,
 lateral jsonb_array_elements(r->'after'->'parking') v;
 for ref in select c.conrelid::regclass relation,a.attname column_name,c.conkey,c.confkey,c.confrelid
 from pg_constraint c join pg_attribute a on a.attrelid=c.conrelid and a.attnum=c.conkey[1]
 where c.contype='f' and c.confrelid='public.trail_parking'::regclass and c.conrelid<>'public.trail_parking_i18n'::regclass loop
  if cardinality(ref.conkey)<>1 or cardinality(ref.confkey)<>1 or (select attname from pg_attribute where attrelid=ref.confrelid and attnum=ref.confkey[1])<>'id' then raise exception 'Complex parking relationship requires rollback review'; end if;
  execute format('select exists(select from %s where %I=any($1))',ref.relation,ref.column_name) into linked using ids;
  if linked then raise exception 'Parking referenced by %; rollback refused',ref.relation; end if;
 end loop;
 if exists(select from pg_constraint where contype='f' and confrelid='public.trail_parking_i18n'::regclass) then raise exception 'Parking translation relationships require rollback review'; end if;
 delete from public.trail_parking_i18n where parking_id=any(ids);
 delete from public.trail_parking where id=any(ids);
 for entry in select value from jsonb_array_elements(receipt->'records') loop
 tid=(entry->>'trail_id')::bigint;
"""+READ+"""
 if actual is distinct from entry->'before' then raise exception 'Parking rollback side effect'; end if;
 end loop;
 delete from peakguide_private.catalogue_batch_receipts where batch_key='kgp-parking-02';
 raise notice 'Removed only the 16 unchanged parking cards';
end $practical$;
commit;
"""
 targets=json.dumps([{'peak_slug':r['peak_slug'],**r['expected_trail']} for r in rows],ensure_ascii=True,separators=(',',':'))
 verify="""-- Read-only. Existing access cards are expected to remain present.
with targets as(select value e from jsonb_array_elements($targets$"""+targets+"""$targets$::jsonb))
select e->>'peak_slug' peak_slug,t.slug,
 (select count(*) from public.trail_access a where a.trail_id=t.id and a.active) access_cards,
 (select count(*) from public.trail_access_i18n i join public.trail_access a on a.id=i.access_id where a.trail_id=t.id and a.active) access_translations,
 (select count(*) from public.trail_parking p where p.trail_id=t.id and p.active) parking_cards,
 (select count(*) from public.trail_parking_i18n i join public.trail_parking p on p.id=i.parking_id where p.trail_id=t.id and p.active) parking_translations,
 t.active and k.active and k.is_korona and k.slug=e->>'peak_slug' and t.peak_id=(e->>'peak_id')::bigint and t.start_point_name is not distinct from e->>'start_point_name' and t.end_point_name is not distinct from e->>'end_point_name' route_identity_matches,
 exists(select from peakguide_private.catalogue_batch_receipts where batch_key='kgp-parking-02') package_applied
from targets left join public.trails t on t.id=(e->>'id')::bigint and t.slug=e->>'slug' left join public.peaks k on k.id=t.peak_id order by e->>'peak_slug';
"""
 original=json.loads((ROOT/'docs/catalogue/kgp-practical-01/records.json').read_text(encoding='utf-8'))
 added={r['peak_slug'] for r in rows}
 all_targets=json.dumps([{'peak_slug':r['peak_slug'],**r['expected_trail'],'expected_parking':int(bool(r['parking']) or r['peak_slug'] in added)} for r in original],ensure_ascii=True,separators=(',',':'))
 verify_all=verify.replace(targets,all_targets).replace(" (select count(*) from public.trail_parking p", " (e->>'expected_parking')::integer expected_parking_cards,\n (select count(*) from public.trail_parking p",1)
 return {'apply.sql':apply,'rollback.sql':rollback,'verify.sql':verify,'verify-all.sql':verify_all}

def main():
 p=argparse.ArgumentParser();p.add_argument('--check',action='store_true');a=p.parse_args()
 for name,s in generate(load()).items():
  assert s.isascii()
  if a.check:assert (FOLDER/name).read_text(encoding='ascii')==s,f'Regenerate {name}'
  else:(FOLDER/name).write_text(s,encoding='ascii')
 print('KGP parking: 19 reviewed; 16 cards / 64 texts; three explicit unresolved cases; generated SQL reproducible')
if __name__=='__main__':main()
