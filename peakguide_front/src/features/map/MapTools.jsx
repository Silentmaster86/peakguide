import {useEffect,useRef} from 'react';
import {useMapEvents} from 'react-leaflet';
import {symbol} from './presentation';

export function MapViewport({points,fitRequest,expanded,onPopupOpen}){
 const map=useMapEvents({popupopen:()=>onPopupOpen(),click:()=>onPopupOpen()});
 useEffect(()=>{if(fitRequest&&points.length)map.fitBounds(points.map(p=>p.point),{padding:[35,35],maxZoom:12,animate:false});},[map,points,fitRequest]);
 useEffect(()=>{const frame=requestAnimationFrame(()=>map.invalidateSize({pan:false}));return()=>cancelAnimationFrame(frame);},[map,expanded]);
 return null;
}

export default function MapTools({labels,layerLabels,baseLayer,onLayer,showPeaks,onPeaks,showPois,onPois,showTrails,onTrails,extra,onFit,expanded,onExpand,poiKinds,hasRoutes,open,onOpen}){
 const button=useRef(null),panel=useRef(null);
 const legendKinds=[...(showPeaks?['peak']:[]),...poiKinds,...(hasRoutes?['route']:[])];
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
   <button ref={button} className="pg-map-layers-toggle" type="button" aria-label={labels.layers} title={labels.layers} aria-expanded={open} aria-controls="pg-map-layer-options" onClick={()=>onOpen(!open)}><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m12 3 9 5-9 5-9-5 9-5Z"/><path d="m3 12 9 5 9-5M3 16l9 5 9-5"/></svg></button>
   <div id="pg-map-layer-options" className="pg-map-layer-options" hidden={!open}>
    <label>{layerLabels[0]}<select value={baseLayer} onChange={e=>onLayer(e.target.value)}>{['standard','satellite','topo'].map((key,i)=><option key={key} value={key}>{layerLabels[i+1]}</option>)}</select></label>
    <label className="pg-map-check"><input type="checkbox" checked={showPeaks} onChange={e=>onPeaks(e.target.checked)}/>{labels.peaks}</label>
    <label className="pg-map-check"><input type="checkbox" checked={showPois} onChange={e=>onPois(e.target.checked)}/>{extra.pois}</label>
    <label className="pg-map-check"><input type="checkbox" checked={showTrails} onChange={e=>onTrails(e.target.checked)}/>{extra.routeLayer}</label>
    {legendKinds.length>0&&<div className="pg-map-legend" role="group" aria-label={labels.legend}>
     {legendKinds.map(kind=><span key={kind}><i aria-hidden="true" className={`pg-legend-symbol pg-legend-symbol--${kind}`} dangerouslySetInnerHTML={{__html:symbol(kind)}}/>{labels[kind]}</span>)}
    </div>}
   </div>
  </div>
 </>;
}
