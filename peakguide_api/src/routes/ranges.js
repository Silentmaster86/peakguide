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
