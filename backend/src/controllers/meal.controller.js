import { MealToken } from "../models/mealToken.models.js";
import { Menu } from "../models/menu.models.js";
import { Transaction } from "../models/transactions.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import crypto from "crypto"

const deadLineCalculate = async(bookingDate, mealType)=>{
    const deadline = new Date(bookingDate);
    
    let cutOfFHour = 10; // lunch - 1pm
    if(Number(mealType)===1) cutOfFHour = 6 // breakfast - 8am 
    if(Number(mealType)===3) cutOfFHour = 17 // dinner - 8pm

    deadline.setHours(cutOfFHour, 0, 0, 0)

    const currentTime = new Date();
    return currentTime > deadline

}


const calculateActualDate = async(targetDay)=>{
    let today = new Date();

    let currentDay = today.getDay();
    if(currentDay===0) currentDay = 7; // converting sunday (0) to (7)

    let daysToAdd = targetDay - currentDay;

    if(daysToAdd<0) daysToAdd+=7;

    const finalDate = new Date(today);

    finalDate.setDate(today.getDate() + daysToAdd)
    
    finalDate.setHours(5, 30, 0, 0); // adding 5:30 to handle utc->ist

    return finalDate;


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
    const bookingDate = await calculateActualDate(day);

    // TODO: change the booking logic (i.e: if cancelled token exist then update status to booked ) -> avoid unecessary filling of database
    const existingBooking = await MealToken.findOne({
        student: req.user?._id,
        date: bookingDate,
        mealType: mealType,
        status: 'BOOKED'
    })

    
    if(existingBooking){
        throw new ApiError(409, "Already Booked")
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

    const createMealToken = await MealToken.create({
        student: req.user?._id,
        date: bookingDate,
        mealType: mealType,
        status: 'BOOKED',
        cost: itemPrice
    })  

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
        new ApiResponse( 201, createMealToken, "Meal booked"))
})

const cancelMeal = asyncHandler(async(req, res)=>{
    const {day, mealType} = req.body;

    if(!day || !mealType){
        throw new ApiError(400, "All fields are required");
    }

    const bookingDate = await calculateActualDate(day);
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
    
})

const verifyMeal = asyncHandler(async(req, res)=>{
    
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

    const validUntil = new Date(Date.now());
    validUntil.setDate(validUntil+timeblock)
    return res
    .status(201)
    .json(
        new ApiResponse(201, {qrPayload, validUntil}, "New QR payload generated")
    )


})
const getDailyHeadCount = asyncHandler(async(req, res)=>{
    
})

export {bookMeal, cancelMeal, verifyMeal, getDailyHeadCount, getMyTokens, generateStaffQR}