import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true
    },

    amount: {
        //positibe for depositing (+2000rs)
        //negative for spending (-50rs)
        type: Number, 
        required: true
    },

    transactionType: {
        type: String,
        enum: ['debit', 'credit'],
        required: true
    },

    description: {
        // eg: wallet recharge or lunch purchase - date
        type: String,
        required: true
    },

    paymentId: {
        type: String // stores upi transaction id
    },

    referenceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "MealToken"
    }

}, {timestamp: true})

export const Transaction = mongoose.model("Transaction", transactionSchema)