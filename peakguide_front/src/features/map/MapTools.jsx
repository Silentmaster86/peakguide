import {useEffect,useRef} from 'react';
import {useMapEvents} from 'react-leaflet';

export function MapViewport({points,fitRequest,expanded,onPopupOpen}){
 const map=useMapEvents({popupopen:()=>onPopupOpen(),click:()=>onPopupOpen()});
 useEffect(()=>{if(fitRequest&&points.length)map.fitBounds(points.map(p=>p.point),{padding:[35,35],maxZoom:12,animate:false});},[map,points,fitRequest]);
 useEffect(()=>{const frame=requestAnimationFrame(()=>map.invalidateSize({pan:false}));return()=>cancelAnimationFrame(frame);},[map,expanded]);
 return null;
}

export default function MapTools({labels,layerLabels,baseLayer,onLayer,showPois,onPois,showTrails,onTrails,extra,onFit,expanded,onExpand,poiKinds,hasRoutes,open,onOpen}){
 const button=useRef(null),panel=useRef(null);
 useEffect(()=>{
  if(!open)return;
  function dismiss(e){if(e.key==='Escape'){e.stopPropagation();onOpen(false);button.current?.focus();}}
  const element=panel.current;element?.addEventListener('keydown',dismiss);
  return()=>element?.removeEventListener('keydown',dismiss);
 },[open,onOpen]);
 return <>
  <div className="pg-map-actions">
   <button type="button" onClick={onFit} aria-label={labels.fit} title={labels.fit}>⌖</button>
   <button type="button" onClick={onExpand} aria-label={expanded?labels.collapse:labels.expand} title={expanded?labels.collapse:labels.expand} aria-pressed={expanded}>{expanded?'↙':'⛶'}</button>
  </div>
  <div className="pg-map-layers" ref={panel}>
   <button ref={button} className="pg-map-layers-toggle" type="button" aria-expanded={open} aria-controls="pg-map-layer-options" onClick={()=>onOpen(!open)}><span aria-hidden="true">▱</span> {labels.layers}</button>
   <div id="pg-map-layer-options" className="pg-map-layer-options" hidden={!open}>
    <label>{layerLabels[0]}<select value={baseLayer} onChange={e=>onLayer(e.target.value)}>{['standard','satellite','topo'].map((key,i)=><option key={key} value={key}>{layerLabels[i+1]}</option>)}</select></label>
    <label className="pg-map-check"><input type="checkbox" checked={showPois} onChange={e=>onPois(e.target.checked)}/>{extra.pois}</label>
    <label className="pg-map-check"><input type="checkbox" checked={showTrails} onChange={e=>onTrails(e.target.checked)}/>{extra.routeLayer}</label>
   </div>
  </div>
  <div className="pg-map-legend" aria-label={labels.legend}>
   {['peak',...poiKinds,...(hasRoutes?['route']:[])].map(kind=><span key={kind}><i aria-hidden="true" className={`pg-legend-dot pg-legend-dot--${kind}`}/>{labels[kind]}</span>)}
  </div>
 </>;
}
