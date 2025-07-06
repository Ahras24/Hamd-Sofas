const mongoose = require('mongoose');


const categoryOfferSchema = new mongoose.Schema({
    categoryId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Category"
    },
    discountPercentage: {
        type: Number,
        required: true
    },
    startDate: {
        type: Date,
        required: true
    },
    endDate: {
        type: Date,
        required: true
    }
}, {timestamps: true });


module.exports = mongoose.model("categoryOffer",categoryOfferSchema)