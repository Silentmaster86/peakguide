import { Router } from "express";
import { db } from "../db.js";

export const rangesRouter = Router();

rangesRouter.get("/ranges", async (req, res) => {
	try {
		const lang = (req.query.lang || "pl").toLowerCase();

		const { rows } = await db.query(
			`
      SELECT r.slug, ri.name
      FROM mountain_ranges r
      JOIN mountain_ranges_i18n ri
        ON ri.range_id = r.id
      WHERE ri.lang = $1
      ORDER BY ri.name;
      `,
			[lang],
		);

		res.json(rows);
	} catch (err) {
		console.error("GET /ranges failed:", err);
		res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * GET /ranges/:slug
 * Returns range details + peaks inside this range (localized).
 */
rangesRouter.get("/ranges/:slug", async (req, res) => {
	try {
		const lang = (req.query.lang || "pl").toLowerCase();
		const { slug } = req.params;

		// 1) Range details (name + description)
		const rangeRes = await db.query(
			`
      SELECT
        r.slug,
        ri.name,
        ri.description
      FROM mountain_ranges r
      JOIN mountain_ranges_i18n ri
        ON ri.range_id = r.id AND ri.lang = $1
      WHERE r.slug = $2;
      `,
			[lang, slug],
		);

		if (!rangeRes.rows.length) {
			return res.status(404).json({ error: "Range not found" });
		}

		// 2) Peaks in this range
		const peaksRes = await db.query(
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
      WHERE r.slug = $2
      ORDER BY p.elevation_m DESC;
      `,
			[lang, slug],
		);

		res.json({
			...rangeRes.rows[0],
			peaks: peaksRes.rows,
		});
	} catch (err) {
		console.error("GET /ranges/:slug failed:", err);
		res.status(500).json({ error: "Internal server error" });
	}
});
