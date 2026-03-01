import { Menu } from "../models/menu.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";

const addMenu = asyncHandler(async(req, res)=>{
    const {day, mealType, items, price} = req.body;

    if(
        [items].some((fields)=>{
            return fields?.trim() === "";
        })
    ) {
        throw new ApiError(400, "All fields are required");
    }


    if(!price || !day || !mealType){
        throw new ApiError(400, "Price is required")
    }

    if(req.user.role === 'student'){
        throw new ApiError(403, "Access Denied");
    }

 
    const existingMenu = await Menu.findOne({
        day: day,
        mealType: mealType
    })

    if(existingMenu){
        throw new ApiError(409, `Menu for ${mealType} already exist for this date`);
    }
    const newItem = await Menu.create({
        day: day,
        mealType: mealType,
        items,
        price
    })

    return res
    .status(201)
    .json(
        new ApiResponse(200, newItem, "Item added to the database successfully")
    );

})

const getMenuByDate = asyncHandler(async(req, res)=>{

    console.log(`[BACKEND HIT] Fetching menu for day: ${req.query.day}`)
    const {day, mealType} = req.query;
    const dayNumber = Number(day);
    const mealTypeNumber = Number(mealType)
    if(!dayNumber) {
        throw new ApiError(400, "All fields are required");
    }


    const filter = {
        day: dayNumber
    }
    if(mealTypeNumber){
        filter.mealType = mealTypeNumber;
    }

    const getMenuItem = await Menu.find(
       filter
    )

    if(!getMenuItem || getMenuItem.length===0){
        throw new ApiError(404, `Menu doesnt exist for ${day}`)
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, getMenuItem, "Successfully fetched data")
    )
})


const getWeeklyMenu = asyncHandler(async(req, res)=>{
 
    const getWeeklyMenu = await Menu.find().sort({ 
        day: 1, 
        mealType: 1 ,
        createdAt: -1
    });
    return res
    .status(200)
    .json(
        new ApiResponse(200, getWeeklyMenu, "Successfully fetched data")
    )
})

const updateMenu = asyncHandler(async(req, res)=>{
    const {id, items, price } = req.query; // i mean we would only allow the name of dishes in case of typo or new update - keeping items as a string
    
    

    if(!id || !items){
        throw new ApiError(400, "All fields are required")
    }
    if(req.user.role === 'student'){
        throw new ApiError(403, "Access Denied")
    }

    const getItem = await Menu.findById(id);

    if(!getItem){
        throw new ApiError(400, "Menu doesnt exist")
    }

    getItem.items = items;
    getItem.price = price ? Number(price) : 0
    await getItem.save({validateBeforeSave: false});

    return res
    .status(200)
    .json(
        new ApiResponse(200, getItem, "Updated successfully")
    )
})

const deleteMenu = asyncHandler(async(req, res)=>{
    const {id} = req.query;

    if(!id){
        throw new ApiError(400, "All fields are required")
    }
    if(req.user.role === 'student'){
        throw new ApiError(403, "Access denied")
    }
    const isDeleted = await Menu.findByIdAndDelete({_id: id})

    if(isDeleted.deletedCount===0){
        throw new ApiError(404, "menu not found")
    }
    return res
    .status(200)
    .json(
        new ApiResponse(200, isDeleted, "menu deleted")
    )
})

export {addMenu, getMenuByDate, getWeeklyMenu, updateMenu, deleteMenu};