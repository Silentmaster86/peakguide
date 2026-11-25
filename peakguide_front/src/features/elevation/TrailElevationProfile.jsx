import {useEffect,useId,useState} from 'react';
import {localeFor} from '../../utils/format';
import {loadProfile,profileMatches,profilePaths,reviewedProfile} from './profile';
import {profileText} from './text';
import './profile.css';

export default function TrailElevationProfile({trail,lang='pl'}){
 const t=profileText[lang]||profileText.pl;
 const [open,setOpen]=useState(false),[result,setResult]=useState(null),[retry,setRetry]=useState(0);
 const known=reviewedProfile(trail),slug=trail.slug;
 useEffect(()=>{
  if(!open||!known)return;
  let alive=true;
  loadProfile(slug).then(data=>{if(alive)setResult({slug,retry,data});}).catch(()=>{if(alive)setResult({slug,retry,error:true});});
  return()=>{alive=false;};
 },[open,known,slug,retry]);
 if(!known)return <p className="elevation-unavailable">{t.unavailable}</p>;
 const ready=result?.slug===slug&&result.retry===retry;
 return <details className="elevation-profile" onToggle={e=>setOpen(e.currentTarget.open)}>
  <summary>{t.title}</summary>
  {open&&(!ready?<p role="status">{t.loading}</p>:result.error?<p role="alert">{t.error} <button onClick={()=>setRetry(v=>v+1)}>{t.retry}</button></p>:!profileMatches(result.data,trail)?<p role="status">{t.changed}</p>:<ProfileChart key={slug} data={result.data} name={trail.name} lang={lang} t={t}/>)}
 </details>;
}
function ProfileChart({data,name,lang,t}){
 const id=useId(),[selected,setSelected]=useState(0),[table,setTable]=useState(false);
 const locale=localeFor(lang),number=(v,digits=0)=>new Intl.NumberFormat(locale,{maximumFractionDigits:digits}).format(v);
 const points=data.segments.flatMap((segment,i)=>segment.map((p,j)=>({p,segment:i+1,sample:j+1})));
 const cursor=points[Math.min(selected,points.length-1)].p;
 const padding=Math.max(5,(data.max_m-data.min_m)*.05),bottom=data.min_m-padding,top=data.max_m+padding;
 const x=distance=>10+distance/data.distance_m*980,y=height=>228-(height-bottom)/(top-bottom)*216;
 const description=`${t.min}: ${number(data.min_m)} m; ${t.max}: ${number(data.max_m)} m; ${t.length}: ${number(data.distance_m/1000,2)} km.`;
 const pointText=`${number(cursor[3]/1000,2)} km · ${cursor[2]===null?t.noHeight:`${number(cursor[2],1)} m`}`;
 function pick(event){
  const bounds=event.currentTarget.getBoundingClientRect();
  const distance=Math.max(0,Math.min(1,((event.clientX-bounds.left)/bounds.width*1000-10)/980))*data.distance_m;
  let nearest=0;for(let i=1;i<points.length;i++)if(Math.abs(points[i].p[3]-distance)<Math.abs(points[nearest].p[3]-distance))nearest=i;
  setSelected(nearest);
 }
 return <div className="elevation-content">
  <dl className="elevation-stats">{[[t.length,`${number(data.distance_m/1000,2)} km`],[t.min,`${number(data.min_m)} m`],[t.max,`${number(data.max_m)} m`]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>
  <p className="elevation-axis-labels"><span>{t.height}</span><span>{t.distance}</span></p>
  <div className="elevation-plot">
   <div className="elevation-y-labels" aria-hidden="true">{[top,(top+bottom)/2,bottom].map(value=><span key={value}>{number(value)}</span>)}</div>
   <svg viewBox="0 0 1000 240" preserveAspectRatio="none" role="img" aria-labelledby={`${id}-title ${id}-desc`} onPointerDown={pick} onPointerMove={e=>{if(e.buttons===1)pick(e);}}>
    <title id={`${id}-title`}>{t.title}: {name}</title><desc id={`${id}-desc`}>{description}</desc>
    {[12,120,228].map(value=><line key={value} className="elevation-grid" x1="10" x2="990" y1={value} y2={value}/>)}
    {profilePaths(data.segments,x,y).map((d,i)=><path key={i} className="elevation-line" d={d} vectorEffect="non-scaling-stroke"/>)}
    <line className="elevation-cursor" x1={x(cursor[3])} x2={x(cursor[3])} y1="12" y2="228" vectorEffect="non-scaling-stroke"/>
    {cursor[2]!==null&&<ellipse className="elevation-dot" cx={x(cursor[3])} cy={y(cursor[2])} rx="5" ry="5"/>}
   </svg>
  </div>
  <div className="elevation-x-labels" aria-hidden="true"><span>0</span><span>{number(data.distance_m/2000,2)}</span><span>{number(data.distance_m/1000,2)}</span></div>
  <div className="elevation-picker"><label htmlFor={`${id}-point`}>{t.point}</label><strong aria-hidden="true">{pointText}</strong></div>
  <input id={`${id}-point`} className="elevation-slider" type="range" min="0" max={points.length-1} step="1" value={selected} aria-valuetext={pointText} onChange={e=>setSelected(Number(e.target.value))}/>
  <p className="elevation-help">{t.help}</p><p className="elevation-note">{t.note}</p>
  {(data.has_discontinuities||data.height_count<data.point_count)&&<p className="elevation-note">{t.gaps}</p>}
  <p className="elevation-source">{t.source}: <a href={data.source_url} target="_blank" rel="noreferrer">{new URL(data.source_url).hostname}</a> · {t.reviewed}: <time dateTime={data.reviewed_at}>{new Intl.DateTimeFormat(locale,{timeZone:'UTC',dateStyle:'medium'}).format(new Date(`${data.reviewed_at}T12:00:00Z`))}</time></p>
  <details className="elevation-table-details" onToggle={e=>setTable(e.currentTarget.open)}><summary>{t.table}</summary>{table&&<div className="elevation-table-wrap" role="region" aria-label={t.table} tabIndex={0}><table><caption>{t.table}: {name}</caption><thead><tr>{[t.segment,t.sample,t.distance,t.altitude].map(label=><th key={label} scope="col">{label}</th>)}</tr></thead><tbody>{points.map(({p,segment,sample},i)=><tr key={i}><td>{segment}</td><td>{sample}</td><td>{number(p[3]/1000,3)}</td><td>{p[2]===null?t.noHeight:number(p[2],1)}</td></tr>)}</tbody></table></div>}</details>
 </div>;
}
