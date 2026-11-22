import { useId, useState } from 'react';
import { parseCoordinates } from '../../utils/coordinates';
import { dateInZone, solarTimes, timeZoneForCountry } from './solar';
import { daylightText } from './text';
import './daylight.css';

export default function PeakDaylightCard({ latitude, longitude, countryCode, lang = 'pl' }) {
  const t = daylightText[lang] || daylightText.en;
  const zone = timeZoneForCountry(countryCode);
  const [date, setDate] = useState(() => dateInZone(new Date(), zone));
  const id = useId();
  const point = parseCoordinates(latitude, longitude);
  const result = solarTimes(date, latitude, longitude);
  const locale = ({ pl:'pl-PL', en:'en-GB', ua:'uk-UA', zh:'zh-CN' })[lang] || 'en-GB';
  const format = value => new Intl.DateTimeFormat(locale, { timeZone: zone, dateStyle:'medium', timeStyle:'short' }).format(value);
  return <section className="peak-daylight" aria-labelledby={`${id}-title`}>
    <h3 id={`${id}-title`}>{t.title}</h3>
    {!point ? <p>{t.missing}</p> : <>
      <div className="peak-daylight-controls"><label htmlFor={`${id}-date`}>{t.date}</label>
        <input id={`${id}-date`} type="date" min="1900-01-01" max="2100-12-31" value={date} onChange={event => setDate(event.target.value)} />
        <button type="button" onClick={() => setDate(dateInZone(new Date(), zone))}>{t.today}</button>
      </div>
      <p>{t.zone}: <strong>{zone}</strong>{zone === 'UTC' && <><br />{t.utc}</>}</p>
      {!result ? <p role="status">{t.invalid}</p> : <div aria-live="polite" aria-atomic="true">
        {result.state !== 'normal' ? <p>{t[result.state]}</p> : <dl>
          {[[t.sunrise,result.sunrise],[t.sunset,result.sunset],[t.dawn,result.dawn],[t.dusk,result.dusk]].filter(([,value]) => value).map(([label,value]) => <div key={label}><dt>{label}</dt><dd><time dateTime={value.toISOString()}>{format(value)}</time></dd></div>)}
        </dl>}
        <p><strong>{t.duration}:</strong> {Math.floor(result.daylightMinutes / 60)} {t.hours} {result.daylightMinutes % 60} {t.minutes}</p>
      </div>}
    </>}
    <p className="peak-daylight-note">{t.note}</p>
    <p className="peak-daylight-source"><a href="https://github.com/mourner/suncalc" target="_blank" rel="noreferrer">{t.source}</a> · <a href="/licenses/suncalc.txt" target="_blank" rel="noreferrer">{t.license}</a></p>
  </section>;
}
