import {render,screen,within,cleanup} from '@testing-library/react';
import {afterEach,expect,it} from 'vitest';
import ForecastDays from './ForecastDays';
import {weatherPageText} from './pageText';
afterEach(cleanup);
const day={date:'2026-10-25',temperature_min_c:0,temperature_max_c:5,wind_max_kmh:0,gust_max_kmh:null,precipitation_sum_mm:0,precipitation_probability_max_percent:0,weather_code:null,daylight_seconds:null,sunrise:'2026-10-25T06:00:00Z',sunset:'2026-10-25T16:00:00Z'};
it('uses local time after DST and marks adjacent solar event dates visibly',()=>{
 render(<ForecastDays days={[{...day,sunset:'2026-10-26T00:30:00Z'}]} lang="en" zone="Europe/Warsaw" t={weatherPageText.en}/>);
 expect(screen.getByText('07:00')).toHaveAttribute('datetime',day.sunrise);
 expect(screen.getByText(/26 Oct 2026, 01:30/)).toBeVisible();
 expect(document.querySelector('.weather-day-condition svg')).toBeNull();
 expect(within(document.querySelector('.weather-day-metrics')).getByText('0 mm')).toBeVisible();
});
it('distinguishes missing solar data from polar night without creating epoch timestamps',()=>{
 const view=render(<ForecastDays days={[{...day,sunrise:null,sunset:null}]} lang="en" zone="Europe/Warsaw" t={weatherPageText.en}/>);
 expect(screen.queryByText('Polar night')).toBeNull();
 expect(document.querySelectorAll('.weather-day-sun time')).toHaveLength(0);
 view.rerender(<ForecastDays days={[{...day,sunrise:null,sunset:null,daylight_seconds:0}]} lang="en" zone="Europe/Warsaw" t={weatherPageText.en}/>);
 expect(screen.getAllByText('Polar night')).toHaveLength(2);
});
