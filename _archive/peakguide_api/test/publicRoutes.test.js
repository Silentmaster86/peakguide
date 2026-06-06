import request from "supertest";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createApp } from "../src/app.js";

const HAS_DB = !!process.env.DATABASE_URL;

describe("Public API (DB-dependent)", () => {
	if (!HAS_DB) {
		it("skips because DATABASE_URL missing", () => {
			expect(true).toBe(true);
		});
		return;
	}

	it("GET /api/ranges returns array", async () => {
		const app = createApp();
		const res = await request(app).get("/api/ranges?lang=pl");
		expect(res.status).toBe(200);
		expect(Array.isArray(res.body)).toBe(true);
	});

	it("GET /api/peaks returns array", async () => {
		const app = createApp();
		const res = await request(app).get("/api/peaks?lang=pl&only=all");
		expect(res.status).toBe(200);
		expect(Array.isArray(res.body)).toBe(true);
	});
});
