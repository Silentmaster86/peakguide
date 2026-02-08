import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { db } from "../db.js";

const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET;

function normalizeEmail(email) {
	return String(email || "")
		.trim()
		.toLowerCase();
}

function setAuthCookie(res, token) {
	const isProd = process.env.NODE_ENV === "production";
	res.cookie("token", token, {
		httpOnly: true,
		sameSite: isProd ? "none" : "lax",
		secure: isProd, // Render/https -> true
		maxAge: 7 * 24 * 60 * 60 * 1000,
	});
}

function signToken(user) {
	if (!JWT_SECRET) throw new Error("Missing JWT_SECRET");
	return jwt.sign(
		{ id: user.id, email: user.email, is_admin: user.is_admin },
		JWT_SECRET,
		{ expiresIn: "7d" },
	);
}

/**
 * POST /api/auth/register
 * body: { email, password, firstName, lastName }
 * (dopasowane do Twojego frontu)
 */
router.post("/register", async (req, res) => {
	try {
		const email = normalizeEmail(req.body.email);
		const password = String(req.body.password || "");
		const firstName = String(req.body.firstName || "").trim();
		const lastName = String(req.body.lastName || "").trim();

		if (!email || !email.includes("@"))
			return res.status(400).json({ error: "Invalid email" });
		if (password.length < 8)
			return res
				.status(400)
				.json({ error: "Password must be at least 8 characters" });

		const displayName =
			`${firstName} ${lastName}`.trim() || email.split("@")[0];

		const passwordHash = await bcrypt.hash(password, 10);

		// first user becomes admin (MVP bootstrap)
		const countRes = await db.query(`SELECT COUNT(*)::int AS n FROM users;`);
		const isAdmin = countRes.rows[0].n === 0;

		const { rows } = await db.query(
			`INSERT INTO users (email, password_hash, display_name, is_admin, active)
       VALUES ($1, $2, $3, $4, true)
       RETURNING id, email, display_name, is_admin;`,
			[email, passwordHash, displayName, isAdmin],
		);

		const user = rows[0];
		const token = signToken(user);
		setAuthCookie(res, token);

		res.json({ user });
	} catch (err) {
		if (err?.code === "23505")
			return res.status(409).json({ error: "Email already exists" });
		console.error("POST /api/auth/register failed:", err);
		res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * POST /api/auth/login
 * body: { email, password }
 */
router.post("/login", async (req, res) => {
	try {
		const email = normalizeEmail(req.body.email);
		const password = String(req.body.password || "");

		const { rows } = await db.query(
			`SELECT id, email, password_hash, display_name, is_admin
       FROM users
       WHERE email=$1 AND active=true
       LIMIT 1;`,
			[email],
		);

		const u = rows[0];
		if (!u) return res.status(401).json({ error: "Invalid credentials" });

		const ok = await bcrypt.compare(password, u.password_hash);
		if (!ok) return res.status(401).json({ error: "Invalid credentials" });

		const user = {
			id: u.id,
			email: u.email,
			display_name: u.display_name,
			is_admin: u.is_admin,
		};
		const token = signToken(user);
		setAuthCookie(res, token);

		res.json({ user });
	} catch (err) {
		console.error("POST /api/auth/login failed:", err);
		res.status(500).json({ error: "Internal server error" });
	}
});

/**
 * POST /api/auth/logout
 */
router.post("/logout", async (_req, res) => {
	res.clearCookie("token");
	res.json({ ok: true });
});

/**
 * GET /api/auth/me
 * (czyta z cookie token)
 */
router.get("/me", async (req, res) => {
	try {
		const token = req.cookies?.token;
		if (!token) return res.status(401).json({ error: "Unauthorized" });

		const payload = jwt.verify(token, JWT_SECRET);

		const { rows } = await db.query(
			`SELECT id, email, display_name, is_admin
       FROM users
       WHERE id=$1 AND active=true
       LIMIT 1;`,
			[payload.id],
		);

		if (!rows.length) return res.status(401).json({ error: "Unauthorized" });
		res.json(rows[0]);
	} catch {
		res.status(401).json({ error: "Unauthorized" });
	}
});

export default router;
