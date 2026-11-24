import hashlib
import json
import math
import unittest
from build_nonkgp_05 import FOLDER,generate,payload

class NonKgp05Test(unittest.TestCase):
    def test_source_metrics_endpoints_and_all_points(self):
        trails={r['body']['peak_slug']:r['body']for r in payload()['records']if r['kind']=='trail'}
        metrics={'stog-izerski':(4.8,573,126),'wysoki-kamien':(3.2,413,91)}
        endpoints={'stog-izerski':([15.334311,50.907326],[15.303837,50.890964]),'wysoki-kamien':([15.517885,50.829702],[15.491945,50.845118])}
        reviews=json.loads((FOLDER/'geometry-review.json').read_text())
        for review in reviews:
            slug=review['peak_slug'];t=trails[slug];lines=t['route_geometry']['coordinates']
            self.assertEqual(tuple(t[k]for k in ['distance_km','elevation_gain_m','time_min']),metrics[slug])
            self.assertEqual((lines[0][0],lines[-1][-1]),endpoints[slug])
            self.assertEqual(sum(map(len,lines)),review['points'])
            self.assertEqual(len(lines),review['segments'])
            self.assertEqual(hashlib.sha256(json.dumps(lines,separators=(',',':')).encode()).hexdigest(),review['coordinates_sha256'])
            self.assertEqual(t['gpx_url'],review['source_gpx'])
        self.assertEqual(sum(r['points']for r in reviews),345)

    def test_peak_pins_not_connected_and_unreviewed_summits_excluded(self):
        data=payload();peaks={p['slug']:p for p in data['peaks']}
        self.assertEqual({p['id']for p in data['peaks']},{33,34})
        for record in data['records']:
            body=record['body'];peak=peaks[body['peak_slug']]
            if record['kind']=='trail':
                lines=body['route_geometry']['coordinates'];pin=[peak['longitude'],peak['latitude']]
                self.assertNotIn(pin,[p for line in lines for p in line])
                end=lines[-1][-1];gap=math.hypot((end[0]-pin[0])*70000,(end[1]-pin[1])*111000)
                self.assertGreater(gap,30);self.assertLess(gap,100)
            else:self.assertIsNone(body['trail_id'])
        unresolved=json.loads((FOLDER/'unresolved.json').read_text())
        self.assertEqual({r['peak']['slug']for r in unresolved},{'iwinka','postawna','anielska-kopa'})
        self.assertTrue(all(r['status']=='not_imported'for r in unresolved))

    def test_ascii_import_and_exact_four_language_payloads(self):
        for name,text in generate().items():
            self.assertTrue(text.isascii());self.assertEqual(text,(FOLDER/name).read_text(encoding='ascii'))
        text=(FOLDER/'records.json').read_text(encoding='utf-8')
        for bad in ['\ufffd','Ð','ï¼','Ã³','Å‚']:self.assertNotIn(bad,text)
        self.assertEqual(len(payload()['records']),4)
        for row in payload()['records']:self.assertEqual(set(row['body']['i18n']),{'en','pl','ua','zh'})
        self.assertNotIn('update public.peaks',generate()['apply.sql'].lower())
        self.assertNotIn('update public.peaks',generate()['rollback.sql'].lower())

if __name__=='__main__':unittest.main()
