const Cart = require('../models/cartModel');
const Wishlist = require('../models/wishlistModel');


const cartnWishlistCount = async (req,res,next) => {
    try {

    const user = req.session.user;
    const userId = user ? user._id : null;

    res.locals.cartCount = 0;
    res.locals.wishlistCount = 0;

    if(userId){
        const cart = await Cart.findOne({ userId })
        res.locals.cartCount = cart?.items.length || 0;

        const wishlist = await Wishlist.findOne({ userId })
        res.locals.wishlistCount = wishlist?.items.length || 0;
    } 
    
    next();
   
    } catch (error) {
        console.error(`error while loading cart and wishlist count, ${error}`);
        next();
    }
}


module.exports = cartnWishlistCount;