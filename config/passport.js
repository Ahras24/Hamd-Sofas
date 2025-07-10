const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const User = require('../models/usersModel');
const { getProductDetails } = require('../controllers/users/productController');
const env = require('dotenv').config();


passport.use(new GoogleStrategy({
    clientID:process.env.GOOGLE_CLIENT_ID,
    clientSecret:process.env.GOOGLE_CLIENT_SECRET,
    callbackURL:"https://hamdsofas.shop/auth/google/callback"
},

async (accessToken,refreshToken,profile,done)=>{
    try {

        const email = profile.emails[0].value;
        
        let user = await User.findOne({googleId:profile.id});

        if(!user) {
            user = await User.findOne({ email });

            if(user) {
                user.googleId = profile.id;
                await user.save();
            }
        }

        if(!user) {
             user = new User({
                username:profile.displayName,
                email:email,
                googleId:profile.id,
             });

            await user.save();
        }

        if(user.isBlocked){
            return done(null,false,{message: "Your account is Blocked by admin"});
        }

        return done(null,user);
        
    } catch (error) {
        return done(error,null)
    }
 }
));


passport.serializeUser((user,done)=>{
    done(null,user.id)
})

passport.deserializeUser(async (id,done)=>{
    const user = await User.findById(id);
    done(null,user);
})


module.exports = passport;