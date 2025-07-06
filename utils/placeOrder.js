const User = require('../models/usersModel');
const Cart = require('../models/cartModel');
const Product = require('../models/productModel');
const Orders = require('../models/ordersModel');
const Address = require('../models/addressModel');



const placeOrder = async (req, userId, selectedAddressId, paymentMethod) => {
    try {

    const addressDoc = await Address.findOne({ userId: userId });

    if (!addressDoc || !addressDoc.addresses || addressDoc.addresses.length === 0) {
      throw new Error("No address found for user");
    }

    const selectedAddress = addressDoc.addresses.find(
      addr => addr._id.toString() === selectedAddressId
    );
    if (!selectedAddress) {
      throw new Error("Selected address not found");
    }

    const cart = await Cart.findOne({ userId }).populate("items.productId");

    if (!cart || cart.items.length === 0) {
      throw new Error("Cart is empty");
    }

    let subtotal = 0;
    const items = [];

    for (let item of cart.items) {
      const product = item.productId;
      const price = product.finalPrice || product.salePrice;
      const quantity = item.quantity;

      if (product.stock < quantity) {
        throw new Error(`Insufficient stock for ${product.productName}`);
      }

      product.stock -= quantity;
      await product.save();

      subtotal += price * quantity;

      items.push({
        product: product._id,
        quantity,
        price,
        status:"pending"
      });
    } 

    const shippingCharge = subtotal > 999 ? 0 : 100;
    const tax = parseFloat((subtotal * 0.10).toFixed(2));

    // Handle coupon
    let discount = 0;
    let couponApplied = false;
    let couponCode = null;

    if(req.session.appliedCoupon) {
      const coupon = req.session.appliedCoupon;
      if(coupon.type === 'percentage'){
        discount = Math.round((subtotal * coupon.discount) / 100);
      }else {
        discount = coupon.discount || 0;
      }
        couponApplied = true;
        couponCode = coupon.code;

        req.session.appliedCoupon = null;
    }

    const grandTotal = subtotal + tax + shippingCharge - discount;

    const newOrder = new Orders({
      userId,
      items,
      subtotal,
      tax,
      shippingCharge,
      discount,
      grandTotal,
      address: selectedAddress,
      status: "pending",
      couponApplied,
      couponCode,
      paymentMethod,
    });

    await newOrder.save();

    await Cart.findOneAndDelete({ userId });

    return { success: true, customId: newOrder.customId };

   } catch(error){
    console.error(`placeOrder error : ${error}`);
    return { success: false, message: error.message };
   }
};


module.exports = placeOrder;
