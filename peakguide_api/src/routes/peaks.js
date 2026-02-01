import { Router } from "express";
import { db } from "../db.js";

export const peaksRouter = Router();

peaksRouter.get("/peaks", async (req, res) => {
	try {
		const lang = (req.query.lang || "pl").toLowerCase();

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
    -- no active filter for now
    ORDER BY p.elevation_m DESC;
    `,
			[lang],
		);

		res.json(rows);
	} catch (err) {
		console.error("GET /peaks failed:", err);
		res.status(500).json({ error: "Internal server error" });
	}
});

peaksRouter.get("/peaks/:slug", async (req, res) => {
	try {
		const lang = (req.query.lang || "pl").toLowerCase();
		const { slug } = req.params;

		const { rows } = await db.query(
			`
    SELECT
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
    WHERE p.slug = $2;
    `,
			[lang, slug],
		);

		if (!rows.length) return res.status(404).json({ error: "Peak not found" });
		res.json(rows[0]);
	} catch (err) {
		console.error("GET /peaks/:slug failed:", err);
		res.status(500).json({ error: "Internal server error" });
	}
});

peaksRouter.get("/peaks/:slug/trails", async (req, res) => {
	try {
		const lang = (req.query.lang || "pl").toLowerCase();
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
});

peaksRouter.get("/peaks/:slug/pois", async (req, res) => {
	try {
		const lang = (req.query.lang || "pl").toLowerCase();
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
});
