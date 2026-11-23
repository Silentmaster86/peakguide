import hashlib
import json
import math
import unittest
from build_nonkgp_04 import FOLDER,generate,payload

class NonKgp04Test(unittest.TestCase):
    def test_frozen_source_variants_and_exact_metrics(self):
        trails={r['body']['peak_slug']:r['body']for r in payload()['records']if r['kind']=='trail'}
        metrics={'krzemien':(5.4,692,153),'jaworzyna-kamienicka':(3.6,117,63),'kudlon':(5.6,592,144),'jelenia-kopa':(2.2,289,60)}
        ends={'krzemien':(22.737598,49.086537),'jaworzyna-kamienicka':(20.158676,49.549650),'kudlon':(20.176227,49.572587),'jelenia-kopa':(16.757833,50.447812)}
        reviews={r['peak_slug']:r for r in json.loads((FOLDER/'geometry-review.json').read_text())}
        for slug,t in trails.items():
            lines=t['route_geometry']['coordinates'];review=reviews[slug]
            self.assertEqual(tuple(t[k]for k in ['distance_km','elevation_gain_m','time_min']),metrics[slug])
            self.assertEqual(tuple(lines[-1][-1]),ends[slug])
            self.assertEqual(sum(map(len,lines)),review['points'])
            self.assertEqual(hashlib.sha256(json.dumps(lines,separators=(',',':')).encode()).hexdigest(),review['coordinates_sha256'])
            self.assertEqual(t['gpx_url'],review['source_gpx'])
        self.assertEqual(sum(r['points']for r in reviews.values()),835)

    def test_restricted_summit_and_clearing_are_not_connected_to_peak_pins(self):
        data=payload();peaks={p['slug']:p for p in data['peaks']}
        trails={r['body']['peak_slug']:r['body']for r in data['records']if r['kind']=='trail'}
        for slug in ['krzemien','jaworzyna-kamienicka']:
            peak=peaks[slug];lines=trails[slug]['route_geometry']['coordinates'];pin=[peak['longitude'],peak['latitude']]
            self.assertNotIn(pin,[point for line in lines for point in line])
            end=lines[-1][-1]
            gap=math.hypot((end[0]-pin[0])*72000,(end[1]-pin[1])*111000)
            self.assertGreater(gap,80);self.assertLess(gap,350)
        self.assertEqual(trails['krzemien']['start_point_name'],'Wołosate')
        self.assertEqual(trails['jaworzyna-kamienicka']['start_point_name'],'Schronisko PTTK Turbacz')
        self.assertNotIn('srebrna-gora',trails)
        pois={r['body']['peak_slug']:r['body']for r in data['records']if r['kind']=='poi'}
        self.assertEqual(pois['jelenia-kopa']['type_slug'],'trailhead')
        self.assertTrue(all(p['trail_id']is None for p in pois.values()))
        self.assertEqual({p['id']for p in data['peaks']},{63,65,66,141})

    def test_ascii_sql_and_four_language_payloads(self):
        for name,text in generate().items():
            self.assertTrue(text.isascii());self.assertEqual(text,(FOLDER/name).read_text(encoding='ascii'))
        text=(FOLDER/'records.json').read_text(encoding='utf-8')
        for bad in ['\ufffd','Ð','ï¼','Ã³','Å‚']:self.assertNotIn(bad,text)
        self.assertEqual(len(payload()['records']),8)
        for row in payload()['records']:self.assertEqual(set(row['body']['i18n']),{'en','pl','ua','zh'})
        self.assertNotIn('update public.peaks',generate()['apply.sql'].lower())
        self.assertNotIn('update public.peaks',generate()['rollback.sql'].lower())

if __name__=='__main__':unittest.main()
