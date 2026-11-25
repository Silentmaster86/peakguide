import { useId, useState } from 'react';
import { parseCoordinates } from '../../utils/coordinates';
import { dateInZone, solarTimes, timeZoneForCountry } from './solar';
import { daylightText } from './text';
import WeatherIcon from '../../components/WeatherIcon';
import './daylight.css';

export default function PeakDaylightCard({ latitude, longitude, countryCode, lang = 'pl' }) {
  const t = daylightText[lang] || daylightText.en;
  const zone = timeZoneForCountry(countryCode);
  const [date, setDate] = useState(() => dateInZone(new Date(), zone));
  const id = useId();
  const point = parseCoordinates(latitude, longitude);
  const result = solarTimes(date, latitude, longitude);
  const locale = ({ pl:'pl-PL', en:'en-GB', ua:'uk-UA', zh:'zh-CN' })[lang] || 'en-GB';
  const format = value => new Intl.DateTimeFormat(locale, { timeZone: zone, hour:'2-digit', minute:'2-digit', hourCycle:'h23' }).format(value);
  const formatDate = value => new Intl.DateTimeFormat(locale, { timeZone: zone, dateStyle:'medium' }).format(value);
  const duration = result ? `${Math.floor(result.daylightMinutes / 60)} ${t.hours} ${result.daylightMinutes % 60} ${t.minutes}` : '';
  return <section className="peak-daylight" role="region" aria-labelledby={`${id}-title`}>
    <div className="peak-daylight-heading"><WeatherIcon kind="sunrise"/><h3 id={`${id}-title`}>{t.title}</h3></div>
    <p className="peak-daylight-intro">{t.intro}</p>
    {!point ? <p>{t.missing}</p> : <>
      <div className="peak-daylight-controls"><label htmlFor={`${id}-date`}>{t.date}</label>
        <input id={`${id}-date`} type="date" min="1900-01-01" max="2100-12-31" value={date} onChange={event => setDate(event.target.value)} />
        <button type="button" onClick={() => setDate(dateInZone(new Date(), zone))}>{t.today}</button>
      </div>
      <p className="peak-daylight-zone">{t.zone}: <strong>{zone}</strong>{zone === 'UTC' && <><br />{t.utc}</>}</p>
      {!result ? <p role="status">{t.invalid}</p> : <div role="status" aria-live="polite" aria-atomic="true">
        {result.state !== 'normal' ? <p>{t[result.state]}</p> : <dl className="peak-daylight-events">
          {[[t.sunrise,result.sunrise,'sunrise'],[t.sunset,result.sunset,'sunset'],[t.dawn,result.dawn,'dawn'],[t.dusk,result.dusk,'dusk']].filter(([,value]) => value).map(([label,value,kind]) => <div key={kind} className={`peak-daylight-event peak-daylight-event--${kind}`}><dt><WeatherIcon kind={kind}/><span>{label}</span></dt><dd><time dateTime={value.toISOString()}>{format(value)}</time>{dateInZone(value,zone) !== date && <small className="peak-daylight-event-date">{formatDate(value)}</small>}</dd></div>)}
        </dl>}
        <div className="peak-daylight-duration"><p><span>{t.duration}</span><strong>{duration}</strong></p>
          <div className="peak-daylight-track" role="meter" aria-label={t.duration} aria-valuemin={0} aria-valuemax={1440} aria-valuenow={result.daylightMinutes} aria-valuetext={duration}><span style={{width:`${result.daylightMinutes / 1440 * 100}%`}}/></div>
          <small>{t.fullDay}</small>
        </div>
      </div>}
    </>}
    <p className="peak-daylight-note">{t.note}</p>
    <p className="peak-daylight-source"><a href="https://github.com/mourner/suncalc" target="_blank" rel="noreferrer">{t.source}</a> · <a href="/licenses/suncalc.txt" target="_blank" rel="noreferrer">{t.license}</a></p>
  </section>;
}
