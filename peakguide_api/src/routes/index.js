import { Router } from "express";
import { peaksRouter } from "./peaks.js";
import { rangesRouter } from "./ranges.js";

export const apiRouter = Router();
apiRouter.use(peaksRouter);
apiRouter.use(rangesRouter);
