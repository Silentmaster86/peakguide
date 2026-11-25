import { useCallback, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import PageSEO from '../seo/PageSEO';
import { fetchPeaks } from '../api/peakguide';
import { useAsync } from '../hooks/useAsync';
import { parseCoordinates } from '../utils/coordinates';
import { normalizeSearchText } from '../utils/search';
import { localeFor } from '../utils/format';
import { fetchDailyWeather, searchWeatherCities } from '../features/weather/extendedApi';
import { useWeatherResource } from '../features/weather/useWeatherResource';
import { weatherPageText } from '../features/weather/pageText';
import ForecastDays from '../features/weather/ForecastDays';
import '../features/weather/page.css';

const dayChoices = [3,5,10,15];
export default function WeatherPage({ lang = 'pl' }) {
  const t = weatherPageText[lang] || weatherPageText.pl;
  const [params,setParams] = useSearchParams();
  const [catalogueRetry,setCatalogueRetry] = useState(0);
  const peaksState = useAsync(()=>fetchPeaks({lang}),[lang,catalogueRetry]);
  const [peakQuery,setPeakQuery] = useState('');
  const [cityQuery,setCityQuery] = useState('');
  const [submitted,setSubmitted] = useState('');
  const [searchRetry,setSearchRetry] = useState(0);
  const [forecastRetry,setForecastRetry] = useState(0);
  const forecastRef = useRef(null);
  const peak = params.get('peak'), city = params.get('city');
  const invalid = (params.has('peak') && params.has('city')) || params.getAll('peak').length>1 || params.getAll('city').length>1
    || (params.has('city') && (!/^[1-9]\d{0,9}$/.test(city) || Number(city)>2_147_483_647)) || (params.has('peak') && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(peak));
  const mode = city || params.get('type')==='city' ? 'city' : 'peak';
  const selection = useMemo(()=>invalid||(!peak&&!city)?null:{kind:city?'city':'peak',value:city||peak},[invalid,peak,city]);
  const requestedDays = dayChoices.includes(Number(params.get('days')))?Number(params.get('days')):5;
  const loadForecast = useCallback(signal=>fetchDailyWeather(selection,lang,signal),[selection,lang]);
  const forecast = useWeatherResource(selection?`${selection.kind}:${selection.value}:${lang}:${forecastRetry}`:'',loadForecast);
  const loadCities = useCallback(signal=>searchWeatherCities(submitted,lang,signal),[submitted,lang]);
  const cities = useWeatherResource(mode==='city'&&submitted?`${submitted}:${lang}:${searchRetry}`:'',loadCities);
  const allPeaks = peaksState.status==='success'?peaksState.data||[]:[];
  const selectedPeak = allPeaks.find(p=>p.slug===peak);
  const matches = peakQuery ? allPeaks.filter(p=>normalizeSearchText(`${p.peak_name} ${p.range_name}`).includes(normalizeSearchText(peakQuery))) : allPeaks;
  const peakChoices = (!peakQuery&&selectedPeak?[selectedPeak,...matches.filter(p=>p.slug!==peak)]:matches).slice(0,8);
  const data = forecast.status==='success'?forecast.data:null;
  const shown = data?Math.min(requestedDays,data.days.length):0;
  const formatTime = instant=>new Intl.DateTimeFormat(localeFor(lang),{timeZone:data.time_zone,dateStyle:'medium',timeStyle:'short'}).format(new Date(instant));
  const number = value=>new Intl.NumberFormat(localeFor(lang),{maximumFractionDigits:1}).format(value);
  function choose(kind,value,name) {
    const next = new URLSearchParams({[kind]:value,days:String(requestedDays)});
    if(kind==='city')next.set('type','city');
    else setPeakQuery(name);
    setSubmitted(''); setParams(next);
    requestAnimationFrame(()=>{forecastRef.current?.focus({preventScroll:true});forecastRef.current?.scrollIntoView({block:'start',behavior:'instant'});});
  }
  function switchMode(value) {
    const next = new URLSearchParams({days:String(requestedDays)});
    if(value==='city')next.set('type','city');
    setSubmitted('');setParams(next);
  }
  return <section className="weather-page">
    <PageSEO page="weather" lang={lang}/>
    <header className="weather-page-header"><h1>{t.title}</h1><p>{t.intro}</p></header>
    <div className="weather-workspace">
      <section className="weather-location-panel" aria-label={t.location}>
        <div className="weather-mode" role="group" aria-label={t.location}>
          <button type="button" aria-pressed={mode==='peak'} onClick={()=>switchMode('peak')}>{t.peaks}</button>
          <button type="button" aria-pressed={mode==='city'} onClick={()=>switchMode('city')}>{t.cities}</button>
        </div>
        {mode==='peak'?<>
          <label>{t.choose}<input type="search" value={peakQuery} onChange={e=>setPeakQuery(e.target.value)}/></label>
          {['idle','loading'].includes(peaksState.status)&&<p role="status">{t.loading}</p>}
          {peaksState.status==='error'&&<p role="alert">{t.catalogueError} <button onClick={()=>setCatalogueRetry(v=>v+1)}>{t.retry}</button></p>}
          {peaksState.status==='success'&&!peakChoices.length&&<p role="status">{t.noPeaks}</p>}
          <ul className="weather-place-results" aria-label={t.peaks}>{peakChoices.map(p=><li key={p.slug}><button type="button" disabled={!parseCoordinates(p.latitude,p.longitude)} aria-pressed={p.slug===peak} onClick={()=>choose('peak',p.slug,p.peak_name)}><strong>{p.peak_name}</strong><span>{p.range_name}</span><small>{parseCoordinates(p.latitude,p.longitude)?`${p.elevation_m??'—'} m`:t.missingCoords}</small></button></li>)}</ul>
        </>:<>
          <form onSubmit={e=>{e.preventDefault();setSubmitted(cityQuery.normalize('NFC').trim());setSearchRetry(v=>v+1);}}>
            <label htmlFor="weather-city-query">{t.query}</label>
            <input id="weather-city-query" type="search" minLength={2} maxLength={80} required aria-describedby="weather-city-hint" value={cityQuery} onChange={e=>{setCityQuery(e.target.value);setSubmitted('');}}/>
            <small id="weather-city-hint">{t.searchHint}</small><button type="submit">{t.search}</button>
          </form>
          {cities.status==='loading'&&<p role="status">{t.loading}</p>}
          {cities.status==='error'&&<p role="alert">{t[cities.error]||t.unavailable} <button onClick={()=>setSearchRetry(v=>v+1)}>{t.retry}</button></p>}
          {cities.status==='success'&&<><h2 className="weather-results-title">{t.results}</h2>{!cities.data.length?<p role="status">{t.empty}</p>:<ul className="weather-place-results" aria-label={t.results}>{cities.data.map(p=><li key={p.id}><button type="button" onClick={()=>choose('city',String(p.id))}><strong>{p.name}</strong><span>{[p.admin1,p.country].filter(Boolean).join(' · ')}</span></button></li>)}</ul>}</>}
        </>}
      </section>
      <section className="weather-forecast-panel" ref={forecastRef} tabIndex={-1} aria-label={t.forecast}>
        {invalid?<p role="alert">{t.invalid}</p>:forecast.status==='idle'?<p className="weather-prompt">{t.prompt}</p>:forecast.status==='loading'?<p role="status">{t.loading}</p>:forecast.status==='error'?<div role="alert"><p>{t[forecast.error]||t.unavailable}</p><button onClick={()=>setForecastRetry(v=>v+1)}>{t.retry}</button></div>:<>
          <header className="weather-selected"><h2>{data.location.kind==='peak'?(selectedPeak?.peak_name||data.location.slug):data.location.name}</h2>
            {data.location.kind==='city'&&<p>{[data.location.admin1,data.location.country].filter(Boolean).join(' · ')}</p>}
            <p>{t.timezone}: <strong>{data.time_zone}</strong></p><p>{t.fetched}: <time dateTime={data.retrieved_at}>{formatTime(data.retrieved_at)}</time></p>
          </header>
          <div className="weather-day-choices" role="group" aria-label={t.days}>{dayChoices.map(days=><button key={days} aria-pressed={days===shown} disabled={days>data.days.length} onClick={()=>setParams(current=>{const next=new URLSearchParams(current);next.set('days',String(days));return next;})}>{days} {t.dayUnit}</button>)}</div>
          <p className="weather-availability" role="status">{t.shown}: {shown} · {t.available}: {data.days.length}</p>
          <ForecastDays days={data.days.slice(0,shown)} lang={lang} zone={data.time_zone} t={t}/>
          <details className="weather-point-details"><summary>{t.details}</summary><p>{t.coordinates}: {data.location.latitude.toFixed(4)}, {data.location.longitude.toFixed(4)}</p><p>{t.elevation}: {data.location.elevation_m===null?t.noData:`${number(data.location.elevation_m)} m`}</p><p>{t.model}: {data.model_location.latitude.toFixed(4)}, {data.model_location.longitude.toFixed(4)}</p></details>
        </>}
      </section>
    </div>
    <p className="weather-page-safety">{t.safety}</p>
    <p className="weather-page-source">{t.source}: <a href="https://open-meteo.com/" target="_blank" rel="noreferrer">Open-Meteo</a> · <a href="https://www.geonames.org/" target="_blank" rel="noreferrer">GeoNames</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">CC BY 4.0</a></p>
  </section>;
}
