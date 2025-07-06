const Cart = require('../../models/cartModel');
const Product = require('../../models/productModel');
const Category = require('../../models/categoryModel');
const Wishlist = require('../../models/wishlistModel');
const applyOfferToProduct = require('../../utils/applyOfferToProduct');

const MAX_QUANTITY_PER_PRODUCT = 5;

const addToCart = async (req,res,next)=>{
    try {
        
        const userId = req.session.user._id;
        const productId = req.body.productId;
        const quantity = parseInt(req.body.quantity) || 1;

      if (!productId) {
        const error = new Error("Product id is not availabe");
        error.statusCode = 404;
        next(error);
      }

      const product = await Product.findById(productId);
      if(!product || product.isBlocked){
        return res.status(403).json({error: 'This Product is blocked or unavailable.'});
      }

    if (product.stock <= 0) {
    console.error("out of stock")
      return res.status(400).json({ error: 'This product is out of stock.' });
    }

      const category = await Category.findById(product.category);
      if(!category || !category.isListed){
        return res.status(403).json({error: "This Product category is not listed."});
      }

       let cart = await Cart.findOne({userId});

        if(!cart){
            cart = new Cart({userId, items: [{productId,quantity}],
            });
        }else {
            const existingItem = cart.items.find(
            item => item.productId.toString() === productId );

            if(existingItem){
                const updatedQty = existingItem.quantity + quantity;
                if (updatedQty > MAX_QUANTITY_PER_PRODUCT) {
                return res.status(400).json({
                success: false,
                message: `You can only purchase up to ${MAX_QUANTITY_PER_PRODUCT} units of this product.`
                });
              }
                existingItem.quantity += quantity;
            }else {
                cart.items.push({productId,quantity});
            }
        }

        await cart.save();

        await Wishlist.updateOne(
            {userId},
            {$pull: {items: { productId }}}
        );

        return res.status(200).json({success:true});

    } catch (error) {
        console.error(`Error while adding to cart : ${error}`)
        res.status(500).json({success:false});
    }
}

const getCartPage = async (req,res,next)=>{
    try {

        const userId = req.session.user._id;
        const cart = await Cart.findOne({ userId })
          .populate({
             path: 'items.productId',
             populate: {
                path: 'category',
                model: 'Category'
            }
        });

        let subtotal = 0;
        let tax = 0;
        let orderTotal = 0;
        let offerDiscount = 0;

        let validItems = [];
        if(cart && cart.items.length > 0) {
            validItems = cart.items.filter(item => 
                item.productId && 
                !item.productId.isBlocked &&
                item.productId.category && 
                item.productId.category.isListed !==false
            );

            validItems.reverse();

            validItems = await Promise.all(validItems.map(async (item)=>{
                const offerProduct = await applyOfferToProduct(item.productId);
                const originalPrice = offerProduct.salePrice;
                const price = offerProduct.finalPrice || offerProduct.regularPrice;

                subtotal += originalPrice * item.quantity;
                offerDiscount += (originalPrice - price) * item.quantity;

                return {
                    ...item.toObject(),
                    productId: {
                        ...offerProduct,
                    },
                    finalPrice: price,
                    discount: offerProduct.appliedOfferDiscount || 0
                };
            }));

            const taxableAmount = subtotal - offerDiscount;
            tax = Math.round(taxableAmount * 0.10);
            orderTotal = (subtotal - offerDiscount) + tax ;
        }
    
        res.render('user/cart',{
            cartItems: validItems,
            subtotal,
            tax,
            orderTotal,
            offerDiscount: Math.round(offerDiscount)
        });
        
    } catch (error) {
        console.error(`Error whiling showing cart page : ${error}`)
        error.statusCode = 500;
        next(error);
    }
}

const updateCartQuantity = async (req,res)=>{
     try {
        
        const userId = req.session.user._id;
        const {productId,change} = req.body;

        const cart = await Cart.findOne({userId});
        if (!cart) return res.status(404).json({ success: false, message: 'Cart not found' });

        const item = cart.items.find(index => index.productId.toString() === productId);
        if (!item) return res.status(404).json({ success: false, message: 'Item not found in cart' });

        const product = await Product.findById(productId);

        const newQuantity = item.quantity += change;

        if(newQuantity > product.stock){
            return res.status(400).json({
                success: false,
                message: `Only ${product.stock} items left in the stock`
            })
        }

        if (newQuantity < 1) {
         cart.items = cart.items.filter(i => i.productId.toString() !== productId);
         await cart.save();
         return res.json({ success: true, removed: true });
        }else {
            item.quantity = newQuantity;
        }

        await cart.save();
        res.json({success:true, removed: false });

     } catch (error) {
        console.error(`Error updating cart : ${error}`);
        res.status(500).json({success: false,message: "Internal server error"});
     }
}

const removeFromCart = async (req,res)=>{
    try {
        
        const userId = req.session.user._id;
        const {productId} = req.body;

        await Cart.findOneAndUpdate({userId},{$pull:{items:{productId}}});

        res.json({message: 'Product removed'});

    } catch (error) {
        console.error(`Error while removing product from the cart : ${error}`);
        res.status(500).json({message: 'Internal Server error'});
    }
}




module.exports = {
    addToCart,
    getCartPage,
    updateCartQuantity,
    removeFromCart
}