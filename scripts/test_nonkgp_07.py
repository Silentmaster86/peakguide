import copy
import hashlib
import json
from pathlib import Path
import tempfile
import unittest
from unittest.mock import patch
import build_nonkgp_07 as batch
import build_elevation_profiles as profiles

class NonKgp07Test(unittest.TestCase):
    def test_exact_scopes_and_source_coordinates(self):
        data=batch.payload();self.assertEqual({p['id']for p in data['peaks']},{47,48})
        expected={'suchawa':(1.9,132,43,88,[16.278288,50.685368],[16.2664411,50.6805463]),'lesista-wielka':(4.8,350,108,159,[16.186379,50.666706],[16.191591,50.702665])}
        reviews={r['peak_slug']:r for r in json.loads((batch.FOLDER/'geometry-review.json').read_text())}
        for record in data['records']:
            body=record['body']
            if record['kind']!='trail':continue
            km,gain,minutes,count,first,last=expected[body['peak_slug']];lines=body['route_geometry']['coordinates'];review=reviews[body['peak_slug']]
            self.assertEqual((body['distance_km'],body['elevation_gain_m'],body['time_min']),(km,gain,minutes))
            self.assertEqual(lines[0][0],first);self.assertEqual(lines[-1][-1],last);self.assertEqual(sum(map(len,lines)),count)
            self.assertEqual(hashlib.sha256(json.dumps(lines,separators=(',',':')).encode()).hexdigest(),review['coordinates_sha256'])
            self.assertEqual(body['gpx_url'],review['source_gpx']);self.assertIsNone(body['difficulty'])
            peak=next(p for p in data['peaks']if p['slug']==body['peak_slug']);self.assertNotEqual(last,[peak['longitude'],peak['latitude']])

    def test_distinct_pois_do_not_become_an_invented_side_path(self):
        pois={r['body']['peak_slug']:r['body']for r in batch.payload()['records']if r['kind']=='poi'}
        self.assertEqual((pois['suchawa']['latitude'],pois['suchawa']['longitude']),(50.684767,16.277919))
        fissure=pois['lesista-wielka'];self.assertEqual((fissure['latitude'],fissure['longitude']),(50.7024,16.2037));self.assertEqual(fissure['type_slug'],'attraction')
        for record in batch.payload()['records']:
            if record['kind']=='trail':self.assertNotIn([16.2037,50.7024],[p for line in record['body']['route_geometry']['coordinates']for p in line])
        self.assertIn('poza opisanym',fissure['i18n']['pl']['tips']);self.assertIn('community',fissure['i18n']['en']['description'])
        self.assertIsNone(fissure['trail_id'])

    def test_ascii_sql_exact_utf8_and_parent_preservation(self):
        for name,text in batch.generate().items():
            self.assertTrue(text.isascii());self.assertEqual(text,(batch.FOLDER/name).read_text(encoding='ascii'))
            self.assertNotIn('update public.peaks',text.lower())
        text=(batch.FOLDER/'records.json').read_text()
        for bad in ['\ufffd','Ð','ï¼','Ã³','Å‚']:self.assertNotIn(bad,text)
        self.assertEqual(len(batch.payload()['records']),4)

    def test_profiles_require_exact_new_identity_and_geometry(self):
        generated=profiles.generate();self.assertEqual(len(generated),12)
        review=json.loads(profiles.REVIEW.read_text());new=[r for r in review if r['catalogue_batch']=='nonkgp-07']
        self.assertEqual(sum(sum(map(len,r['segments']))for r in new),247)
        for row in new:
            with self.subTest(peak=row['peak_slug']):
                value=json.loads(generated[row['trail_slug']+'.json']);self.assertEqual(value['height_count'],value['point_count']);self.assertEqual(value['peak_id'],row['peak_id'])
                changed=copy.deepcopy(review);next(r for r in changed if r['trail_slug']==row['trail_slug'])['peak_id']=999
                with tempfile.TemporaryDirectory()as directory:
                    path=Path(directory)/'review.json';path.write_text(json.dumps(changed))
                    with patch.object(profiles,'REVIEW',path),self.assertRaises(ValueError):profiles.generate()

if __name__=='__main__':unittest.main()
