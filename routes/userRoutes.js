const express = require('express');
const router = express.Router();
const passport = require('passport');

const {
    getHome,
    getSignup,
    postSignup,
    getVerifyOTP,
    postVerifyOTP,
    getLoginPage,
    postLogin,
    resendOTP
} = require("../controllers/users/userController");
const faqsController = require('../controllers/users/faqsController');
const productContoller = require('../controllers/users/productController');
const profileController = require('../controllers/users/profileController');
const accountController = require('../controllers/users/accountController');
const addressController = require('../controllers/users/addressController');
const wishlistController = require('../controllers/users/wishlistController');
const cartController = require('../controllers/users/cartController');
const checkoutController = require('../controllers/users/checkoutController');
const ordersController = require('../controllers/users/ordersController');
const walletController = require('../controllers/users/walletController');
const paymentController = require('../controllers/users/paymentController');
const couponController = require('../controllers/users/couponController');

// Middlewares
const noCache = require('../middlewares/noCache');
const guestOnly = require('../middlewares/guestOnly');
const userAuth = require('../middlewares/userAuth');
const loadUserData = require('../middlewares/loadUserData');
router.use(loadUserData);
const cartnWishlistCount = require('../middlewares/cartnwishlistCount');
router.use(cartnWishlistCount);
const {uploadUserImage} = require('../middlewares/multer');

// Signup Management
router.get('/signup',guestOnly,noCache,getSignup)
router.post('/signup',noCache,postSignup)
router.get('/verify-otp',noCache,getVerifyOTP)
router.post('/verify-otp',noCache,postVerifyOTP)
router.post('/resend-otp',noCache,resendOTP)

// Login Management
router.get('/login',guestOnly,noCache,getLoginPage)
router.post('/login',noCache,postLogin)

// Profile Management
router.get('/forgot-password',profileController.getForgotpasswordPage);
router.post('/forgot-password',profileController.forgotEmailValid);
router.post('/verify-forgotPass-otp',profileController.verifyForgotPassOtp);
router.get('/reset-password',profileController.getResetPassword);
router.post('/resend-forgot-otp',profileController.resendForgotOtp);
router.post('/reset-password',profileController.postResetPassword);

// Google auth route
router.get('/auth/google',passport.authenticate('google',{scope:['profile','email']}))
router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/user/login'}),(req,res)=>{
    req.session.user = req.user;
    return res.redirect("/user/home")
})

// Home Page
router.get('/home',noCache,getHome)

// Shopping Page
router.get('/shop',productContoller.getShoppingPage);
router.get('/product-details/:id',productContoller.getProductDetails)

// FAQs Page
router.get('/FAQs',faqsController.getFaqsPage)

// Account Management
router.get('/user-account',userAuth,accountController.getUserAccount);
router.get('/edit-profile',accountController.getEditProfile)
router.post('/edit-profile',uploadUserImage.single('profileImage'),accountController.postEditProfile);
router.get('/verify-email', accountController.getVerifyEmail);
router.post('/verify-email',accountController.postVerifyEmail);
router.get('/email-resend-otp',accountController.emailResendOtp)
router.get('/change-password',accountController.getChangePassword);
router.post('/change-password',accountController.changePassword);
router.post('/logout',accountController.logout);

// Address Management
router.post('/add-address',userAuth,addressController.addAddress);
router.get('/delete-address/:index',userAuth,addressController.deleteAddress);
router.patch('/set-default-address/:id',userAuth,addressController.setDefaultAddress);
router.post('/edit-address/:id',userAuth,addressController.editAddress);

// Wishlist Management
router.get('/wishlist',userAuth,wishlistController.getWishlist);
router.post('/add-to-wishlist',userAuth,wishlistController.addToWishlist);
router.post('/remove-wishlist/:productId',userAuth,wishlistController.removeWishlistProduct);

// Cart Managment 
router.get('/cart',userAuth,cartController.getCartPage);
router.post('/add-to-cart',userAuth,cartController.addToCart);
router.post('/cart/update',userAuth,cartController.updateCartQuantity);
router.delete('/cart/remove',userAuth,cartController.removeFromCart);

// Checkout
router.get('/checkout',userAuth,checkoutController.getCheckoutPage);
router.post('/place-order-direct',userAuth,checkoutController.placeOrderDirect);
router.get('/order-success/:customId',userAuth,checkoutController.orderSuccess);
router.get('/order-failure',userAuth,checkoutController.orderFailure);

// Coupon
router.post('/apply-coupon',couponController.applyCoupon);
router.post('/remove-coupon',couponController.removeCoupon);

// Payment
router.post('/payment-option',userAuth,paymentController.loadPaymentOption);
router.post('/create-order',paymentController.createOrder);
router.post('/verify-payment',paymentController.verifyPayment);
router.post('/save-failed-order',paymentController.saveFailedOrder);
router.post('/retry-payment/:orderId', paymentController.retryPayment);
router.post('/retry-payment-verify', paymentController.retryPaymentVerify);

// Orders 
router.get('/orders',userAuth,ordersController.getOrdersList);
router.get('/order-details/:id',userAuth,ordersController.orderDetails);
router.post('/order-details/:customId/cancel-order',userAuth,ordersController.cancelFullOrder);
router.post('/order-details/:customId/cancel-item/:productId',userAuth,ordersController.cancelOneItem);
router.post('/order-details/:customId/return/:productId',userAuth,ordersController.returnOrderItem);
router.get('/order/:customId/invoice',userAuth,ordersController.downloadInvoice);

// Wallet
router.get('/wallet',userAuth,walletController.getWalletPage);


module.exports = router;