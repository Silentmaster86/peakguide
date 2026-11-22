import { expect, it } from 'vitest';
import { dateInZone, solarTimes, timeZoneForCountry } from './solar';

it('agrees with approximate Greenwich solstice sunrise and preserves seasonal day length', () => {
  const summer=solarTimes('2026-06-21',51.4779,0),winter=solarTimes('2026-12-21',51.4779,0);
  expect(summer.state).toBe('normal');
  // Greenwich June solstice sunrise is approximately 03:43 UTC; allow astronomical approximation.
  expect(Math.abs(summer.sunrise.getTime()-Date.parse('2026-06-21T03:43:00Z'))).toBeLessThan(3*60_000);
  expect(summer.daylightMinutes).toBeGreaterThan(990);
  expect(winter.daylightMinutes).toBeLessThan(480);
  expect(summer.dawn.getTime()).toBeLessThan(summer.sunrise.getTime());
  expect(summer.dusk.getTime()).toBeGreaterThan(summer.sunset.getTime());
});
it('handles polar day and polar night without rendering invalid dates',()=>{
  expect(solarTimes('2026-06-21',78.2,15.6)).toEqual({state:'polarDay',daylightMinutes:1440});
  expect(solarTimes('2026-12-21',78.2,15.6)).toEqual({state:'polarNight',daylightMinutes:0});
});
it('rejects missing coordinates, impossible dates and unsupported years',()=>{
  for(const args of [['2026-02-30',50,20],['2026-01-01',null,20],['2026-01-01',91,20],['',50,20],['1800-01-01',50,20]])expect(solarTimes(...args)).toBeNull();
  expect(solarTimes('2028-02-29',0,0).state).toBe('normal');
});
it('selects the correct solar calendar cycle east and west of Greenwich',()=>{
  for(const lon of [-170,0,170]){
    const value=solarTimes('2026-03-20',0,lon);
    const solarLocal=new Date(value.sunrise.getTime()+lon*4*60_000);
    expect(solarLocal.toISOString().slice(0,10)).toBe('2026-03-20');
    expect(value.daylightMinutes).toBeGreaterThan(720);
    expect(value.daylightMinutes).toBeLessThan(735);
  }
});
it('uses destination date and explicit UTC fallback instead of browser time',()=>{
  const date=new Date('2026-11-22T23:30:00Z');
  expect(dateInZone(date,timeZoneForCountry('PL'))).toBe('2026-11-23');
  expect(dateInZone(date,timeZoneForCountry('GB'))).toBe('2026-11-22');
  expect(timeZoneForCountry('XX')).toBe('UTC');
});
