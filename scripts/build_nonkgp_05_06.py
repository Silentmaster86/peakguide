"""Build the owner-only atomic rollout of the two reviewed, independent batches."""
import argparse
from pathlib import Path

ROOT=Path(__file__).resolve().parents[1]
FOLDER=ROOT/'docs/catalogue/nonkgp-05-06'

def generate():
    bodies=[];queries=[]
    for key in ['nonkgp-05','nonkgp-06']:
        source=ROOT/'docs/catalogue'/key
        text=(source/'apply.sql').read_text(encoding='ascii')
        lines=text.splitlines()
        assert lines.count('begin;')==lines.count('commit;')==1
        assert lines[-1]=='commit;'
        bodies.append('\n'.join(line for line in lines if line not in ('begin;','commit;')))
        verify=(source/'verify.sql').read_text(encoding='ascii')
        query=verify[verify.index('with manifest'):].strip().removesuffix(';')
        queries.append("select '"+key+"'::text batch_key, v.* from ("+query+") v")
    return {
      'apply.sql': '-- Owner-only grouped rollout. Read README.md and keep a current backup.\n-- ONE transaction: a conflict in either reviewed package rolls back both.\nbegin;\n'+ '\n'.join(bodies)+'\ncommit;\n',
      'verify.sql': '-- Read-only grouped verification: 2 rows for nonkgp-05 and 3 for nonkgp-06.\nselect * from (\n'+'\nunion all\n'.join(queries)+'\n) reviewed order by batch_key,peak_slug;\n',
    }

def main():
    p=argparse.ArgumentParser(description=__doc__);p.add_argument('--check',action='store_true');args=p.parse_args()
    for name,text in generate().items():
        assert text.isascii()
        path=FOLDER/name
        if args.check:
            assert path.read_text(encoding='ascii')==text,'Regenerate '+str(path.relative_to(ROOT))
        else:
            FOLDER.mkdir(exist_ok=True);path.write_text(text,encoding='ascii')
    print('Checked'if args.check else'Generated','atomic nonkgp-05 + nonkgp-06 rollout')

if __name__=='__main__':main()
