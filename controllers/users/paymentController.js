const Cart = require('../../models/cartModel');
const Product = require('../../models/productModel');
const Orders = require('../../models/ordersModel');
const razorpay = require('../../config/razorpay');
const crypto = require('crypto');
const placeOrder = require('../../utils/placeOrder');
const Address = require('../../models/addressModel');



const loadPaymentOption = async (req,res,next)=>{
    try {
        
        const userId = req.session.user._id;
        const selectedAddressId = req.body.selectedAddressId;
        
        const cart = await Cart.findOne({userId}).populate('items.productId');
        if(!cart || cart.items.length===0 ) {
          const error = new Error("Cart is empty");
          error.statusCode = 404;
          next(error);
        }

        if(!selectedAddressId) {
          return res.status(404).json({success: false, message: "Select a address"});
        }

        const totalItems = cart.items.length;
        let subtotal = 0;

        cart.items.forEach(item => {
            const price = item.productId.finalPrice || item.productId.salePrice;
            const quantity = item.quantity;

            subtotal += price * quantity;
        })

        const tax = parseFloat((subtotal * 0.10).toFixed(2));
        const shippingCharge = subtotal > 999 ? 0 : 100;

        let discount = 0;
        if(req.session.appliedCoupon){
            const coupon = req.session.appliedCoupon;
            if(coupon.type === 'percentage'){
            discount = Math.round((subtotal * coupon.discount) / 100);
        } else {
            discount = coupon.discount;
        }
        }

        const grandTotal = subtotal + tax + shippingCharge - discount;

        req.session.lastOrderAmount = grandTotal;
        req.session.selectedAddressId = selectedAddressId;

        res.render('user/payment-option',{
            selectedAddressId,
            cartItems: cart.items,
            subtotal,
            discount,
            tax,
            shippingCharge,
            grandTotal,
            totalItems,
            RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID
        });

    } catch (error) {
        console.error(`Error while loading Payment option Page: ${error}`);
        error.statusCode = 500;
        next(error);
    }
}

const createOrder = async (req,res)=>{
    try {
        
        const {amount} = req.body;

        const options = {
            amount: Math.round(amount * 100),
            currency: "INR",
            receipt: `receipt_order_${Date.now()}`,
        };

        const order = await razorpay.orders.create(options);
        res.json({ success: true, order });
        
    } catch (error) {
        console.error("Error while creating Razorpay order:", error.response ? error.response.body : error.message || error);
        res.status(500).json({success: false });
    }
}

const verifyPayment = async (req,res)=> {
    try {
        
        const { razorpay_order_id, razorpay_payment_id, razorpay_signature} = req.body;
        const userId = req.session.user._id;
        const selectedAddressId = req.session.selectedAddressId;

        const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update( razorpay_order_id + "|" + razorpay_payment_id )
        .digest('hex');

        if(expectedSignature === razorpay_signature){
            const result = await placeOrder(req, userId, selectedAddressId, "razorpay", razorpay_order_id);

         if(result.success){
             return res.status(200).json({ success: true, customId: result.customId });
        }else {
             return res.status(400).json({ success: false, message: "Order failed" });
        }

      } else {
          return res.status(400).json({ success: false, message: "Invalid signature" });
        }

    } catch (error) {
        console.error(`error while verifying payment, ${error}`);
        res.status(500).json({ success: false, message: "Internal server error" });
    }
}

const saveFailedOrder = async (req,res) =>{
    try {
        
        const { razorpayOrderId, razorpayPaymentId, paymentStatus, paymentMethod, selectedAddressId } = req.body;
        const userId = req.session.user?._id;

       const userAddressDoc = await Address.findOne({ userId });
    if (!userAddressDoc) {
      return res.status(400).json({ success: false, message: 'User address document not found' });
    }

     const selectedAddress = userAddressDoc.addresses.id(selectedAddressId);

    if (!selectedAddress) {
      return res.status(400).json({ success: false, message: 'Selected address not found' });
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
        status:"failed"
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

        const failedOrder = new Orders({
            userId,
            items,
            subtotal,
            discount,
            tax,
            shippingCharge,
            grandTotal,
            address: selectedAddress,
            status: 'failed',
            paymentMethod,
            razorpayOrderId,
            razorpayPaymentId,
            paymentStatus
        });

        await failedOrder.save();
        
        res.status(200).json({success: true })

    } catch (error) {
        console.error(`Error saving failed order : ${error}`);
        res.status(500).json({success: false, message: "Failed to save failed order "})
    }
}

const retryPayment = async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const order = await Orders.findById(orderId);

    if (!order || order.status !== 'failed') {
      return res.status(400).json({ success: false, message: 'Invalid or non-failed order' });
    }

    const newRazorpayOrder = await razorpay.orders.create({
      amount: Math.round(order.grandTotal * 100),
      currency: "INR",
      receipt: `retry_order_${Date.now()}`
    });

    // Save new Razorpay order ID (overwrite)
    order.razorpayOrderId = newRazorpayOrder.id;
    order.paymentStatus = 'created';
    await order.save();

    res.json({ success: true, order: newRazorpayOrder });

  } catch (error) {
    console.error("Retry payment error:", error);
    res.status(500).json({ success: false, message: "Retry setup failed" });
  }
};


const retryPaymentVerify = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature, localOrderId } = req.body;
    const userId = req.session.user._id;

    const order = await Orders.findById(localOrderId);
    if (!order || order.status !== 'failed') {
      return res.status(400).json({ success: false, message: 'Invalid order for verification' });
    }

    const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest('hex');

    if (expectedSignature !== razorpay_signature) {
      return res.status(400).json({ success: false, message: 'Invalid signature' });
    }

    // Update the existing order
    order.razorpayPaymentId = razorpay_payment_id;
    order.paymentStatus = 'paid';
    order.status = 'pending';
    order.items.forEach(item => {
        item.status = 'pending';
    });

    await order.save();

    await Cart.findOneAndDelete({userId});

    res.status(200).json({ success: true, customId: order.customId });

  } catch (error) {
    console.error('Retry payment verification error:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
};

module.exports = {
    loadPaymentOption,
    createOrder,
    verifyPayment,
    saveFailedOrder,
    retryPayment,
    retryPaymentVerify
}