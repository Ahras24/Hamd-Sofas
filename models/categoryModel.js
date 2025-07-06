const mongoose = require('mongoose');


const categorySchema = new mongoose.Schema({
    name:{
        type:String,
        required:true,
        trim:true,
        unique:true
    },
    image:{
        type:String
    },
    imageUrl:{
        type:String,
        required:true
    },
    publicId:{
        type:String,
        required:true
    },
    isListed:{
        type:Boolean,
        default:true
    },
    createdAt:{
        type:Date,
        default:Date.now
    }

})


const Category = mongoose.model('Category',categorySchema);
module.exports = Category;