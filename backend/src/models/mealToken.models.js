import mongoose from "mongoose";
import crypto from "crypto";

const mealTokenSchema = new mongoose.Schema({
    student: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },
    tokenId: {
        type: String,
        unique: true 
    },
    date: {
        type: Date,
        required: true

    },
    mealType: {
        type: Number,
        required: true,
        min: 1,
        max: 3
    },
    status: {
        type: String,
        enum: ['booked', 'used', 'cancelled'],
        default: 'booked'
    },
    cost: {
        type: Number,
        required: true 
    }
}, { timestamps: true });

mealTokenSchema.virtual('mealTypeName').get(function() {
    const meals = { 1: 'Breakfast', 2: 'Lunch', 3: 'Dinner' };
    return meals[this.mealType];
});

mealTokenSchema.index({ student: 1, date: 1, mealType: 1 }, { unique: true });

mealTokenSchema.pre('save', async function(){
    if(this.isNew){
        this.tokenId = crypto.randomBytes(3).toString('hex').toUpperCase();
    }
})


export const MealToken = mongoose.model("MealToken", mealTokenSchema);