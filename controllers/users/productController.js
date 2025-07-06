const Product = require('../../models/productModel');
const Category = require('../../models/categoryModel');
const User = require('../../models/usersModel');
const mongoose = require('mongoose');
const applyOfferToProduct = require('../../utils/applyOfferToProduct');

const ITEMS_PER_PAGE = 9;

const getShoppingPage = async (req, res) => {
  try {
    
    const page = parseInt(req.query.page) || 1;
    const search = req.query.search?.trim() || '';
    const sortPrice = req.query.sortPrice?.trim() || '';
    const sortName = req.query.sortName?.trim() || '';
    const category = req.query.category?.trim() || '';
    const minPrice = parseInt(req.query.minPrice) || 0;
    const maxPrice = parseInt(req.query.maxPrice) || 1000000;

    const listedCategories = await Category.find({isListed:true}).select('_id');
    const listedCategoriesId = listedCategories.map(cat => cat._id.toString());

    let filter = {
      isBlocked: false,
      category: {$in: listedCategoriesId},
      productName: { $regex: search, $options: 'i' },
      salePrice: { $gte: minPrice, $lte: maxPrice },
    };

    if(category && listedCategoriesId.includes(category.trim())){
      filter.category = category.trim();
    }

    if (category && mongoose.Types.ObjectId.isValid(category)) {
      filter.category = new mongoose.Types.ObjectId(category);
    } else {
      filter.category = { $in: listedCategoriesId };
    }

    let sortOption = {};
    if (sortPrice === 'priceLowHigh') sortOption.salePrice = 1;
    else if (sortPrice === 'priceHighLow') sortOption.salePrice = -1;
    
    const nameSort = sortName?.toLowerCase();
    if (nameSort === 'az') sortOption.productName = 1;
    else if (nameSort === 'za') sortOption.productName = -1;

    if(Object.keys(sortOption).length ===0){
      sortOption.createdAt = -1;
    }

    const totalProducts = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalProducts / ITEMS_PER_PAGE);

    const rawProducts = await Product.find(filter)
      .sort(sortOption)
      .skip((page - 1) * ITEMS_PER_PAGE)
      .limit(ITEMS_PER_PAGE)
      .populate("category");

    const products = await Promise.all(rawProducts.map(applyOfferToProduct));

    const categories = await Category.find({isListed:true}).sort({createdAt:-1});

    res.render('user/shop', {
      products,
      categories,
      currentPage: page,
      totalPages,
      search,
      sortPrice,
      sortName,
      selectedCategory: category,
      minPrice,
      maxPrice,
    });

  } catch (error) {
    console.error('Error loading Shop page:', error);
    res.status(500).json('Internal server error');
  }
};

const getProductDetails = async (req,res)=>{
  try {
    const productId = req.params.id;

    const rawProduct = await Product.findById(productId).populate('category')

    if(rawProduct.isBlocked){
      return res.redirect("/user/shop")
    }

    const product = await applyOfferToProduct(rawProduct);

    const relatedProducts = await Product.find({
      category  : product.category._id,
      _id:{$ne: product._id},
    })

    res.render('user/product-details',{
      product,
      relatedProducts
    })

  } catch (error) {
    console.error(`Error while loading single product details page: ${error}`);
    res.status(500).json("Internal server error")
  }
}


module.exports = { 
  getShoppingPage,
  getProductDetails
 };

