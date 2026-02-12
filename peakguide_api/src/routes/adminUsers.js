import express from "express";
import { prisma } from "../db/prisma.js";
import { requireAuth, requireAdmin } from "../middleware/guard.js";

const router = express.Router();

/**
 * GET /api/admin/users
 */
router.get("/users", requireAuth, requireAdmin, async (_req, res) => {
	try {
		const users = await prisma.users.findMany({
			orderBy: { created_at: "desc" },
			select: {
				id: true,
				email: true,
				display_name: true,
				is_admin: true,
				active: true,
				created_at: true,
			},
		});

		res.json({
			items: users.map((u) => ({
				...u,
				id: u.id.toString(),
			})),
		});
	} catch (err) {
		console.error("GET /admin/users failed:", err);
		res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * PATCH /api/admin/users/:id/admin
 */
router.patch(
	"/users/:id/admin",
	requireAuth,
	requireAdmin,
	async (req, res) => {
		try {
			const id = BigInt(req.params.id);

			const user = await prisma.users.findUnique({ where: { id } });
			if (!user) return res.status(404).json({ error: "User not found" });

			const updated = await prisma.users.update({
				where: { id },
				data: { is_admin: !user.is_admin },
			});

			res.json({
				id: updated.id.toString(),
				is_admin: updated.is_admin,
			});
		} catch (err) {
			console.error("PATCH /admin/users/:id/admin failed:", err);
			res.status(500).json({ error: "Internal server error" });
		}
	},
);

export default router;
