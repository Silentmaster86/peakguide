import { Router } from "express";
import { db } from "../db.js";

export const peaksRouter = Router();

peaksRouter.get("/peaks", async (req, res) => {
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
    [lang]
  );

  res.json(rows);
});

peaksRouter.get("/peaks/:slug", async (req, res) => {
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
    [lang, slug]
  );

  if (!rows.length) return res.status(404).json({ error: "Peak not found" });
  res.json(rows[0]);
});
