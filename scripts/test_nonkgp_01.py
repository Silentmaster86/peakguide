import hashlib
import json
import math
import unittest
import xml.etree.ElementTree as ET
from pathlib import Path
from build_nonkgp_01 import FOLDER, generate, payload


class NonKgpSourceTest(unittest.TestCase):
    def test_direction_scope_and_independent_summit_anchors(self):
        trails={r['body']['peak_slug']:r['body']for r in payload()['records']if r['kind']=='trail'}
        anchors={'lysina':(20.048920,49.775906),'snieznica':(20.177236,49.715231),'gora-zar':(19.224869,49.787239),'leskowiec':(19.443444,49.788611)}
        metrics={'lysina':(8.5,718,210),'snieznica':(2.2,328,67),'gora-zar':(2.5,372,75),'leskowiec':(2.5,405,80)}
        for peak,trail in trails.items():
            end=trail['route_geometry']['coordinates'][-1][-1];anchor=anchors[peak]
            self.assertLess(math.hypot((end[0]-anchor[0])*72000,(end[1]-anchor[1])*111000),200)
            self.assertEqual(tuple(trail[k]for k in ['distance_km','elevation_gain_m','time_min']),metrics[peak])
            self.assertEqual(trail['route_type'],'point-to-point')
        self.assertNotIn('ostry-wierch',trails)
        self.assertLess(trails['snieznica']['route_geometry']['coordinates'][0][0][1],49.701)

    def test_adapted_gpx_preserves_every_coordinate_and_elevation(self):
        trail=next(r['body']for r in payload()['records']if r['kind']=='trail'and r['body']['peak_slug']=='lysina')
        ns={'g':'http://www.topografix.com/GPX/1/1'}
        root=ET.parse(FOLDER/'routes/lysina-pcim-kudlacze-wejscie.gpx').getroot()
        lines=[[[float(p.attrib['lon']),float(p.attrib['lat'])]for p in seg.findall('g:trkpt',ns)]for seg in root.findall('g:trk/g:trkseg',ns)]
        self.assertEqual(lines,trail['route_geometry']['coordinates'])
        points=root.findall('g:trk/g:trkseg/g:trkpt',ns)
        self.assertEqual(len(points),208)
        self.assertTrue(all(p.find('g:ele',ns)is not None for p in points))
        elevations=[float(p.find('g:ele',ns).text)for p in points]
        review=next(r for r in json.loads((FOLDER/'geometry-review.json').read_text())if r['peak_slug']=='lysina')
        self.assertEqual(hashlib.sha256(json.dumps(elevations,separators=(',',':')).encode()).hexdigest(),review['adapted_elevations_sha256'])
        self.assertIn('PTTK',root.attrib['creator'])
        self.assertEqual(root.find('g:metadata/g:link',ns).attrib['href'],trail['source_url'])
        self.assertGreater(lines[0][0][1],49.75)
        self.assertLess(lines[0][0][0],20)

    def test_generated_sql_is_current_and_no_text_has_known_mojibake(self):
        for name,sql in generate().items():
            self.assertTrue(sql.isascii());self.assertEqual(sql,(FOLDER/name).read_text(encoding='ascii'))
        text=(FOLDER/'records.json').read_text(encoding='utf-8')
        for bad in ['\ufffd','BiaÅ','Ð','ï¼','Ã³']:self.assertNotIn(bad,text)
        pois=[r['body']for r in payload()['records']if r['kind']=='poi']
        self.assertTrue(all(p['trail_id']is None for p in pois))
        self.assertEqual(sum(p['type_slug']=='shelter'for p in pois),3)


if __name__=='__main__':unittest.main()
