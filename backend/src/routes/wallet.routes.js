import { Router } from "express";
import { createOrder, getBalance, getWalletHistory, verifyPayment } from "../controllers/wallet.controller.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

router.route("/create-order").post(verifyJWT, createOrder);

router.route("/verify").post(verifyJWT, verifyPayment);

router.route("/history").get(getWalletHistory);

router.route("/balance").get(getBalance);


export default router