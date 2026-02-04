import { db } from "../db.js";

function safeLang(lang) {
	const allowed = new Set(["pl", "en", "ua", "zh"]);
	const v = (lang || "pl").toLowerCase();
	return allowed.has(v) ? v : "pl";
}

/**
 * GET /peaks?lang=pl
 */
export async function listPeaks(req, res) {
	try {
		const lang = safeLang(req.query.lang);

		const { rows } = await db.query(
			`
      SELECT
        p.slug,
        pi.name AS peak_name,
        p.elevation_m,
        r.slug AS range_slug,
        ri.name AS range_name
      FROM peaks p
      JOIN peaks_i18n pi
        ON pi.peak_id = p.id AND pi.lang = $1
      JOIN mountain_ranges r
        ON r.id = p.range_id
      JOIN mountain_ranges_i18n ri
        ON ri.range_id = r.id AND ri.lang = $1
      ORDER BY p.elevation_m DESC;
      `,
			[lang],
		);

		res.json(rows);
	} catch (err) {
		console.error("GET /peaks failed:", err);
		res.status(500).json({ error: "Internal server error" });
	}
}

/**
 * GET /peaks/:slug?lang=pl
 */
export async function getPeakBySlug(req, res) {
	try {
		const lang = safeLang(req.query.lang);
		const { slug } = req.params;

		const { rows } = await db.query(
			`
      SELECT
        p.id,
        p.slug,
        pi.name,
        pi.short_description,
        pi.description,
        p.elevation_m,
        p.latitude,
        p.longitude,
        r.slug AS range_slug,
        ri.name AS range_name
      FROM peaks p
      JOIN peaks_i18n pi
        ON pi.peak_id = p.id AND pi.lang = $1
      JOIN mountain_ranges r
        ON r.id = p.range_id
      JOIN mountain_ranges_i18n ri
        ON ri.range_id = r.id AND ri.lang = $1
      WHERE p.slug = $2
      LIMIT 1;
      `,
			[lang, slug],
		);

		if (!rows.length) return res.status(404).json({ error: "Peak not found" });
		res.json(rows[0]);
	} catch (err) {
		console.error("GET /peaks/:slug failed:", err);
		res.status(500).json({ error: "Internal server error" });
	}
}

/**
 * GET /peaks/:slug/trails?lang=pl
 */
export async function getPeakTrails(req, res) {
	try {
		const lang = safeLang(req.query.lang);
		const slug = req.params.slug;

		const { rows } = await db.query(
			`
      SELECT
        t.slug,
        COALESCE(ti.name, t.slug) AS name,
        ti.description,
        ti.notes,
        t.start_point_name,
        t.end_point_name,
        t.distance_km,
        t.elevation_gain_m,
        t.time_min,
        t.difficulty,
        t.route_type,
        t.gpx_url,
        t.map_url
      FROM peaks p
      JOIN trails t ON t.peak_id = p.id
      LEFT JOIN trails_i18n ti
        ON ti.trail_id = t.id AND ti.lang = $2
      WHERE p.slug = $1
        AND t.active = true
      ORDER BY COALESCE(ti.name, t.slug);
      `,
			[slug, lang],
		);

		res.json(rows);
	} catch (err) {
		console.error("GET /peaks/:slug/trails failed:", err);
		res.status(500).json({ error: "Internal server error" });
	}
}

/**
 * GET /peaks/:slug/pois?lang=pl
 */
export async function getPeakPois(req, res) {
	try {
		const lang = safeLang(req.query.lang);
		const slug = req.params.slug;

		const { rows } = await db.query(
			`
      SELECT
        poi.id,
        pt.slug AS type_slug,
        COALESCE(pti.name, pt.slug) AS type_name,
        COALESCE(pii.name, 'POI') AS name,
        pii.description,
        pii.tips,
        poi.latitude,
        poi.longitude,
        poi.website_url,
        poi.google_maps_url
      FROM peaks p
      JOIN pois poi ON poi.peak_id = p.id
      JOIN poi_types pt ON pt.id = poi.type_id
      LEFT JOIN poi_types_i18n pti
        ON pti.type_id = pt.id AND pti.lang = $2
      LEFT JOIN pois_i18n pii
        ON pii.poi_id = poi.id AND pii.lang = $2
      WHERE p.slug = $1
        AND poi.active = true
      ORDER BY COALESCE(pii.name, 'POI');
      `,
			[slug, lang],
		);

		res.json(rows);
	} catch (err) {
		console.error("GET /peaks/:slug/pois failed:", err);
		res.status(500).json({ error: "Internal server error" });
	}
}

/**
 * GET /peaks/:slug/nearby?lang=pl
 * peaks.geom column (GEOGRAPHY or GEOMETRY) created from latitude/longitude
 * Additional peaks in the same range_id (besides the KGP peak),
 * so there are nearby results to return
 */
export async function getNearbyPeaks(req, res) {
	try {
		const lang = safeLang(req.query.lang);
		const { slug } = req.params;

		const baseRes = await db.query(
			`
      SELECT p.id, p.slug, p.range_id, p.geom
      FROM peaks p
      WHERE p.slug = $1
      LIMIT 1;
      `,
			[slug],
		);

		const base = baseRes.rows[0];
		if (!base) return res.status(404).json({ error: "Peak not found" });
		if (!base.geom)
			return res.status(400).json({ error: "Peak missing geom (coords)" });

		const { rows } = await db.query(
			`
      SELECT
        p.slug,
        pi.name AS name,
        p.elevation_m,
        ROUND((ST_Distance(p.geom, $1) / 1000.0)::numeric, 1) AS distance_km
      FROM peaks p
      JOIN peaks_i18n pi
        ON pi.peak_id = p.id AND pi.lang = $2
      WHERE p.range_id = $3
        AND p.slug <> $4
        AND p.geom IS NOT NULL
      ORDER BY ST_Distance(p.geom, $1) ASC
      LIMIT 2;
      `,
			[base.geom, lang, base.range_id, slug],
		);

		res.json({ items: rows });
	} catch (err) {
		console.error("GET /peaks/:slug/nearby failed:", err);
		res.status(500).json({ error: "Internal server error" });
	}
}
