import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET || "test_secret";

// zgodnie z middleware: req.cookies.token
export function cookieForUser(payload) {
	const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
	return [`token=${token}`]; // supertest expects array or string
}

export function cookieUser() {
	return cookieForUser({ id: 1, email: "user@test.com", is_admin: false });
}

export function cookieAdmin() {
	return cookieForUser({ id: 999, email: "admin@test.com", is_admin: true });
}
