import SunCalc from 'suncalc';
import { parseCoordinates } from '../../utils/coordinates.js';

// These catalogue countries each have one current civil time zone. Do not guess for new countries.
export const timeZoneForCountry = code => ({ PL: 'Europe/Warsaw', GB: 'Europe/London',
  UA: 'Europe/Kyiv', SK: 'Europe/Bratislava', CN: 'Asia/Shanghai' })[code] || 'UTC';

export function dateInZone(date, timeZone) {
  const parts = new Intl.DateTimeFormat('en-GB', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(date);
  const get = type => parts.find(part => part.type === type).value;
  return `${get('year')}-${get('month')}-${get('day')}`;
}

export function solarTimes(date, latitude, longitude) {
  const point = parseCoordinates(latitude, longitude);
  if (!point || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const [year, month, day] = date.split('-').map(Number);
  if (year < 1900 || year > 2100) return null;
  const noon = new Date(Date.UTC(year, month - 1, day, 12));
  if (noon.toISOString().slice(0, 10) !== date) return null;
  // Choose the solar cycle for this calendar day at the point, not at the viewer's longitude.
  const anchor = new Date(noon.getTime() - point.lon * 4 * 60_000);
  // Sea-level elevation is not observer height above the surrounding horizon: do not pass peak elevation here.
  const times = SunCalc.getTimes(anchor, point.lat, point.lon);
  const valid = value => value instanceof Date && Number.isFinite(value.getTime());
  if (!valid(times.sunrise) || !valid(times.sunset)) {
    const highest = SunCalc.getPosition(times.solarNoon, point.lat, point.lon).altitude;
    return { state: highest > -0.833 * Math.PI / 180 ? 'polarDay' : 'polarNight', daylightMinutes: highest > -0.833 * Math.PI / 180 ? 1440 : 0 };
  }
  return { state: 'normal', sunrise: times.sunrise, sunset: times.sunset,
    dawn: valid(times.dawn) ? times.dawn : null, dusk: valid(times.dusk) ? times.dusk : null,
    daylightMinutes: Math.round((times.sunset - times.sunrise) / 60_000) };
}
