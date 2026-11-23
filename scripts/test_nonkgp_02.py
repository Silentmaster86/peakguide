import hashlib
import json
import math
import unittest
from build_nonkgp_02 import FOLDER, generate, payload

class NonKgp02Test(unittest.TestCase):
    def test_source_scope_endpoints_and_metrics(self):
        trails={r['body']['peak_slug']:r['body'] for r in payload()['records']if r['kind']=='trail'}
        anchors={'rotunda':(21.235825,49.474487),'niemcowa':(20.646535,49.445284),'barania-gora':(19.010556,49.611389),'klimczok':(18.995274,49.739830)}
        metrics={'rotunda':(1.8,250,53),'niemcowa':(6.1,681,165),'barania-gora':(7.4,666,175),'klimczok':(4.8,603,136)}
        reviews={r['peak_slug']:r for r in json.loads((FOLDER/'geometry-review.json').read_text())}
        for slug,t in trails.items():
            lines=t['route_geometry']['coordinates'];end=lines[-1][-1];anchor=anchors[slug]
            self.assertLess(math.hypot((end[0]-anchor[0])*72000,(end[1]-anchor[1])*111000),30)
            self.assertEqual(tuple(t[k]for k in ['distance_km','elevation_gain_m','time_min']),metrics[slug])
            review=reviews[slug]
            self.assertEqual(sum(map(len,lines)),review['points'])
            self.assertEqual(hashlib.sha256(json.dumps(lines,separators=(',',':')).encode()).hexdigest(),review['coordinates_sha256'])
            self.assertEqual(lines[0][0],review['first']);self.assertEqual(end,review['last'])
        self.assertEqual(sum(r['points']for r in reviews.values()),805)
        # Preserve the PTTK clearing/junction endpoint; never draw a connector to the 1001 m pin.
        self.assertNotEqual(trails['niemcowa']['route_geometry']['coordinates'][-1][-1],[20.647028,49.443917])
        self.assertEqual(trails['niemcowa']['gpx_url'],'https://malopolska.szlaki.pttk.pl/item/gpx/659')
        self.assertNotIn('wielki-rogal',trails)

    def test_precise_poi_types_and_preserved_peaks(self):
        data=payload();pois={r['body']['peak_slug']:r['body']for r in data['records']if r['kind']=='poi'}
        self.assertEqual({k:p['type_slug']for k,p in pois.items()},{'niemcowa':'transport','rotunda':'attraction','barania-gora':'viewpoint','klimczok':'shelter'})
        self.assertNotIn('range_change',data)
        self.assertTrue(all(p['trail_id']is None for p in pois.values()))
        self.assertEqual(len({p['id']for p in data['peaks']}),4)
        self.assertEqual({p['range_id']for p in data['peaks']},{20,23,25})

    def test_frozen_ascii_sql_and_translation_encoding(self):
        for name,text in generate().items():
            self.assertTrue(text.isascii());self.assertEqual(text,(FOLDER/name).read_text(encoding='ascii'))
        text=(FOLDER/'records.json').read_text(encoding='utf-8')
        for bad in ['\ufffd','Ð','ï¼','Ã³','Å‚']:self.assertNotIn(bad,text)
        for row in payload()['records']:
            self.assertEqual(set(row['body']['i18n']),{'en','pl','ua','zh'})
        self.assertNotIn('update public.peaks',generate()['apply.sql'].lower())
        self.assertNotIn('update public.peaks',generate()['rollback.sql'].lower())

if __name__=='__main__':unittest.main()
