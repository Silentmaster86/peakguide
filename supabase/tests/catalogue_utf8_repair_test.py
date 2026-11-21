"""Integration tests on the dedicated catalogue_utf8_repair_test database only."""
import argparse
import importlib.util
import json
import subprocess
from pathlib import Path

root = Path(__file__).resolve().parents[2]
spec = importlib.util.spec_from_file_location('repair_generator', root / 'scripts/build_catalogue_utf8_repair.py')
generator = importlib.util.module_from_spec(spec)
spec.loader.exec_module(generator)
parser = argparse.ArgumentParser()
parser.add_argument('--docker')
args = parser.parse_args()
command = (['docker', 'exec', '-i', args.docker] if args.docker else []) + ['psql', '-X', '-U', 'postgres', '-d', 'catalogue_utf8_repair_test', '-At', '-v', 'ON_ERROR_STOP=1']


def sql(text, error=None):
    result = subprocess.run(command, input=text, text=True, capture_output=True)
    if error:
        assert result.returncode and error in result.stderr, result.stderr
    else:
        assert not result.returncode, result.stderr
    return result.stdout.strip()


base = root / 'docs/catalogue'
apply = (base / 'utf8-repair/apply.sql').read_text(encoding='ascii')
verify = (base / 'utf8-repair/verify.sql').read_text(encoding='ascii')
assert apply.isascii() and verify.isascii()
assert generator.mojibake('Śnieżnik') == 'ÅšnieÅ¼nik'
assert generator.mojibake('Białczańska') == 'BiaÅ‚czaÅ„ska'
assert generator.mojibake('中文').startswith('ä¸')


def snapshot():
    return sql("select jsonb_build_object('trails',(select jsonb_agg(to_jsonb(t) order by id) from trails t),'pois',(select jsonb_agg(to_jsonb(p) order by id) from pois p),'ti',(select jsonb_agg(to_jsonb(i) order by trail_id,lang) from trails_i18n i),'pi',(select jsonb_agg(to_jsonb(i) order by poi_id,lang) from pois_i18n i),'receipts',(select jsonb_agg(to_jsonb(r) order by batch_key) from peakguide_private.catalogue_batch_receipts r))")


def reset(correct_first=False):
    sql('drop schema if exists peakguide_private cascade;drop schema public cascade;create schema public;')
    sql((root / 'supabase/tests/catalogue_management_fixture.sql').read_text())
    sql((root / 'supabase/migrations/202611150014_catalogue_management.sql').read_text())
    peaks = {'sniezka': 1, 'snieznik': 2, 'wysoka-kopa': 3, 'rudawiec': 4, 'orlica': 5, 'wielka-sowa': 6, 'jagodna': 7, 'skalnik': 8, 'kowadlo': 9, 'szczeliniec-wielki': 11, 'klodzka-gora': 13, 'biskupia-kopa': 15, 'rysy': 16, 'babia-gora': 17, 'tarnica': 18, 'turbacz': 19, 'radziejowa': 20, 'lubomir': 21, 'mogielica': 22, 'lackowa': 23, 'czupel': 24, 'skrzyczne': 25, 'wysoka-pieniny': 26}
    sql('delete from peaks;insert into peaks(id,slug,active)values' + ','.join(f"({v},'{k}',true)" for k, v in peaks.items()) + ";insert into poi_types(id,slug)values(2,'viewpoint'),(3,'trailhead'),(4,'shelter'),(5,'attraction');")
    for n in ('02', '03', '04'):
        content = (base / f'batch-{n}/apply.sql').read_text(encoding='utf-8')
        sql(content if correct_first and n == '02' else generator.mojibake(content))
    sql("insert into trails(peak_id,slug,start_point_name) values(1,'owner-existing','Śnieżka');insert into trails_i18n(trail_id,lang,name) select id,'pl','Własna trasa' from trails where slug='owner-existing';")


reset()
# A late owner edit must abort and roll back even repairs made earlier in the transaction.
sql("update pois_i18n set tips='Owner edit' where lang='zh' and poi_id=(select max(id) from pois);")
before = snapshot()
sql(apply, 'Imported record changed')
assert snapshot() == before
# A distinct test also rejects noncanonical text recorded in a receipt.
reset()
sql("update trails_i18n set notes='unexpected receipted note' where lang='pl' and trail_id=1; update peakguide_private.catalogue_batch_receipts set snapshot=jsonb_set(snapshot,'{0,snapshot}',(select jsonb_build_object('row',to_jsonb(t),'i18n',(select jsonb_agg(to_jsonb(i) order by lang) from trails_i18n i where trail_id=t.id)) from trails t where t.id=1)) where batch_key='kgp-02';")
before = snapshot()
sql(apply, 'Unexpected translation')
assert snapshot() == before
reset()
before = json.loads(snapshot())
sql(apply)
rows = [json.loads(line) for line in sql("select row_to_json(v) from (" + verify.rstrip().removesuffix(';') + ") v").splitlines()]
assert [(r['expected_records'], r['found_records'], r['correct_text_records'], r['remaining_issues']) for r in rows] == [(10, 10, 10, []), (30, 30, 30, []), (6, 6, 6, [])], rows
fixed = snapshot()
sql(apply)
assert snapshot() == fixed, 'Repair must be idempotent, including revisions and receipts'
after = json.loads(fixed)
for table in ('trails', 'pois'):
    for old, new in zip(before[table], after[table]):
        assert {k: v for k, v in old.items() if k not in ('start_point_name', 'end_point_name', 'updated_at', 'revision')} == {k: v for k, v in new.items() if k not in ('start_point_name', 'end_point_name', 'updated_at', 'revision')}, (old, new)
assert sql("select start_point_name from trails where slug='owner-existing'") == 'Śnieżka'
assert sql("select name from trails_i18n where trail_id=(select id from trails where slug='owner-existing')") == 'Własna trasa'
# Refreshed receipts must remain compatible with canonical reapply and protected rollback.
for n in ('02', '03', '04'):
    sql((base / f'batch-{n}/apply.sql').read_text(encoding='utf-8'))
for n in ('04', '03', '02'):
    sql((base / f'batch-{n}/rollback.sql').read_text(encoding='utf-8'))
assert sql('select count(*) from trails') == '1'
assert sql('select count(*) from pois') == '0'
reset(correct_first=True)
correct_before = sql("select snapshot from peakguide_private.catalogue_batch_receipts where batch_key='kgp-02'")
sql(apply)
assert sql("select snapshot from peakguide_private.catalogue_batch_receipts where batch_key='kgp-02'") == correct_before
sql("delete from peakguide_private.catalogue_batch_receipts where batch_key='kgp-04'")
before = snapshot()
sql(apply, 'Missing or incomplete receipt')
assert snapshot() == before
print('PASS: CP1252 reproduction, 46 in-place repairs, all translations/start/end labels, preserved IDs/geometry/metrics/owner data, atomic edit guards, canonical mixed data, idempotency and receipt reapply/rollback compatibility')
