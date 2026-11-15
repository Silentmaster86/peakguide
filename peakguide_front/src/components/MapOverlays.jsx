import {useMemo} from 'react';
import {Marker,GeoJSON,Popup} from 'react-leaflet';
import {Link} from 'react-router-dom';
import {safeUrl} from '../utils/practical.mjs';
import {mapIcon,poiKind} from '../features/map/presentation';
import {validRouteGeometry} from '../utils/routeGeometry';

export default function MapOverlays({pois,trails,sourceLabel,ui}){
 const geometries=useMemo(()=>trails.map(trail=>({...trail,geometry:validRouteGeometry(trail.route_geometry)})),[trails]);
 return <>
  {pois.map(p=><Marker key={`poi-${p.id}`} position={[p.coords.lat,p.coords.lon]} icon={mapIcon(poiKind(p))} title={p.name} alt={p.name}>
   <Popup className="pg-map-popup" maxWidth={240} minWidth={140} autoPanPaddingTopLeft={[12,165]} autoPanPaddingBottomRight={[12,48]}><span className="pg-popup-category">{ui[poiKind(p)]}</span><h3>{p.name}</h3><p><Link className="pg-popup-link" to={`/peaks/${p.peak_slug}?tab=pois`}>{ui.details}</Link></p>{safeUrl(p.source_url)&&<a href={safeUrl(p.source_url)} target="_blank" rel="noopener noreferrer">{sourceLabel}</a>}</Popup>
  </Marker>)}
  {geometries.map(p=><GeoJSON key={`${p.id}-${p.updated_at||''}`} data={p.geometry} style={{color:'#b83f16',weight:5,opacity:0.95,className:'pg-map-route'}}>
   <Popup><Link to={`/peaks/${p.peak_slug}?tab=trails&trail=${encodeURIComponent(p.slug)}`}>{p.name}</Link>{safeUrl(p.geometry_source_url)&&<p><a href={safeUrl(p.geometry_source_url)} target="_blank" rel="noopener noreferrer">{sourceLabel}</a></p>}</Popup>
  </GeoJSON>)}
 </>;
}
