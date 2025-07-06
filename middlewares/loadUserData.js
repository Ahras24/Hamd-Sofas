const User = require('../models/usersModel');


const loadUserData = async (req,res,next)=>{
    try {
        
        if(req.session.user){
            const freshUser = await User.findById(req.session.user._id);
            if(freshUser){
                res.locals.user = {
                    _id: freshUser._id,
                    username: freshUser.username,
                    email: freshUser.email,
                    profileImage : freshUser.profileImage
                }
            }
        }
        next();

    } catch (error) {
        console.error(`Error loading user data : ${error}`);
        next();
        
    }
}



module.exports = loadUserData;