import { MealToken } from "../models/mealToken.models.js";
import { Menu } from "../models/menu.models.js";
import { Transaction } from "../models/transactions.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

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

    const existingBooking = await MealToken.findOne({
        student: req.user?._id,
        date: bookingDate,
        mealType: mealType 

    })

    if(existingBooking){
        throw new ApiError(409, "Already Booked")
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
        status: 'booked',
        cost: itemPrice
    })    // generate the token here

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

    const currentTime = new Date();
    const isCancellationPossible = bookingDate - currentTime;

    if(isCancellationPossible<6 * 60 * 60 * 1000){
        throw new ApiError(400, "Cancellation window closed");
    }

    req.user.currentBalance += getMeal.price;
    await req.user.save({validateBeforeSave: false})

    getMeal.status = 'cancelled';
    await getMeal.save({validateBeforeSave: false});
    

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

const getDailyHeadCount = asyncHandler(async(req, res)=>{
    
})

export {bookMeal, cancelMeal, verifyMeal, getDailyHeadCount, getMyTokens}