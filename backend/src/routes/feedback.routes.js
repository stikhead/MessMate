import { Router } from "express";
import { newFeedback, respondFeedback, getFeedback, getAllFeedbacks } from "../controllers/feedback.controller.js";
import { verifyJWT, verifyAdmin } from "../middlewares/auth.middlewares.js"; 

const router = Router();

router.route("/new").post(verifyJWT, newFeedback);

router.route("/get").get(verifyJWT, getFeedback);

router.route("/all").get(verifyJWT, verifyAdmin, getAllFeedbacks); 

router.route("/respond").post(verifyJWT, verifyAdmin, respondFeedback); 

export default router;