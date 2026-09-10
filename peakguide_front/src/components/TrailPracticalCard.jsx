import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { safeUrl, translation, verifiedDate } from '../utils/practical.mjs';

const text = {
 pl: {title:'Przed wyjściem',start:'Start i dojazd',parking:'Parking',transport:'Transport publiczny',warnings:'Bezpieczeństwo',map:'Otwórz mapę',source:'Źródło',date:'Weryfikacja',unknown:'Brak potwierdzonych danych',missing:'Informacje w tym języku nie zostały jeszcze uzupełnione.',loading:'Ładowanie informacji praktycznych…',error:'Nie udało się pobrać informacji praktycznych.',retry:'Spróbuj ponownie',empty:'Informacje praktyczne nie zostały jeszcze dodane.',paid:'Parking płatny',toilets:'Toalety',overnight:'Parkowanie nocą',yes:'Tak',no:'Nie',primary:'Główny',details:'Informacje o transporcie'},
 en: {title:'Before you set off',start:'Start and access',parking:'Parking',transport:'Public transport',warnings:'Safety',map:'Open map',source:'Source',date:'Verified',unknown:'Not confirmed',missing:'Information in this language has not been added yet.',loading:'Loading practical information…',error:'Could not load practical information.',retry:'Try again',empty:'Practical information has not been added yet.',paid:'Paid parking',toilets:'Toilets',overnight:'Overnight parking',yes:'Yes',no:'No',primary:'Primary',details:'Transport information'},
 ua: {title:'Перед виходом',start:'Старт і доїзд',parking:'Парковка',transport:'Громадський транспорт',warnings:'Безпека',map:'Відкрити мапу',source:'Джерело',date:'Перевірено',unknown:'Не підтверджено',missing:'Інформацію цією мовою ще не додано.',loading:'Завантаження практичної інформації…',error:'Не вдалося завантажити практичну інформацію.',retry:'Спробувати ще раз',empty:'Практичну інформацію ще не додано.',paid:'Платна парковка',toilets:'Туалети',overnight:'Нічне паркування',yes:'Так',no:'Ні',primary:'Основна',details:'Інформація про транспорт'},
 zh: {title:'出发前',start:'起点与交通',parking:'停车场',transport:'公共交通',warnings:'安全提示',map:'打开地图',source:'来源',date:'核实日期',unknown:'尚未确认',missing:'尚未添加此语言的信息。',loading:'正在加载实用信息…',error:'无法加载实用信息。',retry:'重试',empty:'尚未添加实用信息。',paid:'收费停车',toilets:'卫生间',overnight:'过夜停车',yes:'是',no:'否',primary:'主要',details:'交通信息'}
};
const box = {padding:14,border:'1px solid var(--border)',borderRadius:14,minWidth:0,background:'var(--surface-2)',overflowWrap:'anywhere'};
const paragraph = {whiteSpace:'pre-wrap',lineHeight:1.6,margin:'8px 0'};
function ExternalLink({url, children}) {
 const href = safeUrl(url);
 return href ? <a href={href} target="_blank" rel="noopener noreferrer" style={{display:'inline-block',padding:'10px 12px',color:'var(--text)',border:'1px solid var(--border)',borderRadius:10,margin:'4px 8px 4px 0'}}>{children}</a> : null;
}
function Provenance({record,labels,lang}) {
 return <div style={{marginTop:10,fontSize:12}}>
  {safeUrl(record.source_url) ? <ExternalLink url={record.source_url}>{labels.source}</ExternalLink> : <div>{labels.source}: {labels.unknown}</div>}
  <div>{labels.date}: {verifiedDate(record.last_verified_at,lang) || labels.unknown}</div>
 </div>;
}
export default function TrailPracticalCard({trailId,lang='pl'}) {
 const language = text[lang] ? lang : 'en';
 const labels = text[language];
 const key = `${trailId}:${language}`;
 const [state,setState] = useState({key:null,status:'loading',access:null,parking:[]});
 const [retry,setRetry] = useState(0);
 useEffect(() => {
  let cancelled = false;
  async function load() {
   try {
    const [a,p] = await Promise.all([
     supabase.from('trail_access').select('*, trail_access_i18n(*)').eq('trail_id',trailId).eq('active',true).maybeSingle(),
     supabase.from('trail_parking').select('*, trail_parking_i18n(*)').eq('trail_id',trailId).eq('active',true).order('is_primary',{ascending:false}).order('id')
    ]);
    if(a.error) throw a.error;
    if(p.error) throw p.error;
    if(!cancelled) setState({key,status:'success',access:a.data,parking:p.data || []});
   } catch { if(!cancelled) setState({key,status:'error',access:null,parking:[]}); }
  }
  load();
  return () => { cancelled=true; };
 },[trailId,language,key,retry]);
 const status = state.key === key ? state.status : 'loading';
 const a = state.access;
 const at = translation(a?.trail_access_i18n,language);
 const bool = v => v === true ? labels.yes : v === false ? labels.no : labels.unknown;
 return <section aria-label={labels.title} style={{marginTop:16}}>
  <h3 style={{margin:'0 0 12px'}}>{labels.title}</h3>
  {status === 'loading' && <p role="status">{labels.loading}</p>}
  {status === 'error' && <div role="alert"><p>{labels.error}</p><button type="button" onClick={() => {setState(s => ({...s,status:'loading'}));setRetry(v=>v+1);}}>{labels.retry}</button></div>}
  {status === 'success' && <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit, minmax(min(100%, 280px), 1fr))',gap:12}}>
   {!a && !state.parking.length && <p>{labels.empty}</p>}
   {a && <div style={box}>
    <h4 style={{margin:0}}>{labels.start}</h4>
    {a.address && <p style={paragraph}>{a.address}{a.postcode ? `, ${a.postcode}` : ''}</p>}
    <p style={paragraph}>{at.directions || labels.missing}</p>
    <ExternalLink url={a.google_maps_url}>{labels.map}</ExternalLink>
    {(at.public_transport || safeUrl(a.public_transport_url)) && <><h4>{labels.transport}</h4><p style={paragraph}>{at.public_transport || labels.missing}</p><ExternalLink url={a.public_transport_url}>{labels.details}</ExternalLink></>}
    <h4>{labels.warnings}</h4><p style={paragraph}>{at.warnings || labels.missing}</p>
    <Provenance record={a} labels={labels} lang={language}/>
   </div>}
   {state.parking.map(p => {
    const t = translation(p.trail_parking_i18n,language);
    return <div key={p.id} style={box}>
     <h4 style={{margin:0}}>{t.name || labels.parking}{p.is_primary ? ` · ${labels.primary}` : ''}</h4>
     {!t.name && <p>{labels.missing}</p>}
     {t.description && <p style={paragraph}>{t.description}</p>}
     <p>{labels.paid}: {bool(p.paid)}</p>
     {t.fee_info && <p style={paragraph}>{t.fee_info}</p>}
     <p>{labels.toilets}: {bool(p.toilets)}</p><p>{labels.overnight}: {bool(p.overnight_allowed)}</p>
     {t.opening_info && <p style={paragraph}>{t.opening_info}</p>}
     {t.notes && <p style={paragraph}>{t.notes}</p>}
     <ExternalLink url={p.map_url}>{labels.map}</ExternalLink>
     <Provenance record={p} labels={labels} lang={language}/>
    </div>;
   })}
  </div>}
 </section>;
}
