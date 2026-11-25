import { useEffect, useId, useState } from 'react';
import { parseCoordinates } from '../../utils/coordinates';
import { fetchPeakWeather } from './api';
import { weatherText } from './text';
import WeatherIcon from '../../components/WeatherIcon';
import './weather.css';

// The parent keys this component by peak slug: navigation cancels the previous request.
export default function PeakWeatherCard({ slug, latitude, longitude, lang = 'pl' }) {
  const t = weatherText[lang] || weatherText.en;
  const locale = ({ pl: 'pl-PL', en: 'en-GB', ua: 'uk-UA', zh: 'zh-CN' })[lang] || 'en-GB';
  const titleId = useId();
  const [attempt, setAttempt] = useState(0);
  const [result, setResult] = useState({ status: 'idle' });
  const coords = parseCoordinates(latitude, longitude);
  useEffect(() => {
    if (!attempt) return;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12000);
    let cancelled = false;
    fetchPeakWeather(slug, controller.signal).then(data => {
      if (!controller.signal.aborted) setResult({ status: 'success', data, checkedAt: Date.now() });
    }).catch(() => {
      // Timeout is a retryable error; unmount cleanup stops the timer first.
      if (!cancelled) setResult({ status: 'error' });
    }).finally(() => clearTimeout(timeout));
    return () => { cancelled = true; clearTimeout(timeout); controller.abort(); };
  }, [slug, attempt]);
  const data = result.data;
  const timeZone = data?.location?.time_zone || 'UTC';
  const formatTime = value => new Intl.DateTimeFormat(locale, { dateStyle: 'medium', timeStyle: 'short', timeZone }).format(new Date(value));
  const formatValue = (value, unit) => typeof value === 'number' && Number.isFinite(value)
    ? `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(value)} ${unit}` : t.noValue;
  const rows = data?.forecast.filter(step => Date.parse(step.time) >= result.checkedAt - 60 * 60_000) || [];
  const first = rows.find(step => Date.parse(step.time) >= result.checkedAt) || rows[0];
  const load = () => { setResult({ status: 'loading' }); setAttempt(value => value + 1); };
  return <section className="peak-weather" role="region" aria-labelledby={titleId}>
    <div className="peak-weather-heading"><WeatherIcon kind="temperature" className="peak-weather-title-icon"/><h3 id={titleId}>{t.title}</h3></div>
    <p className="peak-weather-intro">{t.intro}</p>
    {!coords ? <p>{t.missing}</p> : <>
      {result.status === 'idle' && <button type="button" onClick={load}>{t.load}</button>}
      {result.status === 'loading' && <p role="status">{t.loading}</p>}
      {result.status === 'error' && <><p role="status">{t.error}</p><button type="button" onClick={load}>{t.retry}</button></>}
      {result.status === 'success' && first && <>
        <div className="peak-weather-forecast-time"><span>{t.next}</span><strong><time dateTime={first.time}>{formatTime(first.time)}</time></strong><span>{t.timezone}: {timeZone}</span></div>
        <dl className="peak-weather-metrics">
          {[[t.temperature, first.temperature_c, '°C', 'temperature'], [t.wind, first.wind_kmh, 'km/h', 'wind'], [t.gust, first.gust_kmh, 'km/h', 'gust'], [t.rain, first.precipitation_mm_next_hour, 'mm', 'rain']].map(([label, value, unit, kind]) => <div className={`peak-weather-metric peak-weather-metric--${kind}`} key={kind}><dt><WeatherIcon kind={kind}/><span>{label}</span></dt><dd>{formatValue(value, unit)}</dd></div>)}
        </dl>
        <details className="peak-weather-model-details"><summary>{t.modelDetails}</summary>
          <p>{t.coordinates}: {data.location.latitude.toFixed(4)}, {data.location.longitude.toFixed(4)} · {t.altitude}: {formatValue(data.location.elevation_m, 'm')}</p>
          <p>{t.updated}: <time dateTime={data.updated_at}>{formatTime(data.updated_at)}</time><br />{t.retrieved}: <time dateTime={data.retrieved_at}>{formatTime(data.retrieved_at)}</time></p>
        </details>
        {result.checkedAt - Date.parse(data.updated_at) > 12 * 60 * 60_000 && <p role="status">{t.stale}</p>}
        {data.deprecated && <p role="status">{t.deprecated}</p>}
        <details><summary>{t.hourly}</summary>
          <div className="peak-weather-scroll" role="region" aria-label={t.hourly} tabIndex={0}>
            <table><caption>{t.hourly}</caption><thead><tr>{[t.time, `${t.temperature} °C`, `${t.wind} km/h`, `${t.gust} km/h`, `${t.rain} mm`].map(label => <th scope="col" key={label}>{label}</th>)}</tr></thead>
              <tbody>{rows.map(row => <tr key={row.time}><th scope="row"><time dateTime={row.time}>{formatTime(row.time)}</time></th>{[[row.temperature_c, '°C'], [row.wind_kmh, 'km/h'], [row.gust_kmh, 'km/h'], [row.precipitation_mm_next_hour, 'mm']].map(([value, unit], index) => <td key={index}>{formatValue(value, unit)}</td>)}</tr>)}</tbody>
            </table>
          </div>
        </details>
        <p className="peak-weather-source">{t.source}: <a href="https://www.met.no/en" target="_blank" rel="noreferrer">MET Norway</a> · <a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noreferrer">{t.license}</a><br />{t.adapted}</p>
      </>}
    </>}
    <p className="peak-weather-note">{t.safety}</p>
  </section>;
}
