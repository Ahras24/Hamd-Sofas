const express = require('express');
const router = express.Router();
const cloudinary = require('cloudinary').v2;
const path = require('path')
const {upload} = require('../middlewares/multer')
const adminAuth = require('../middlewares/adminAuth')
const noCache = require('../middlewares/noCache')
const { getLogin,
        postLogin,
        logout,
} = require('../controllers/admin/adminController')

const dashboardController = require('../controllers/admin/dashboardController');
const customerController = require('../controllers/admin/customerController')
const categoryController = require('../controllers/admin/categoryController')
const productController = require('../controllers/admin/productController');
const ordersController = require('../controllers/admin/ordersController');
const couponController = require('../controllers/admin/couponController');
const offersController = require('../controllers/admin/offersController');
const salesReportController = require('../controllers/admin/salesReportController');

router.use(noCache);

// Routes Defining
router.get('/login',noCache,getLogin);
router.post('/login',noCache,postLogin);
router.get('/logout',logout)

// Dashboard
router.get('/dashboard',noCache,adminAuth,dashboardController.getDashboard);
router.post('/dashboard/filter',adminAuth,dashboardController.getFilteredSalesData);

// customer management
router.get('/customers',adminAuth,customerController.customerDetails)
router.post('/block-user', adminAuth, customerController.userBlocked);
router.post('/unblock-user', adminAuth, customerController.userUnBlocked);

// category management
router.get('/category',adminAuth,categoryController.categoryDetails)
router.post('/addCategory',upload.single('image'),adminAuth,categoryController.addCategory);
router.get('/category/edit/:id',categoryController.getEditCategory);
router.post('/category/edit/:id',upload.single('image'),categoryController.editCategory);
router.put("/category/toggle-list/:id", categoryController.toggleListStatus);

// product management
router.get('/products',adminAuth,productController.getAllProducts);
router.get('/addProducts',adminAuth,productController.getAddProductPage);
router.post('/addProducts',adminAuth,upload.array("productImages"),productController.addProducts);
router.patch('/products/toggle-block/:id',productController.toggleBlockStatus)
router.get('/editProduct',adminAuth,productController.getEditProduct);
router.post('/editProduct/:id',adminAuth,upload.array('productImages'),productController.editProduct);

// Order Management
router.get('/orders',ordersController.getAllOrders);
router.get('/orders/:customId',ordersController.getOrderDetails);
router.post('/orders/:customId/status',ordersController.updateOrderStatus);
router.post('/orders/:customId/return/:productId/approve',ordersController.approveReturn);
router.post('/orders/:customId/return/:productId/deny',ordersController.denyReturn);

// Coupon Management
router.get('/coupons',adminAuth,couponController.getCouponList);
router.post('/add-coupon',adminAuth,couponController.addCoupon);
router.post('/edit-coupon',adminAuth,couponController.editCoupon);
router.delete('/coupon/delete/:id',adminAuth,couponController.deleteCoupon);

// Offer Management
router.get('/offers',adminAuth,offersController.getOfferPage);
router.post('/offers/product-offer',adminAuth,offersController.createProductOffer);
router.post('/offers/category-offer',adminAuth,offersController.createCategoryOffer);
router.post('/offers/delete-product-offer/:id',offersController.deleteProductOffer);
router.post('/offers/delete-category-offer/:id',offersController.deleteCategoryOffer);

// Sales Report
router.get('/sales-report',adminAuth,salesReportController.getSalesReport);
router.post('/sales-report/filter',adminAuth,salesReportController.filterSalesReport);
router.get('/sales-report/download/pdf',adminAuth,salesReportController.downloadSalesReportPDF);
router.get('/sales-report/download/excel',adminAuth,salesReportController.downloadSalesReportExcel);



module.exports = router;