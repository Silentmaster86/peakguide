import { Helmet } from "react-helmet-async";

export const SITE_URL = "https://peak-guide.netlify.app";
export const SITE_NAME = "PeakGuide";

/**
 * Generic SEO component
 */
export function SEO({
	title,
	description,
	canonical,
	image,
	type = "website",
}) {
	const url = canonical;

	return (
		<Helmet>
			{/* Basic */}
			<title>{title}</title>
			<meta name='description' content={description} />

			{/* Canonical */}
			{canonical && <link rel='canonical' href={canonical} />}

			{/* OpenGraph */}
			<meta property='og:type' content={type} />
			<meta property='og:title' content={title} />
			<meta property='og:description' content={description} />
			{url && <meta property='og:url' content={url} />}
			{image && <meta property='og:image' content={image} />}

			{/* Twitter */}
			<meta name='twitter:card' content='summary_large_image' />
			<meta name='twitter:title' content={title} />
			<meta name='twitter:description' content={description} />
			{image && <meta name='twitter:image' content={image} />}
		</Helmet>
	);
}

/**
 * Peak Details SEO
 */
export function PeakSEO({ peak, lang = "pl" }) {
	if (!peak) return null;

	const canonical = `${SITE_URL}/peaks/${peak.slug}`;

	const title =
		lang === "pl"
			? `${peak.name} (${peak.elevation_m} m) — ${SITE_NAME}`
			: `${peak.name} (${peak.elevation_m} m) — ${SITE_NAME}`;

	const description =
		peak.short_description ||
		(lang === "pl"
			? `Poznaj szczyt ${peak.name}: wysokość, pasmo, współrzędne, mapa i pobliskie szczyty.`
			: `Explore ${peak.name}: elevation, range, coordinates, map and nearby peaks.`);

	// Structured data
	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "Place",
		name: peak.name,
		description,
		url: canonical,
		geo:
			peak.latitude && peak.longitude
				? {
						"@type": "GeoCoordinates",
						latitude: Number(peak.latitude),
						longitude: Number(peak.longitude),
					}
				: undefined,
	};

	return (
		<>
			<SEO
				title={title}
				description={description}
				canonical={canonical}
				type='article'
			/>

			<Helmet>
				<script type='application/ld+json'>{JSON.stringify(jsonLd)}</script>
			</Helmet>
		</>
	);
}

/**
 * Range Details SEO
 */
export function RangeSEO({ range, lang = "pl" }) {
	if (!range) return null;

	const canonical = `${SITE_URL}/ranges/${range.slug}`;

	const title =
		lang === "pl"
			? `${range.name || range.slug} — Pasmo górskie | ${SITE_NAME}`
			: `${range.name || range.slug} — Mountain range | ${SITE_NAME}`;

	const description =
		lang === "pl"
			? `Lista szczytów w paśmie ${range.name || range.slug}. Sprawdź wysokości i przejdź do szczegółów.`
			: `Peaks in ${range.name || range.slug}. Check elevations and open details.`;

	return <SEO title={title} description={description} canonical={canonical} />;
}
