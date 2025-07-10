const mongoose = require("mongoose");


const connectDB = async()=>{
    try {
        const conn = await mongoose.connect(process.env.MONGO_URL,{
            dbName:'hamdSofas',
            maxConnecting:100,
            maxPoolSize:10, 
        });

        console.log(`MongoDB connected : ${process.env.MONGO_URL}`)
        
    } catch (error) {
        console.error(`MongoDB connection error : ${error.message}`)
        process.exit(1);
    }
};


module.exports = connectDB;