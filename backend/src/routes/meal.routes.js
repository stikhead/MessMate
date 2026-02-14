import { Router } from "express";
import { bookMeal, cancelMeal, getDailyHeadCount, getMyTokens, verifyMeal } from "../controllers/meal.controller.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

router.route("/book").post(verifyJWT, bookMeal);

router.route("/cancel").post(cancelMeal);

router.route("/get-tokens").get(getMyTokens);

router.route("/verify").post(verifyMeal);

router.route("/analytics").get(getDailyHeadCount);

export default router;

