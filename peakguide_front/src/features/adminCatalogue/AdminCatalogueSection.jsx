import {useEffect,useRef,useState} from 'react';
import {geometryFromGpx} from './gpx';
import {loadCatalogue,saveCatalogue} from './api';
import {catalogueLabels} from './labels';
import {commonFields,fields,langs,draftFor,payloadFor} from './fields';

export default function AdminCatalogueSection({kind='trail',lang='pl'}){
 const t=catalogueLabels(lang);
 const [data,setData]=useState({items:[],peaks:[],types:[],trails:[]});
 const [loading,setLoading]=useState(true),[error,setError]=useState(''),[retry,setRetry]=useState(0);
 const [editing,setEditing]=useState(null),[draft,setDraft]=useState(null),[busy,setBusy]=useState(false),[locale,setLocale]=useState(lang);
 const formRef=useRef(null),generation=useRef(0),draftVersion=useRef(0);
 const label=(rows,id,table)=>{const row=rows.find(r=>String(r.id)===String(id));return row?.[table]?.find(r=>r.lang===lang)?.name||row?.[table]?.[0]?.name||row?.slug||id;};
 useEffect(()=>{
  let alive=true;
  const revision=generation;
  setLoading(true);setError('');
  loadCatalogue(kind).then(value=>{if(alive){setData(value);setLoading(false);}}).catch(()=>{if(alive){setError('error');setLoading(false);}});
  return()=>{alive=false;revision.current++;};
 },[kind,retry]);
 function open(row){draftVersion.current++;setEditing(row||{id:null});setDraft(draftFor(kind,row));setError('');setLocale(lang);requestAnimationFrame(()=>{formRef.current?.scrollIntoView?.({block:'start'});formRef.current?.querySelector('input,select')?.focus();});}
 async function submit(event){
  event.preventDefault();if(busy)return;
  const attempt=generation.current;setBusy(true);setError('');
  try{
   const body=payloadFor(kind,draft);
   await saveCatalogue(kind,editing.id,body,editing.updated_at);
   if(attempt===generation.current){draftVersion.current++;setDraft(null);setEditing(null);setRetry(v=>v+1);}
  }catch(e){if(attempt===generation.current)setError(e.message?.includes('Record changed')?'conflict':'error');}
  finally{if(attempt===generation.current)setBusy(false);}
 }
 function field([key,text,type,required]){
  const options=type==='peak'?data.peaks:type==='type'?data.types:type==='trail'?data.trails.filter(r=>String(r.peak_id)===String(draft.peak_id)):null;
  const update=value=>setDraft(prev=>({...prev,[key]:value,...(key==='peak_id'?{trail_id:''}:{})}));
  const props={value:draft[key]??'',onChange:e=>update(e.target.value),required,disabled:busy};
  const enums=type==='difficulty'?['easy','moderate','hard']:type==='routeType'?['out-and-back','loop','point-to-point']:null;
  return <label key={key} className={type==='json'?'catalogue-editor-wide':''}><span>{t[text]}{required?' *':''}</span>
   {options?<select {...props}><option value="">{required?t.choose:t.none}</option>{options.map(row=><option key={row.id} value={row.id}>{label(options,row.id,type==='peak'?'peaks_i18n':type==='type'?'poi_types_i18n':'trails_i18n')}</option>)}</select>:enums?<select {...props}>{!required&&<option value="">{t.none}</option>}{enums.map(v=><option key={v} value={v}>{t[v]}</option>)}</select>:type==='json'?<textarea {...props} rows={5}/>:<input {...props} type={type} step={type==='number'?'any':undefined} maxLength={type==='text'?500:undefined}/>}
  </label>;
 }
 return <section className="catalogue-editor">
  <h2>{kind==='trail'?t.trails:t.pois}</h2><p>{t.help}</p>
  {!draft&&<button type="button" onClick={()=>open(null)} disabled={loading}>{t.add}</button>}
  {error&&<p role="alert">{t[error]} <button type="button" disabled={busy} onClick={()=>{draftVersion.current++;setDraft(null);setEditing(null);setRetry(v=>v+1);}}>{t.retry}</button></p>}
  {draft&&<form ref={formRef} onSubmit={submit}>
   <h3>{editing.id?t.edit:t.add}</h3>
   {kind==='trail'&&<label>{t.gpxImport}<input type="file" accept=".gpx,application/gpx+xml" disabled={busy} onChange={async e=>{
    const input=e.target;const file=input.files?.[0];if(!file)return;const version=draftVersion.current;
    try{if(file.size>2_000_000)throw new Error('Too large');const geometry=geometryFromGpx(await file.text());if(version!==draftVersion.current||!input.isConnected)return;setDraft(prev=>prev?({...prev,route_geometry:JSON.stringify(geometry,null,2)}):prev);setError('');}catch{if(version===draftVersion.current&&input.isConnected)setError('error');}
   }}/></label>}
   <div className="catalogue-editor-fields">{[...commonFields,...fields[kind]].map(field)}</div>
   <label className="catalogue-editor-check"><input type="checkbox" disabled={busy} checked={draft.active} onChange={e=>setDraft({...draft,active:e.target.checked})}/>{t.active}</label>
   <div className="catalogue-editor-languages">{langs.map(value=><button key={value} type="button" aria-pressed={locale===value} onClick={()=>setLocale(value)}>{value.toUpperCase()}</button>)}</div>
   {['name','description',kind==='trail'?'notes':'tips'].map(key=><label key={key}>{t[key]} ({locale.toUpperCase()})<textarea disabled={busy} rows={key==='name'?1:4} value={draft.i18n[locale]?.[key]||''} onChange={e=>setDraft({...draft,i18n:{...draft.i18n,[locale]:{...draft.i18n[locale],[key]:e.target.value}}})}/></label>)}
   <div className="catalogue-editor-actions"><button disabled={busy} type="submit">{busy?t.loading:t.save}</button><button disabled={busy} type="button" onClick={()=>{draftVersion.current++;setDraft(null);setEditing(null);setError('');}}>{t.cancel}</button></div>
  </form>}
  {loading?<p role="status">{t.loading}</p>:!data.items.length?<p>{t.empty}</p>:<ul className="catalogue-editor-list">{data.items.map(row=><li key={row.id}><span>{label(data.items,row.id,`${kind==='trail'?'trails':'pois'}_i18n`)} · {row.active?t.active:t.unpublished}</span><button disabled={busy} type="button" onClick={()=>open(row)}>{t.edit}</button></li>)}</ul>}
 </section>;
}
