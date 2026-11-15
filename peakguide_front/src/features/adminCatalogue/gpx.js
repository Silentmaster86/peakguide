import {validRouteGeometry} from '../../utils/routeGeometry';
export function geometryFromGpx(text){
 if(typeof text!=='string'||text.length>2_000_000)throw new Error('Invalid GPX');
 const xml=new DOMParser().parseFromString(text,'application/xml');
 if(xml.querySelector('parsererror')||xml.documentElement.localName!=='gpx')throw new Error('Invalid GPX');
 const point=node=>{
  if(!node.getAttribute('lat')?.trim()||!node.getAttribute('lon')?.trim())throw new Error('Invalid GPX point');
  return [Number(node.getAttribute('lon')),Number(node.getAttribute('lat'))];
 };
 const lines=[...xml.getElementsByTagNameNS('*','trkseg')].map(segment=>[...segment.getElementsByTagNameNS('*','trkpt')].map(point));
 if(!lines.length)for(const route of xml.getElementsByTagNameNS('*','rte'))lines.push([...route.getElementsByTagNameNS('*','rtept')].map(point));
 const geometry=lines.length===1?{type:'LineString',coordinates:lines[0]}:{type:'MultiLineString',coordinates:lines};
 if(!validRouteGeometry(geometry))throw new Error('Invalid GPX');
 return geometry;
}
