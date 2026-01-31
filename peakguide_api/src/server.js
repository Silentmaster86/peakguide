import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import { apiRouter } from "./routes/index.js";

const app = express();

app.use(helmet());
app.use(express.json());

app.use(
	cors({
		origin: (origin, cb) => {
			const allowList = process.env.CORS_ORIGIN?.split(",")
				.map((s) => s.trim())
				.filter(Boolean) ?? ["http://localhost:5173"];

			// pozwól na brak origin (curl/postman)
			if (!origin) return cb(null, true);

			if (allowList.includes(origin)) return cb(null, true);
			return cb(new Error("CORS blocked: " + origin));
		},
		credentials: true,
	}),
);

app.get("/api/health", (req, res) => {
	res.json({ ok: true, name: "peakguide-api" });
});

app.use("/api", apiRouter);

const port = process.env.PORT || 5000;
app.listen(port, () => {
	console.log(`API running on http://localhost:${port}`);
});
