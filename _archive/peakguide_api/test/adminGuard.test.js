import request from "supertest";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createApp } from "../src/app.js";

describe("Admin guards", () => {
	it("blocks GET /api/admin/users when not logged in", async () => {
		const app = createApp();
		const res = await request(app).get("/api/admin/users");
		expect([401, 403]).toContain(res.status);
	});

	it("blocks GET /api/admin/peaks when not logged in", async () => {
		const app = createApp();
		const res = await request(app).get("/api/admin/peaks?lang=pl");
		expect([401, 403]).toContain(res.status);
	});

	it("blocks GET /api/admin/messages when not logged in", async () => {
		const app = createApp();
		const res = await request(app).get("/api/admin/messages");
		expect([401, 403]).toContain(res.status);
	});
});
