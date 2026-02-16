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
    if(Number(mealType)===3) cutOfFHour = 17 // dinner - 8pm

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

    const existingBooking = await MealToken.findOne({
        student: req.user?._id,
        date: bookingDate,
        mealType: mealType
    })

    
    if(existingBooking){
        if(existingBooking.status === 'BOOKED'){
            throw new ApiError(409, "Already Booked")
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
    const {day, mealType} = req.query;

    if(!day || !mealType){
        throw new ApiError(400, "All fields are required")
    }

    const bookingDate = await calculateActualDate(Number(day), 2); 

    const getMealToken = await MealToken.findOne({
        student: req.user?._id,
        date: bookingDate,
        mealType: Number(mealType)
    })
    
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
    const {scannedPayload} = req.body;
    
    const secret = process.env.QR_CODE_SECRET;

    const timeBlock = Math.floor(Date.now() / 30000);

    const validHashes = [
        crypto.createHmac('sha256', secret).update(String(timeBlock)).digest('hex'),
        crypto.createHmac('sha256', secret).update(String(timeBlock - 1)).digest('hex')
    ];

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

    const timeblock = Math.floor(Date.now()/30000);

    const secret = process.env.QR_CODE_SECRET;

    if(!secret){
        throw new ApiError(500, "SERVER ERROR")
    }

    const qrPayload = crypto
        .createHmac('sha256', secret)
        .update(String(timeblock))
        .digest('hex');

    return res
    .status(201)
    .json(
        new ApiResponse(201, {qrPayload}, "New QR payload generated")
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

export {bookMeal, cancelMeal, verifyMeal, getDailyHeadCount, getMyTokens, generateStaffQR}