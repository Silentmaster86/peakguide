import locations from './peak-locations.json' with { type: 'json' };
import { createExtendedWeatherHandlers } from './extended-weather.mjs';

// Same feature switch as existing weather. No new key or paid provider account.
export const extendedWeather = createExtendedWeatherHandlers({ locations, enabled: () => process.env.PEAKGUIDE_WEATHER_ENABLED === 'true' });
