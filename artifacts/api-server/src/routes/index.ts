import { Router, type IRouter } from "express";
import healthRouter from "./health";
import chatRouter from "./chat";
import checkinRouter from "./checkin";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/chat", chatRouter);
router.use("/checkin", checkinRouter);

export default router;
