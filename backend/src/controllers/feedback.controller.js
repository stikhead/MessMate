import { Feedback } from "../models/feedback.models.js";
import { MealToken } from "../models/mealToken.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const newFeedback = asyncHandler(async(req, res)=>{
       const {category, description, day, date, mealType} = req.body;

    if (
        [category, description, date].some((f)=>{
            return f?.trim() === "";
        })
    ) {
        throw new ApiError(400, "All fields are required")
    }

    if(!mealType || !day){
        throw new ApiError(400, "Fields are required")
    }

    const startOfDay = new Date(date);
    startOfDay.setUTCHours(0, 0, 0, 0);
    
    const endOfDay = new Date(date);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const fetchMealToken = await MealToken.findOne({
        student: req.user?._id,
        mealType: mealType,
        date: {
            $gte: startOfDay,
            $lte: endOfDay
        },
        status: 'REDEEMED'
    });

    console.log("Looking for token:", { student: req.user?._id, date, mealType });
    
    if(!fetchMealToken){
        throw new ApiError(404, 'User did not eat this meal on the selected date')
    }

    const existingFeedback = await Feedback.findOne({
        user: req.user?._id,
        category: category,
        meal: fetchMealToken?._id
    })

    if(existingFeedback){
        throw new ApiError(400, "Only one feedback can be created for each meal category");
    }
    
    const createFeedback = await Feedback.create({
        user: req.user?._id,
        category: category,
        description: description,
        status: 'SUBMITTED',
        meal: fetchMealToken?._id
    })

    return res
    .status(201)
    .json(
        new ApiResponse(
            201,
            createFeedback,
            "Feedback submitted"
        )
    )
})


const respondFeedback = asyncHandler(async(req, res)=>{
    const {responseString, FeedbackId} = req.body;

    if(
        [responseString, FeedbackId].some((f)=>{
            return f?.trim() === "";
        })
    ) {
        throw new ApiError(400, "All fields are required")
    }

    const fetchFeedback = await Feedback.findById(FeedbackId);

    if(!fetchFeedback){
        throw new ApiError(404, "invalid feedback id")
    }

    fetchFeedback.response = responseString;
    fetchFeedback.status = 'RESOLVED';
    await fetchFeedback.save({validateBeforeSave: false})

    return res
    .status(200)
    .json(
        new ApiResponse(200, fetchFeedback, "Successfully added response")
    )

})


const getFeedback = asyncHandler(async(req, res)=>{
    if(!req.user?._id){
        throw new ApiError(401, "Unauthorized");
    }

    const feedbacks = await Feedback.find({user: req.user?._id})
        .populate("meal") 
        .sort({createdAt: -1})

    if(!feedbacks){
        throw new ApiError(404, "Not found");
    }
    
    return res
    .status(200)
    .json(
        new ApiResponse(200, feedbacks, "SUCCESS")
    )
})
const getAllFeedbacks = asyncHandler(async(req, res) => {
    // 1. Fetch all feedbacks (no user filter)
    // 2. Populate the user so admin sees their name
    // 3. Populate the meal so admin sees the date and mealType
    const feedbacks = await Feedback.find()
        .populate("user", "name email hostel roomNo") // Populates student info
        .populate("meal")                             // Populates meal info
        .sort({createdAt: -1});                       // Newest first

    if(!feedbacks){
        throw new ApiError(404, "No feedbacks found");
    }
    
    return res
    .status(200)
    .json(
        new ApiResponse(200, feedbacks, "All feedbacks fetched successfully")
    )
})

// Don't forget to export it at the bottom!
export { newFeedback, respondFeedback, getFeedback, getAllFeedbacks };