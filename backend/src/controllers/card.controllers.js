import {Card} from "../models/card.models.js"
import asyncHandler from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/users.models.js";
const createCard = asyncHandler(async(req, res)=>{
    const { isActive, email, phoneNumber } = req.body;
    if(!isActive || !email || !phoneNumber){
        throw new ApiError(400, "All fields are required")
    }
    if(req.user.role === 'student'){
        throw new ApiError(400, "Unauthorized")
    }

    const user = await User.findOne({
        email: email,
        phoneNumber: phoneNumber
    });

     if(!user){
        throw new ApiError(404, "User Not Found")
    }

    if(user.cardNumber || user.isCardHolder){
        throw new ApiError(400, "Already exists")
    }

    const card = await Card.create({
        isActive: isActive,
        owner: user._id
    });

    if(!card){
        throw new ApiError(500, "Server error")
    }

    user.cardNumber = card._id;
    user.isCardHolder = true;
    await user.save({validateBeforeSave: false})

    return res
    .status(201)
    .json(
        new ApiResponse(201, {card, user}, "Success")
    );
})

const rechargeCard = asyncHandler(async(req, res)=>{
    const userID = req.user._id;
    const PLAN_COST = 2000;
    const PLAN_MEALS = 45;

    const user = await User.findById(userID).populate('cardNumber');
    if (!user || !user.cardNumber) {
        throw new ApiError(404, "No Mess Card linked to this account");
    }
    const card = await Card.findById(user.cardNumber._id);

    if (user.currentBalance < PLAN_COST) {
        throw new ApiError(402, `Insufficient Wallet Balance. Required: ₹${PLAN_COST}`);
    }

    user.currentBalance -= PLAN_COST;
    await user.save({ validateBeforeSave: false });

    card.isActive = 'ACTIVE';
    card.mealAmount += PLAN_MEALS;
    card.isAutoBookingEnabled = true; 
    await card.save({validateBeforeSave: false});

    return res
    .status(200)
    .json(
        new ApiResponse(200, { 
            newBalance: user.currentBalance, 
            cardStatus: card.isActive,
            meals: card.mealAmount
        }, "Card Activated.")
    );
})

const getCard = asyncHandler(async(req, res)=>{
    const card = await Card.findById(req.user?.cardNumber._id)
    if(!card){
        throw new ApiError(404, "Not found");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, card, "Success")
    )
})


const cardPreferences = asyncHandler(async(req, res)=>{
    const { isAutoBookingEnabled } = req.body;
  
    if(!req?.user?.isCardHolder){
        return;
    }
    const card = await Card.findById(req?.user?.cardNumber?._id);
    if(!card){
        throw new ApiError(404, "Not found");
    }

    card.isAutoBookingEnabled = isAutoBookingEnabled;
    await card.save({validateBeforeSave: false});

    return res
    .status(200)
    .json(
        new ApiResponse(200, card.isAutoBookingEnabled , "SUCCESS")
    )



})

export {createCard, rechargeCard, getCard, cardPreferences};