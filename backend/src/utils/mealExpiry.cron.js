import { MealToken } from "../models/mealToken.models.js";

export const expireUnusedTokens = async (mealType, mealName) => {
    try {
        const startOfDay = new Date();
        startOfDay.setUTCHours(0, 0, 0, 0);

        const endOfDay = new Date();
        endOfDay.setUTCHours(23, 59, 59, 999);

        const result = await MealToken.updateMany(
            {
                date: { $gte: startOfDay, $lte: endOfDay },
                mealType: Number(mealType), 
                status: 'BOOKED'
            },
            {
                $set: { status: 'EXPIRED' }
            }
        );

        console.log(`[Cron] 🕒 Marked ${result.modifiedCount} unused ${mealName} tokens as EXPIRED.`);
    } catch (error) {
        console.error(`[Cron Error] ❌ Failed to expire ${mealName} tokens:`, error);
        throw error; 
    }
};