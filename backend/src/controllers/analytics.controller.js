import { MealToken } from "../models/mealToken.models.js";
import { User } from "../models/users.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const getAnalyticsOverview = asyncHandler(async(req, res) => {
    const totalStudents = await User.countDocuments({ role: 'student' });

    const dateParam = req.query.date;
    const baseDate = dateParam ? new Date(dateParam) : new Date();
    const targetDayStart = new Date(baseDate);
    targetDayStart.setHours(0, 0, 0, 0); 
    
    const targetDayEnd = new Date(baseDate);
    targetDayEnd.setDate(targetDayStart.getDate() + 1);
    targetDayEnd.setHours(0, 0, 0, 0);

    const targetStats = await MealToken.aggregate([
        { $match: { date: { $gte: targetDayStart, $lt: targetDayEnd }, status: { $in: ['BOOKED', 'REDEEMED'] } } },
        { $group: {
            _id: null,
            predictedStudents: { $sum: 1 },
            studentsAte: { $sum: { $cond: [{ $eq: ["$status", "REDEEMED"] }, 1, 0] } },
            totalRevenue: { $sum: "$cost" }
        }}
    ]);

    const stats = targetStats[0] || { predictedStudents: 0, studentsAte: 0, totalRevenue: 0 };
    const mealWastage = stats.predictedStudents - stats.studentsAte;

    const yesterdayStart = new Date(targetDayStart);
    yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    
    const yesterdaysStats = await MealToken.aggregate([
        { $match: { date: { $gte: yesterdayStart, $lt: targetDayStart }, status: { $in: ['BOOKED', 'REDEEMED'] } } },
        { $group: {
            _id: null,
            revenue: { $sum: "$cost" }
        }}
    ]);
    const yesterdaysRevenue = yesterdaysStats[0]?.revenue || 0;

    const sevenDaysAgo = new Date(targetDayStart);
    sevenDaysAgo.setDate(targetDayStart.getDate() - 6);

    const weeklyTrend = await MealToken.aggregate([
        { 
            $match: { 
                date: { $gte: sevenDaysAgo, $lt: targetDayEnd }, 
                status: { $in: ['BOOKED', 'REDEEMED'] } 
            } 
        },
        {
            $group: {
                _id: { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                predicted: { $sum: 1 },
                ate: { $sum: { $cond: [{ $eq: ["$status", "REDEEMED"] }, 1, 0] } },
                revenue: { $sum: "$cost" }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    const formattedTrend = weeklyTrend.map(day => ({
        date: new Date(day._id).toLocaleDateString('en-US', { weekday: 'short' }),
        predicted: day.predicted,
        ate: day.ate,
        wastage: day.predicted - day.ate,
        revenue: day.revenue
    }));
    const startOfMonth = new Date(baseDate.getFullYear(), baseDate.getMonth(), 1);
    const endOfMonth = new Date(baseDate.getFullYear(), baseDate.getMonth() + 1, 0, 23, 59, 59, 999);

    const monthlyStats = await MealToken.aggregate([
        { $match: { date: { $gte: startOfMonth, $lte: endOfMonth }, status: { $in: ['BOOKED', 'REDEEMED'] } } },
        { $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$date", timezone: "Asia/Kolkata" } }, 
            revenue: { $sum: "$cost" }
        }}
    ]);

    return res.status(200).json(
        new ApiResponse(200, {
            totalStudents,
            predictedStudents: stats.predictedStudents,
            studentsAte: stats.studentsAte,
            mealWastage: mealWastage > 0 ? mealWastage : 0,
            todaysRevenue: stats.totalRevenue, 
            yesterdaysRevenue: yesterdaysRevenue, 
            expenditure: 0,
            trendData: formattedTrend,
            monthlyData: monthlyStats
        }, "Analytics fetched successfully")
    );
});

export { getAnalyticsOverview };