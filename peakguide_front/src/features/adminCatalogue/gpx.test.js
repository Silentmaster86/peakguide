import {expect,it} from 'vitest';
import {geometryFromGpx} from './gpx';
it('preserves disconnected segments without inventing straight connectors',()=>{
 const g=geometryFromGpx('<gpx xmlns="http://www.topografix.com/GPX/1/1"><trk><trkseg><trkpt lat="50" lon="20"/><trkpt lat="50.1" lon="20.1"/></trkseg><trkseg><trkpt lat="51" lon="21"/><trkpt lat="51.1" lon="21.1"/></trkseg></trk></gpx>');
 expect(g.type).toBe('MultiLineString');expect(g.coordinates).toHaveLength(2);expect(g.coordinates[0][0]).toEqual([20,50]);
});
it('rejects malformed, oversized and impossible-coordinate GPX',()=>{
 for(const text of ['not xml','<gpx/>','<gpx><rte><rtept lat="50"/><rtept lat="51" lon="20"/></rte></gpx>','<gpx><rte><rtept lat="99" lon="20"/><rtept lat="50" lon="20"/></rte></gpx>','x'.repeat(2_000_001)])expect(()=>geometryFromGpx(text)).toThrow();
});
