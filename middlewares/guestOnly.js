


const guestOnly = (req,res,next)=>{
    const user = req.session.user;
    if(req.session && user){
        return res.redirect('/user/home');
    }
    next();
}

module.exports = guestOnly;
 