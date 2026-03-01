import mongoose from "mongoose";
import { v4 as uuidv4 } from "uuid";
const cardSchema = new mongoose.Schema({
    number: {
        type: String,
        required: true,
        default: uuidv4,
        index: true,
        unique: true
    },

    mealAmount: {
        type: Number,
        required: true,
        default: 0
    },
expiresAt: {
    type: Date,
    default: null
},
    isActive: {
        type: String,
        enum: ['ACTIVE', 'INACTIVE'],
        default: 'INACTIVE'
    },

    isAutoBookingEnabled: {
        type: Boolean,
        default: true
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    }
}, {timestamps: true});

export const Card = mongoose.model('Card', cardSchema);