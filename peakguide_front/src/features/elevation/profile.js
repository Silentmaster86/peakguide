import index from './data/index.json';
import {validRouteGeometry} from '../../utils/routeGeometry';
const loaders=import.meta.glob('./data/*.json',{import:'default'});
export function reviewedProfile(trail){
 const entry=Object.hasOwn(index,trail?.slug||'')?index[trail.slug]:null;
 return Boolean(entry&&entry.peak_id===trail.peak_id&&entry.gpx_url===trail.gpx_url&&entry.geometry_source_url===trail.geometry_source_url);
}
export async function loadProfile(slug){
 if(!Object.hasOwn(index,slug))throw new Error('Unreviewed profile');
 return loaders[`./data/${slug}.json`]();
}
export function profileMatches(data,trail){
 if(!reviewedProfile(trail)||data?.trail_slug!==trail.slug||data.peak_id!==trail.peak_id||data.gpx_url!==trail.gpx_url||data.geometry_source_url!==trail.geometry_source_url||!validRouteGeometry(trail.route_geometry))return false;
 const lines=trail.route_geometry.type==='LineString'?[trail.route_geometry.coordinates]:trail.route_geometry.coordinates;
 return Array.isArray(data.segments)&&lines.length===data.segments.length&&lines.every((line,i)=>line.length===data.segments[i].length&&line.every((p,j)=>p.length===2&&p[0]===data.segments[i][j][0]&&p[1]===data.segments[i][j][1]));
}
export function profilePaths(segments,x,y){
 // Missing heights and separate GPX segments break the line. No gap is bridged.
 return segments.map(segment=>{
  let connected=false;
  return segment.map(p=>{
   if(p[2]===null){connected=false;return '';}
   const path=`${connected?'L':'M'}${x(p[3]).toFixed(2)},${y(p[2]).toFixed(2)}`;connected=true;return path;
  }).join(' ');
 }).filter(Boolean);
}
