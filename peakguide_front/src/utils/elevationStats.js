export function elevationStats(peaks) {
  const elevations = peaks.map((peak) => peak.elevation_m)
    .filter((value) => value != null && typeof value !== 'boolean' && String(value).trim() !== '')
    .map(Number).filter(Number.isFinite);
  return { count: peaks.length, maxElev: elevations.length ? Math.max(...elevations) : null, minElev: elevations.length ? Math.min(...elevations) : null };
}
