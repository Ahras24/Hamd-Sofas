const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');
const Product = require('./productModel');


const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    items:[{
        product:{
            type:mongoose.Schema.Types.ObjectId,
            ref:"Product",
        },
        quantity:{
            type:Number,
            required:true
        },
        price:{
            type:Number,
            default:0
        },
        status:{
            type:String,
            default:"Pending"
        },
        cancelReason:{
            type:String
        },
        cancelledAt:{
            type:Date
        },
        returnStatus: {
            type: String,
            enum: ["none","return-requested","return-approved",'return-denied'],
            default: 'none'
        },
        returnReason:{
            type:String,
        },
        returnRequestedAt: { type: Date },
        returnApprovedAt: { type: Date },
        returnDeniedAt: { type: Date },
        returnDenyReason: { type: String, defualt:''}
    }],

    subtotal:{
        type:Number,
        required:true
    },
    discount:{
        type:Number,
        default:0
    },
    tax: {
        type:Number,
        default:0
    },
    shippingCharge: {
        type: Number,
        default:0
    },
    grandTotal:{
        type:Number,
        required:true
    },
    address:{
        type:Object,
        required:true
    },
    invoiceDate:{
        type:Date,
        default:Date.now()
    },
    status:{
        type:String,
        required:true,
        enum:["pending","failed","shipped","out-for-delivery","delivered","cancelled","return-requested","returned"]
    },
    couponApplied:{
        type:Boolean,
        default:false
    },
    couponCode: {
        type: String,
        default: null
    },
    customId: {
        type: String,
        unique: true
    },
    cancelReason: {
        type: String,
    },
    cancelledAt: {
        type: Date
    },
    paymentMethod: {
        type: String,
        enum: ['razorpay','cod','wallet'],
        required: true
    },
    grandTotal: {
        type: Number
    },
    razorpayOrderId: {
        type: String,
        default:null
    },
    razorpayPaymentId: {
        type: String,
        default: null
    },
    paymentStatus: {
        type: String,
        enum: ['created','failed','paid'],
        default: 'created'
    }
    
}, { timestamps: true });



orderSchema.pre('save', function (next) {
  if (!this.customId) {
    this.customId = 'HMD-ORD-' + uuidv4().slice(0, 8).toUpperCase();
  }
  next();
});


const Order = mongoose.model("Order",orderSchema);
module.exports = Order;