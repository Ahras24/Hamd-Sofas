const mongoose = require('mongoose');


const productOfferSchema = new mongoose.Schema({
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Product",
    },
    discountPercentage:{
        type: Number,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate:{
        type: Date,
        required: true
    }
}, {timestamps: true });


module.exports = mongoose.model("ProductOffer",productOfferSchema);