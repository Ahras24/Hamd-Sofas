const User = require('../../models/usersModel')
const Category = require('../../models/categoryModel');
const Product = require('../../models/productModel')
const nodemailer = require('nodemailer')
const env = require('dotenv').config()
const bcrypt = require('bcrypt')



const getHome = async (req,res)=>{
    try {
        res.render('user/home',{
            user:req.session.user 
        })

    } catch (error) {
        console.error(`Error while Loading home page : ${error}`)
        res.status(500).send("Server error")
    }
}

const getSignup = async (req, res) => {
    try {
        const errorMessage = req.session.errorMessage;
        const successMessage = req.session.successMessage;
        req.session.errorMessage = null;
        req.session.successMessage = null;
        res.render('user/signup',{errorMessage,successMessage});
    
    } catch (error) {
      console.error('Error while loading signup page', error);
      res.status(500).send("Internal Server Error");
    }
  };

function generateOtp(){
    return Math.floor(100000+Math.random()*900000).toString();
}

async function sendOtpToEmail(email,otp){
    try {
        const transporter = nodemailer.createTransport({
            service:'gmail',
            port:587,
            secure:false,
            requireTLS:true,
            auth:{
                user:process.env.NODEMAILER_EMAIL,
                pass:process.env.NODEMAILER_PASSWORD
            }
        })

        const mailOptions = {
            from: process.env.NODEMAILER_EMAIL,
            to: email,
            subject: "Verify your account",
            text: `Your OTP is : ${otp}. It will expire in 1 minute.`,
        };

        await transporter.sendMail(mailOptions);
        return true;

    } catch (error) {
        console.error("Error sending OTP to email",error);
        return false;
        
    }
}

const postSignup = async (req,res)=>{
    try {
        const {username,email,phone,password,confirmPassword} = req.body;

        if(!username || !email || !phone || !password ){
            req.session.errorMessage = "All fields are required";
            return res.redirect('/user/signup')
        }
        if(password !== confirmPassword){
            req.session.errorMessage = "Passwords do not match"
            return res.redirect('/user/signup')
        }

        const existingUser = await User.findOne({email});
        if(existingUser){
            req.session.errorMessage = "User with this email already exists";
            return res.redirect('/user/signup');  }

        const otp = generateOtp()

        const emailSent = await sendOtpToEmail(email,otp);
        if(!emailSent){
            req.session.errorMessage = "Failed to send OTP";
            return res.redirect('/user/signup');
        }

        req.session.userOTP = otp;
        req.session.userData = {username,email,phone,password}

        console.log("OTP send : ",otp)
        return res.redirect('verify-otp')
        

    } catch (error) {
        console.error(`Signup error`,error)
        return res.status(500).render('user/signup',{errorMessage:"Internal server error. Please try again later.",successMessage:null})
    }
}

const getVerifyOTP = async (req,res)=>{
    try {
        const errorMessage = req.session.errorMessage;
        const successMessage = req.session.successMessage;
        req.session.errorMessage = null;
        req.session.successMessage = null;

        res.render('user/verifyOTP', { errorMessage, successMessage });

    } catch (error) {
        console.error(`Error while loading OTP verification page ${error}`)
        res.status(500).send("Internal server error")   
    }
}

const hashedPassword = async (password)=>{
    try {
        const passwordHash = await bcrypt.hash(password,10)
        return passwordHash;
    } catch (error) {
        console.error(`Error while hashing password : ${error}`)
        return res.status(500).send("Internal server error")
        
    }
}

const postVerifyOTP = async (req, res) => {
    try {
      const { otp1, otp2, otp3, otp4, otp5, otp6 } = req.body;
  
      const enteredOTP = otp1 + otp2 + otp3 + otp4 + otp5 + otp6;
      const sessionOTP = req.session.userOTP;
      const userData = req.session.userData;
  
      if (!sessionOTP || !userData) {
        req.session.errorMessage = "Session expired. Please try signing up again.";
        return res.redirect('/user/signup');
      }
  
      if (enteredOTP !== sessionOTP) {
        req.session.errorMessage = "Invalid OTP. Please try again.";
        return res.redirect('/user/verify-otp');
      }
  
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      const newUser = new User({
        username: userData.username,
        email: userData.email,
        phone: userData.phone,
        password: hashedPassword,
      });
  
      await newUser.save();
  
      req.session.userOTP = null;
      req.session.userData = null;
  
      req.session.successMessage = "Signup successful. Please login.";
      return res.redirect('/user/login');
  
    } catch (error) {
      console.error("Error during OTP verification:", error);
      req.session.errorMessage = "Something went wrong. Please try again.";
      res.redirect('/user/verify-otp');
    }
  };

const resendOTP = async (req,res)=>{
    try {
        const userData = req.session.userData;

        if(!userData || !userData.email){
            req.session.errorMessage = "Session expired. Please sign up again.";
            return res.redirect('user/signup')
        }

        const newOTP = generateOtp();

        const emailSent = await sendOtpToEmail(userData.email,newOTP);

        if(!emailSent){
            req.session.errorMessage = "Failed to resend OTP.";
            return res.redirect('/user/verify-otp')
        }

        req.session.userOTP = newOTP;
        req.session.successMessage = "OTP resend successfully";
        console.log("resend otp :",newOTP);

        return res.redirect('/user/verify-otp')

    } catch (error) {
        console.error("Error resending OTP :",error);
        req.session.errorMessage = "Something went wrong. try again.";
        return res.redirect('/user/verify-otp')
        
    }

}

const getLoginPage = async (req,res)=>{
    try {
        const errorMessage = req.session.errorMessage;
        const successMessage = req.session.successMessage;
        
        req.session.errorMessage = null;
        req.session.successMessage = null;
        
        res.render('user/login', { errorMessage,successMessage });

    } catch (error) {
        console.error(`Error while loading login page ${error}`)
        res.status(500).send("Internal server error")
    }
}

const postLogin = async (req,res)=>{
    try {
        const {email,password} = req.body;

        if(!email || !password){
            return res.status(400).render('user/login',{errorMessage:"Please enter both email and password",successMessage:null})
        }

        const user = await User.findOne({email})

        if(!user){
            return res.status(401).render('user/login',{errorMessage:"User not found. Please signup",successMessage:null})
        }

        if(user.isBlocked){
            return res.status(401).render('user/login',{errorMessage:"User is blocked by admin",successMessage:null})
        }

        const isPasswordMatch = await bcrypt.compare(password,user.password)
        if(!isPasswordMatch){
            return res.status(401).render('user/login',{errorMessage:"Invalid Password",successMessage:null})
        }

        req.session.user = {
            _id:user._id,
            email:user.email,
            username:user.username
        }
        
        res.redirect('/user/home')

    } catch (error) {
        console.error(`error while login the user : ${error}`)
        res.status(500).render('user/login',{errorMessage:"Internal server error",successMessage:null})
        
    }
}


module.exports = {
    getHome,
    getSignup,
    postSignup,
    getVerifyOTP,
    postVerifyOTP,
    resendOTP,
    getLoginPage,
    postLogin
}

