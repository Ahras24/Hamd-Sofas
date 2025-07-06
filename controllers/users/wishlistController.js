const Wishlist = require('../../models/wishlistModel');


const getWishlist = async (req,res)=>{
    try {

        const userId = req.session.user._id;

        const wishlist = await Wishlist.findOne({ userId }).populate('items.productId'); 

        const wishlistItems = wishlist ? wishlist.items.filter(item => item.productId && !item.productId.blocked ) : [];

        res.render('user/wishlist',{
            product: wishlist ? wishlist.items : [],
            wishlistItems,
            wishlistCount: wishlistItems.length
        });
        
    } catch (error) {
        console.error(`Error loading wishlist page : ${error}`);
        return res.status(500).json({ success:false, message: "Internal server error"});
    }
}

const addToWishlist = async (req,res)=>{
    try {
        
        const userId = req.session.user._id;
        const {productId} = req.body;

        if(!productId){
            return res.status(400).json({success:false,message: "Product ID is missing"})
        }

        let wishlist = await Wishlist.findOne({userId});

        if(!wishlist){
            wishlist = new Wishlist({
                userId,
                items: [{ productId }]
            });
        } else {
            const exists = wishlist.items.find(
                item => item.productId.toString() === productId
            );
            if(!exists){
                wishlist.items.push({ productId });
            }else {
               return res.status(500).json({ success: false, message: "This Product already in wishlist"});
            }
        }

        await wishlist.save();
        res.json({success: true, message: "Product added to wishlist "});
        

    } catch (error) {
        console.error(`Error while adding to wishlist : ${error}`);
        res.status(500).json({success:false, message: "Error adding to wishlist"});
    }
}

const removeWishlistProduct = async (req,res)=>{
    try {
        
        const userId = req.session.user._id;
        const productId = req.params.productId;

        await Wishlist.updateOne(
            {userId},
            {$pull: { items: {productId }}}
        );

        res.json({success:true, message: "Product removed from wishlist"});

    } catch (error) {
        console.error(`Error while removing wishlist product : ${error}`);
        res.status(500).json({success: false, message: "Internal server error"});
    }
}


module.exports = {
    getWishlist,
    addToWishlist,
    removeWishlistProduct
}

