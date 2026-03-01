import "dotenv/config";
import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

let isConnected = false; 

const connectDB = async () => {

    if (isConnected) {
        console.log("=> Using existing MongoDB connection");
        return;
    }

    try {
       
       const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);

        isConnected = connectionInstance.connection.readyState === 1;
        
        console.log(`MongoDB connected! Host: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.error("MongoDB connection error: ", error);
        throw new Error("Failed to connect to the database"); 
    }
};




export default connectDB;