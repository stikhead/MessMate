import mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken"
import crypto from "crypto";
import { v4 as uuidv4 } from "uuid";

const userSchema =  new mongoose.Schema({
    userID: {
        type: String,
        default: uuidv4,
        index: true,
        unique: true
    },

    fullName: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },

    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        trim: true,
        match: [/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },

    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: 6,
        select: false
    },

    roll_no: {
        type: String,
        unique: true,
        sparse: true,
    },

    role: {
        type: String,
        enum: ['student', 'staff', 'admin'],
        default: 'student'
    },

    phoneNumber: {
        type: String,
        required: true,
        unique: true,
        match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number']
    },

    currentBalance: {
        type: Number,
        default: 0
    },

    qrCodeHash: {
        type: String,
        unique: true,
        sparse: true
    },

    qrCodeExpiry: {
        type: Date
    },
    isCardHolder: {
        type: Boolean,
        default: false
    },
    cardNumber: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Card"
    },

    messOffDates: [{
        startDate: { type: Date, required: true },
        endDate: { type: Date, required: true },
        mealTypes: {
            type: [String],
            enum: ['breakfast', 'lunch', 'dinner']
        },
        reason: { type: String }
    }],

    refreshToken: {
        type: String,
        select: false
    }

}, {timestamps: true});

userSchema.pre("save", async function(next) {
    if(this.isModified("password")){  // checks if any field is modified, this is required bc we do not want to run bcrypt every time while modifying other fields
        this.password = await bcrypt.hash(this.password, 10);
    }
});   // do not use array function since it doesnt provide context ( this. )


userSchema.pre('save', async function(next){
    if(this.role === 'student' && !this.cardNumber){
        this.cardNumber = crypto.randomBytes(6).toString('hex').toUpperCase();
    }
})

userSchema.methods.comparePassword = async function(password) {
    return await bcrypt.compare(password, this.password);
}

userSchema.methods.generateAccessToken = async function() {
    return jwt.sign({
        _id: this._id,
        email: this.email,
        userID: this.userID,
        fullName: this.fullName,
    }, 
        process.env.ACCESS_TOKEN_SECRET, 
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = async function() {
    return jwt.sign({
        _id: this._id
    }, 
        process.env.REFRESH_TOKEN_SECRET, 
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}





export const User = mongoose.model("User", userSchema);