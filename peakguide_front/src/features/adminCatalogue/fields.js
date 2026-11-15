export const commonFields=[['peak_id','peak','peak',true],['source_url','source','url'],['last_verified_at','verified','datetime-local']];
export const fields={
 trail:[['slug','slug','text',true],['start_point_name','start','text'],['end_point_name','end','text'],['distance_km','distance','number'],['elevation_gain_m','ascent','number'],['time_min','time','number'],['difficulty','difficulty','difficulty'],['route_type','routeType','routeType',true],['map_url','map','url'],['gpx_url','gpx','url'],['distance_source_url','distanceSource','url'],['distance_verified_at','distanceDate','datetime-local'],['elevation_gain_source_url','ascentSource','url'],['elevation_gain_verified_at','ascentDate','datetime-local'],['time_source_url','timeSource','url'],['time_verified_at','timeDate','datetime-local'],['route_geometry','geometry','json'],['geometry_source_url','geometrySource','url'],['geometry_verified_at','geometryDate','datetime-local']],
 poi:[['type_id','type','type',true],['trail_id','trail','trail'],['latitude','latitude','number'],['longitude','longitude','number'],['website_url','website','url'],['google_maps_url','map','url']],
};
export const langs=['pl','en','ua','zh'];
export function draftFor(kind,row){
 const draft={active:row?.active??false,i18n:Object.fromEntries(langs.map(lang=>[lang,{name:'',description:'',notes:'',tips:''}]))};
 for(const [key,,type] of [...commonFields,...fields[kind]]){
  const value=row?.[key];
  draft[key]=type==='json'?(value?JSON.stringify(value,null,2):''):type==='datetime-local'?(value?new Date(value).toISOString().slice(0,16):''):value??'';
 }
 draft.route_type=draft.route_type||'out-and-back';
 for(const tr of row?.[`${kind==='trail'?'trails':'pois'}_i18n`]||[])if(draft.i18n[tr.lang])draft.i18n[tr.lang]={...draft.i18n[tr.lang],...tr};
 return draft;
}
export function payloadFor(kind,draft){
 const body={active:draft.active===true};
 for(const [key,,type] of [...commonFields,...fields[kind]]){
  const value=String(draft[key]??'').trim();
  if(type==='number'&&value&&!Number.isFinite(Number(value)))throw new Error('Invalid number');
  body[key]=!value?null:type==='number'||['peak','trail','type'].includes(type)?Number(value):type==='json'?JSON.parse(value):type==='datetime-local'?new Date(value+'Z').toISOString():value;
 }
 body.i18n=Object.fromEntries(langs.filter(lang=>Object.values(draft.i18n[lang]).some(v=>typeof v==='string'&&v.trim())).map(lang=>[lang,Object.fromEntries(['name','description',kind==='trail'?'notes':'tips'].map(key=>[key,String(draft.i18n[lang][key]||'').trim()]))]));
 return body;
}
