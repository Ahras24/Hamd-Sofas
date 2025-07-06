const Coupon = require('../../models/couponModel');



const getCouponList = async (req,res)=>{
    try {

        const success = req.session.success;
        const error = req.session.error;
        req.session.success = null;
        req.session.error = null;

       const page = parseInt(req.query.page) || 1;
       const limit = 5;
       const skip = (page-1) * limit;

        const totalCoupons = await Coupon.countDocuments();
        const totalPages = Math.ceil(totalCoupons/limit);

        const coupons = await Coupon.find()
          .skip(skip)
          .limit(limit)
          .sort({createdAt:-1});

        if(req.xhr){
          return res.render('admin/coupons',{
            coupons,
            currentPage:page,
            totalPages,
            layout: false,
            isAjax: true
          });
        }

        res.render('admin/coupons',{
            coupons,
            success,
            error,
            currentPage: page,
            totalPages,
            isAjax: false
        });
        
    } catch (error) {
        console.error(`error while loading admin coupon management page: ${error}`);
        return res.status(500).json("Internal server error");
    }
}

const addCoupon = async (req,res) => {
    try {

        const {couponName,couponCode,discountType,discountValue,minCartValue,expiry} = req.body;

        const existingCoupon = await Coupon.findOne({couponName});
        if(existingCoupon){
            return res.status(400).json("coupon already exists")
        }
        
        let coupon = new Coupon({
            couponName: couponName,
            couponCode,
            discountType,
            discountValue,
            minCartValue,
            expiry
        });

        await coupon.save();
        req.session.success = "Coupon added successfully!";
        res.redirect('/admin/coupons');
        
    } catch (error) {
        console.error(`error while adding new coupon, ${error}`);
        return res.status(500).json({ message: "Server error",error: error.message });
    }
}

const editCoupon = async (req,res)=>{
    
    try {

        const {id,couponName,couponCode,discountType,discountValue,minCartValue,expiry} = req.body;

        const updatedCoupon = await Coupon.findByIdAndUpdate(id,{
            couponName,
            couponCode,
            discountType,
            discountValue,
            minCartValue,
            expiry
        },{ new: true });

        if(!updatedCoupon){
            req.session.error = "Coupon does not exist!";
            res.redirect('/admin/coupons'); 
        }

        req.session.success = "Your Coupon Updated successfully!";
        res.redirect('/admin/coupons');

    } catch (error) {
        console.error(`error while editing coupon, ${error}`);
        return res.status(500).json("Internal server error");
    }
}

const deleteCoupon = async (req,res)=>{
    try {
        
        const couponId = req.params.id;

        const deleted = await Coupon.findByIdAndDelete(couponId);

        if(!deleted){
            return res.status(404).json({ message: "Coupon not found "});
        }

        return res.status(200).json({ message: "Coupon deleted successfully" });

    } catch (error) {
        console.error(`error while deleting coupon, ${error}`);
        return res.status(500).json({ message: "Internal server error"});
    }
}


module.exports = {
    getCouponList,
    addCoupon,
    editCoupon,
    deleteCoupon
}