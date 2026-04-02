import { Router } from "express";
import { changeCurrentPassword, getAllUsers, getCurrentUser, loginUser, logoutUser, refreshAccessToken, registerUser, sendOtp, verifyForgetPasswordOtpAndResetPassword, verifyUser } from "../controllers/users.controller.js";
import { verifyAdmin, verifyJWT, verifyRefreshToken } from "../middlewares/auth.middlewares.js";

const router = Router();

router.route("/register").post(registerUser);

router.route("/login").post(loginUser);

router.route("/logout").post(verifyJWT, logoutUser);

router.route("/refreshAccessToken").post(verifyRefreshToken, refreshAccessToken);

router.route("/changeCurrentPassword").post(verifyJWT, changeCurrentPassword);

router.route("/getCurrentUser").get(verifyJWT, getCurrentUser)

router.route("/getUsers").get(verifyJWT, verifyAdmin, getAllUsers)

router.route('/send-otp').post(sendOtp);

router.route('/reset-password').post(verifyForgetPasswordOtpAndResetPassword);

router.route('/verify').post(verifyUser);
export default router;