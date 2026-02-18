import { Router } from "express";
import { verifyAdmin, verifyJWT } from "../middlewares/auth.middlewares.js";
import { cardPreferences, createCard, getCard, rechargeCard } from "../controllers/card.controllers.js";

const router = Router();

router.route("/create").post(verifyJWT, verifyAdmin, createCard);
router.route("/recharge").post(verifyJWT, rechargeCard);
router.route("/get").get(verifyJWT, getCard);
router.route('/preferences').post(verifyJWT, cardPreferences)
export default router;