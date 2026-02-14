import { User } from "../models/users.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";


const generateAccessAndRefreshToken = async(userID)=>{
    const user = await User.findById(userID).select("+refreshToken");
    const refreshToken = await user.generateRefreshToken();
    const accessToken = await user.generateAccessToken();


    if(!refreshToken){
        console.log("Some error occurred during refresh token")
    }
    if(!accessToken){
        console.log("Some error occurred during access token")
    }

    user.refreshToken = refreshToken;
    await user.save({validateBeforeSave: false});

    return {refreshToken, accessToken};

}

const registerUser = asyncHandler( async (req, res) => {
    const {fullName, email, password, roll_no, phoneNumber, role} = req.body;

    if(
        [fullName, email, password, phoneNumber].some((field)=>{
            return field?.trim() === "";
        }
        )
    ) {
        throw new ApiError(400, "fullName, email, password and phoneNumber are required")
    }

    const existingUser = await User.findOne(
        {
            $or: [{email}, {phoneNumber}]
        }
    )

    if(existingUser){
        throw new ApiError(409, "User already exist");
    }


    const user = await User.create({
        fullName,
        email,
        password,
        phoneNumber,
        role: role || 'student', 
        roll_no: (role === 'student' && roll_no) ? roll_no : undefined
    })
    
    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"
    )
        
    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user")
    } else {
        console.log("user created")
    }
        
    
    return res.status(201).json( 
        new ApiResponse(201, createdUser, "User registered successfully")
    )
})


const loginUser = asyncHandler(async(req, res)=>{
    const {email, cardNumber, password} = req.body;
    const userMethod = email || cardNumber;

    if(!userMethod){
        throw new ApiError(400, "Email or Card Number is required");
    }

    if(!password){
        throw new ApiError(400, "Password is required");
    }

    const user = await User.findOne({
        $or: [{email: userMethod}, {cardNumber: userMethod}]
    }).select("+password")

    if(!user){
        throw new ApiError(400, "User doesn't exist");
    }

    const isPasswordCorrect = await user.comparePassword(password);

    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid Password");
    }

    const {refreshToken, accessToken} = await generateAccessAndRefreshToken(user?._id);
    
    const updatedUser = await User.findById(user?._id).select(
        "-password -refreshToken"
    )

    return res
    .status(200)
    .cookie(
        'accessToken', `${accessToken}`, {
            httpOnly: true,
            secure: true
        }
    )
    .cookie(
        'refreshToken', `${refreshToken}`, {
            httpOnly: true,
            secure: true
        }
    )
    .json(
        new ApiResponse(200, {
            user: updatedUser,
            refreshToken: refreshToken,
            accessToken: accessToken
        },
       "User logged in successfullty")
    )
})

const logoutUser = asyncHandler(async(req, res)=>{

    if (!req.user) {
        throw new ApiError(401, "User not authenticated");
    }
    await User.findByIdAndUpdate(
        req.user?._id,
        {
            $unset: { refreshToken: 1 }
        }, 
        {
            new: true
        }
    )

    return res
        .status(200)
        .clearCookie(
            'accessToken', {
            httpOnly: true,
            secure: true
        })
        .clearCookie(
        'refreshToken', {
            httpOnly: true,
            secure: true
        })
        .json(
            new ApiResponse(200, {}, "logged out")
        )
})

const getCurrentUser = asyncHandler(async(req, res)=>{
    if (!req.user) {
        throw new ApiError(401, "User not authenticated");
    }

    return res.status(200).json(
        new ApiResponse(200, req.user, "fetched successfully")
    )
})

const changeCurrentPassword = asyncHandler(async(req, res)=>{
    const {oldPassword, newPassword} = req.body;

    if(!req.user){
        throw new ApiError(400, "user not authenticated")
    }

    if(
        [oldPassword, newPassword].some((field)=>{
            return field?.trim() === ""
        })
    ) {
        throw new ApiError(400, "Old and new passwords are required");
    }

    const user = await User.findById(req.user?._id).select("+password")
    if (!user) throw new ApiError(404, "User not found");
    const isPasswordCorrect = await user.comparePassword(oldPassword);
    if(!isPasswordCorrect){
        throw new ApiError(400, "Invalid Password")
    }


    user.password = newPassword;
    await user.save({validateBeforeSave: false});

    const {refreshToken, accessToken} = await generateAccessAndRefreshToken(user?._id)

    return res
    .status(200)
    .cookie(
        'accessToken', `${accessToken}`, {
            expires: new Date(Date.now() + 24*3600000),
            httpOnly: true,
            secure: true
        }  
    )
    .cookie(
        'refreshToken', `${refreshToken}`, {
            expires: new Date(Date.now() + 24*3600000),
            httpOnly: true,
            secure: true
        }  
    )
    .json(
        new ApiResponse(200, {
            refreshToken: refreshToken,
            accessToken: accessToken,
        }, 
        "password updated successfully")
    )   
})

const refreshAccessToken = asyncHandler(async(req, res)=>{
    if (!req.user) {
        throw new ApiError(401, "User not authenticated");
    }
    
    const {refreshToken, accessToken} = await generateAccessAndRefreshToken(req.user?._id);
  
    return res
    .status(200)
    .cookie(
        'accessToken', `${accessToken}`, {
            expires: new Date(Date.now() + 24*3600000),
            httpOnly: true,
            secure: true
        }  
    )
    .cookie(
        'refreshToken', `${refreshToken}`, {
            expires: new Date(Date.now() + 24*3600000),
            httpOnly: true,
            secure: true
        }  
    )
    .json(
        new ApiResponse(200, {
            refreshToken: refreshToken, 
            accessToken: accessToken
        }, 
        "success")
    )  
})



export {registerUser, loginUser, logoutUser, getCurrentUser, changeCurrentPassword, refreshAccessToken};