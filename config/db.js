const mongoose = require("mongoose");
const env = require('dotenv').config();

const connectDB = async()=>{
    try {
        const conn = await mongoose.connect(process.env.MONGO_URL);
        console.log(`MongoDB connected : ${process.env.MONGO_URL}`)
        
    } catch (error) {
        console.error(`MongoDB connection error : ${error.message}`)
        process.exit(1);
    }
};


module.exports = connectDB;