const ProductOffer = require('../models/productOfferModel');
const CategoryOffer = require('../models/categoryOfferModel');
const Product = require('../models/productModel');


const applyOfferToProduct = async (product) =>{
    try {
        
        const today = new Date();
        let maxDiscount = 0;

        const productOffer = await ProductOffer.findOne({
            productId: product._id,
            startDate: { $lte: today },
            endDate: { $gte: today }
        });

        const categoryOffer = await CategoryOffer.findOne({
            categoryId: product.category._id,
            startDate: { $lte: today },
            endDate: { $gte: today }
        });

        if(productOffer) maxDiscount = productOffer.discountPercentage;
        
        if(categoryOffer && categoryOffer.discountPercentage > maxDiscount){
            maxDiscount = categoryOffer.discountPercentage;
        }

        const discountAmount = (product.salePrice * maxDiscount ) / 100;
        const finalPrice = Math.round(product.salePrice - discountAmount );

        await Product.findByIdAndUpdate(product._id, {
            finalPrice
        });

        return {
            ...product.toObject(),
            appliedOfferDiscount: maxDiscount,
            finalPrice,
        }

    } catch (error) {
        console.error(`Error while applying offer, ${error}`);
        await Product.findByIdAndUpdate(product._id,{
            finalPrice:product.salePrice
        })
        return {
            ...product.toObject(),
            appliedOfferDiscount: 0,
            finalPrice: product.salePrice
        }
    }
}


module.exports = applyOfferToProduct;