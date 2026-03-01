import "dotenv/config";
import connectDB from "./db/db.js"
import app from "./app.js"
import dns from "dns";
import razorpay from "razorpay";
import {startCronJobs} from "./utils/mealExpiry.cron.js"

dns.setServers(['8.8.8.8', '1.1.1.1']);





export default app;