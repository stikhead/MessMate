import "dotenv/config"
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

const app = express();
    
app.use(cors({
    origin: "*", // process.env.CORS_ORIGIN,
    credentials: true
}));

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

export default app;