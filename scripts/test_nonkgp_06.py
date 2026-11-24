import hashlib
import json
import math
import unittest
from build_nonkgp_06 import FOLDER,generate,payload

class NonKgp06Test(unittest.TestCase):
    def test_exact_variants_not_long_loop_or_hut_detour(self):
        trails={r['body']['peak_slug']:r['body']for r in payload()['records']if r['kind']=='trail'}
        metrics={'czarna-gora':(4.8,647,140),'kalenica':(2.4,200,54),'wiezyca':(0.7,123,27)}
        ends={'czarna-gora':[16.805033,50.252191],'kalenica':[16.546396,50.64279],'wiezyca':[16.728817,50.886715]}
        reviews=json.loads((FOLDER/'geometry-review.json').read_text())
        for review in reviews:
            slug=review['peak_slug'];t=trails[slug];lines=t['route_geometry']['coordinates']
            self.assertEqual(tuple(t[k]for k in ['distance_km','elevation_gain_m','time_min']),metrics[slug])
            self.assertEqual(lines[-1][-1],ends[slug]);self.assertEqual(lines[0][0],review['first'])
            self.assertEqual(sum(map(len,lines)),review['points']);self.assertEqual(len(lines),review['segments'])
            self.assertEqual(hashlib.sha256(json.dumps(lines,separators=(',',':')).encode()).hexdigest(),review['coordinates_sha256'])
            self.assertEqual(t['gpx_url'],review['source_gpx'])
        self.assertEqual(sum(r['points']for r in reviews),403)
        self.assertIn('/route/export?q=',trails['wiezyca']['gpx_url'])
        self.assertNotIn('/3rqa1',trails['wiezyca']['source_url'])
        self.assertEqual(trails['kalenica']['source_url'],'https://mapa-turystyczna.pl/route/6vs3')

    def test_parent_preservation_and_area_markers(self):
        data=payload();peaks={p['slug']:p for p in data['peaks']}
        self.assertEqual({p['id']for p in data['peaks']},{31,39,82})
        for record in data['records']:
            body=record['body'];peak=peaks[body['peak_slug']]
            if record['kind']=='trail':
                lines=body['route_geometry']['coordinates'];pin=[peak['longitude'],peak['latitude']]
                self.assertNotIn(pin,[p for line in lines for p in line])
                end=lines[-1][-1];gap=math.hypot((end[0]-pin[0])*70000,(end[1]-pin[1])*111000)
                self.assertLess(gap,100)
            else:self.assertIsNone(body['trail_id'])
        unresolved=json.loads((FOLDER/'unresolved.json').read_text())
        self.assertEqual([r['peak']['slug']for r in unresolved],['dzikowiec'])
        self.assertEqual(unresolved[0]['status'],'not_imported');self.assertEqual(unresolved[0]['peak']['range_id'],12)
        pois={r['body']['peak_slug']:r['body']for r in data['records']if r['kind']=='poi'}
        self.assertEqual(pois['czarna-gora']['type_slug'],'attraction')
        self.assertEqual(pois['wiezyca']['website_url'],'https://www.sleza.sobotka.pl/wiezyca/')

    def test_ascii_sql_and_multilingual_text_integrity(self):
        for name,text in generate().items():
            self.assertTrue(text.isascii());self.assertEqual(text,(FOLDER/name).read_text(encoding='ascii'))
        text=(FOLDER/'records.json').read_text(encoding='utf-8')
        for bad in ['\ufffd','Ð','ï¼','Ã³','Å‚']:self.assertNotIn(bad,text)
        self.assertEqual(len(payload()['records']),6)
        for row in payload()['records']:self.assertEqual(set(row['body']['i18n']),{'en','pl','ua','zh'})
        self.assertNotIn('update public.peaks',generate()['apply.sql'].lower())
        self.assertNotIn('update public.peaks',generate()['rollback.sql'].lower())

if __name__=='__main__':unittest.main()
