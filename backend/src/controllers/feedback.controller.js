import { Feedback } from "../models/feedback.models.js";
import { MealToken } from "../models/mealToken.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import { calculateActualDate } from "../utils/DateConverter.js";

const newFeedback = asyncHandler(async(req, res)=>{
    const {category, description, day, mealType} = req.body;

    if(
        [category, description].some((f)=>{
            return f?.trim() === "";
        })
    ) {
        throw new ApiError(400, "All fields are required")
    }

    if(!mealType || !day){
        throw new ApiError(400, "fields are required")
    }
    const bookDate = await calculateActualDate(day, 1);

    const fetchMealToken = await MealToken.findOne({
        student: req.user?._id,
        mealType: mealType,
        date: bookDate,
        status: 'REDEEMED'
    })

    console.log({category, description, day, mealType})
    
    if(!fetchMealToken){
        throw new ApiError(404, 'User didnt ate this meal')
    }
    const existingFeedback = await Feedback.findOne({
        user: req.user?._id,
        category: category,
        meal: fetchMealToken?._id
    })

    if(existingFeedback){
        throw new ApiError(400, "Only one feedback can be created for each meal");
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

    const feedbacks = await Feedback.find({user: req.user?._id}).sort({createdAt: -1})

    if(!feedbacks){
        throw new ApiError(404, "Not found");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, feedbacks, "SUCCESS")
    )

})

export {newFeedback, respondFeedback, getFeedback};