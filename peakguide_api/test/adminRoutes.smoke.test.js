import request from "supertest";
import { describe, it, expect, beforeEach } from "vitest";
import { createApp } from "../src/app.js";
import { cleanDb } from "./db-clean.js";
import { cookieAdmin, cookieUser } from "./helpers.js";

describe("Admin routes - guard smoke tests", () => {
	const app = createApp();

	beforeEach(async () => {
		await cleanDb();
	});

	it("GET /api/admin/messages -> 401 when no cookie", async () => {
		const res = await request(app).get("/api/admin/messages");
		expect(res.status).toBe(401);
	});

	it("GET /api/admin/messages -> 403 when user cookie", async () => {
		const res = await request(app)
			.get("/api/admin/messages")
			.set("Cookie", cookieUser());
		expect(res.status).toBe(403);
	});

	it("GET /api/admin/messages -> 200 when admin cookie", async () => {
		const res = await request(app)
			.get("/api/admin/messages")
			.set("Cookie", cookieAdmin());
		expect([200, 204]).toContain(res.status); // zależnie czy zwracasz pustą listę/204
	});
});
