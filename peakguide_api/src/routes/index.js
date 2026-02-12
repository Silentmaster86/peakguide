import { Router } from "express";
import { peaksRouter } from "./peaks.js";
import { rangesRouter } from "./ranges.js";
import { messagesRouter } from "./messages.js";
import authRouter from "./auth.js";
import adminPeaksRouter from "./adminPeaks.js";
import adminUsersRouter from "./adminUsers.js";

export const apiRouter = Router();
apiRouter.use(peaksRouter);
apiRouter.use(rangesRouter);

apiRouter.use("/auth", authRouter);
apiRouter.use("/admin", adminPeaksRouter);
apiRouter.use("/admin", adminUsersRouter);
apiRouter.use("/", messagesRouter);
