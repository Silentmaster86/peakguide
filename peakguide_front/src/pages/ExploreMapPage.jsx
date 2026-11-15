import { useMemo, useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { MapContainer, TileLayer, CircleMarker, Popup, Tooltip, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { fetchPeaks } from '../api/peakguide';
import { useAsync } from '../hooks/useAsync';
import { parseCoordinates } from '../utils/coordinates';
import { normalizeSearchText } from '../utils/search';
import PageSEO from '../seo/PageSEO';

const copy = {
 pl: ['Mapa szczytów','Szukaj szczytu','Kraj','Wszystkie kraje','Pasmo','Wszystkie pasma','Wczytywanie szczytów…','Nie udało się pobrać szczytów.','Spróbuj ponownie','Brak szczytów dla tych filtrów.','Szczyty na mapie','Zobacz szczegóły','Nie udało się wczytać części mapy. Lista szczytów nadal działa.','Bez poprawnych współrzędnych','Lista szczytów','Przybliż grupę','Przesuwaj mapę i używaj przycisków +/−. Kliknij punkt, aby zobaczyć szczyt.'],
 en: ['Peak map','Search peaks','Country','All countries','Range','All ranges','Loading peaks…','Could not load peaks.','Retry','No peaks match these filters.','Peaks on map','View details','Some map tiles could not load. The peak list remains available.','Without valid coordinates','Peak list','Zoom into group','Drag the map and use the +/− controls. Select a point to view a peak.'],
 ua: ['Мапа вершин','Пошук вершин','Країна','Усі країни','Хребет','Усі хребти','Завантаження вершин…','Не вдалося завантажити вершини.','Спробувати знову','Немає вершин за цими фільтрами.','Вершини на мапі','Докладніше','Частину мапи не вдалося завантажити. Список вершин залишається доступним.','Без коректних координат','Список вершин','Наблизити групу','Перетягуйте мапу й використовуйте кнопки +/−. Натисніть точку, щоб переглянути вершину.'],
 zh: ['山峰地图','搜索山峰','国家','所有国家','山脉','所有山脉','正在加载山峰…','无法加载山峰。','重试','没有符合筛选条件的山峰。','地图上的山峰','查看详情','部分地图图块无法加载，仍可使用山峰列表。','无有效坐标','山峰列表','放大此组','拖动地图并使用 +/− 按钮缩放。点击标记查看山峰。'],
};

function FitResults({ peaks }) {
 const map = useMap();
 useEffect(() => {
  if (peaks.length) map.fitBounds(peaks.map(p=>p.point), {padding:[35,35],maxZoom:12,animate:false});
  const frame=requestAnimationFrame(()=>map.invalidateSize());
  return ()=>cancelAnimationFrame(frame);
 }, [map, peaks]);
 return null;
}

function Points({ peaks, t }) {
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
  return <CircleMarker key={key} center={center} radius={items.length>1?16:8} pathOptions={{color:'#fff',weight:2,fillColor:'#155f3d',fillOpacity:1}}>
   {items.length>1&&<Tooltip permanent direction="center" className="explore-map-cluster">{items.length}</Tooltip>}
   <Popup>
    {items.length>1 && <button type="button" onClick={()=>map.fitBounds(items.map(p=>p.point),{padding:[35,35],maxZoom:Math.max(14,zoom+2),animate:false})}>{t[15]} ({items.length})</button>}
    <ul>{items.map(p=><li key={p.slug}><Link to={`/peaks/${p.slug}`}>{p.peak_name}</Link> · {p.elevation_m} m</li>)}</ul>
   </Popup>
  </CircleMarker>;
 });
}

export default function ExploreMapPage({lang='pl'}) {
 const t=copy[lang]||copy.pl;
 const [retry,setRetry]=useState(0),[query,setQuery]=useState(''),[country,setCountry]=useState(''),[range,setRange]=useState('');
 const [tileError,setTileError]=useState(false),[tiles,setTiles]=useState(0);
 const result=useAsync(()=>fetchPeaks({lang}),[lang,retry]);
 const peaks=useMemo(()=>result.data||[],[result.data]);
 const countries=[...new Map(peaks.map(p=>[p.country_slug,p.country_name])).entries()].filter(([k])=>k);
 const ranges=[...new Map(peaks.filter(p=>!country||p.country_slug===country).map(p=>[p.range_slug,p.range_name])).entries()].filter(([k])=>k);
 const filtered=useMemo(()=>peaks.filter(p=>(!country||p.country_slug===country)&&(!range||p.range_slug===range)&&normalizeSearchText(`${p.peak_name} ${p.slug} ${p.range_name}`).includes(normalizeSearchText(query))),[peaks,country,range,query]);
 const located=useMemo(()=>filtered.map(p=>{const c=parseCoordinates(p.latitude,p.longitude);return {...p,point:c?[c.lat,c.lon]:null};}).filter(p=>p.point),[filtered]); // Stable results keep user panning intact.
 return <section className="explore-map-page">
  <PageSEO page="map" lang={lang}/><h1>{t[0]}</h1>
  <div className="explore-map-filters">
   <label>{t[1]}<input type="search" value={query} onChange={e=>setQuery(e.target.value)}/></label>
   <label>{t[2]}<select value={country} onChange={e=>{setCountry(e.target.value);setRange('');}}><option value="">{t[3]}</option>{countries.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>
   <label>{t[4]}<select value={range} onChange={e=>setRange(e.target.value)}><option value="">{t[5]}</option>{ranges.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select></label>
  </div>
  {['idle','loading'].includes(result.status)?<p role="status">{t[6]}</p>:result.status==='error'?<p role="alert">{t[7]} <button onClick={()=>setRetry(v=>v+1)}>{t[8]}</button></p>:<>
   <p role="status">{t[10]}: {located.length} · {t[13]}: {filtered.length-located.length}</p>
   {tileError&&<p role="alert">{t[12]} <button onClick={()=>{setTileError(false);setTiles(v=>v+1);}}>{t[8]}</button></p>}
   {located.length>0&&<><p>{t[16]}</p><div className="explore-map-canvas" role="region" aria-label={t[0]}>
    <MapContainer center={[49,20]} zoom={5} zoomAnimation={false} markerZoomAnimation={false} fadeAnimation={false} scrollWheelZoom={false} style={{height:'100%',width:'100%'}}>
     <TileLayer key={tiles} url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors' eventHandlers={{tileerror:()=>setTileError(true)}}/>
     <FitResults peaks={located}/><Points peaks={located} t={t}/>
    </MapContainer>
   </div></>}
   <h2>{t[14]}</h2>
   {!filtered.length?<p>{t[9]}</p>:<ul className="explore-map-list">{filtered.map(p=><li key={p.slug}><Link to={`/peaks/${p.slug}`}>{p.peak_name}</Link> · {p.elevation_m} m · {p.range_name}</li>)}</ul>}
  </>}
 </section>;
}
