const icons = {
  clear: <><circle cx="12" cy="12" r="4"/><path d="M12 2v2m0 16v2M2 12h2m16 0h2M5 5l2 2m10 10 2 2M5 19l2-2M17 7l2-2"/></>,
  partly: <><circle cx="8" cy="8" r="4"/><path d="M8 1v1M1 8h1m1-5 1 1M6 20a5 5 0 1 1 2-9 6 6 0 0 1 11 3 3 3 0 1 1 0 6H6Z"/></>,
  cloudy: <path d="M6 19a5 5 0 1 1 2-9 6 6 0 0 1 11 3 3 3 0 1 1 0 6H6Z"/>,
  fog: <><path d="M6 12a4 4 0 1 1 2-7 5 5 0 0 1 9 3 3 3 0 0 1 3 4M3 16h18M5 20h14"/></>,
  snow: <><path d="M12 2v20M3 7l18 10M3 17L21 7M9 4l3 3 3-3M9 20l3-3 3 3M3 11l4-1-1-4m12 12-1-4 4-1M3 13l4 1-1 4m12-12-1 4 4 1"/></>,
  thunder: <><path d="M6 14a5 5 0 1 1 2-9 6 6 0 0 1 11 3 3 3 0 0 1 1 6M13 12l-4 6h5l-3 5"/></>,
  temperature: <><path d="M9 14.8V5a3 3 0 0 1 6 0v9.8a5 5 0 1 1-6 0Z"/><path d="M12 8v10"/><circle cx="12" cy="18" r="1"/></>,
  wind: <><path d="M3 8h12a3 3 0 1 0-3-3M3 12h16a3 3 0 1 1-3 3M3 16h6a3 3 0 1 1-3 3"/></>,
  gust: <><path d="M2 7h13a3 3 0 1 0-3-3M2 12h17a3 3 0 1 1-3 3M2 17h8"/><path d="m11 20 3-3-3-3"/></>,
  rain: <><path d="M12 3s-7 8-7 12a7 7 0 0 0 14 0c0-4-7-12-7-12Z"/><path d="M9 16a3 3 0 0 0 3 3"/></>,
  sunrise: <><path d="M2 18h20M5 15a7 7 0 0 1 14 0M12 2v7m-3-3 3-3 3 3M3 7l2 2m14 0 2-2"/></>,
  sunset: <><path d="M2 18h20M5 15a7 7 0 0 1 14 0M12 2v7m-3-3 3 3 3-3M3 7l2 2m14 0 2-2"/></>,
  dawn: <><path d="M2 18h20M5 15a7 7 0 0 1 14 0M12 3v2M4 7l2 2m12 0 2-2"/></>,
  dusk: <><path d="M2 18h20M5 15a7 7 0 0 1 14 0M20 3a4 4 0 0 1-5 5 4 4 0 0 0 5-5Z"/></>,
};

// Decorative pictograms. Sky icons are selected only from supplied WMO codes.
export default function WeatherIcon({ kind, className }) {
  if (!icons[kind]) return null;
  return <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" focusable="false">{icons[kind]}</svg>;
}
