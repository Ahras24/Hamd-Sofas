const User = require('../../models/usersModel');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');
const env = require('dotenv').config();
const session = require('express-session');



function generateOtp(){
    const digits = '1234567890';
    let otp = '';
    for(let i=0; i<6; i++){
        otp+=digits[Math.floor(Math.random()*10)]
    }
    return otp;
}

const sendVerificationEmail = async (email,otp)=>{
    try {
        const transporter = nodemailer.createTransport({
            service:'gmail',
            port:587,
            secure:false,
            requireTLS:true,
            auth:{
                user:process.env.NODEMAILER_EMAIL,
                pass:process.env.NODEMAILER_PASSWORD,
            }
        })

        const mailOptions = {
            from:process.env.NODEMAILER_EMAIL,
            to:email,
            subject:'Your OTP for reset the password',
            text:`Your OTP is ${otp}`,
            html: `
            <div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f9f9f9;">
              <div style="max-width: 600px; margin: auto; background: white; padding: 20px; border-radius: 10px; box-shadow: 0px 0px 10px rgba(0,0,0,0.1);">
                <h2 style="text-align: center; color: #333;">Password Reset Request</h2>
                <p>Hello,</p>
                <p>We received a request to reset your password. Please use the OTP below to proceed:</p>
                <div style="text-align: center; margin: 20px 0;">
                  <span style="display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; font-size: 24px; border-radius: 5px;">
                    ${otp}
                  </span>
                </div>
                <p>Or click the button below to reset your password:</p>
                <div style="text-align: center; margin: 30px;">
                  <a href="http://user/reset-password" style="background-color: #4CAF50; color: white; padding: 12px 20px; text-decoration: none; font-size: 18px; border-radius: 5px;">
                    Reset Password
                  </a>
                </div>
                <p>If you didn't request this, you can safely ignore this email.</p>
                <p>Thanks,<br><strong>Hamd Sofas Team</strong></p>
              </div>
            </div>
          `
            };

        const info = await transporter.sendMail(mailOptions);
        console.log("Email sent:",info.messageId);
        return true;

    } catch (error) {
        console.error(`Error while sending email, ${error}`);
        return false;
    }
}

const securePassword = async (password)=>{
    try {
        const passwordHash = await bcrypt.hash(password,10);
        return passwordHash;

    } catch (error) {
        console.error("Error while hashing the password",error);
        throw error;
    }
}

const getForgotpasswordPage = async (req,res)=>{
    try {
        const errorMessage = req.session.errorMessage;
        const successMessage = req.session.successMessage;

        req.session.errorMessage = null;
        req.session.successMessage = null;

        res.render('user/forgot-password',{errorMessage,successMessage})

    } catch (error) {
        console.error("error while loading forgot password page",error);
        return res.status(500).send("Internal server error")
    }
}

const forgotEmailValid = async (req,res)=>{
    try {
        const {email} = req.body;
        const findUser = await User.findOne({email:email});
        if(findUser){
            const otp = generateOtp();
            const emailSent = await sendVerificationEmail(email,otp);
            if(emailSent){
                req.session.userOtp = otp;
                req.session.email = email;
                res.render('user/forgot-password-otp',{errorMessage:null,successMessage:null});
                console.log("OTP: ",otp);
            }else {
                res.render("user/forgot-password",{errorMessage:"Failed to send OTP. Please try again",successMessage : null})
            }
        }else {
            res.render('user/forgot-password',{errorMessage:"User with this email does not exist",successMessage : null})
        }
    } catch (error) {
        console.error(`error while loading OTP ${error}`);
        res.status(500).send("Internal server error")
        
    }
}

const verifyForgotPassOtp = async (req,res)=>{
    try {
        const errorMessage = req.session.errorMessage;
        const successMessage = req.session.successMessage;

        req.session.errorMessage = null;
        req.session.successMessage = null;

        const {otp1,otp2,otp3,otp4,otp5,otp6} = req.body;
        const enteredOTP = otp1 + otp2 + otp3 + otp4 + otp5 + otp6 ;

        if(enteredOTP === req.session.userOtp){
            res.redirect('/user/reset-password')
        }else{
            res.render('user/forgot-password-otp',{errorMessage:"OTP not matching",successMessage:null})
        }
    } catch (error) {
        console.error("Error while verifying forgot password OTP ",error);
        res.status(500).send("Internal server error")
    }
}

const getResetPassword = async (req,res)=>{
    try {
        const errorMessage = req.session.errorMessage;
        const successMessage = req.session.successMessage;

        req.session.errorMessage = null;
        req.session.successMessage = null;

        res.render('user/reset-password');
    } catch (error) {
        console.error("error while loading reset password page",error);
        res.status(500).send("Internal server error")
        
    }
}

const resendForgotOtp = async (req,res)=>{
    try {
        const otp = generateOtp();
        req.session.userOtp = otp;
        const email = req.session.email;
        console.log('Resending otp to email :',email);

        const emailSent = await sendVerificationEmail(email,otp);
      
        if(emailSent){
            console.log("resended otp : ",otp);
            return res.status(200).json({message:"OTP sent successfully"})
        }else {
            return res.status(500).json({messaage:"error while sending otp"});
        }
    } catch (error) {
        console.error("Error while resending OTP",error);
        res.status(500).json("Internal server error");
        
    }
}

const postResetPassword = async (req,res)=>{
    try {
        const {newPassword,confirmPassword} = req.body;
        const email = req.session.email;
        if(newPassword === confirmPassword){
            const hashedPassword = await securePassword(newPassword);
            await User.updateOne(
                {email:email},
                {$set:{password:hashedPassword}}
            );
            req.session.successMessage = "Password reset successfull. Please Login.";
            res.redirect('/user/login');
        }else {
            res.render('user/reset-password',{
                errorMessage:"Passwords does not match",
                successMessage:null
            })
        }
    } catch (error) {
        console.error('Error while reseting password',error);
        return res.status(500).send("internal server error")
        
    }
}



module.exports = {
    getForgotpasswordPage,
    forgotEmailValid,
    verifyForgotPassOtp,
    getResetPassword,
    resendForgotOtp,
    postResetPassword,
}