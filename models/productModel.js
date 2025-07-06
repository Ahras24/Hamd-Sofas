const mongoose = require('mongoose')


const productSchema = new mongoose.Schema({
    productName:{
        type:String,
        trim:true,
        required:true
    },
    description:{
        type:String,
        trim:true,
        required:true
    },
    category:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"Category",
        required:true
    },
    regularPrice:{
        type:Number,
        required:true,
        min:0
    },
    salePrice:{
        type:Number,
        required:true
    },
    finalPrice:{
        type:Number
    },
    stock:{
        type:Number,
        default:true,
        trim:true,
    },
    productImage:[{
        type:String,
    }],
    status:{
        type:String,
        default: 'Available',
        required:true
    },
    isBlocked: { 
        type: Boolean,
        default: false 
    }

},{timestamps:true});


const Product = mongoose.model("Product",productSchema);
module.exports = Product;