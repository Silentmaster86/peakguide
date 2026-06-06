import { Router } from "express";
import {
	listPeaks,
	getPeakBySlug,
	getPeakTrails,
	getPeakPois,
	getNearbyPeaks,
} from "../controllers/peaksController.js";

export const peaksRouter = Router();

peaksRouter.get("/peaks", listPeaks);
peaksRouter.get("/peaks/:slug", getPeakBySlug);
peaksRouter.get("/peaks/:slug/trails", getPeakTrails);
peaksRouter.get("/peaks/:slug/pois", getPeakPois);

// NEW: PostGIS nearby
peaksRouter.get("/peaks/:slug/nearby", getNearbyPeaks);
