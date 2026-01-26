import { useMemo, useState } from "react";
import { fetchPeaks, fetchRanges } from "../api/peakguide";
import { useAsync } from "../hooks/useAsync";
import PeaksToolbar from "../components/PeaksToolbar";
import PeakCard from "../components/PeakCard";
import PeakCardSkeleton from "../components/PeakCardSkeleton";

export default function PeaksPage({ lang }) {
  const [q, setQ] = useState("");
  const [range, setRange] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const peaksState = useAsync(() => fetchPeaks({ lang }), [lang, refreshKey]);
  const rangesState = useAsync(() => fetchRanges({ lang }), [lang, refreshKey]);

  const peaks = useMemo(() => peaksState.data || [], [peaksState.data]);

  const filtered = useMemo(() => {
    const qq = q.trim().toLowerCase();
    return peaks
      .filter((p) => (range ? p.range_slug === range : true))
      .filter((p) => (qq ? p.peak_name.toLowerCase().includes(qq) : true));
  }, [peaks, q, range]);

  const isLoading = peaksState.status === "loading";
  const isError = peaksState.status === "error";

  return (
    <div style={{ display: "grid", gap: 14 }}>
      <div style={toolbarBox}>
    <PeaksToolbar
    q={q}
    setQ={setQ}
    range={range}
    setRange={setRange}
    ranges={rangesState.data || []}
    lang={lang}
  />

  <div style={counter}>
    {lang === "pl" ? "Wyniki" : "Results"}: <b>{filtered.length}</b>
  </div>
</div>


      {isError && (
        <div style={errorBox}>
          <div style={{ fontWeight: 800, marginBottom: 6 }}>
            {lang === "pl" ? "Nie udało się pobrać danych" : "Failed to load data"}
          </div>
          <div style={{ opacity: 0.9, marginBottom: 10 }}>{peaksState.error}</div>
          <button style={retryBtn} onClick={() => setRefreshKey((x) => x + 1)}>
            {lang === "pl" ? "Spróbuj ponownie" : "Retry"}
          </button>
        </div>
      )}

      {!isError && (
        <div style={grid}>
          {isLoading
            ? Array.from({ length: 10 }).map((_, i) => <PeakCardSkeleton key={i} />)
            : filtered.map((p) => <PeakCard key={p.slug} peak={p} lang={lang} />)}
        </div>
      )}
    </div>
  );
}

const toolbarBox = {
  display: "flex",
  justifyContent: "space-between",
  gap: 12,
  alignItems: "flex-end",
  flexWrap: "wrap",
  border: "1px solid var(--border)",
  borderRadius: 18,
  padding: 12,
  background: "var(--surface)",
  boxShadow: "var(--shadow-soft)",
};

const counter = {
  border: "1px solid var(--border)",
  borderRadius: 999,
  padding: "10px 12px",
  background: "var(--surface)",
  fontSize: 13,
  boxShadow: "var(--shadow-soft)",
};

const errorBox = {
  border: "1px solid rgba(185,28,28,0.25)",
  borderRadius: 18,
  padding: 14,
  background: "rgba(185,28,28,0.06)",
};

const retryBtn = {
  border: "1px solid rgba(31,122,79,0.30)",
  borderRadius: 12,
  padding: "10px 12px",
  background: "rgba(31,122,79,0.10)",
  color: "var(--primary)",
  cursor: "pointer",
  fontWeight: 900,
};

const grid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))",
  gap: 12,
  paddingTop: 6,
};

