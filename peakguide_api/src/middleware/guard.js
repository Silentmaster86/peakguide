import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;

export function requireAuth(req, res, next) {
	try {
		const token = req.cookies?.token;
		if (!token) return res.status(401).json({ error: "Unauthorized" });
		const payload = jwt.verify(token, JWT_SECRET);
		req.user = payload; // { id, email, is_admin }
		next();
	} catch {
		return res.status(401).json({ error: "Unauthorized" });
	}
}

export function requireAdmin(req, res, next) {
	if (!req.user) return res.status(401).json({ error: "Unauthorized" });
	if (!req.user.is_admin) return res.status(403).json({ error: "Forbidden" });
	next();
}
