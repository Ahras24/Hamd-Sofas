const Coupon = require('../../models/couponModel');
const Cart = require('../../models/cartModel');



const applyCoupon = async (req,res)=>{
    try {
        
        const userId = req.session.user._id;
        const { couponCode } = req.body;

        const coupon = await Coupon.findOne({ couponCode });

        if(!coupon){
            return res.json({success: false, message: "Invaid coupon code."});
        }

        if(new Date(coupon.expiry) < new Date()) {
            return res.json({success: false, message: "Coupon has expired"});
        }

        const cart = await Cart.findOne({userId}).populate('items.productId');

        const cartTotal = cart.items.reduce((acc,item) => {
            const price = item.productId?.finalPrice || item.productId?.salePrice || 0;
            return acc + price * item.quantity;
        },0);

        if(cartTotal < coupon.minCartValue) {
            return res.json({success:false,message:`Cart must be atleast ₹${coupon.minCartValue} to use this coupon.`});
        }

        let discountAmount = 0;
        if(coupon.discountType === 'percentage'){
            discountAmount = Math.round((cartTotal * coupon.discountValue) / 100);
        } else {
            discountAmount = coupon.discountValue;
        }

        const tax = Math.round(cartTotal * 0.10);
        const newGrandTotal = cartTotal + tax - discountAmount; 
  
        req.session.appliedCoupon = {
            code: coupon.couponCode,
            type: coupon.discountType,
            discount: coupon.discountValue,
        }

        return res.json({
            success: true,
            message: "Coupon applied successfully!",
            discountAmount,
            newGrandTotal
        });

    } catch (error) {
        console.error(`error while applying coupon, ${error}`);
        return res.status(500).json({success: false, message: "Internal server error"});
    }
}

const removeCoupon = async (req,res)=>{
    try {
        
        req.session.appliedCoupon = null;

        const userId = req.session.user._id;
        const cart = await Cart.findOne({ userId }).populate('items.productId');

        let subtotal =0;
        cart.items.forEach(item => {
            const price = item.productId.finalPrice || item.productId.salePrice;
            subtotal += price * item.quantity;
        });

        const tax = parseFloat((subtotal * 0.10));
        const shippingCharge = subtotal > 999 ? 0 : 100;
        const grandTotal = subtotal + tax + shippingCharge;

        res.json({ success: true, message: "Coupon removed successfully", grandTotal });

    } catch (error) {
        console.error(`error while removing coupon, ${error}`);
        res.status(500).json({ success: false, message: "Failed to remove coupon." });
    }
}




module.exports = {
    applyCoupon,
    removeCoupon
}