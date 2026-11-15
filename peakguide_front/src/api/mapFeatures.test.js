import {expect,it,vi} from 'vitest';
vi.mock('../lib/supabaseClient',()=>({supabase:{}}));
import {validRouteGeometry,overlayPois,overlayTrails} from './mapFeatures';
it('rejects malformed or impossible route geometry',()=>{
 for(const value of [null,{type:'Point',coordinates:[20,50]},{type:'LineString',coordinates:[[20,50]]},{type:'LineString',coordinates:[[200,50],[20,50]]},{type:'MultiLineString',coordinates:[]}])expect(validRouteGeometry(value)).toBeNull();
 expect(validRouteGeometry({type:'LineString',coordinates:[[20,50],[20.1,50.1]]})).toBeTruthy();
});
it('applies peak filters and keeps records without geometry off the map',()=>{
 const ids=new Set([1]);
 expect(overlayPois([{peak_id:1,latitude:50,longitude:20},{peak_id:2,latitude:51,longitude:21},{peak_id:1,latitude:null,longitude:null}],ids)).toHaveLength(1);
 expect(overlayTrails([{peak_id:1,route_geometry:null},{peak_id:2,route_geometry:{type:'LineString',coordinates:[[20,50],[20.1,50.1]]}}],ids)).toHaveLength(0);
});
