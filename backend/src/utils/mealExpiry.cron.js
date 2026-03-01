import cron from "node-cron";
import { MealToken } from "../models/mealToken.models.js";

const expireUnusedTokens = async (mealType, mealName) => {
    try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setHours(23, 59, 59, 999);

     
        const result = await MealToken.updateMany(
            {
                date: { $gte: startOfDay, $lte: endOfDay },
                mealType: mealType,
                status: 'BOOKED'
            },
            {
                $set: { status: 'EXPIRED' }
            }
        );

        console.log(`[Cron] 🕒 Marked ${result.modifiedCount} unused ${mealName} tokens as EXPIRED.`);
    } catch (error) {
        console.error(`[Cron Error] ❌ Failed to expire ${mealName} tokens:`, error);
    }
};

export const startCronJobs = () => {
    cron.schedule('0 10 * * *', () => {
        console.log("Running Breakfast Expiry Job...");
        expireUnusedTokens(1, "Breakfast");
    });

    cron.schedule('0 15 * * *', () => {
        console.log("Running Lunch Expiry Job...");
        expireUnusedTokens(2, "Lunch");
    });

    cron.schedule('0 22 * * *', () => {
        console.log("Running Dinner Expiry Job...");
        expireUnusedTokens(3, "Dinner");
    });

    console.log("✅ All Meal Expiry Cron Jobs Initialized!");
};