import { Router } from "express";
import { peaksRouter } from "./peaks.js";
import { rangesRouter } from "./ranges.js";
import authRouter from "./auth.js";
import adminPeaksRouter from "./adminPeaks.js";

export const apiRouter = Router();
apiRouter.use(peaksRouter);
apiRouter.use(rangesRouter);

apiRouter.use("/auth", authRouter);
apiRouter.use("/admin", adminPeaksRouter);
