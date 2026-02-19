import { Router } from "express";
import { addMenu, deleteMenu, getMenuByDate, getWeeklyMenu, updateMenu } from "../controllers/menu.controller.js";
import { verifyAdmin, verifyJWT } from "../middlewares/auth.middlewares.js";

const router = Router();

router.route("/add").post(verifyJWT, verifyAdmin, addMenu);

router.route("/getMenu").get(verifyJWT, getMenuByDate);


router.route("/getWeeklyMenu").get(verifyJWT, getWeeklyMenu);


router.route("/update").put(verifyJWT, verifyAdmin, updateMenu);


router.route("/delete").delete(verifyJWT, verifyAdmin, deleteMenu);

export default router;