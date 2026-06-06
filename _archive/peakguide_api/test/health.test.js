import request from "supertest";
import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { createApp } from "../src/app.js";

describe("GET /api/health", () => {
	it("returns ok", async () => {
		const app = createApp();
		const res = await request(app).get("/api/health");
		expect(res.status).toBe(200);
		expect(res.body).toMatchObject({ ok: true, name: "peakguide-api" });
	});
});
