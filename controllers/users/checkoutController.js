const Address = require('../../models/addressModel');
const User = require('../../models/usersModel');
const product = require('../../models/productModel');
const Cart = require('../../models/cartModel');
const Orders = require('../../models/ordersModel');
const Coupons = require('../../models/couponModel');

const placeOrder = require('../../utils/placeOrder');

const applyOfferToProduct = require('../../utils/applyOfferToProduct');

const getCheckoutPage = async (req,res,next)=>{
    try {

        req.session.appliedCoupon = null;

        const userId = req.session.user;
        const userData = await User.findById(userId);
        
        const addressDoc = await Address.findOne({userId});
        const addresses = addressDoc ? addressDoc.addresses : [];
        
        const defaultSet = req.session.defaultSet;
        req.session.defaultSet = null; 

        const cart = await Cart.findOne({ userId }).populate("items.productId");
        if(!cart || cart.items.length===0 ) {
          const error = new Error("Cart not found or empty");
          error.statusCode = 404;
          return next(error);
        }
        
        const cartItems = cart ? cart.items : [];

          let totalItems = 0;
          let subtotal = 0;
          let tax = 0;

          const updatedCartItems = [];

          for(const item of cartItems){
            const product = item.productId;

            const updatedProduct = await applyOfferToProduct(product)

            item.productId = updatedProduct;

            const quantity = item.quantity;
            const finalPrice = updatedProduct.finalPrice || updatedProduct.salePrice;

            subtotal += finalPrice * quantity;
            
            updatedCartItems.push(item);
            totalItems += quantity;
          }
        
        const shippingCharge = subtotal > 999 ? 0 : 100;
        const discount = 0;
        tax += parseFloat((subtotal * 0.10).toFixed(2));
        const grandTotal = (subtotal + tax + shippingCharge) - discount;

        const today = new Date();
        const coupons = await Coupons.find({
          isActive: true,
          expiry: { $gte: today }
        });
        
        res.render('user/checkout',{
            addresses,
            defaultSet,
            cartItems: updatedCartItems,
            totalItems,
            subtotal,
            tax,
            shippingCharge,
            discount,
            grandTotal,
            coupons
        });

    } catch (error) {
        console.error(`Error while showing checkout page ${error}`);
        error.statusCode = 500;
        next(error);
    }
}

const placeOrderDirect = async (req,res,next)=>{
  try {

    const userId = req.session.user._id;
    const {selectedAddressId,paymentMethod} = req.body; 

    const result = await placeOrder(req,userId, selectedAddressId, paymentMethod);

    if(result.success){
     res.json({ success: true, customId: result.customId });
    } else {
     res.status(400).json({ success: false, message: result.message });
    }
    
  } catch (error) {
    console.error(`Error while placing COD/Wallet order : ${error}`);
    error.statusCode = 500;
    next(error);
  }
};

const orderSuccess = async (req,res,next)=>{
  try {

    const customId = req.params.customId;

    if (!customId) {
      error.statusCode = 500;
      next(error);
    }

    const order = await Orders.findOne({ customId }).populate("items.product");

    if (!order) {
      error.statusCode = 500;
      next(error);
    }

    res.render('user/order-success',{
      order,
      pageTitle: "Order Successful"
    });
    
  } catch (error) {
    console.error(`Error while loading order success Page : ${error}`);
    error.statusCode = 500;
    next(error);
  }
}

const orderFailure = async (req,res,next)=>{
  try {

    const userId = req.session.user._id;
    const order = await Orders.findOne({userId})
    
    res.render('user/order-failure',{
      pageTitle: "Order Failed",
      order
    });

  } catch (error) {
    console.error(`Error while loading order failure page, ${error}`);
    error.statusCode = 500;
    next(error);
  }
}


module.exports = {
    getCheckoutPage,
    placeOrderDirect,
    orderSuccess,
    orderFailure,
}