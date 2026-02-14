import mongoose, { mongo } from "mongoose";

const menuSchema = new mongoose.Schema({
    day: {
        type: Number, // monday, tuesday etc
        required: true,
        min: 1,
        max: 7
    },

    mealType: {
        type: Number,
        required: true,
        min: 1,
        max: 3
    },

    items: {
        type: String, // for paneer, rice etc
        required: true
    },
    

    price: {
        type: Number,
        required: true
    }

}, {
    toJSON: true,
    toObject: true
}, {timestamps: true})

menuSchema.virtual('dayName').get(function() {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    return days[this.day-1];
});

menuSchema.virtual('mealTypeName').get(function() {
    const meals = { 1: 'Breakfast', 2: 'Lunch', 3: 'Dinner' };
    return meals[this.mealType];
});

menuSchema.index({ day: 1, mealType: 1 }, { unique: true });

export const Menu = mongoose.model("Menu", menuSchema);