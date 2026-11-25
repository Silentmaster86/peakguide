import {expect,it} from 'vitest';
import data from './data/lysina-pcim-kudlacze-wejscie.json';
import {profileMatches,profilePaths,reviewedProfile} from './profile';
const trail=()=>({slug:data.trail_slug,peak_id:data.peak_id,gpx_url:data.gpx_url,geometry_source_url:data.geometry_source_url,route_geometry:{type:'MultiLineString',coordinates:data.segments.map(s=>s.map(p=>p.slice(0,2)))}});
it('binds the profile to the exact reviewed route and source, not only its peak',()=>{
 expect(reviewedProfile(trail())).toBe(true);expect(profileMatches(data,trail())).toBe(true);
 for(const patch of [{slug:'other-route'},{peak_id:999},{gpx_url:'https://example.com/other.gpx'},{geometry_source_url:'https://example.com/source'},{route_geometry:null}])expect(profileMatches(data,{...trail(),...patch})).toBe(false);
 const edited=trail();edited.route_geometry.coordinates[0][0][0]+=.001;expect(profileMatches(data,edited)).toBe(false);
 const threeD=trail();threeD.route_geometry.coordinates[0][0].push(100);expect(profileMatches(data,threeD)).toBe(false);
});
it('never joins missing elevation samples or separate GPX segments',()=>{
 const paths=profilePaths([[[0,0,10,0],[0,0,20,1],[0,0,null,2],[0,0,30,3],[0,0,40,4]],[[0,0,50,4],[0,0,60,5]]],v=>v,v=>v);
 expect(paths[0]).toBe('M0.00,10.00 L1.00,20.00  M3.00,30.00 L4.00,40.00');expect(paths[1]).toBe('M4.00,50.00 L5.00,60.00');
});
