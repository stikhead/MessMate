import mongoose from "mongoose";

const walletSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        index: true
    },
    order_id: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String, 
        required: true,
        enum: ['PENDING', 'SUCCESS', 'FAILED'],
        default: 'PENDING'
    }
}, {});

export const Wallet = mongoose.model('Wallet', walletSchema);