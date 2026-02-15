import mongoose, { mongo } from "mongoose";

const feedbackSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
    },

    category: {
        type: String,
        required: true,
        enum: ['HYGIENE', 'QUANTITY', 'TASTE', "DELAY"]
    },

    description: {
        type: String,
        required: true,
        trim: true, // to remove whitespace characters
        minLength: [10, "Minimum 10 characters are required"],
        maxLength: [100, "Maximum 100 characters allowed"]
    },

    status: {
        type: String,
        required: true,
        enum: ['SUBMITTED', 'RESOLVED'],
        default: 'SUBMITTED'
    },

    meal: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'MealToken'
    },

    response: {
        type: String,
        trim: true, // to remove whitespace characters
        minLength: [10, "Minimum 10 characters are required"],
        maxLength: [100, "Maximum 100 characters allowed"]
    }

}, {timestamps: true});

feedbackSchema.index({
    user: 1,
    category: 1,
    meal: 1
}, {unique: 1})
export const Feedback = mongoose.model('Feedback', feedbackSchema);