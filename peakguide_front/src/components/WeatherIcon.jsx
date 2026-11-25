const icons = {
  temperature: <><path d="M9 14.8V5a3 3 0 0 1 6 0v9.8a5 5 0 1 1-6 0Z"/><path d="M12 8v10"/><circle cx="12" cy="18" r="1"/></>,
  wind: <><path d="M3 8h12a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h6a3 3 0 1 1-3 3"/></>,
  gust: <><path d="M2 7h13a3 3 0 1 0-3-3M2 12h17a3 3 0 1 1-3 3M2 17h8"/><path d="m11 20 3-3-3-3"/></>,
  rain: <><path d="M12 3s-7 8-7 12a7 7 0 0 0 14 0c0-4-7-12-7-12Z"/><path d="M9 16a3 3 0 0 0 3 3"/></>,
  sunrise: <><path d="M2 18h20M5 15a7 7 0 0 1 14 0M12 2v7m-3-3 3-3 3 3M3 7l2 2m14 0 2-2"/></>,
  sunset: <><path d="M2 18h20M5 15a7 7 0 0 1 14 0M12 2v7m-3-3 3 3 3-3M3 7l2 2m14 0 2-2"/></>,
  dawn: <><path d="M2 18h20M5 15a7 7 0 0 1 14 0M12 3v2M4 7l2 2m12 0 2-2"/></>,
  dusk: <><path d="M2 18h20M5 15a7 7 0 0 1 14 0M20 3a4 4 0 0 1-5 5 4 4 0 0 0 5-5Z"/></>,
};

// Metric/event pictograms, not a claim about current sky conditions.
export default function WeatherIcon({ kind, className }) {
  if (!icons[kind]) return null;
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{icons[kind]}</svg>;
}
