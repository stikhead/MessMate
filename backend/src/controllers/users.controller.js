import { User } from "../models/users.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendVerificationEmail } from "../services/email.service.js";

const isOtpAvailableAndGenerateOtp = async (user) => {
    const currentTime = Date.now();


    if (!user.verification) {
        user.verification = {};
    }

    if (user.verification?.nextOtpAvailableAt && currentTime < user.verification.nextOtpAvailableAt) {
        const secondsLeft = Math.ceil((user.verification.nextOtpAvailableAt - currentTime) / 1000);
        throw new ApiError(429, `Please wait ${secondsLeft} seconds before requesting another code.`);
    }

    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const cooldownMs = 60 * 1000;
    const expiryMs = 15 * 60 * 1000;
    const nextAvailable = currentTime + cooldownMs;

    if (user.isVerified) {
        user.verification.passwordToken = otp;
        user.verification.passwordExpiry = currentTime + expiryMs;
    } else {
        user.verification.emailToken = otp;
        user.verification.emailExpiry = currentTime + expiryMs;
    }

    user.verification.nextOtpAvailableAt = nextAvailable;
    return { nextAvailable, otp, user };

}

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
    const {fullName, email, password, roll_no, phoneNumber} = req.body;

    if(
        [fullName, email, roll_no, password, phoneNumber].some((field)=>{
            return field?.trim() === "";
        }
        )
    ) {
        throw new ApiError(400, "fullName, email, password and phoneNumber are required")
    }

    const existingUser = await User.findOne({
        $or: [{ email }, { roll_no }, { phoneNumber }]
    });

    if (existingUser) {
        if (existingUser.email === email) {
            throw new ApiError(409, "A user with this email already exists.");
        }
        if (existingUser.roll_no === roll_no) {
            throw new ApiError(409, "This Roll Number is already registered.");
        }
        if (existingUser.phoneNumber === phoneNumber) {
            throw new ApiError(409, "This Phone Number is already in use.");
        }
    }

    const user = await User.create({
        fullName,
        email,
        password,
        phoneNumber,
        role: 'student', 
        roll_no: roll_no
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
        $or: [{email: userMethod}]
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

const getAllUsers = asyncHandler(async(req, res)=>{
    if(req?.user._id === 'student'){
        throw new ApiError(402, "missing perms");
    }

    const users = await User.find().populate('cardNumber');

    if(!users){
        throw new ApiError(404, "Not found");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, users, "success")
    )

})

const googleLogin = asyncHandler(async (req, res) => {
    const { code, fullName, phoneNumber, roll_no } = req.body;

    if (!code || !fullName || !phoneNumber || !roll_no) {
        throw new ApiError(
            400, 'Google token is required'
        )
    }

    let googleUser;
    try {
        const { data: tokens } = await axios.post(`${process.env.GOOGLE_OAUTH_URI}`, {
            client_id: process.env.GOOGLE_CLIENT_ID,
            client_secret: process.env.GOOGLE_CLIENT_SECRET,
            code: code,
            grant_type: 'authorization_code',
            redirect_uri: process.env.GOOGLE_REDIRECT_URI
        });

        const { access_token } = tokens;

        const response = await axios.get(`${process.env.GOOGLE_VERIFICATION_URI}`, {
            headers: { Authorization: `Bearer ${access_token}` }
        });

        googleUser = response.data;

    } catch (error) {
        console.error(error.response?.data || error.message);
        throw new ApiError(401, "Google authentication failed");
    }

    let user = await User.findOne({ email: googleUser.email });

    if (!user) {
        const generatedPassword = crypto.randomBytes(32).toString("hex");

        user = await User.create({
            email: googleUser.email,
            fullName: fullName,
            roll_no: roll_no,
            phoneNumber: phoneNumber,
            password: generatedPassword,
            isVerified: true,
            name: googleUser.name
        });
    }

    const { refreshToken, accessToken } = await generateAccessAndRefreshToken(user);
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
                user: user,
                accessToken: accessToken,
                refreshToken: refreshToken
            },
                "User logged in successfullty")
        )
})

const sendOtp = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) {
        throw new ApiError(400, 'Email is required');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (!existingUser) {
        return res.status(200).json(
            new ApiResponse(200, {nextOtpAvailableAt: Date.now() + ( 60 * 1000)}, "If an account exists, a new code has been sent.")
        );
    }

    const { nextAvailable, otp, user } = await isOtpAvailableAndGenerateOtp(existingUser);

    await user.save({ validateBeforeSave: false });

    try {
        await sendVerificationEmail(normalizedEmail, otp);
        console.log(`OTP Resent to ${normalizedEmail}: ${otp}`);
    } catch (error) {
        if (user.isVerified) {
            user.verification.passwordToken = undefined;
            user.verification.passwordExpiry = undefined;
        } else {
            user.verification.emailToken = undefined;
            user.verification.emailExpiry = undefined;
        }
        user.verification.nextOtpAvailableAt = undefined;
        await user.save({ validateBeforeSave: false });
        throw new ApiError(500, `Failed to send email: ${error.message}`);
    }

    return res.status(200).json(
        new ApiResponse(200, {
            nextOtpAvailableAt: nextAvailable
        }, 'If an account exists, a new code has been sent.')
    );
});

const verifyForgetPasswordOtpAndResetPassword = asyncHandler(async (req, res) => {
    const { otp, email, newPassword } = req.body;

    if (!otp || !email || !newPassword) {
        throw new ApiError(400, "All fields (email, otp, newPassword) are required");
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await User.findOne({
        email: normalizedEmail
    });

    if (!user) {
        throw new ApiError(400, 'Invalid or expired OTP');
    }

    let validOtp;
    if (user.isVerified) {
        validOtp = user.verification?.passwordToken === otp && user.verification?.passwordExpiry > currentTime;
    } else {
        validOtp = user.verification?.emailToken === otp && user.verification?.emailExpiry > currentTime;

    }

    if (!validOtp) {
        throw new ApiError(400, 'Invalid or expired OTP');
    }


    if (!user.isVerified) {
        user.isVerified = true;
    }

    user.verification.passwordToken = undefined;
    user.verification.passwordExpiry = undefined;
    user.verification.emailToken = undefined;
    user.verification.emailExpiry = undefined;
    await user.save({ validateBeforeSave: true });

    return res.status(200).json(
        new ApiResponse(200, {}, "Password reset successfully")
    );
});

export {registerUser, loginUser, logoutUser, googleLogin, verifyForgetPasswordOtpAndResetPassword, sendOtp, getCurrentUser, changeCurrentPassword, refreshAccessToken, getAllUsers};