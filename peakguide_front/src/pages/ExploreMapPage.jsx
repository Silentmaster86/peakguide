import { useMemo, useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchPeaks } from '../api/peakguide';
import { useAsync } from '../hooks/useAsync';
import { parseCoordinates } from '../utils/coordinates';
import { normalizeSearchText } from '../utils/search';
import PageSEO from '../seo/PageSEO';
import {fetchMapFeatures,overlayPois,overlayTrails} from '../api/mapFeatures';
import MapOverlays from '../components/MapOverlays';
import MapTools,{MapViewport} from '../features/map/MapTools';
import {mapIcon,clusterIcon,mapLabels,poiKind} from '../features/map/presentation';
import {catalogueLabels} from '../features/adminCatalogue/labels';
import MapResultList from '../features/map/MapResultList';

const copy = {
 pl: ['Mapa szczytów','Szukaj szczytu','Kraj','Wszystkie kraje','Pasmo','Wszystkie pasma','Wczytywanie szczytów…','Nie udało się pobrać szczytów.','Spróbuj ponownie','Brak szczytów dla tych filtrów.','Szczyty na mapie','Zobacz szczegóły','Nie udało się wczytać części mapy. Lista szczytów nadal działa.','Bez poprawnych współrzędnych','Lista szczytów','Przybliż grupę','Przesuwaj mapę i używaj przycisków +/−. Kliknij punkt, aby zobaczyć szczyt.'],
 en: ['Peak map','Search peaks','Country','All countries','Range','All ranges','Loading peaks…','Could not load peaks.','Retry','No peaks match these filters.','Peaks on map','View details','Some map tiles could not load. The peak list remains available.','Without valid coordinates','Peak list','Zoom into group','Drag the map and use the +/− controls. Select a point to view a peak.'],
 ua: ['Мапа вершин','Пошук вершин','Країна','Усі країни','Хребет','Усі хребти','Завантаження вершин…','Не вдалося завантажити вершини.','Спробувати знову','Немає вершин за цими фільтрами.','Вершини на мапі','Докладніше','Частину мапи не вдалося завантажити. Список вершин залишається доступним.','Без коректних координат','Список вершин','Наблизити групу','Перетягуйте мапу й використовуйте кнопки +/−. Натисніть точку, щоб переглянути вершину.'],
 zh: ['山峰地图','搜索山峰','国家','所有国家','山脉','所有山脉','正在加载山峰…','无法加载山峰。','重试','没有符合筛选条件的山峰。','地图上的山峰','查看详情','部分地图图块无法加载，仍可使用山峰列表。','无有效坐标','山峰列表','放大此组','拖动地图并使用 +/− 按钮缩放。点击标记查看山峰。'],
};

const baseLayers = {
 standard: {url:'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',maxNativeZoom:19,attribution:'&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'},
 satellite: {url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',maxNativeZoom:19,attribution:'Source: <a href="https://goto.arcgisonline.com/maps/World_Imagery">Esri</a>, Vantor, Earthstar Geographics, and the GIS User Community'},
 topo: {url:'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',maxNativeZoom:19,attribution:'Sources: <a href="https://www.arcgis.com/home/item.html?id=30e5fe3149c34df1ba922e6f5bbf808f">Esri</a>, HERE, Garmin, Intermap, increment P Corp., GEBCO, USGS, FAO, NPS, NRCAN, GeoBase, IGN, Kadaster NL, Ordnance Survey, Esri Japan, METI, Esri China (Hong Kong), &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, and the GIS User Community'},
};
const layerLabels = {
 pl: ['Widok mapy','Standardowy','Satelitarny','Topograficzny'],
 en: ['Map view','Standard','Satellite','Topographic'],
 ua: ['Вигляд мапи','Звичайний','Супутниковий','Топографічний'],
 zh: ['地图视图','标准','卫星','地形'],
};
function savedLayer() {
 try { const value=localStorage.getItem('peakguide_map_layer'); return Object.hasOwn(baseLayers,value)?value:'standard'; }
 catch { return 'standard'; }
}

function FitResults({ peaks }) {
 const map = useMap();
 useEffect(() => {
  if (peaks.length) map.fitBounds(peaks.map(p=>p.point), {padding:[35,35],maxZoom:12,animate:false});
  const frame=requestAnimationFrame(()=>map.invalidateSize());
  return ()=>cancelAnimationFrame(frame);
 }, [map, peaks]);
 return null;
}

function Points({ peaks, t, ui }) {
 const map = useMap();
 const [zoom, setZoom] = useState(map.getZoom());
 useMapEvents({zoomend:()=>setZoom(map.getZoom())});
 // Merge nearby projected points, including neighbors across grid boundaries.
 const groups = useMemo(()=>{
  const clusters=[];
  for (const peak of peaks) {
   const point={...peak,pixel:map.project(peak.point,zoom)};
   const matches=zoom>=13?[]:clusters.filter(group=>group.some(p=>p.pixel.distanceTo(point.pixel)<48));
   const merged=[point,...matches.flat()];
   for(const match of matches) clusters.splice(clusters.indexOf(match),1);
   clusters.push(merged);
  }
  return clusters.map(items=>[items.map(p=>p.slug).sort().join('|'),items]);
 },[map,peaks,zoom]);
 return groups.map(([key,items])=>{
  const center=items.reduce((a,p)=>[a[0]+p.point[0]/items.length,a[1]+p.point[1]/items.length],[0,0]);
  return <Marker key={key} position={center} icon={items.length>1?clusterIcon(items.length):mapIcon('peak')} title={items.length>1?`${t[15]} (${items.length})`:items[0].peak_name} alt={items.length>1?`${items.length}`:items[0].peak_name}>
   <Popup className="pg-map-popup" maxWidth={240} minWidth={140} autoPanPaddingTopLeft={[12,165]} autoPanPaddingBottomRight={[12,48]}>
    {items.length>1?<><button type="button" onClick={()=>map.fitBounds(items.map(p=>p.point),{padding:[35,35],maxZoom:Math.max(14,zoom+2),animate:false})}>{t[15]} ({items.length})</button><ul>{items.map(p=><li key={p.slug}><Link to={`/peaks/${p.slug}`}>{p.peak_name}</Link> · {p.elevation_m} m</li>)}</ul></>:<>
     <span className="pg-popup-category">{ui.peak}</span><h3>{items[0].peak_name}</h3><p className="pg-popup-altitude">{items[0].elevation_m} m</p><p>{items[0].range_name}</p><Link className="pg-popup-link" to={`/peaks/${items[0].slug}`}>{ui.details}</Link>
    </>}
   </Popup>
  </Marker>;
 });
}

export default function ExploreMapPage({lang='pl'}) {
 const t=copy[lang]||copy.pl;
 const ui=mapLabels(lang);
 const [expanded,setExpanded]=useState(false),[fitRequest,setFitRequest]=useState(0),[layerPanelOpen,setLayerPanelOpen]=useState(false);
 const expandButton=useRef(null);
 useEffect(()=>{
  if(!expanded)return;
  const previous=document.body.style.overflow;document.body.style.overflow='hidden';
  function close(e){
   if(e.key==='Escape'&&!e.defaultPrevented){setExpanded(false);expandButton.current?.querySelector('[aria-pressed]')?.focus();}
   if(e.key==='Tab'){
    const controls=[...expandButton.current.querySelectorAll('button,a[href],select,input,[tabindex="0"]')].filter(el=>el.getClientRects().length&&!el.disabled);
    const first=controls[0],last=controls.at(-1);
    if(controls.length&&((e.shiftKey&&document.activeElement===first)||(!e.shiftKey&&document.activeElement===last)||!expandButton.current.contains(document.activeElement))){e.preventDefault();(e.shiftKey?last:first).focus();}
   }
  }
  document.addEventListener('keydown',close);
  return()=>{document.body.style.overflow=previous;document.removeEventListener('keydown',close);};
 },[expanded]);
 const extra=catalogueLabels(lang);
 const [showPeaks,setShowPeaks]=useState(true),[showPois,setShowPois]=useState(false),[showTrails,setShowTrails]=useState(false),[featureRetry,setFeatureRetry]=useState(0);
 const poiState=useAsync(()=>showPois?fetchMapFeatures('poi',lang):Promise.resolve([]),[showPois,lang,featureRetry]);
 const trailState=useAsync(()=>showTrails?fetchMapFeatures('trail',lang):Promise.resolve([]),[showTrails,lang,featureRetry]);
 const layers=layerLabels[lang]||layerLabels.pl;
 const [baseLayer,setBaseLayer]=useState(savedLayer);
 const layer=baseLayers[baseLayer];
 const [retry,setRetry]=useState(0),[query,setQuery]=useState(''),[country,setCountry]=useState(''),[range,setRange]=useState('');
 const [tileError,setTileError]=useState(null),[tiles,setTiles]=useState(0);
 const layerKey=`${baseLayer}-${tiles}`;
 function changeLayer(value) {
  setBaseLayer(value);setTileError(null);
  try { localStorage.setItem('peakguide_map_layer',value); } catch { /* Storage is optional. */ }
 }
 const result=useAsync(()=>fetchPeaks({lang}),[lang,retry]);
 const peaks=useMemo(()=>result.data||[],[result.data]);
 const countries=[...new Map(peaks.map(p=>[p.country_slug,p.country_name])).entries()].filter(([k])=>k);
 const ranges=[...new Map(peaks.filter(p=>!country||p.country_slug===country).map(p=>[p.range_slug,p.range_name])).entries()].filter(([k])=>k);
 const filtered=useMemo(()=>peaks.filter(p=>(!country||p.country_slug===country)&&(!range||p.range_slug===range)&&normalizeSearchText(`${p.peak_name} ${p.slug} ${p.range_name}`).includes(normalizeSearchText(query))),[peaks,country,range,query]);
 const located=useMemo(()=>filtered.map(p=>{const c=parseCoordinates(p.latitude,p.longitude);return {...p,point:c?[c.lat,c.lon]:null};}).filter(p=>p.point),[filtered]); // Stable results keep user panning intact.
 const peakIds=useMemo(()=>new Set(filtered.map(p=>Number(p.id))),[filtered]);
 const mapPois=useMemo(()=>showPois?overlayPois(poiState.data||[],peakIds):[],[showPois,poiState.data,peakIds]);
 const mapTrails=useMemo(()=>showTrails?overlayTrails(trailState.data||[],peakIds):[],[showTrails,trailState.data,peakIds]);
 const mapPoints=useMemo(()=>{
  const points=[...(showPeaks?located:[]),...mapPois.map(p=>({point:[p.coords.lat,p.coords.lon]}))];
  for(const trail of mapTrails){
   const lines=trail.route_geometry.type==='LineString'?[trail.route_geometry.coordinates]:trail.route_geometry.coordinates;
   let minLat=90,minLon=180,maxLat=-90,maxLon=-180;
   for(const line of lines)for(const [lon,lat] of line){minLat=Math.min(minLat,lat);minLon=Math.min(minLon,lon);maxLat=Math.max(maxLat,lat);maxLon=Math.max(maxLon,lon);}
   points.push({point:[minLat,minLon]},{point:[maxLat,maxLon]});
  }
  return points;
 },[showPeaks,located,mapPois,mapTrails]);
 return <section className="explore-map-page">
  <PageSEO page="map" lang={lang}/><h1>{t[0]}</h1>
  <div className="explore-map-filters">
   <label>{t[1]}<input type="search" value={query} onChange={e=>setQuery(e.target.value)}/></label>
   <label>{t[2]}<select value={country} onChange={e=>{setCountry(e.target.value);setRange('');}}><option value="">{t[3]}</option>{countries.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>
   <label>{t[4]}<select value={range} onChange={e=>setRange(e.target.value)}><option value="">{t[5]}</option>{ranges.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>
  </div>
  {((showPois&&poiState.status==='error')||(showTrails&&trailState.status==='error'))&&<p role="alert">{extra.error} <button onClick={()=>setFeatureRetry(v=>v+1)}>{t[8]}</button></p>}
  {['idle','loading'].includes(result.status)?<p role="status">{t[6]}</p>:result.status==='error'?<p role="alert">{t[7]} <button onClick={()=>setRetry(v=>v+1)}>{t[8]}</button></p>:<>
   <div className="pg-map-summary" role="status"><span>{t[10]}: {showPeaks?located.length:0} · {t[13]}: {filtered.length-located.length}</span>{showPois&&<span>{extra.pois}: {mapPois.length}</span>}{showTrails&&<span>{extra.routeLayer}: {mapTrails.length}</span>}</div>
   {tileError===layerKey&&<p role="alert">{t[12]} <button onClick={()=>{setTileError(null);setTiles(v=>v+1);}}>{t[8]}</button></p>}
   {(located.length>0||mapPoints.length>0)&&<><div ref={expandButton} className={`explore-map-canvas${expanded?' is-expanded':''}`} role={expanded?'dialog':'region'} aria-modal={expanded||undefined} aria-label={t[0]}>
    <MapContainer center={[49,20]} zoom={5} zoomAnimation={false} markerZoomAnimation={false} fadeAnimation={false} scrollWheelZoom={false} style={{height:'100%',width:'100%'}}>
     <TileLayer key={layerKey} {...layer} maxZoom={22} eventHandlers={{tileerror:()=>setTileError(layerKey)}}/>
     <FitResults peaks={mapPoints}/><MapViewport points={mapPoints.length?mapPoints:located} fitRequest={fitRequest} expanded={expanded} onPopupOpen={()=>setLayerPanelOpen(false)}/>{showPeaks&&<Points peaks={located} t={t} ui={ui}/>}<MapOverlays pois={mapPois} trails={mapTrails} sourceLabel={extra.source} ui={ui}/>
    </MapContainer>
    <MapTools open={layerPanelOpen} onOpen={setLayerPanelOpen} labels={ui} layerLabels={layers} baseLayer={baseLayer} onLayer={changeLayer} showPeaks={showPeaks} onPeaks={setShowPeaks} showPois={showPois} onPois={setShowPois} showTrails={showTrails} onTrails={setShowTrails} extra={extra} onFit={()=>setFitRequest(v=>v+1)} expanded={expanded} onExpand={()=>setExpanded(v=>!v)} poiKinds={[...new Set(mapPois.map(poiKind))]} hasRoutes={mapTrails.length>0}/>
   </div><p className="pg-map-hint">{t[16]}{showTrails&&<> {extra.geometryHelp}</>}</p></>}
   {showPois&&<MapResultList items={(poiState.data||[]).filter(p=>peakIds.has(Number(p.peak_id)))} kind="poi" lang={lang} label={extra.pois}/>}
   {showTrails&&<MapResultList items={(trailState.data||[]).filter(p=>peakIds.has(Number(p.peak_id)))} kind="trail" lang={lang} label={extra.trails}/>}
   <h2>{t[14]}</h2>
   {!filtered.length?<p>{t[9]}</p>:<MapResultList items={filtered} lang={lang} label={t[14]}/>}
  </>}
 </section>;
}
