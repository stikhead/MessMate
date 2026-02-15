import "dotenv/config"
import Razorpay from "razorpay";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import crypto from "crypto";
import { User } from "../models/users.models.js";
import { Wallet } from "../models/wallet.models.js";
var razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
})
const createOrder = asyncHandler(async(req, res)=>{
    const {amount} = req.body;
   const options = {
        amount: Math.round(amount * 100), 
        currency: "INR",
        receipt: `receipt_${Date.now()}` 
    };

    try {
        const order = await razorpayInstance.orders.create(options);
        const newTrans = await Wallet.create({
            user: req.user._id,
            order_id: order.id,
            amount: order.amount,
        })
        console.log(newTrans)
        return res.status(200).json(
            new ApiResponse(200, order, "Order created successfully")
        );
    } catch (error) {
        console.error("Razorpay Error:", error);
        throw new ApiError(500, "Failed to create Razorpay order");
    }
})



const verifyPayment = asyncHandler(async(req, res)=>{
    const {
        razorpay_payment_id,
        razorpay_signature,
        razorpay_order_id,
    } = req.body;
    console.log(razorpay_payment_id, razorpay_order_id, razorpay_signature)
    const orderToken = await Wallet.findOne({
        order_id: razorpay_order_id,
        status: 'PENDING'
    });
    console.log(orderToken)
    if(!orderToken){
        throw new ApiError(404, "not found")
    }

    const generateSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(orderToken.order_id+ '|' +razorpay_payment_id)
    .digest("hex")
console.log(generateSignature)
    
    if(generateSignature !== razorpay_signature){
       throw new ApiError(400, "Payment verification failed: Invalid Signature");
    }

    const user = await User.findById(req.user._id);
    if (!user) throw new ApiError(404, "User not found");

    const rechargeAmount = Number(orderToken.amount);
    user.currentBalance += rechargeAmount;
    await user.save({ validateBeforeSave: false });

    // await Transaction.create({
    //     user: user._id,
    //     amount: rechargeAmount,
    //     transactionType: "credit", // Money In
    //     description: `Wallet Recharge (Razorpay)`,
    //     referenceId: razorpay_payment_id, // Save the Payment ID for tracking
    //     status: "SUCCESS"
    // });

    return res.status(200).json(
        new ApiResponse(200, { 
            newBalance: user.currentBalance,
            paymentId: razorpay_payment_id 
        }, "Payment verified and wallet updated successfully")
    );
})

const getWalletHistory = asyncHandler(async(req, res)=>{

})

const getBalance = asyncHandler(async(req, res)=>{

})

export {createOrder, verifyPayment, getBalance, getWalletHistory}