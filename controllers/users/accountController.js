const User = require('../../models/usersModel');
const Address = require('../../models/addressModel')
const {sendOTPToEmail, verifyOTP} = require('../../utils/sendOTP')
const bcrypt = require('bcrypt');



const getUserAccount = async (req,res,next)=>{
    try {
        
        const userId = req.session.user;
        const userData = await User.findById(userId);

        const addressDoc = await Address.findOne({userId: userId._id });
        const addresses = addressDoc ? addressDoc.addresses : [];

        const defaultSet = req.session.defaultSet;
        req.session.defaultSet = null; 
        
        res.render('user/user-account',{
            user:userData,
            success: req.flash('success'),
            error: req.flash('error'),
            otpSuccess: req.flash('otpSuccess'),
            addresses,
            defaultSet
        })

    } catch (error) {
        console.error(`Error while loading User Account Page ${error}`);
        error.statusCode = 500;
        next(error);
    }
}

const getEditProfile = async (req,res,next)=>{
    try {
        const userId = req.session.user;
        const userData = await User.findById(userId);

        res.render('user/edit-profile',{
            user:userData,
            error: req.flash('error'),
            success: req.flash('success'),
            emailExistsError: req.flash('emailExistsError')
        })
        
    } catch (error) {
        console.error(`Error while loading Edit profile Page : ${error}`);
        error.statusCode = 500;
        next(error);
        
    }
}

const postEditProfile = async (req,res,next)=>{
    try {

        const user = req.session.user;
        const userId = await User.findById(user);

        if(!userId){
            req.flash('error','User not found.');
            return res.redirect('/user/edit-profile')
        }

        const {username,phone,email} = req.body;

        const isEmailChanged = email !== userId.email;

        userId.username = username;
        userId.phone = phone;

        if(req.file && req.file.path){
            userId.profileImage = req.file.path;
        }

        if(isEmailChanged){
            const existingEmail = await User.findOne({
                email: email,
                _id:{ $ne: userId._id }
            });

            if(existingEmail){
                req.flash('emailExistsError','Email already Exists. Please try by another email');
                return res.redirect('/user/edit-profile');
            }

            req.session.tempEmail = email;
            req.session.emailChangeUserId = userId;

            try {
               await sendOTPToEmail(email);
               req.flash('success','OTP Sent successfuly to your new email');
               return res.redirect('/user/verify-email');
                
            } catch (otpError) {
                console.error(`OTP Sending Failed : ${otpError}}`);
                req.flash('error','Failed to send OTP. please try again');
                return res.redirect('/user/edit-profile') 
            }
        }

        await userId.save();
        req.session.user = {
           _id: userId._id,
           username: userId.username,
           email: userId.email,
           profileImage:userId.profileImage
        };
        req.flash('success', 'Profile updated successfully');
        res.redirect('/user/user-account');

    } catch (error) {
        console.error(`Error while updating user details: ${error}`);
        error.statusCode = 500;
        next(error);
    }
}

const getVerifyEmail = async (req,res,next)=>{
    try {

        if (!req.session.tempEmail || !req.session.emailChangeUserId) {
            req.flash('error', 'No email verification in progress');
            return res.redirect('/user/edit-profile');
        }
        
        res.render('user/verify-email',{
            success: req.flash('success'),
            error: req.flash('error'),
            otpError: req.flash('otpError'),
            tempEmail: req.session.tempEmail
        });

    } catch (error) {
        console.error(`Error while loading verify email page`);
        error.statusCode = 500;
        next(error);
    }
}

const postVerifyEmail = async (req,res,next)=>{
    try {
        
        const {otp} = req.body;
        const tempEmail = req.session.tempEmail;
        const userId = req.session.emailChangeUserId;

        if(!otp){
            req.flash('otpError','Please enter the OTP.');
            return res.redirect('/user/verify-email');
        }

        if(!tempEmail || !userId){
            req.flash('error','Invalid session. Please try again')
            return res.redirect('/user/edit-profile');
        }

        const isValid = verifyOTP(tempEmail,otp);

        if(!isValid){
            req.flash('otpError','Incorrect OTP. Please try again')
            return res.redirect('/user/verify-email');
        }

        await User.findByIdAndUpdate(userId,{email:tempEmail},{new:true});

        delete req.session.tempEmail;
        delete req.session.emailChangeUserId;

        req.flash('otpSuccess','OTP Verified Successfully and your email is updated')
        return res.redirect('/user/user-account');

    } catch (error) {
        console.error(`Error while verifying the email : ${error}`);
        error.statusCode = 500;
        next(error);  
    }
}

const emailResendOtp = async (req,res)=>{
    try {
        
        const email = req.session.tempEmail;

        if(!email){
            req.flash('error','No email verification in progress');
            return res.redirect('/user/edit-profile');
        }

        await sendOTPToEmail(email);
        req.flash('success','OTP Resend successfully');
        res.redirect('/user/verify-email');

    } catch (error) {
        console.error(`Error while resending OTP : ${error}`);
        req.flash('error','Failed to resend OTP');
        res.redirect('/user/verify-email');
    }
}

const getChangePassword = async (req,res,next)=>{
    try {

        res.render('user/change-password',{
            error: req.flash('error'),
            success : req.flash('success'),
            oldPassError: req.flash('oldPassError')
        })
        
    } catch (error) {
        console.error(`Error while loading Change password page ${error}`);
        error.statusCode = 500;
        next(error);
        
    }
}

const changePassword = async (req,res)=>{
    try {
        
        const userSession = req.session.user;


        const user = await User.findById(userSession._id);

        if(!user){
            req.flash('error','User not found');
            return res.redirect('/user/change-password');
        }

        const {oldPassword,newPassword,confirmPassword} = req.body;

        const isMatch = await bcrypt.compare(oldPassword,user.password);
        if(!isMatch){
            req.flash('oldPassError','Old password is incorrect.');
            return res.redirect('/user/change-password');
        }

        const hashedPassword = await bcrypt.hash(newPassword,10);
        user.password = hashedPassword;
        
        await user.save();

        req.flash('success','Password updated successfully');
        res.redirect('/user/user-account');

    } catch (error) {
        console.error(`Error while changing the password : ${error}`);
        req.flash('error','Something went wrong.');
        res.redirect('/user/change-password')
        
    }
}

const logout = async (req,res)=>{
    try {
        req.session.user = null;
        return res.redirect('/user/login')
        
    } catch (error) {
        console.error(`Error while logout , ${error}`);
        return res.redirect('/user/home');
    }
}


module.exports = {
    getUserAccount,
    getEditProfile,
    postEditProfile,
    getVerifyEmail,
    postVerifyEmail,
    emailResendOtp,
    getChangePassword,
    changePassword,
    logout
};