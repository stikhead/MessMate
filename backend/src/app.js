import "dotenv/config"
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();


import connectDB from "./db/db.js";

app.use(async (req, res, next) => {
    try {
        await connectDB();
       next();
    } catch (error) {
        res.status(500).json({ message: "Database connection failed" });
    }
});

const allowedOrigins = [
  "http://localhost:3000", 
  process.env.FRONTEND_URL 
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Blocked by CORS'));
    }
  },
  credentials: true
};

app.use(cors(corsOptions));

app.options('*', cors(corsOptions));

app.use(express.json({
    limit: '16kb'
}))

app.use(express.urlencoded({
    limit: '16kb',
    extended: true
}))

app.use(express.static("public"));

app.use(cookieParser());

import userRouter from "./routes/users.routes.js";
import mealRouter from "./routes/meal.routes.js";
import menuRouter from "./routes/menu.routes.js";
import walletRouter from "./routes/wallet.routes.js";
import feebackRouter from "./routes/feedback.routes.js";
import cardRouter from "./routes/card.routes.js";
import analyticRouter from "./routes/analytics.routes.js";

app.use("/api/v1/users", userRouter);
app.use("/api/v1/menu", menuRouter);
app.use("/api/v1/meal", mealRouter);
app.use("/api/v1/wallet", walletRouter);
app.use('/api/v1/feedback', feebackRouter);
app.use('/api/v1/cards', cardRouter)
app.use('/api/v1/analytics', analyticRouter)

import { expireUnusedTokens } from "./utils/mealExpiry.cron.js";

app.get("/api/v1/cron/expire-meal", async (req, res) => {
    const authHeader = req.headers['authorization'];
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    const { type, name } = req.query;

    if (!type || !name) {
        return res.status(400).json({ message: "Missing meal type or name" });
    }
    try {
        await expireUnusedTokens(Number(type), name);
        return res.status(200).json({ success: true, message: `${name} expired!` });
    } catch (error) {
        return res.status(500).json({ success: false, message: "Cron failed" });
    }
});
export default app;