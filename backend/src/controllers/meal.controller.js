import { MealToken } from "../models/mealToken.models.js";
import { Menu } from "../models/menu.models.js";
import { Transaction } from "../models/transactions.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import crypto from "crypto"
import { calculateActualDate } from "../utils/DateConverter.js";

const deadLineCalculate = async(bookingDate, mealType)=>{
    const deadline = new Date(bookingDate);
    
    let cutOfFHour = 10; // lunch - 1pm
    if(Number(mealType)===1) cutOfFHour = 6 // breakfast - 8am 
    if(Number(mealType)===3) cutOfFHour = 18 // dinner - 8pm

    deadline.setHours(cutOfFHour, 0, 0, 0)

    const currentTime = new Date();
    return currentTime > deadline

}


const bookMeal = asyncHandler(async(req, res)=>{
    const {day, mealType} = req.body;

    if(!day || !mealType){
        throw new ApiError(400, "All fields are required");
    }

    const menuItem  = await Menu.findOne({
        $and: [{day}, {mealType}]
    })

    if(!menuItem){
        throw new ApiError(404, "Item not found")
    }

    const itemPrice = menuItem.price;

    if(!itemPrice){
        throw new ApiError(500, "Server Error")
    }    
    const bookingDate = await calculateActualDate(day, 2);
    const isPastDeadline = await deadLineCalculate(bookingDate, mealType);
    if(isPastDeadline){
        throw new ApiError(400, "Booking deadline has passed for this meal");
    }
    const existingBooking = await MealToken.findOne({
        student: req.user?._id,
        date: bookingDate,
        mealType: mealType
    })

    
    if(existingBooking){
        if(existingBooking.status === 'BOOKED' || existingBooking.status === 'REDEEMED'){
            throw new ApiError(409, "Already Booked")
        }

        if (existingBooking.status === 'CANCELLED') {
            if(req.user.currentBalance < menuItem.price){
                throw new ApiError(402, "Insufficient balance to re-book this meal");
            }
            
            req.user.currentBalance -= menuItem.price;
            await req.user.save({validateBeforeSave: false});

            existingBooking.status = 'BOOKED';
            existingBooking.isEmergency = true;
            await existingBooking.save();

            await Transaction.create({
                user: req.user._id,
                amount: menuItem.price,
                transactionType: "debit",
                description: `Emergency Re-book: ${menuItem.items}`,
                referenceId: existingBooking._id
            });

            return res.status(200).json(new ApiResponse(200, existingBooking, "Meal re-booked successfully"));
        }
    
    }

    if(await deadLineCalculate(bookingDate, mealType)){
        throw new ApiError(400, "Booking closed")
    }

    if(req.user.currentBalance < itemPrice){
        throw new ApiError(402, `Insufficient balance. req: ${itemPrice} got: ${req.user.currentBalance}`)
    }

    req.user.currentBalance -= itemPrice;
    const isUpdated = await req.user.save({validateBeforeSave: false})

    if(!isUpdated){
        throw new ApiError(500, "Some error occuered while deducting the balance", isUpdated)
    }
    let createMealToken;
    if(existingBooking && existingBooking.status === 'CANCELLED'){
        existingBooking.status = 'BOOKED';
        await existingBooking.save({validateBeforeSave: false});
        createMealToken = existingBooking
    }
    else {
        createMealToken = await MealToken.create({
            student: req.user?._id,
            date: bookingDate,
            mealType: mealType,
            status: 'BOOKED',
            cost: itemPrice
        })  
    }

    const transactionLog = await Transaction.create({
        user: req.user?._id,
        amount: -itemPrice,
        transactionType: 'debit',
        description: `Booked ${menuItem.mealType} for ${bookingDate.toDateString()}`,
        referenceId: createMealToken?._id
    })

    return res
    .status(201)
    .json(
        new ApiResponse( 201, {createMealToken, transactionLog}, "Meal booked"))
})

const cancelMeal = asyncHandler(async(req, res)=>{
    const {day, mealType} = req.body;

    if(!day || !mealType){
        throw new ApiError(400, "All fields are required");
    }

    const bookingDate = await calculateActualDate(day, 2);
    const getMeal = await MealToken.findOne({
        student: req.user?._id,
        date: bookingDate,
        mealType: mealType ,
        status: "BOOKED"
    })
    

    if(!getMeal){
        throw new ApiError(404, "Not found");
    }

    if(await deadLineCalculate(bookingDate, mealType)){
        throw new ApiError(400, "cancellation window closed")
    }

    const refundAmount = getMeal.cost;
    req.user.currentBalance += refundAmount;
    await req.user.save({validateBeforeSave: false})

    getMeal.status = 'CANCELLED';
    await getMeal.save({validateBeforeSave: false});
    
    await Transaction.create({
        user: req.user._id,
        amount: refundAmount, 
        transactionType: "credit",
        description: `Refund for Cancelled Meal (${bookingDate.toDateString()})`,
        referenceId: getMeal._id
    });

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Cancelled successfully")
    )
})

const getMyTokens = asyncHandler(async(req, res)=>{
    const {day, mealType} = req.query
    
    const filter = {
        student: req.user?._id,
    }

    if(day){

    const bookingDate = await calculateActualDate(Number(day), 2); 
        filter.date =  bookingDate
    }
    
    if(mealType){
        filter.mealType = mealType;
    }

    const getMealToken = await MealToken.find(
        filter
    ).sort({createdAt: -1})
    
    if(!getMealToken){
        throw new ApiError(404, "Not found");
    }


    return res
    .status(200)
    .json(
        new ApiResponse(200, getMealToken, "SUCCCESS")
    )
})

const verifyMeal = asyncHandler(async(req, res)=>{
    const {scannedPayload} = req.query;
    
    const secret = process.env.QR_CODE_SECRET;

    const timeBlock = Math.floor(Date.now() / 30000);

    const validHashes = [
        crypto.createHmac('sha256', secret).update(String(timeBlock)).digest('hex'),
        crypto.createHmac('sha256', secret).update(String(timeBlock - 1)).digest('hex')
    ];

    console.log(validHashes)
    console.log(scannedPayload)
    if(!validHashes.includes(scannedPayload)){
        throw new ApiError(400, "Invalid QR code")
    }

    const currentHour = new Date().getHours();
    let mealType = 2;

    if(currentHour<10) mealType = 1;
    if(currentHour>=17) mealType = 3;

    const dateToday = new Date();
    dateToday.setHours(5, 30, 0, 0);

    const token = await MealToken.findOne({
        student: req.user?._id,
        date: dateToday,
        mealType: mealType,
    })


    if(token && token.status === 'REDEEMED'){
        throw new ApiError(400, "Token already used || student already ate")
    }
    if(!token || token.status==='CANCELLED'){
        throw new ApiError(404, "Not found")
    }

    token.status = 'REDEEMED';
    await token.save({validateBeforeSave: false});

    return res.
    status(200).
    json(
        new ApiResponse(200, token, "Verification Successful! Enjoy your meal.")
    )
})

const generateStaffQR = asyncHandler(async(req, res)=>{
    
    if(req.user.role === 'student'){
        throw new ApiError(403, "Access denied");
    }
    const createTime = Date.now();
    const timeblock = Math.floor(createTime/30000);

    const secret = process.env.QR_CODE_SECRET;

    if(!secret){
        throw new ApiError(500, "SERVER ERROR")
    }
    
    const qrPayload = crypto
        .createHmac('sha256', secret)
        .update(String(timeblock))
        .digest('hex');


    const expiresAt = (timeblock + 1) * 30000;
    return res
    .status(201)
    .json(
        new ApiResponse(201, {qrPayload, expiresAt}, "New QR payload generated")
    )


})


const getDailyHeadCount = asyncHandler(async(req, res)=>{
    const {date} = req.params;

    let queryDate = date ? new Date(date) : new Date();

    queryDate.setHours(5, 30, 0, 0);

    const stats = await MealToken.aggregate([
        {
            $match: {
                date: queryDate,
                status: { $in: ['BOOKED', 'REDEEMED']}
            }
        },

        {
            $group: {
                _id: "$mealType",
                count: {$sum: 1},
                revenue: {$sum: "$cost"}
            }
        },

        {
            $sort: { _id: 1 }
        }
    ]);

    const formattedStats = stats.map((stat) => ({
        meal: stat._id === 1 ? "Breakfast" : stat._id === 2 ? "Lunch" : "Dinner",
        count: stat.count,
        revenue: stat.revenue
    }));


    return res.status(200).json(
        new ApiResponse(200, formattedStats, `Headcount for ${queryDate.toDateString()}`)
    );
})

const bulkCancelMeals = asyncHandler(async(req, res) => {
    const { startDate, endDate } = req.body;

    if (!startDate || !endDate) {
        throw new ApiError(400, "Start date and end date are required");
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    // start.setHours(0,0,0,0);
    // Include the whole end day
     const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    // NEW: Enforce the +1 day rule
    if (start < tomorrow) {
        throw new ApiError(400, "Cancellations must be made at least one day in advance.");
    }
    end.setHours(29, 29, 59, 999); 

    const mealsToCancel = await MealToken.find({
        student: req.user._id,
        date: { $gte: start, $lte: end },
        status: 'BOOKED'
    });


    
    console.log(start)
    
    console.log(end)

    console.log(mealsToCancel)
    if (mealsToCancel.length === 0) {
        throw new ApiError(404, "No booked meals found in this date range");
    }

    const totalRefund = mealsToCancel.reduce((sum, meal) => sum + meal.cost, 0);

    req.user.currentBalance += totalRefund;
    await req.user.save({ validateBeforeSave: false });

    await MealToken.updateMany(
        {
            student: req.user._id,
            date: { $gte: start, $lte: end },
            status: 'BOOKED'
        },
        { $set: { status: 'CANCELLED' } }
    );

    await Transaction.create({
        user: req.user._id,
        amount: totalRefund, 
        transactionType: "credit",
        description: `Bulk Refund for Cancelled Meals (${start.toLocaleDateString()} to ${end.toLocaleDateString()})`,
        referenceId: mealsToCancel[0]._id
    });

    return res.status(200).json(
        new ApiResponse(200, { cancelledCount: mealsToCancel.length, refunded: totalRefund }, "Leave applied and meals cancelled successfully")
    );
});

const getQueueStatus = asyncHandler(async (req, res) => {
    const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);

    const recentScansCount = await MealToken.countDocuments({
        status: 'REDEEMED',
        updatedAt: { $gte: fifteenMinsAgo }
    });

    return res.status(200).json(
        new ApiResponse(200, { count: recentScansCount }, "Queue status fetched")
    );
});

export { bookMeal, cancelMeal, verifyMeal, getDailyHeadCount, getQueueStatus, getMyTokens, generateStaffQR, bulkCancelMeals };