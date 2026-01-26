export async function fetchPeaks({ lang = "pl" } = {}) {
  const res = await fetch(`/api/peaks?lang=${encodeURIComponent(lang)}`);
  if (!res.ok) throw new Error(`Failed to load peaks (${res.status})`);
  return res.json();
}

export async function fetchRanges({ lang = "pl" } = {}) {
  const res = await fetch(`/api/ranges?lang=${encodeURIComponent(lang)}`);
  if (!res.ok) throw new Error(`Failed to load ranges (${res.status})`);
  return res.json();
}
