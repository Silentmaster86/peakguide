export default function PeakCard({ peak, lang }) {
  const heightLabel = lang === "pl" ? "Wysokość" : "Elevation";

  return (
    <article
      style={card}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "var(--shadow)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0px)";
        e.currentTarget.style.boxShadow = "var(--shadow-soft)";
      }}
    >
      <header style={cardTop}>
        <div style={{ minWidth: 0 }}>
          <h3 style={title} title={peak.peak_name}>
            {peak.peak_name}
          </h3>
          <div style={sub}>{peak.range_name}</div>
        </div>

        <div style={badge} title={heightLabel}>
          ⛰️ {peak.elevation_m} m
        </div>
      </header>
    </article>
  );
}

const card = {
  border: "1px solid rgba(15,23,42,0.10)",
  borderRadius: 18,
  padding: 14,
  background: "var(--surface-2)",
  boxShadow: "var(--shadow-soft)",
  transition: "transform 140ms ease, box-shadow 140ms ease",
};

const cardTop = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "flex-start",
  gap: 12,
};

const title = { margin: 0, fontSize: 18, letterSpacing: "-0.2px" };
const sub = { color: "var(--muted)", fontSize: 13, marginTop: 4 };

const badge = {
  border: "1px solid rgba(31,122,79,0.28)",
  borderRadius: 999,
  padding: "7px 10px",
  fontWeight: 900,
  fontSize: 13,
  whiteSpace: "nowrap",
  color: "var(--primary)",
  background: "rgba(31,122,79,0.09)",
};
