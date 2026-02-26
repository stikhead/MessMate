import { Router } from "express";
import { verifyAdmin, verifyJWT } from "../middlewares/auth.middlewares.js";
import { getAnalyticsOverview } from "../controllers/analytics.controller.js";

const router = Router();

router.route("/overview").get(verifyJWT, verifyAdmin, getAnalyticsOverview);

router.route("").get(verifyJWT, verifyAdmin);

router.route("").get(verifyJWT, verifyAdmin);

router.route("").get(verifyJWT, verifyAdmin);

export default router;