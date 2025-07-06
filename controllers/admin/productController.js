const Product = require('../../models/productModel')
const Category = require('../../models/categoryModel');
const User = require('../../models/usersModel') 
const path = require('path');
const fs = require('fs')
const sharp = require('sharp');
const cloudinary = require('../../config/cloudinary')



const getAllProducts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const perPage = 5; 
    const search = req.query.search || '';

    const query = {};
    if (search) {
      query.productName = { $regex: search, $options: 'i' };
    }

    const totalProducts = await Product.countDocuments(query);
    const totalPages = Math.ceil(totalProducts / perPage);

    const products = await Product.find(query)
      .populate('category')
      .sort({createdAt: -1})
      .skip((page - 1) * perPage)
      .limit(perPage);

    let categories;
    try {
      categories = await Category.find();
    } catch (categoryError) {
      console.error('Error fetching categories:', categoryError);
      categories = [];
    }

    res.render('admin/products', {
      products,
      categories, 
      page,
      perPage,
      totalPages,
      search,
      totalProducts
    });

  } catch (error) {
    console.error('Error while Fetching Products:', error);
    res.redirect('/admin/addProducts?error=' + encodeURIComponent('Failed to load products'));
  }
};

const getAddProductPage = async (req,res)=>{
  try {
    const categories = await Category.find({isListed:true});
    res.render('admin/product-add',{
      categories
    });

  } catch (error) {
    console.error("Error fetching Add Product Page : ", error);
    res.render('admin/addProduct', { error_msg: "Error While Fetching Add Product page" });
 }
}

const addProducts = async (req, res) => {
  try {
    const { productName, description, regularPrice, salePrice, stock, category, status } = req.body;

    if (!productName || !description || !regularPrice || !salePrice || !stock || !category || !status) {
      return res.redirect('/admin/addProducts?error=' + encodeURIComponent('All required fields must be provided'));
    }

    const productExists = await Product.findOne({ productName });
    if (productExists) {
      return res.redirect('/admin/addProducts?error=' + encodeURIComponent('Product already exists. Please provide another product'));
    }

    const categoryId = await Category.findOne({ name: category });
    if (!categoryId) {
      return res.redirect('/admin/addProducts?error=' + encodeURIComponent('Invalid category name'));
    }

    if (!req.files || req.files.length !== 4) {
      return res.redirect('/admin/addProducts?error=' + encodeURIComponent('Please upload exactly 4 images'));
    }

    const images = [];
    for (const file of req.files) {
      const uploadResponse = await cloudinary.uploader.upload(file.path, {
        folder: 'hamd_sofas/products',
        public_id: `product-${Date.now()}-${Math.floor(Math.random() * 1000)}`
      });
      images.push(uploadResponse.secure_url);
    }

    const newProduct = new Product({
      productName,
      description,
      category: categoryId._id,
      regularPrice: parseFloat(regularPrice),
      salePrice: parseFloat(salePrice),
      stock: parseInt(stock),
      productImage: images,
      status: status === 'Out of Stock' ? 'Out of Stock' : 'Available',
      createdOn: new Date()
    });

    await newProduct.save();

    res.redirect('/admin/products?success=' + encodeURIComponent('Product added successfully'));
    
  } catch (error) {
    console.error('Error saving product:', error);
    res.redirect('/admin/addProducts?error=' + encodeURIComponent('Failed to add product'));
  }
};

const toggleBlockStatus = async (req,res)=>{
  try {
    const {id} = req.params;
    const block = req.query.block === 'true';

    const product = await Product.findByIdAndUpdate(id, { isBlocked: block });

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    res.status(200).json({ status: block ? 'Blocked' : 'Active' });

  } catch (error) {
    console.error("Error while Toggling block",error);
    res.status(500).json({ message: 'Something went wrong' });
    
  }
}

const getEditProduct = async (req,res)=>{
  try {
    const id = req.query.id;
    const product = await Product.findOne({_id:id});
    const category = await Category.find({});
    res.render('admin/product-edit',{
      product,
      categories:category
    })

  } catch (error) {
    console.error(`Error while loading edit product page, ${error}`);
    res.status(500).json({message:"Something went wrong"})
    
  }
}

const editProduct = async (req,res)=>{
  try {
    const id= req.params.id;
    const data = req.body;

    const existingProduct = await Product.findOne({
      productName:data.productName,
      _id:{$ne:id}
    })

    if(existingProduct){
      return res.status(400).json({message:"Product with this name already exist. Please try with another name"});
    }

    const updateFields = {
      productName:data.productName,
      description:data.description,
      regularPrice:data.regularPrice,
      salePrice:data.salePrice,
      category:data.category,
      stock:data.stock,
    }

    let existingImages = data.existingImages || [];

    if(typeof existingImages === 'string'){
      existingImages = [existingImages];
    }

    const oldProduct = await Product.findById(id);

    const newImages = req.files?.map(file => file.path) || [];

    const finalImages = [];

    
   for (let i = 0; i < 4; i++) {
      if (newImages[i]) {
        // If a new image is present at index i, delete old image file if it exists
        if (existingImages[i]) {
          const oldPath = path.join(__dirname, '..', existingImages[i]);
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        }
        finalImages[i] = newImages[i];
      } else if (existingImages[i]) {
        finalImages[i] = existingImages[i]; // Keep the existing one
      }
    }

    // Only update productImage if finalImages is not empty
    if (finalImages.length > 0) {
      updateFields.productImage = finalImages;
    }

    await Product.findByIdAndUpdate(id,updateFields,{new:true});

    return res.status(200).json({success:true,message:"Product updated successfully"});
    

  } catch (error) {
    console.error(`Error while updating product, ${error}`);
    return res.status(500).json({success:false,message:"Internal server error"})
    
  }
}




module.exports = {
  getAddProductPage,
  addProducts,
   getAllProducts,
   getEditProduct,
   toggleBlockStatus,
   editProduct
};
