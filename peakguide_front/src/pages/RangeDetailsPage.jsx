import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { fetchPeaks } from "../api/peakguide";
import { useMediaQuery } from "../hooks/useMediaQuery";

export default function RangeDetailsPage({ lang = "pl" }) {
	const { slug } = useParams();
	const isMobile = useMediaQuery("(max-width: 900px)");

	const [status, setStatus] = useState("loading"); // loading | success | error
	const [peaks, setPeaks] = useState([]);

	const labels = useMemo(() => getLabels(lang), [lang]);

	useEffect(() => {
		let alive = true;

		(async () => {
			try {
				setStatus("loading");
				const all = await fetchPeaks({ lang });

				if (!alive) return;

				const filtered = (Array.isArray(all) ? all : []).filter(
					(p) => p.range_slug === slug,
				);

				setPeaks(filtered);
				setStatus("success");
			} catch {
				if (!alive) return;
				setStatus("error");
			}
		})();

		return () => {
			alive = false;
		};
	}, [lang, slug]);

	if (status === "loading") {
		return <div style={wrap}>Loading…</div>;
	}

	if (status === "error") {
		return <div style={wrap}>Failed to load range.</div>;
	}

	return (
		<div style={wrap}>
			{/* Header */}
			<section style={hero}>
				<h1 style={heroTitle(isMobile)}>
					{labels.range}: {slug}
				</h1>
				<p style={heroSubtitle}>{labels.peaksCount(peaks.length)}</p>
			</section>

			{/* Peaks list */}
			{peaks.length === 0 ? (
				<div style={muted}>—</div>
			) : (
				<div style={grid}>
					{peaks.map((p) => (
						<Link
							key={p.slug}
							to={`/peaks/${p.slug}`}
							style={{ textDecoration: "none", color: "inherit" }}
						>
							<article style={card}>
								<div style={cardTitle}>{p.peak_name}</div>
								<div style={cardMeta}>⛰️ {p.elevation_m} m</div>
							</article>
						</Link>
					))}
				</div>
			)}
		</div>
	);
}

/* ----------------------------- labels ----------------------------- */

function getLabels(lang) {
	const dict = {
		pl: {
			range: "Pasmo",
			peaksCount: (n) => `Liczba szczytów: ${n}`,
		},
		en: {
			range: "Range",
			peaksCount: (n) => `Number of peaks: ${n}`,
		},
		ua: {
			range: "Хребет",
			peaksCount: (n) => `Кількість вершин: ${n}`,
		},
		zh: {
			range: "山脉",
			peaksCount: (n) => `山峰数量: ${n}`,
		},
	};

	return dict[lang] || dict.pl;
}

/* ----------------------------- styles ----------------------------- */

const wrap = {
	maxWidth: 1140,
	margin: "0 auto",
	padding: "8px 0 20px",
};

const hero = {
	border: "1px solid var(--border)",
	borderRadius: 22,
	padding: 18,
	background: "var(--menu-bg)",
	boxShadow: "var(--shadow-soft)",
	marginBottom: 14,
};

const heroTitle = (isMobile) => ({
	margin: 0,
	fontSize: isMobile ? 26 : 32,
	letterSpacing: "-0.6px",
});

const heroSubtitle = {
	marginTop: 8,
	color: "var(--muted)",
};

const muted = {
	marginTop: 10,
	color: "var(--muted)",
};

const grid = {
	display: "grid",
	gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
	gap: 12,
};

const card = {
	border: "1px solid var(--ink)",
	borderRadius: 18,
	padding: 14,
	background: "var(--surface-2)",
	boxShadow: "var(--shadow-soft)",
	transition: "transform 140ms ease, box-shadow 140ms ease",
};

const cardTitle = {
	fontWeight: 1000,
	letterSpacing: "-0.2px",
};

const cardMeta = {
	marginTop: 6,
	color: "var(--muted)",
	fontSize: 12,
	fontWeight: 900,
};
