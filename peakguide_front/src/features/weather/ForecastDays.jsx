import WeatherIcon from '../../components/WeatherIcon';
import { localeFor } from '../../utils/format';
import { weatherCondition } from './pageText';

export default function ForecastDays({ days, lang, zone, t }) {
  const locale = localeFor(lang);
  const value = (number, unit) => number === null ? t.noData : `${new Intl.NumberFormat(locale, { maximumFractionDigits: 1 }).format(number)} ${unit}`;
  const time = instant => new Intl.DateTimeFormat(locale, { timeZone: zone, hour:'2-digit', minute:'2-digit', hourCycle:'h23' }).format(new Date(instant));
  const fullTime = instant => new Intl.DateTimeFormat(locale, { timeZone: zone, dateStyle:'medium', timeStyle:'short' }).format(new Date(instant));
  const localDate = instant => {
    const parts = new Intl.DateTimeFormat('en', { timeZone: zone, year:'numeric', month:'2-digit', day:'2-digit' }).formatToParts(new Date(instant));
    const part = type => parts.find(p => p.type === type).value;
    return `${part('year')}-${part('month')}-${part('day')}`;
  };
  return <div className="weather-days">
    {days.map(day => {
      const condition = weatherCondition(day.weather_code, lang);
      return <article className="catalogue-card weather-day" key={day.date}>
        <header><h3><time dateTime={day.date}>{new Intl.DateTimeFormat(locale, { timeZone:'UTC', weekday:'long', day:'numeric', month:'short' }).format(new Date(`${day.date}T12:00:00Z`))}</time></h3>
          <div className="weather-day-condition">{condition.icon && <WeatherIcon kind={condition.icon}/>}<span>{condition.text}</span></div>
        </header>
        <dl className="weather-day-temperatures">
          <div><dt>{t.min}</dt><dd>{value(day.temperature_min_c,'°C')}</dd></div>
          <div><dt>{t.max}</dt><dd>{value(day.temperature_max_c,'°C')}</dd></div>
        </dl>
        <dl className="weather-day-metrics">
          {[[t.wind,day.wind_max_kmh,'km/h'],[t.gust,day.gust_max_kmh,'km/h'],[t.rain,day.precipitation_sum_mm,'mm'],[t.chance,day.precipitation_probability_max_percent,'%']].map(([label,number,unit])=><div key={label}><dt>{label}</dt><dd>{value(number,unit)}</dd></div>)}
        </dl>
        <dl className="weather-day-sun">
          {[[t.sunrise,day.sunrise,'sunrise'],[t.sunset,day.sunset,'sunset']].map(([label,instant,kind])=><div key={kind}><dt><WeatherIcon kind={kind}/>{label}</dt><dd>{instant?<time dateTime={instant} title={fullTime(instant)}>{localDate(instant)===day.date?time(instant):fullTime(instant)}</time>:day.daylight_seconds===86400?t.polarDay:day.daylight_seconds===0?t.polarNight:t.noData}</dd></div>)}
        </dl>
      </article>;
    })}
  </div>;
}
