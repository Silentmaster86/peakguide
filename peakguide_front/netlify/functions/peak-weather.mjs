import locations from './lib/peak-locations.json' with { type: 'json' };
import { createWeatherHandler } from './lib/weather.mjs';

// Opt-in only after the project owner has reviewed MET Norway's service terms.
export default createWeatherHandler({ locations, enabled: () => process.env.PEAKGUIDE_WEATHER_ENABLED === 'true' });
