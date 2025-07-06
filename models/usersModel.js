const mongoose = require('mongoose');
const addressModel = require('./addressModel')

const userSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true,
        trim:true
    },
    email:{
        type:String,
        required:true,
        unique:true,
        trim:true,
        lowercase:true
    },
    phone:{
        type:String,
        required:false,
        sparse:true,
        default:null
    },
    googleId:{
        type:String,
        unique:true
    },
    password:{
        type:String,
        required:false
    },
    isBlocked:{
        type:Boolean,
        default:false
    },
    profileImage:{
        type:String,
        default: '/public/images/profile-img.png'
    }
    
},{timestamps:true})




const User = mongoose.model('User',userSchema);
module.exports = User;