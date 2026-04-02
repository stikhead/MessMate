import { User } from "../models/users.models.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { ApiError } from "../utils/ApiError.js";
import asyncHandler from "../utils/asyncHandler.js";
import { sendVerificationEmail } from "../services/email.service.js";
import jwt from "jsonwebtoken";
import axios from "axios";
const cookieOptions = {
    httpOnly: true,    
    secure: true,   
    sameSite: 'none',  
    path: '/',       
};
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

const generateAccessAndRefreshToken = async (userID) => {
    const user = await User.findById(userID).select("+refreshToken");
    const refreshToken = await user.generateRefreshToken();
    const accessToken = await user.generateAccessToken();


    if (!refreshToken) {
        console.log("Some error occurred during refresh token")
    }
    if (!accessToken) {
        console.log("Some error occurred during access token")
    }

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });

    return { refreshToken, accessToken };

}

const registerUser = asyncHandler(async (req, res) => {
    const { fullName, email, password, roll_no, phoneNumber } = req.body;

    const normalizedEmail = email?.toLowerCase().trim();

    if ([fullName, normalizedEmail, roll_no, password, phoneNumber].some((field) => field?.trim() === "")) {
        throw new ApiError(400, "All fields are required");
    }

    const existingUser = await User.findOne({
        $or: [{ email: normalizedEmail }, { roll_no }, { phoneNumber }]
    });

    if (existingUser) {
        if (existingUser.isVerified) {
            if (existingUser.email === normalizedEmail) throw new ApiError(409, "Email already exists.");
            if (existingUser.roll_no === roll_no) throw new ApiError(409, "Roll Number already registered.");
            if (existingUser.phoneNumber === phoneNumber) throw new ApiError(409, "Phone Number in use.");
        }

        const { nextAvailable, otp, user } = await isOtpAvailableAndGenerateOtp(existingUser);

        user.password = password;
        user.roll_no = roll_no;
        user.phoneNumber = phoneNumber;
        user.fullName = fullName;

        await user.save({ validateBeforeSave: true });

        try {
            await sendVerificationEmail(normalizedEmail, otp);
        } catch (error) {
            throw new ApiError(500, "Failed to send email. Please try again in a few minutes.");
        }

        return res.status(200).json(
            new ApiResponse(200, {
                email: normalizedEmail,
                nextOtpAvailableAt: nextAvailable
            }, "Verification email resent.")
        );
    }

    const newUser = await User.create({
        fullName,
        email: normalizedEmail,
        password,
        phoneNumber,
        role: 'student',
        roll_no
    });

    const createdUser = await User.findById(newUser._id).select("-password -refreshToken");

    const { nextAvailable, otp, user: updatedUser } = await isOtpAvailableAndGenerateOtp(createdUser);

    await updatedUser.save({ validateBeforeSave: false });

    try {
        await sendVerificationEmail(normalizedEmail, otp);
    } catch (error) {
        await User.findByIdAndDelete(updatedUser._id);
        throw new ApiError(500, "Failed to send verification email. Please try again.");
    }

    const nUser = await User.findById(createdUser._id).select("-password -refreshToken -verification");

    return res.status(201).json(
        new ApiResponse(201, {
            user: nUser,
            nextOtpAvailableAt: nextAvailable
        }, "User registered successfully. Please verify your email.")
    );
});

const verifyUser = asyncHandler(async (req, res) => {
    const { email, code } = req.body;

    const normalizedEmail = email?.toLowerCase().trim();

    if (!normalizedEmail || !code) {
        throw new ApiError(400, "Email and OTP are required");
    }

    const user = await User.findOne({
        email: normalizedEmail,
        "verification.emailToken": code,
        "verification.emailExpiry": { $gt: Date.now() }
    });

    if (!user) {
        throw new ApiError(400, "Invalid or expired OTP");
    }

    user.isVerified = true;
    user.verification = undefined;

    await user.save({ validateBeforeSave: false });

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user._id);

    const updatedUser = await User.findById(user?._id).select(
        "-password -refreshToken"
    )

    return res
        .status(200)
        .cookie(
            'accessToken', `${accessToken}`, cookieOptions
        )
        .cookie(
            'refreshToken', `${refreshToken}`, cookieOptions
        )
        .json(
            new ApiResponse(
                200,
                {
                    accessToken,
                    refreshToken,
                    user: updatedUser
                },
                "Account verified successfully"
            )
        );
});


const loginUser = asyncHandler(async (req, res) => {
    const { email, cardNumber, password } = req.body;
    const userMethod = email || cardNumber;

    if (!userMethod) {
        throw new ApiError(400, "Email or Card Number is required");
    }

    if (!password) {
        throw new ApiError(400, "Password is required");
    }

    const user = await User.findOne({
        $or: [{ email: userMethod }]
    }).select("+password")

    if (!user) {
        throw new ApiError(400, "User doesn't exist");
    }

    const isPasswordCorrect = await user.comparePassword(password);

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid Password");
    }

    const { refreshToken, accessToken } = await generateAccessAndRefreshToken(user?._id);

    const updatedUser = await User.findById(user?._id).select(
        "-password -refreshToken -verification"
    )

    return res
        .status(200)
        .cookie(
            'accessToken', `${accessToken}`, cookieOptions
        )
        .cookie(
            'refreshToken', `${refreshToken}`, cookieOptions
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

const logoutUser = asyncHandler(async (req, res) => {

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
            'accessToken', cookieOptions)
        .clearCookie(
            'refreshToken', cookieOptions)
        .json(
            new ApiResponse(200, {}, "logged out")
        )
})

const getCurrentUser = asyncHandler(async (req, res) => {
    if (!req.user) {
        throw new ApiError(401, "User not authenticated");
    }


    return res.status(200).json(
        new ApiResponse(200, req.user, "fetched successfully")
    )
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body;

    if (!req.user) {
        throw new ApiError(400, "user not authenticated")
    }

    if (
        [oldPassword, newPassword].some((field) => {
            return field?.trim() === ""
        })
    ) {
        throw new ApiError(400, "Old and new passwords are required");
    }

    const user = await User.findById(req.user?._id).select("+password")
    if (!user) throw new ApiError(404, "User not found");
    const isPasswordCorrect = await user.comparePassword(oldPassword);
    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid Password")
    }


    user.password = newPassword;
    await user.save({ validateBeforeSave: false });

    const { refreshToken, accessToken } = await generateAccessAndRefreshToken(user?._id)

    return res
        .status(200)
        .cookie(
            'accessToken', `${accessToken}`, cookieOptions
        )
        .cookie(
            'refreshToken', `${refreshToken}`, cookieOptions
        )
        .json(
            new ApiResponse(200, {
                refreshToken: refreshToken,
                accessToken: accessToken,
            },
                "password updated successfully")
        )
})


const refreshAccessToken = asyncHandler(async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken;

    if (!incomingRefreshToken) {
        throw new ApiError(401, "Unauthorized request: No refresh token provided");
    }

    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        );

        const user = await User.findById(decodedToken?._id);

        if (!user) {
            throw new ApiError(401, "Invalid refresh token: User not found");
        }

        if (incomingRefreshToken !== user?.refreshToken) {
            throw new ApiError(401, "Refresh token is expired or used");
        }



        const { accessToken, newRefreshToken } = await generateAccessAndRefreshToken(user._id);

        return res
            .status(200)
            .cookie(
                'accessToken', `${accessToken}`,cookieOptions
            )
            .cookie(
                'refreshToken', `${newRefreshToken}`, cookieOptions
            )
            .json(
                new ApiResponse(
                    200,
                    { accessToken, refreshToken: newRefreshToken },
                    "Access token refreshed"
                )
            );

    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token");
    }
});

const getAllUsers = asyncHandler(async (req, res) => {
    if (req?.user._id === 'student') {
        throw new ApiError(402, "missing perms");
    }

    const users = await User.find().populate('cardNumber');

    if (!users) {
        throw new ApiError(404, "Not found");
    }

    return res
        .status(200)
        .json(
            new ApiResponse(200, users, "success")
        )

})

const googleAuth = asyncHandler(async (req, res) => {
    const { code } = req.body;

    if (!code) throw new ApiError(400, "Google code is required");

    const { data: tokens } = await axios.post(process.env.GOOGLE_OAUTH_URI, {
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: process.env.GOOGLE_REDIRECT_URI
    });

    const response = await axios.get(process.env.GOOGLE_VERIFICATION_URI, {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
    });

    const { email, name } = response.data;
    const user = await User.findOne({ email });

    if (user) {
        const { refreshToken, accessToken } = await generateAccessAndRefreshToken(user._id);
        if (!user.isVerified) {
            user.isVerified = true;
        }

        if (user.verification) {
            user.verification.passwordToken = undefined;
            user.verification.passwordExpiry = undefined;
            user.verification.emailToken = undefined;
            user.verification.emailExpiry = undefined;
            user.verification.nextOtpAvailableAt = undefined;
        }

        return res
            .cookie(
                'accessToken', `${accessToken}`, cookieOptions
            )
            .cookie(
                'refreshToken', `${refreshToken}`, cookieOptions
            )
            .status(200)
            .json(new ApiResponse(200, {
                user, accessToken, refreshToken, isNewUser: false
            }, "Login successful"));
    }

    const onboardingToken = jwt.sign({ email, name }, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '15m' });

    return res
        .status(202)
        .json(new ApiResponse(202, {
            onboardingToken,
            isNewUser: true,
            email
        }, "User needs to finalize profile"));
});



const googleFinalize = asyncHandler(async (req, res) => {
    const { onboardingToken, fullName, phoneNumber, roll_no } = req.body;

    if (!onboardingToken || !fullName || !phoneNumber || !roll_no) {
        throw new ApiError(400, "All profile details are required");
    }

    let decoded;
    try {
        decoded = jwt.verify(onboardingToken, process.env.ACCESS_TOKEN_SECRET);
    } catch (error) {
        throw new ApiError(401, "Invalid or expired onboarding token");
    }

    const existingUser = await User.findOne({
        $or: [
            { email: decoded.email },
            { roll_no: roll_no.trim() },
            { phoneNumber: phoneNumber.trim() }
        ]
    });

    if (existingUser) {
        if (existingUser.email === decoded.email) {
            throw new ApiError(409, "User with this email already exists");
        }
        if (existingUser.roll_no === roll_no.trim()) {
            throw new ApiError(409, "This Roll Number is already registered");
        }
        if (existingUser.phoneNumber === phoneNumber.trim()) {
            throw new ApiError(409, "This Phone Number is already in use");
        }
    }

    const user = await User.create({
        email: decoded.email,
        fullName: fullName.trim(),
        roll_no: roll_no.trim(),
        phoneNumber: phoneNumber.trim(),
        password: crypto.randomBytes(32).toString("hex"),
        isVerified: true
    });

    const { refreshToken, accessToken } = await generateAccessAndRefreshToken(user._id);


    return res
        .status(201)
        .cookie(
            'accessToken', `${accessToken}`, cookieOptions
        )
        .cookie(
            'refreshToken', `${refreshToken}`, cookieOptions
        )
        .json(new ApiResponse(201, {
            user,
            accessToken,
            refreshToken
        }, "Account created successfully"));
});

const sendOtp = asyncHandler(async (req, res) => {
    const { email } = req.body;
    if (!email) {
        throw new ApiError(400, 'Email is required');
    }

    const normalizedEmail = email.trim().toLowerCase();
    const existingUser = await User.findOne({ email: normalizedEmail });

    if (!existingUser) {
        return res.status(200).json(
            new ApiResponse(200, { nextOtpAvailableAt: Date.now() + (60 * 1000) }, "If an account exists, a new code has been sent.")
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

    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
        throw new ApiError(400, 'Invalid or expired OTP');
    }

    const now = Date.now();
    let isOtpValid = false;
    if (user.isVerified) {
        isOtpValid =
            user.verification?.passwordToken === otp &&
            user.verification?.passwordExpiry > now;
    } else {
        isOtpValid =
            user.verification?.emailToken === otp &&
            user.verification?.emailExpiry > now;
    }

    if (!isOtpValid) {
        throw new ApiError(400, 'Invalid or expired OTP');
    }

    user.password = newPassword;

    if (!user.isVerified) {
        user.isVerified = true;
    }

    if (user.verification) {
        user.verification.passwordToken = undefined;
        user.verification.passwordExpiry = undefined;
        user.verification.emailToken = undefined;
        user.verification.emailExpiry = undefined;
        user.verification.nextOtpAvailableAt = undefined;
    }

    await user.save({ validateBeforeSave: true });

    return res.status(200).json(
        new ApiResponse(200, {}, "Password reset successfully")
    );
});

export { registerUser, loginUser, logoutUser, verifyUser, googleAuth, googleFinalize, verifyForgetPasswordOtpAndResetPassword, sendOtp, getCurrentUser, changeCurrentPassword, refreshAccessToken, getAllUsers };