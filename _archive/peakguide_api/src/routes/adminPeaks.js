import express from "express";
import { prisma } from "../db/prisma.js";
import { z } from "zod";

// Użyj swoich middleware (podmień importy na swoje ścieżki)
import { requireAuth, requireAdmin } from "../middleware/guard.js";

const router = express.Router();

const LANGS = ["pl", "en", "ua", "zh"];

const i18nSchema = z.object({
	name: z.string().min(1, "name required"),
	short_description: z.string().optional().nullable(),
	description: z.string().optional().nullable(),
	tips: z.string().optional().nullable(),
});

const peakSchema = z.object({
	slug: z.string().min(1),
	range_id: z.union([z.string(), z.number()]).transform((v) => BigInt(v)),
	subrange_id: z
		.union([z.string(), z.number()])
		.transform((v) => BigInt(v))
		.optional()
		.nullable(),
	elevation_m: z.number().int(),
	latitude: z.number().optional().nullable(),
	longitude: z.number().optional().nullable(),
	difficulty: z.string().optional().nullable(),
	best_season: z.string().optional().nullable(),
	cover_image_url: z.string().url().optional().nullable(),
	is_korona: z.boolean().default(true),
	active: z.boolean().default(true),
	i18n: z.record(z.enum(["pl", "en", "ua", "zh"]), i18nSchema),
});

// JSON nie wspiera BigInt -> zamieniamy na string
function serializePeak(peak, lang = "pl") {
	const peakI18n = peak.peaks_i18n || [];
	const t =
		peakI18n.find((x) => x.lang === lang) ||
		peakI18n.find((x) => x.lang === "pl") ||
		null;

	const range = peak.mountain_ranges || null;
	const rangeI18n = range?.mountain_ranges_i18n || [];
	const rLang =
		rangeI18n.find((x) => x.lang === lang) ||
		rangeI18n.find((x) => x.lang === "pl") ||
		null;

	return {
		id: peak.id.toString(),
		slug: peak.slug,

		range_id: peak.range_id?.toString?.() ?? null,
		range_slug: range?.slug ?? null,
		range_name: rLang?.name ?? range?.slug ?? null,

		subrange_id: peak.subrange_id?.toString?.() ?? null,
		elevation_m: peak.elevation_m,
		latitude: peak.latitude ? Number(peak.latitude) : null,
		longitude: peak.longitude ? Number(peak.longitude) : null,
		difficulty: peak.difficulty,
		best_season: peak.best_season,
		cover_image_url: peak.cover_image_url,
		is_korona: peak.is_korona,
		active: peak.active,
		created_at: peak.created_at,

		// nazwa do tabeli (z i18n)
		name: t?.name ?? null,
		lang,

		// pełne i18n do modala edycji
		i18n: LANGS.reduce((acc, l) => {
			const row = peakI18n.find((x) => x.lang === l);
			acc[l] = {
				name: row?.name ?? "",
				short_description: row?.short_description ?? "",
				description: row?.description ?? "",
				tips: row?.tips ?? "",
			};
			return acc;
		}, {}),
	};
}

/**
 * GET /api/admin/peaks?lang=pl&q=...
 * MVP: pobieramy wszystko i filtrujemy prosto (możemy dodać paginację później)
 */
router.get("/peaks", requireAuth, requireAdmin, async (req, res) => {
	const lang = (req.query.lang || "pl").toString();
	const q = (req.query.q || "").toString().trim();

	if (!LANGS.includes(lang))
		return res.status(400).json({ error: "Invalid lang" });

	// proste wyszukiwanie po slug lub i18n.name w danym języku
	const where = q
		? {
				OR: [
					{ slug: { contains: q, mode: "insensitive" } },
					{
						peaks_i18n: {
							some: { lang, name: { contains: q, mode: "insensitive" } },
						},
					},
				],
			}
		: {};

	const peaks = await prisma.peaks.findMany({
		where,
		orderBy: { elevation_m: "desc" },
		include: {
			peaks_i18n: true,
			mountain_ranges: {
				include: { mountain_ranges_i18n: true },
			},
		},
	});

	res.json({ items: peaks.map((p) => serializePeak(p, lang)) });
});

/**
 * POST /api/admin/peaks
 * transakcja: peaks + upsert i18n (4 języki)
 */
router.post("/peaks", requireAuth, requireAdmin, async (req, res) => {
	const parsed = peakSchema.safeParse(req.body);
	if (!parsed.success)
		return res.status(400).json({ error: parsed.error.flatten() });

	const b = parsed.data;

	try {
		const created = await prisma.$transaction(async (tx) => {
			const peak = await tx.peaks.create({
				data: {
					slug: b.slug,
					range_id: b.range_id,
					subrange_id: b.subrange_id ?? null,
					elevation_m: b.elevation_m,
					latitude: b.latitude ?? null,
					longitude: b.longitude ?? null,
					difficulty: b.difficulty ?? null,
					best_season: b.best_season ?? null,
					cover_image_url: b.cover_image_url ?? null,
					is_korona: b.is_korona,
					active: b.active,
				},
			});

			for (const l of LANGS) {
				const t = b.i18n[l];
				await tx.peaks_i18n.upsert({
					where: { peak_id_lang: { peak_id: peak.id, lang: l } },
					update: {
						name: t.name,
						short_description: t.short_description ?? null,
						description: t.description ?? null,
						tips: t.tips ?? null,
					},
					create: {
						peak_id: peak.id,
						lang: l,
						name: t.name,
						short_description: t.short_description ?? null,
						description: t.description ?? null,
						tips: t.tips ?? null,
					},
				});
			}

			const full = await tx.peaks.findUnique({
				where: { id: peak.id },
				include: { peaks_i18n: true },
			});

			return full;
		});

		res.status(201).json({ item: serializePeak(created, "pl") });
	} catch (e) {
		res
			.status(500)
			.json({ error: "Create failed", details: String(e?.message || e) });
	}
});

/**
 * PUT /api/admin/peaks/:id
 */
router.put("/peaks/:id", requireAuth, requireAdmin, async (req, res) => {
	const idRaw = req.params.id;
	let id;
	try {
		id = BigInt(idRaw);
	} catch {
		return res.status(400).json({ error: "Invalid id" });
	}

	// pozwalamy na częściową aktualizację
	const parsed = peakSchema.partial().safeParse(req.body);
	if (!parsed.success)
		return res.status(400).json({ error: parsed.error.flatten() });

	const b = parsed.data;

	try {
		const updated = await prisma.$transaction(async (tx) => {
			await tx.peaks.update({
				where: { id },
				data: {
					slug: b.slug ?? undefined,
					range_id: b.range_id ?? undefined,
					subrange_id: b.subrange_id === undefined ? undefined : b.subrange_id,
					elevation_m: b.elevation_m ?? undefined,
					latitude: b.latitude ?? undefined,
					longitude: b.longitude ?? undefined,
					difficulty: b.difficulty ?? undefined,
					best_season: b.best_season ?? undefined,
					cover_image_url: b.cover_image_url ?? undefined,
					is_korona: b.is_korona ?? undefined,
					active: b.active ?? undefined,
				},
			});

			if (b.i18n) {
				for (const l of LANGS) {
					const t = b.i18n[l];
					if (!t) continue;

					await tx.peaks_i18n.upsert({
						where: { peak_id_lang: { peak_id: id, lang: l } },
						update: {
							name: t.name,
							short_description: t.short_description ?? null,
							description: t.description ?? null,
							tips: t.tips ?? null,
						},
						create: {
							peak_id: id,
							lang: l,
							name: t.name,
							short_description: t.short_description ?? null,
							description: t.description ?? null,
							tips: t.tips ?? null,
						},
					});
				}
			}

			return tx.peaks.findUnique({
				where: { id },
				include: { peaks_i18n: true },
			});
		});

		res.json({ item: serializePeak(updated, "pl") });
	} catch (e) {
		res
			.status(500)
			.json({ error: "Update failed", details: String(e?.message || e) });
	}
});

/**
 * DELETE /api/admin/peaks/:id
 */
router.delete("/peaks/:id", requireAuth, requireAdmin, async (req, res) => {
	let id;
	try {
		id = BigInt(req.params.id);
	} catch {
		return res.status(400).json({ error: "Invalid id" });
	}

	try {
		await prisma.$transaction(async (tx) => {
			await tx.peaks_i18n.deleteMany({ where: { peak_id: id } });
			await tx.peaks.delete({ where: { id } });
		});

		res.json({ ok: true });
	} catch (e) {
		res
			.status(500)
			.json({ error: "Delete failed", details: String(e?.message || e) });
	}
});

export default router;
