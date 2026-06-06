import { beforeEach } from "vitest";
import { cleanDb } from "./db-clean.js";

beforeEach(async () => {
	await cleanDb();
});
