import {validRouteGeometry} from '../utils/routeGeometry';
export {validRouteGeometry} from '../utils/routeGeometry';
import {parseCoordinates} from '../utils/coordinates';
import {supabase} from '../lib/supabaseClient';
import {translation} from '../utils/practical.mjs';
export async function fetchMapFeatures(kind,lang){
 const table=kind==='poi'?'pois':kind==='trail'?'trails':null;
 if(!table)throw new Error('Invalid kind');
 const {data,error}=await supabase.from(table).select(`*,${table}_i18n(*),peaks!inner(id,slug,active)`).eq('active',true).eq('peaks.active',true);
 if(error)throw error;
 return (data||[]).filter(row=>row.active!==false&&row.peaks?.active!==false).map(row=>({...row,name:translation(row[`${table}_i18n`],lang)?.name||row.slug||'',peak_slug:row.peaks?.slug}));
}

export function overlayPois(rows,peakIds){return rows.filter(p=>peakIds.has(Number(p.peak_id))).map(p=>({...p,coords:parseCoordinates(p.latitude,p.longitude)})).filter(p=>p.coords);}
export function overlayTrails(rows,peakIds){return rows.filter(p=>peakIds.has(Number(p.peak_id))&&validRouteGeometry(p.route_geometry));}
