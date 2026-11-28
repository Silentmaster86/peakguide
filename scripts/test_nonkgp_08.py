import hashlib
import json
import unittest
import build_nonkgp_08 as batch
import build_elevation_profiles as profiles
import build_nonkgp_07_08 as grouped

class NonKgp08Test(unittest.TestCase):
    def test_exact_source_variants_and_endpoints(self):
        expected={'wolek':(3.5,161,71,166,[15.935477,50.838019]),'trzy-korony':(3.3,505,108,188,[20.414215,49.413833]),'zamkowa-gora':(2.7,238,66,171,[17.458823,50.272707]),'srebrna-kopa':(4.9,522,126,317,[17.4550557,50.2569801])}
        reviews={r['peak_slug']:r for r in json.loads((batch.FOLDER/'geometry-review.json').read_text())}
        for record in batch.payload()['records']:
            if record['kind']!='trail':continue
            body=record['body'];km,gain,minutes,count,last=expected[body['peak_slug']];lines=body['route_geometry']['coordinates'];r=reviews[body['peak_slug']]
            self.assertEqual((body['distance_km'],body['elevation_gain_m'],body['time_min']),(km,gain,minutes));self.assertEqual(lines[-1][-1],last);self.assertEqual(sum(map(len,lines)),count)
            self.assertEqual(hashlib.sha256(json.dumps(lines,separators=(',',':')).encode()).hexdigest(),r['coordinates_sha256']);self.assertEqual(body['gpx_url'],r['source_gpx'])
        self.assertEqual(sum(r['points']for r in reviews.values()),842)

    def test_preserves_four_parents_and_distinct_poi_scopes(self):
        data=batch.payload();self.assertEqual({p['id']for p in data['peaks']},{43,57,79,142});pois={r['body']['peak_slug']:r['body']for r in data['records']if r['kind']=='poi'}
        self.assertEqual((pois['wolek']['latitude'],pois['wolek']['longitude']),(50.823543,15.945836));self.assertEqual(pois['wolek']['type_slug'],'trailhead')
        self.assertEqual((pois['zamkowa-gora']['latitude'],pois['zamkowa-gora']['longitude']),(50.272711,17.45885));self.assertIn('go.zopk.pl',pois['zamkowa-gora']['source_url'])
        self.assertEqual((pois['srebrna-kopa']['latitude'],pois['srebrna-kopa']['longitude']),(50.260819,17.432179));self.assertIn('nie jest częścią',pois['srebrna-kopa']['i18n']['pl']['tips'])
        for row in data['records']:
            if row['kind']=='poi':self.assertIsNone(row['body']['trail_id'])
            else:self.assertIsNone(row['body']['difficulty'])

    def test_full_profiles_and_source_point_files_are_not_routes(self):
        rows=json.loads(profiles.REVIEW.read_text());new=[r for r in rows if r['catalogue_batch']=='nonkgp-08'];self.assertEqual(len(new),4);self.assertEqual(sum(sum(map(len,r['segments']))for r in new),842)
        files=profiles.generate()
        for r in new:
            p=json.loads(files[r['trail_slug']+'.json']);self.assertEqual(p['height_count'],p['point_count']);self.assertEqual(p['peak_id'],r['peak_id'])
        primary=json.loads((batch.FOLDER/'source-review.json').read_text());waypoints=primary['park_waypoints'];self.assertEqual(waypoints['use'],'identity_and_poi_only');self.assertEqual(waypoints['track_points'],0)

    def test_ascii_typed_sql_and_grouped_atomicity(self):
        for folder,files in [(batch.FOLDER,batch.generate()),(grouped.FOLDER,grouped.generate())]:
            for name,text in files.items():self.assertTrue(text.isascii());self.assertEqual(text,(folder/name).read_text(encoding='ascii'));self.assertNotIn('update public.peaks',text.lower())
        for name in ['apply.sql','rollback.sql']:
            lines=grouped.generate()[name].splitlines();self.assertEqual(lines.count('begin;'),1);self.assertEqual(lines.count('commit;'),1)
        self.assertLess(grouped.generate()['apply.sql'].find("batch_key='nonkgp-07'"),grouped.generate()['apply.sql'].find("batch_key='nonkgp-08'"))
        self.assertLess(grouped.generate()['rollback.sql'].find("batch_key='nonkgp-08'"),grouped.generate()['rollback.sql'].find("batch_key='nonkgp-07'"))
        for bad in ['\ufffd','Ð','ï¼','Ã³','Å‚']:self.assertNotIn(bad,(batch.FOLDER/'records.json').read_text())

if __name__=='__main__':unittest.main()
