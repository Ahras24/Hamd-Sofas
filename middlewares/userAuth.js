const User = require('../models/usersModel')


const userAuth = async (req,res,next)=>{
    try {
        
        if(req.session && req.session.user ){
            const user = await User.findById(req.session.user._id);

            if(user){
                if(user.isBlocked){
                    req.session.user = null;
                    return res.render('user/login',{
                          errorMessage: "User Blocked by admin",
                          successMessage: null
                    });
                }
 
                return next();
            }
        }
        return res.redirect('/user/login');

    } catch (error) {
       console.error(`error in userAuth middleware, ${error}`);
       return res.status(500).send("Internal server error");
    }
}

module.exports = userAuth;

