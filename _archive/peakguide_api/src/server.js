import dotenv from "dotenv";

dotenv.config({ path: process.env.NODE_ENV === "test" ? ".env.test" : ".env" });

const { createApp } = await import("./app.js");

const app = createApp();
const port = process.env.PORT || 5000;

app.listen(port, () => {
	console.log(`API running on http://localhost:${port}`);
});
