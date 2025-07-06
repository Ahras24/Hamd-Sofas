const mongoose = require('mongoose');


const couponSchema = new mongoose.Schema({
    couponName:{
        type:String,
        required:true,
        unique: true,
        trim: true
    },
    couponCode: {
        type: String,
        required: true,
        unique: true
    },
    discountType: {
        type: String,
        enum: ["percentage","flat"],
        required: true
    },
    discountValue: {
        type: Number,
        required: true
    },
    minCartValue: {
        type: Number,
        default: 0
    },
    expiry:{
        type:Date,
        required:true
    },
    isActive:{
        type:Boolean,
        default:true
    },
    maxUsagePerUser: {
        type: Number,
        default: 1
    },
    createdAt:{
        type:Date,
        default:Date.now,
    },
}, { timestamps: true });


const Coupon = mongoose.model("Coupon",couponSchema);
module.exports = Coupon;