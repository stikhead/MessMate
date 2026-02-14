import { Router } from "express";
import { createOrder, getBalance, getWalletHistory, verifyPayment } from "../controllers/wallet.controller.js";

const router = Router();

router.route("/create-order").post(createOrder);

router.route("/verify-payment").post(verifyPayment);

router.route("/history").get(getWalletHistory);

router.route("/balance").get(getBalance);


export default router