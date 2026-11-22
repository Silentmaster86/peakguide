import { act, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import PeakWeatherCard from './PeakWeatherCard';
import { weatherText } from './text';

const payload = () => ({
  peak: 'rysy', location: { latitude: 49.1795, longitude: 20.0881, elevation_m: 2499, time_zone: 'Europe/Warsaw' },
  updated_at: new Date().toISOString(), retrieved_at: new Date().toISOString(),
  forecast: [{ time: new Date(Date.now() + 3600_000).toISOString(), temperature_c: -5, wind_kmh: 36, gust_kmh: null, precipitation_mm_next_hour: 0 }],
});
beforeEach(() => vi.stubGlobal('fetch', vi.fn()));
afterEach(() => vi.unstubAllGlobals());

it.each(['pl', 'en', 'ua', 'zh'])('loads on demand and labels missing values and hourly rain in %s', async lang => {
  fetch.mockResolvedValue({ok:true,json:async()=>payload()});
  render(<PeakWeatherCard slug="rysy" latitude={49.17} longitude={20.08} lang={lang} />);
  expect(fetch).not.toHaveBeenCalled();
  const user = userEvent.setup();
  await user.click(screen.getByRole('button',{name:weatherText[lang].load}));
  expect(await screen.findByText(weatherText[lang].gust)).toBeInTheDocument();
  expect(within(document.querySelector('dl')).getByText(weatherText[lang].noValue)).toBeInTheDocument();
  expect(screen.getByText(/2499|2[\s,.]?499/)).toBeInTheDocument();
  expect(screen.getByText(/Europe\/Warsaw/)).toBeInTheDocument();
  expect(screen.getByRole('link',{name:weatherText[lang].license})).toHaveAttribute('href','https://creativecommons.org/licenses/by/4.0/');
  expect(fetch).toHaveBeenCalledWith('/.netlify/functions/peak-weather?peak=rysy',expect.objectContaining({signal:expect.any(AbortSignal)}));
  await user.click(screen.getByText(weatherText[lang].hourly,{selector:'summary'}));
  expect(screen.getByRole('table')).toBeInTheDocument();
  expect(screen.getByRole('region',{name:weatherText[lang].hourly})).toHaveAttribute('tabindex','0');
});
it('shows a retryable error for disabled service and rejects a response for another peak', async()=>{
  fetch.mockResolvedValueOnce({ok:false}).mockResolvedValueOnce({ok:true,json:async()=>({...payload(),peak:'other'})}).mockResolvedValueOnce({ok:true,json:async()=>payload()});
  render(<PeakWeatherCard slug="rysy" latitude={49} longitude={20} lang="en" />);
  const user=userEvent.setup();
  await user.click(screen.getByRole('button',{name:'Show forecast'}));
  await user.click(await screen.findByRole('button',{name:'Retry'}));
  await waitFor(()=>expect(fetch).toHaveBeenCalledTimes(2));
  await user.click(await screen.findByRole('button',{name:'Retry'}));
  expect(await screen.findByText('Temperature')).toBeInTheDocument();
});
it('does not request a forecast without valid coordinates',()=>{
  render(<PeakWeatherCard slug="rysy" latitude={null} longitude={null} lang="en" />);
  expect(screen.queryByRole('button')).not.toBeInTheDocument();
  expect(fetch).not.toHaveBeenCalled();
});
it('cancels in-flight work when leaving a peak', async()=>{
  let signal;
  fetch.mockImplementation((url,options)=>{signal=options.signal;return new Promise((resolve,reject)=>options.signal.addEventListener('abort',()=>reject(new DOMException('Aborted','AbortError'))));});
  const view=render(<PeakWeatherCard slug="rysy" latitude={49} longitude={20} lang="en" />);
  await userEvent.click(screen.getByRole('button',{name:'Show forecast'}));
  await act(async()=>view.unmount());
  expect(signal.aborted).toBe(true);
});
