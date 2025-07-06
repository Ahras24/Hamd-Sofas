const Product = require('../../models/productModel');
const Category = require('../../models/categoryModel');
const ProductOffer = require('../../models/productOfferModel');
const CategoryOffer = require('../../models/categoryOfferModel');


const getOfferPage = async (req,res)=>{
    try {

        const products = await Product.find();
        const categories = await Category.find();
        const productOffer = await ProductOffer.find().populate('productId').sort({createdAt:-1});
        const categoryOffer = await CategoryOffer.find().populate('categoryId').sort({createdAt:-1});

        const message = req.session.message;
        req.session.message = null;
        
        res.render('admin/offers',{
            products,
            categories,
            productOffer,
            categoryOffer,
            message: message ? JSON.stringify(message) : null
        });

    } catch (error) {
        console.error(`Error while loading offer page, ${error}`);
        return res.status(500).json("Internal server error");
    }
}

const createProductOffer = async (req,res)=>{
    try {

        const {productId,discountPercentage,startDate,endDate} = req.body;

        const existingOffer = await ProductOffer.findOne({
            productId,
            $or: [{ 
                startDate: {$lte: endDate },
                endDate: {$gte: startDate }
            }]
        });

        if(existingOffer){
            req.session.message = { success:false, text:"This product already has an active offer in the selected period!"};
            return res.redirect('/admin/offers');
        }

        await ProductOffer.create({
            productId,
            discountPercentage,
            startDate,
            endDate
        });

        req.session.message = { success:true, text:"Offer added to the Product successfully!"};
        return res.redirect('/admin/offers');
        
    } catch (error) {
        console.error(`Error while createing product offer: ${error}`);
        req.session.message = { success:false,text:"Error while creating Product offer!"};
        return res.redirect('/admin/offers');
    }
}

const createCategoryOffer = async (req,res)=>{
    try {
        
        const {categoryId,discountPercentage,startDate,endDate} = req.body;

        const existingOffer = await CategoryOffer.findOne({
            categoryId,
            $or: [{ 
                startDate: {$lte: endDate },
                endDate: {$gte: startDate }
            }]
        });

        if(existingOffer){
            req.session.message = { success:false, text:"This Category already has an active offer in the selected period!"};
            return res.redirect('/admin/offers');
        }

        await CategoryOffer.create({
            categoryId,
            discountPercentage,
            startDate,
            endDate
        });

         req.session.message = { success:true, text:"Offer added to the Category successfully!"};
         return res.redirect('/admin/offers');

    } catch (error) {
        console.error(`Error while creating category offer, ${error}`);
        req.session.message = { success:false, text:"Error while creating category offer!"};
        return res.redirect('/admin/offers');
    }
}

const deleteProductOffer = async (req,res)=>{
    try {
        
        const id = req.params.id;

        await ProductOffer.findByIdAndDelete(id);

        req.session.message = {success:true,text:"Product offer deleted successfully"};
        return res.redirect('/admin/offers');

    } catch (error) {
        console.error(`error while deleting product offer, ${error}`);
        req.session.message = { success:false, text:"Error while deleting Product offer!"};
        return res.redirect('/admin/offers');
    }
}

const deleteCategoryOffer = async (req,res)=>{
    try {
        
        const id = req.params.id;
    
        await CategoryOffer.findByIdAndDelete(id);

        req.session.message = {success:true,text:"Category offer deleted successfully"};
        return res.redirect('/admin/offers');

    } catch (error) {
        console.error(`Error while deleting category offer, ${error}`);
        req.session.message = {success:false,text:"Error while deleting category offer!"};
        return res.redirect('/admin/offers');
    }
}


module.exports = {
    getOfferPage,
    createProductOffer,
    createCategoryOffer,
    deleteProductOffer,
    deleteCategoryOffer
}