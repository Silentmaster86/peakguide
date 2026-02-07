import { db } from "../db.js";

function safeLang(lang) {
	const allowed = new Set(["pl", "en", "ua", "zh"]);
	const v = (lang || "pl").toLowerCase();
	return allowed.has(v) ? v : "pl";
}

/**
 * GET /peaks?lang=pl&only=all|korona|nearby
 */
export async function listPeaks(req, res) {
	try {
		const lang = safeLang(req.query.lang);
		const only = String(req.query.only || "all").toLowerCase(); // all | korona | nearby

		const where =
			only === "korona"
				? "WHERE p.is_korona = true"
				: only === "nearby"
					? "WHERE p.is_korona = false"
					: "";

		const { rows } = await db.query(
			`
  SELECT
    p.slug,
    COALESCE(pi_lang.name, pi_pl.name, p.slug) AS peak_name,
    p.elevation_m,
    p.latitude,
    p.longitude,
    p.is_korona,
    r.slug AS range_slug,
    COALESCE(ri_lang.name, ri_pl.name, r.slug) AS range_name
  FROM peaks p
  LEFT JOIN peaks_i18n pi_lang
    ON pi_lang.peak_id = p.id AND pi_lang.lang = $1
  LEFT JOIN peaks_i18n pi_pl
    ON pi_pl.peak_id = p.id AND pi_pl.lang = 'pl'
  JOIN mountain_ranges r
    ON r.id = p.range_id
  LEFT JOIN mountain_ranges_i18n ri_lang
    ON ri_lang.range_id = r.id AND ri_lang.lang = $1
  LEFT JOIN mountain_ranges_i18n ri_pl
    ON ri_pl.range_id = r.id AND ri_pl.lang = 'pl'
  ${where}
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
    COALESCE(pi_lang.name, pi_pl.name, p.slug) AS name,
    COALESCE(pi_lang.short_description, pi_pl.short_description) AS short_description,
    COALESCE(pi_lang.description, pi_pl.description) AS description,
    p.elevation_m,
    p.latitude,
    p.longitude,
    r.slug AS range_slug,
    COALESCE(ri_lang.name, ri_pl.name, r.slug) AS range_name
  FROM peaks p
  LEFT JOIN peaks_i18n pi_lang
    ON pi_lang.peak_id = p.id AND pi_lang.lang = $1
  LEFT JOIN peaks_i18n pi_pl
    ON pi_pl.peak_id = p.id AND pi_pl.lang = 'pl'
  JOIN mountain_ranges r
    ON r.id = p.range_id
  LEFT JOIN mountain_ranges_i18n ri_lang
    ON ri_lang.range_id = r.id AND ri_lang.lang = $1
  LEFT JOIN mountain_ranges_i18n ri_pl
    ON ri_pl.range_id = r.id AND ri_pl.lang = 'pl'
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
        COALESCE(ti_lang.name, ti_pl.name, t.slug) AS name,
        COALESCE(ti_lang.description, ti_pl.description) AS description,
        COALESCE(ti_lang.notes, ti_pl.notes) AS notes,
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
      JOIN trails t
        ON t.peak_id = p.id
      LEFT JOIN trails_i18n ti_lang
        ON ti_lang.trail_id = t.id AND ti_lang.lang = $2
      LEFT JOIN trails_i18n ti_pl
        ON ti_pl.trail_id = t.id AND ti_pl.lang = 'pl'
      WHERE p.slug = $1
        AND t.active = true
      ORDER BY COALESCE(ti_lang.name, ti_pl.name, t.slug);
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
        COALESCE(pti_lang.name, pti_pl.name, pt.slug) AS type_name,
        COALESCE(pii_lang.name, pii_pl.name, 'POI') AS name,
        COALESCE(pii_lang.description, pii_pl.description) AS description,
        COALESCE(pii_lang.tips, pii_pl.tips) AS tips,
        poi.latitude,
        poi.longitude,
        poi.website_url,
        poi.google_maps_url
      FROM peaks p
      JOIN pois poi
        ON poi.peak_id = p.id
      JOIN poi_types pt
        ON pt.id = poi.type_id
      LEFT JOIN poi_types_i18n pti_lang
        ON pti_lang.type_id = pt.id AND pti_lang.lang = $2
      LEFT JOIN poi_types_i18n pti_pl
        ON pti_pl.type_id = pt.id AND pti_pl.lang = 'pl'
      LEFT JOIN pois_i18n pii_lang
        ON pii_lang.poi_id = poi.id AND pii_lang.lang = $2
      LEFT JOIN pois_i18n pii_pl
        ON pii_pl.poi_id = poi.id AND pii_pl.lang = 'pl'
      WHERE p.slug = $1
        AND poi.active = true
      ORDER BY COALESCE(pii_lang.name, pii_pl.name, 'POI');
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
 * GET /peaks/:slug/nearby?lang=pl&limit=6
 */
export async function getNearbyPeaks(req, res) {
	try {
		const lang = safeLang(req.query.lang);
		const { slug } = req.params;
		const limit = Math.min(Number(req.query.limit || 6), 30);

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
    COALESCE(pi_lang.name, pi_pl.name, p.slug) AS name,
    p.elevation_m,
    ROUND((ST_Distance(p.geom, $1) / 1000.0)::numeric, 1) AS distance_km
  FROM peaks p
  LEFT JOIN peaks_i18n pi_lang
    ON pi_lang.peak_id = p.id AND pi_lang.lang = $2
  LEFT JOIN peaks_i18n pi_pl
    ON pi_pl.peak_id = p.id AND pi_pl.lang = 'pl'
  WHERE p.range_id = $3
    AND p.slug <> $4
    AND p.geom IS NOT NULL
    AND p.is_korona = false
  ORDER BY ST_Distance(p.geom, $1) ASC
  LIMIT $5;
  `,
			[base.geom, lang, base.range_id, slug, limit],
		);

		res.json({ items: rows });
	} catch (err) {
		console.error("GET /peaks/:slug/nearby failed:", err);
		res.status(500).json({ error: "Internal server error" });
	}
}
