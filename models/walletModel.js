const mongoose = require('mongoose')


const walletTransactionSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: [ "credit", " debit"],
        required: true,
    },
    amount: {
        type: Number,
        required: true,
    },
    reason: {
        type: String,
        default: '',
    },
    date: {
        type: Date,
        default: Date.now,
    },
    orderId: {
        type: String,
    }
});

const walletSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true
    },
    balance: {
        type: Number,
        default: 0,
    },
    transactions: [ walletTransactionSchema ]
});




const Wallet = mongoose.model("Wallet",walletSchema);
module.exports = Wallet;