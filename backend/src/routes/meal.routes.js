import { Router } from "express";
import { bookMeal, cancelMeal, generateStaffQR, getDailyHeadCount, getMyTokens, verifyMeal } from "../controllers/meal.controller.js";
import { verifyAdmin, verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

router.route("/book").post(verifyJWT, bookMeal);

router.route("/cancel").post(verifyJWT, cancelMeal);

router.route("/get-tokens").get(verifyJWT, getMyTokens);

router.route("/verify").post(verifyJWT, verifyMeal);

router.route("/analytics").get(getDailyHeadCount);

router.route("/qrcode").get(verifyJWT, verifyAdmin, generateStaffQR)
export default router;

