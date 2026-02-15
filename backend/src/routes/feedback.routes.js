import { Router } from "express";
import { verifyAdmin, verifyJWT } from "../middlewares/auth.middlewares.js";
import { getFeedback, newFeedback, respondFeedback } from "../controllers/feedback.controller.js";

const router = Router();

router.route('/new').post(verifyJWT, newFeedback);

router.route('/respond').post(verifyJWT, verifyAdmin, respondFeedback);

router.route('/get').get(verifyJWT, getFeedback);

export default router;