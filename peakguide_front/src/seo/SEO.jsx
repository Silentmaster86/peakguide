import { Helmet } from "react-helmet-async";
import { parseCoordinates } from "../utils/coordinates";

import { SITE_URL, SITE_NAME } from './site';
export { SITE_URL, SITE_NAME } from './site';

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

	const title = `${peak.name} (${peak.elevation_m} m) — ${SITE_NAME}`;
	const fallbackDescriptions = {
		pl: `Poznaj szczyt ${peak.name}: wysokość, pasmo, współrzędne, mapa i pobliskie szczyty.`,
		en: `Explore ${peak.name}: elevation, range, coordinates, map and nearby peaks.`,
		ua: `Дізнайтеся про вершину ${peak.name}: висота, хребет, координати, мапа та сусідні вершини.`,
		zh: `了解${peak.name}：海拔、所属山脉、坐标、地图及附近山峰。`,
	};
	const description = peak.short_description || fallbackDescriptions[lang] || fallbackDescriptions.pl;

	const coordinates = parseCoordinates(peak.latitude, peak.longitude);
	
	// Structured data
	const jsonLd = {
		"@context": "https://schema.org",
		"@type": "Place",
		name: peak.name,
		description,
		url: canonical,
		geo: coordinates
				? {
						"@type": "GeoCoordinates",
						latitude: coordinates.lat,
						longitude: coordinates.lon,
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

	const name = range.name || range.slug;
	const words = { pl: 'Pasmo górskie', en: 'Mountain range', ua: 'Гірський хребет', zh: '山脉' };
	const title = `${name} — ${words[lang] || words.pl} | ${SITE_NAME}`;
	const descriptions = {
		pl: `Lista szczytów w paśmie ${name}. Sprawdź wysokości i przejdź do szczegółów.`,
		en: `Peaks in ${name}. Check elevations and open details.`,
		ua: `Вершини хребта ${name}. Перегляньте висоти та докладну інформацію.`,
		zh: `${name}的山峰列表。查看海拔并打开详细信息。`,
	};
	const description = descriptions[lang] || descriptions.pl;

	return <SEO title={title} description={description} canonical={canonical} />;
}
