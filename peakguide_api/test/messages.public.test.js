import request from "supertest";
import { describe, it, expect, beforeEach } from "vitest";
import { createApp } from "../src/app.js";
import { cleanDb } from "./db-clean.js";

describe("Public messages", () => {
	const app = createApp();

	beforeEach(async () => {
		await cleanDb();
	});

	it("POST /api/messages creates message", async () => {
		const res = await request(app).post("/api/messages").send({
			email: "someone@test.com",
			message: "Hello from test!",
		});

		expect([201, 200]).toContain(res.status);
		expect(res.body).toBeTruthy();
	});
});
