import { Router } from "express";
import { verifyAdmin, verifyJWT } from "../middlewares/auth.middlewares";

const router = Router();

router.route("").get(verifyJWT, verifyAdmin);

router.route("").get(verifyJWT, verifyAdmin);

router.route("").get(verifyJWT, verifyAdmin);

router.route("").get(verifyJWT, verifyAdmin);

export default router;