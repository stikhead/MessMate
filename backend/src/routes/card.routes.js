import { Router } from "express";
import { verifyAdmin, verifyJWT } from "../middlewares/auth.middlewares.js";
import { cardPreferences, createCard, getCard, rechargeCard, revokeCard } from "../controllers/card.controllers.js";

const router = Router();

router.route("/create").post(verifyJWT, verifyAdmin, createCard);
router.route("/recharge").post(verifyJWT, rechargeCard);
router.route("/get").get(verifyJWT, getCard);
router.route('/preferences').patch(verifyJWT, cardPreferences);

router.route('/revoke').patch(verifyJWT, revokeCard);
export default router;