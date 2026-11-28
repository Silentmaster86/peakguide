"""Build an owner-only atomic import/rollback of prepared batches 07 and 08."""
import argparse
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
FOLDER=ROOT/'docs/catalogue/nonkgp-07-08'
KEYS=['nonkgp-07','nonkgp-08']

def transaction_body(key,name):
    lines=(ROOT/'docs/catalogue'/key/name).read_text(encoding='ascii').splitlines()
    assert lines.count('begin;')==lines.count('commit;')==1
    assert lines[-1]=='commit;'
    return '\n'.join(line for line in lines if line not in ('begin;','commit;'))

def generate():
    files={}
    for name,keys in [('apply.sql',KEYS),('rollback.sql',list(reversed(KEYS)))]:
        files[name]='-- Owner only. Read README.md; this is ONE transaction for both packages.\nbegin;\n'+'\n'.join(transaction_body(key,name)for key in keys)+'\ncommit;\n'
    queries=[]
    for key in KEYS:
        text=(ROOT/'docs/catalogue'/key/'verify.sql').read_text(encoding='ascii')
        query=text[text.index('with manifest'):].strip().removesuffix(';')
        queries.append("select '"+key+"'::text batch_key, v.* from ("+query+") v")
    files['verify.sql']='-- Read only: 2 rows from nonkgp-07 and 4 from nonkgp-08.\nselect * from (\n'+'\nunion all\n'.join(queries)+'\n) reviewed order by batch_key,peak_slug;\n'
    return files

def main():
    parser=argparse.ArgumentParser(description=__doc__);parser.add_argument('--check',action='store_true');args=parser.parse_args()
    for name,text in generate().items():
        assert text.isascii();path=FOLDER/name
        if args.check:assert path.read_text(encoding='ascii')==text,'Regenerate '+str(path.relative_to(ROOT))
        else:FOLDER.mkdir(exist_ok=True);path.write_text(text,encoding='ascii')
    print('Checked'if args.check else'Generated','atomic nonkgp-07 + nonkgp-08')

if __name__=='__main__':main()
