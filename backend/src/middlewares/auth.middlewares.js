import "dotenv/config"
import jwt from "jsonwebtoken";
import asyncHandler from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/users.models.js";

export const verifyJWT = asyncHandler(async(req, _, next)=>{
    try {
        const accessToken = req.cookies?.accessToken || req.header('Authorization')?.replace('Bearer ', '');
    
        if(!accessToken){
            throw new ApiError(401, "Unauthorized");
        }
    
        const decodeToken = jwt.verify(accessToken, process.env.ACCESS_TOKEN_SECRET) 
    
        const user = await User.findById(decodeToken?._id).select(
            "-password -refreshToken"
        );
    
        if(!user){
            throw new ApiError(401, "Invalid Access Token");
        }
    
        req.user = user;
        next();
    
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Access Token");
    }
});

export const verifyRefreshToken = async(req, _, next)=>{
    try {
        const oldRefreshToken = req.cookies?.refreshToken || req.header('Authorization')?.replace('Bearer ', "");

        if(!oldRefreshToken){
            throw new ApiError(401, "Unauthorized");
        }        

        const decodeToken = jwt.verify(oldRefreshToken, process.env.REFRESH_TOKEN_SECRET);

        const user = await User.findById(decodeToken?._id).select("+refreshToken");

        if(!user){
            throw new ApiError(404, "User doesnt exist");
        }

        if(oldRefreshToken !== user.refreshToken){
            throw new ApiError(401, "Token Expired");
        }

        req.user = user;
        next();

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid Refresh Token");
    }
}

export const verifyAdmin = async(req, __, next)=>{

        if(req.user && (req.user.role === 'admin' || req.user.role === 'staff')){
            next();
        }
        else {
            throw new ApiError(403, "Access Denied")
        }
   
}