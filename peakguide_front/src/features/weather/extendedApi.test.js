import {afterEach,beforeEach,expect,it,vi} from 'vitest';
import {fetchDailyWeather,searchWeatherCities} from './extendedApi';
const city={kind:'city',id:2950159,name:'Berlin',admin1:'Berlin',country:'Germany',latitude:52.52,longitude:13.4,elevation_m:null,time_zone:'Europe/Berlin'};
const payload=()=>({location:city,time_zone:city.time_zone,retrieved_at:'2026-11-25T09:00:00Z',model_location:{latitude:52.5,longitude:13.4},available_days:1,days:[{date:'2026-11-25',temperature_min_c:null,temperature_max_c:0,weather_code:null,precipitation_sum_mm:0,precipitation_probability_max_percent:0,wind_max_kmh:null,gust_max_kmh:null,daylight_seconds:null,sunrise:null,sunset:null}]});
beforeEach(()=>vi.stubGlobal('fetch',vi.fn()));afterEach(()=>vi.unstubAllGlobals());
it('sends only city identity and locale, preserving nulls and real zero values',async()=>{
 fetch.mockResolvedValue({ok:true,json:async()=>payload()});const signal=new AbortController().signal;
 const result=await fetchDailyWeather({kind:'city',value:'2950159'},'ua',signal);
 expect(fetch).toHaveBeenCalledWith('/.netlify/functions/weather-forecast?city=2950159&lang=ua',expect.objectContaining({credentials:'omit',signal}));
 expect(result.days[0]).toMatchObject({temperature_max_c:0,gust_max_kmh:null,precipitation_sum_mm:0});
});
it.each([
 p=>{p.location={...city,id:1};},p=>{p.days[0].date='2026-02-30';},p=>{p.days[0].temperature_max_c=null;},p=>{p.days[0].gust_max_kmh='0';},p=>{p.time_zone='invalid';},p=>{p.available_days=15;},
])('rejects incorrect place identity or invalid provider-shaped data',async change=>{const p=payload();change(p);fetch.mockResolvedValue({ok:true,json:async()=>p});await expect(fetchDailyWeather({kind:'city',value:'2950159'},'en')).rejects.toMatchObject({code:'unavailable'});});
it('maps safe search results and rejects unlabelled places',async()=>{
 fetch.mockResolvedValueOnce({ok:true,json:async()=>({results:[city]})}).mockResolvedValueOnce({ok:true,json:async()=>({results:[{...city,name:''}]})});
 expect(await searchWeatherCities('Berlin','en')).toEqual([city]);await expect(searchWeatherCities('Berlin','en')).rejects.toMatchObject({code:'unavailable'});
});
it.each([[429,'busy'],[404,'unknown'],[503,'unavailable']])('maps HTTP %s to a recoverable error',async(status,code)=>{fetch.mockResolvedValue({ok:false,status});await expect(searchWeatherCities('北京','zh')).rejects.toMatchObject({code});});
