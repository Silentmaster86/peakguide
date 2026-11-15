import {useMemo} from 'react';
import {CircleMarker,GeoJSON,Popup} from 'react-leaflet';
import {Link} from 'react-router-dom';
import {safeUrl} from '../utils/practical.mjs';
import {validRouteGeometry} from '../utils/routeGeometry';

export default function MapOverlays({pois,trails,sourceLabel}){
 const geometries=useMemo(()=>trails.map(trail=>({...trail,geometry:validRouteGeometry(trail.route_geometry)})),[trails]);
 return <>
  {pois.map(p=><CircleMarker key={`poi-${p.id}`} center={[p.coords.lat,p.coords.lon]} radius={7} pathOptions={{color:'#fff',weight:2,fillColor:'#155bb5',fillOpacity:1}}>
   <Popup><b>{p.name}</b><p><Link to={`/peaks/${p.peak_slug}?tab=pois`}>{p.peak_slug}</Link></p>{safeUrl(p.source_url)&&<a href={safeUrl(p.source_url)} target="_blank" rel="noopener noreferrer">{sourceLabel}</a>}</Popup>
  </CircleMarker>)}
  {geometries.map(p=><GeoJSON key={`${p.id}-${p.updated_at||''}`} data={p.geometry} style={{color:'#b83f16',weight:4,opacity:0.9}}>
   <Popup><Link to={`/peaks/${p.peak_slug}?tab=trails&trail=${encodeURIComponent(p.slug)}`}>{p.name}</Link>{safeUrl(p.geometry_source_url)&&<p><a href={safeUrl(p.geometry_source_url)} target="_blank" rel="noopener noreferrer">{sourceLabel}</a></p>}</Popup>
  </GeoJSON>)}
 </>;
}
