import pkg from "pg";
const { Pool } = pkg;

const isTest = process.env.NODE_ENV === "test";

const connectionString = isTest
	? process.env.DATABASE_URL_TEST
	: process.env.DATABASE_URL;

if (!connectionString) {
	throw new Error(
		isTest ? "Missing DATABASE_URL_TEST" : "Missing DATABASE_URL",
	);
}

function dbNameFromUrl(url) {
	try {
		const u = new URL(url);
		return (u.pathname || "").replace("/", "");
	} catch {
		return "";
	}
}

// Safety: never wipe real DB in tests
if (isTest) {
	const dbName = dbNameFromUrl(String(connectionString));
	if (!dbName || !dbName.toLowerCase().includes("test")) {
		throw new Error(
			`Refusing to run tests on non-test DB (db="${dbName}"). Use DATABASE_URL_TEST pointing to a *_test database.`,
		);
	}
}

export const pool = new Pool({
	connectionString,
	ssl:
		process.env.NODE_ENV === "production"
			? { rejectUnauthorized: false }
			: false,
});

export const db = {
	query: (text, params) => pool.query(text, params),
};
