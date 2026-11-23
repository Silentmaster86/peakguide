import hashlib
import json
import math
import unittest
from build_nonkgp_03 import FOLDER, generate, payload

class NonKgp03Test(unittest.TestCase):
    def test_source_metrics_and_independent_peak_anchors(self):
        trails={r['body']['peak_slug']:r['body']for r in payload()['records']if r['kind']=='trail'}
        anchors={'cwilin':(20.191897,49.688740),'lakowa-wyspowy':(20.462113,49.642726),'maly-babia-gora':(19.4996,49.5812),'polica':(19.619426,49.623685),'halicz':(22.768833,49.072139)}
        metrics={'cwilin':(2,394,70),'lakowa-wyspowy':(4.4,399,105),'maly-babia-gora':(1.8,323,55),'polica':(6.9,481,150),'halicz':(10.6,660,224)}
        reviews={r['peak_slug']:r for r in json.loads((FOLDER/'geometry-review.json').read_text())}
        for slug,t in trails.items():
            lines=t['route_geometry']['coordinates'];end=lines[-1][-1];anchor=anchors[slug]
            self.assertLess(math.hypot((end[0]-anchor[0])*72000,(end[1]-anchor[1])*111000),100)
            self.assertEqual(tuple(t[k]for k in ['distance_km','elevation_gain_m','time_min']),metrics[slug])
            self.assertEqual(t['route_type'],'point-to-point')
            review=reviews[slug]
            self.assertEqual(sum(map(len,lines)),review['points'])
            self.assertEqual(hashlib.sha256(json.dumps(lines,separators=(',',':')).encode()).hexdigest(),review['coordinates_sha256'])
            self.assertEqual(lines[0][0],review['first']);self.assertEqual(end,review['last'])
        self.assertEqual(sum(r['points']for r in reviews.values()),1203)
        # Use the complete provider route to the Lyzka peak; do not append points to PTTK 129.
        self.assertEqual(trails['lakowa-wyspowy']['gpx_url'],'https://mapa-turystyczna.pl/route/3vfnn.gpx')
        self.assertNotEqual(trails['lakowa-wyspowy']['route_geometry']['coordinates'][-1][-1],[20.46530929,49.64177906])

    def test_precise_route_variants_and_poi_scope(self):
        data=payload();trails={r['body']['peak_slug']:r['body']for r in data['records']if r['kind']=='trail'}
        def nearest(slug,lon,lat):
            return min(math.hypot((p[0]-lon)*72000,(p[1]-lat)*111000)for line in trails[slug]['route_geometry']['coordinates']for p in line)
        self.assertLess(nearest('maly-babia-gora',19.510188,49.581515),25)
        self.assertLess(nearest('halicz',22.770450,49.052657),25)
        self.assertEqual(trails['halicz']['route_geometry']['coordinates'][0][0],[22.680646,49.066051])
        self.assertEqual(trails['maly-babia-gora']['route_geometry']['coordinates'][0][0],[19.516633,49.587426])
        pois={r['body']['peak_slug']:r['body']for r in data['records']if r['kind']=='poi'}
        self.assertEqual({k:p['type_slug']for k,p in pois.items()},{'cwilin':'viewpoint','lakowa-wyspowy':'attraction','maly-babia-gora':'shelter','polica':'attraction','halicz':'viewpoint'})
        self.assertTrue(all(p['trail_id']is None for p in pois.values()))
        self.assertNotIn('range_change',data)
        self.assertEqual({p['range_id']for p in data['peaks']},{17,18,22})

    def test_frozen_ascii_sql_and_translation_encoding(self):
        for name,text in generate().items():
            self.assertTrue(text.isascii());self.assertEqual(text,(FOLDER/name).read_text(encoding='ascii'))
        text=(FOLDER/'records.json').read_text(encoding='utf-8')
        for bad in ['\ufffd','Ð','ï¼','Ã³','Å‚']:self.assertNotIn(bad,text)
        self.assertEqual(len(payload()['records']),10)
        for row in payload()['records']:self.assertEqual(set(row['body']['i18n']),{'en','pl','ua','zh'})
        self.assertNotIn('update public.peaks',generate()['apply.sql'].lower())
        self.assertNotIn('update public.peaks',generate()['rollback.sql'].lower())

if __name__=='__main__':unittest.main()
