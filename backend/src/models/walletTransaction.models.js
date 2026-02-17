import mongoose from "mongoose";

const walletTransactionSchema = new mongoose.Schema({
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

    referenceId: {
        type: String // stores upi transaction id
    },
    
    date: {
        type: Date,
        required: true
    },

    status: {
        type: String,
        enum: ['SUCCESS', 'PENDING', "CANCELLED"]
    }


}, {timestamp: true})

export const WalletTransaction = mongoose.model("WalletTransaction", walletTransactionSchema)