import { Router } from "express";
import { db } from "../db.js";
import { requireAuth, requireAdmin } from "../middleware/guard.js";

export const messagesRouter = Router();

function normalizeEmail(email) {
	return String(email || "")
		.trim()
		.toLowerCase();
}

/**
 * POST /api/messages
 * Public: user może wysłać wiadomość (bez logowania też OK)
 * body: { email, message }
 */
messagesRouter.post("/messages", async (req, res) => {
	console.log("POST /api/messages HIT", req.body);
	try {
		const email = normalizeEmail(req.body.email);
		const message = String(req.body.message || "").trim();

		if (!email || !email.includes("@"))
			return res.status(400).json({ error: "Invalid email" });
		if (!message || message.length < 5)
			return res.status(400).json({ error: "Message too short" });

		const { rows } = await db.query(
			`
      INSERT INTO contact_messages (email, message)
      VALUES ($1, $2)
      RETURNING id, email, message, created_at, status;
      `,
			[email, message],
		);

		res.status(201).json({ item: rows[0] });
	} catch (err) {
		console.error("POST /api/messages failed:", err);
		res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * GET /api/admin/messages
 * Admin only: lista wiadomości
 */
messagesRouter.get(
	"/admin/messages",
	requireAuth,
	requireAdmin,
	async (_req, res) => {
		try {
			const { rows } = await db.query(
				`
        SELECT id, email, message, created_at, status
        FROM contact_messages
        ORDER BY created_at DESC
        LIMIT 200;
        `,
			);

			// id jako string (BigInt safe)
			res.json({
				items: rows.map((r) => ({
					...r,
					id: String(r.id),
				})),
			});
		} catch (err) {
			console.error("GET /api/admin/messages failed:", err);
			res.status(500).json({ error: "Internal server error" });
		}
	},
);

/**
 * PATCH /api/admin/messages/:id/status
 * Admin only: zmiana statusu (new/archived)
 * body: { status }
 */
messagesRouter.patch(
	"/admin/messages/:id/status",
	requireAuth,
	requireAdmin,
	async (req, res) => {
		try {
			const id = BigInt(req.params.id);
			const status = String(req.body.status || "").trim();

			if (!["new", "archived"].includes(status))
				return res.status(400).json({ error: "Invalid status" });

			const { rows } = await db.query(
				`
        UPDATE contact_messages
        SET status = $2
        WHERE id = $1
        RETURNING id, status;
        `,
				[id, status],
			);

			if (!rows.length) return res.status(404).json({ error: "Not found" });

			res.json({ id: String(rows[0].id), status: rows[0].status });
		} catch (err) {
			console.error("PATCH /api/admin/messages/:id/status failed:", err);
			res.status(500).json({ error: "Internal server error" });
		}
	},
);

/**
 * DELETE /api/admin/messages/:id
 * Admin only: usuń wiadomość
 */
messagesRouter.delete(
	"/admin/messages/:id",
	requireAuth,
	requireAdmin,
	async (req, res) => {
		try {
			const id = BigInt(req.params.id);

			const { rowCount } = await db.query(
				`DELETE FROM contact_messages WHERE id=$1`,
				[id],
			);

			if (!rowCount) return res.status(404).json({ error: "Not found" });
			res.status(204).send();
		} catch (err) {
			console.error("DELETE /api/admin/messages/:id failed:", err);
			res.status(500).json({ error: "Internal server error" });
		}
	},
);
