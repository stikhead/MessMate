import {Card} from "../models/card.models.js"
import asyncHandler from "../utils/asyncHandler.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/users.models.js";
import { MealToken } from "../models/mealToken.models.js";
const createCard = asyncHandler(async(req, res)=>{
    const { userID } = req.body;
    if( !userID ){
        throw new ApiError(400, "All fields are required")
    }
    if(req.user.role === 'student'){
        throw new ApiError(400, "Unauthorized")
    }

    const user = await User.findOne({
       _id: userID
    });

     if(!user){
        throw new ApiError(404, "User Not Found")
    }

    if(user.cardNumber || user.isCardHolder){
        throw new ApiError(400, "Already exists")
    }

    const card = await Card.create({
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

const rechargeCard = asyncHandler(async (req, res) => {
    const PLAN_COST = 500;
    const PLAN_MEALS = 45;
    const userID = req.user?._id;
    const user = await User.findById(userID);
    
    if (!user || !user.cardNumber) {
        throw new ApiError(404, "No Mess Card linked to this account");
    }

    const tomorrow = new Date();
    tomorrow.setHours(5, 30, 0, 0); 
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    const futureTokens = await MealToken.find({
        student: userID,
        date: { $gte: tomorrow }
    });

    let refundAmount = 0;
    futureTokens.forEach(token => {
        if (token.status === 'BOOKED') {
            refundAmount += (token.cost || 0);
        }
    });

    if (futureTokens.length > 0) {
        await MealToken.deleteMany({
            student: userID,
            date: { $gte: tomorrow }
        });
    }

       const effectiveBalance = user.currentBalance + refundAmount;
    
    if (effectiveBalance < PLAN_COST) {
        throw new ApiError(402, `Insufficient Wallet Balance. Required: ₹${PLAN_COST}`);
    }

 

    const tokensToCreate = [];
    
    for (let i = 0; i < 30; i++) {
        const targetDate = new Date(tomorrow);
        targetDate.setDate(tomorrow.getDate() + i);
        const timestamp = targetDate.getTime();

        tokensToCreate.push({
            tokenId: `MT-${userID}-${timestamp}-1`,
            student: userID,
            date: targetDate,
            mealType: 1,
            status: 'BOOKED',
            cost: 40 
        });
        
        tokensToCreate.push({
             tokenId: `MT-${userID}-${timestamp}-2`,
            student: userID,
            date: targetDate,
            mealType: 2,
            status: 'BOOKED',
            cost: 60
        });
        
        tokensToCreate.push({
             tokenId: `MT-${userID}-${timestamp}-3`,
            student: userID,
            date: targetDate,
            mealType: 3,
            status: 'BOOKED',
            cost: 60
        });
    }

   try {
     await MealToken.insertMany(tokensToCreate);
     const successMsg = refundAmount > 0 
         ? `Recharge successful! ₹${refundAmount} was refunded for overlapping meals.`
         : `Recharge successful! 30-day plan activated.`;
    user.isCardHolder = true;
    user.currentBalance = effectiveBalance - PLAN_COST;
    await user.save({ validateBeforeSave: false });

    const card = await Card.findById(user.cardNumber._id);
    card.isActive = 'ACTIVE';
    card.mealAmount += PLAN_MEALS;
    const expiry = new Date();
    expiry.setDate(expiry.getDate() + 30); 
    expiry.setHours(23, 59, 59, 999); 
    card.expiresAt = expiry; 

    await card.save({validateBeforeSave: false});
    return res.status(200).json(
        new ApiResponse(200, card, successMsg)
    );
   } catch (error) {
        console.log(error);
        throw new ApiError(500, "An error occurred!")
   }

   
    
});

const getCard = asyncHandler(async(req, res)=>{
    if(req?.user.cardNumber?._id){
        const card = await Card.findById(req.user?.cardNumber._id)
        if(!card){
            throw new ApiError(404, "Not found");
        }
    
        return res
        .status(200)
        .json(
            new ApiResponse(200, card, "Success")
        )
    }
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

const revokeCard = asyncHandler(async(req, res) => {
    const { userID } = req.body;

    const user = await User.findByIdAndUpdate(
        userID,
        { isCardHolder: false },
        { new: true }
    );

    if (!user) throw new ApiError(404, "User not found");


    const card = await Card.findOneAndUpdate(
        { user: userID, isActive: 'ACTIVE' }, 
        { isActive: 'INACTIVE' },
        { new: true }
    );

    return res.status(200).json(
        new ApiResponse(200, {}, "Card revoked successfully")
    );
});
export {createCard, rechargeCard, getCard, cardPreferences, revokeCard};