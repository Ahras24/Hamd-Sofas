const Category = require('../../models/categoryModel');
const cloudinary = require('../../config/cloudinary')
const {getCategoryData} = require('../../utils/categoryUtils');


const categoryDetails = async (req, res) => {
    try {
        let searchQuery = req.query.search || "";
        const page = parseInt(req.query.page) || 1;

        const data = await getCategoryData(searchQuery,page);

        res.render('admin/category', {
            ...data,
            success_msg: req.query.success_msg || '',
            error_msg: req.query.error_msg || ''
        });

    } catch (error) {
        console.error(`Error Fetching categories ${error}`);
        res.render('admin/category', { error_msg: "Internal server error" });
    }
};

const addCategory = async (req, res) => {
    const { name } = req.body;

    try {
        const data = await getCategoryData();
        
        if (!req.file) {
            return res.render('admin/category', {
                ...data,
                error_msg: "Please upload an image",
                success_msg:""
            });
        }

        const existingCategory = await Category.findOne({name});
        if (existingCategory) {
            return res.render('admin/category', {
                ...data,
                error_msg: "Category already exists",
                success_msg:""
                
            });
        }

        const result = await cloudinary.uploader.upload(req.file.path, {
            folder: 'hamd_sofas/categories',
            resource_type: 'image'
        });

        const newCategory = new Category({
            name,
            imageUrl: result.secure_url,
            publicId: result.public_id,
            isListed: true
        });

        await newCategory.save();
        res.redirect('/admin/category?success_msg=Category added successfully');

    } catch (error) {
        console.error(`Error while adding category ${error}`);
        res.redirect('/admin/category?error_msg=Error occurred while adding the category');
    }
};

const getEditCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await Category.findById(id);

        if (!category) {
            return res.render('admin/category', {
                error_msg: "Category not found"
            });
        }

        res.render('admin/category', {
            category,
            success_msg: req.query.success_msg || '',
            error_msg: req.query.error_msg || ''
        });

    } catch (error) {
        console.error("Error fetching category: ", error);
        res.render('admin/category', { error_msg: "Error Fetching Category" });
    }
};

const editCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;

        const existingCategory = await Category.findOne({ name, _id: { $ne: id } });
        if (existingCategory) {
            return res.render('admin/category', {
                error_msg: "Category already exists"
            });
        }

        const updateData = { name, isListed: true };

        if (req.file) {
            const category = await Category.findById(id);
            if (category.publicId) {
                await cloudinary.uploader.destroy(category.publicId);
            }

            const result = await cloudinary.uploader.upload(req.file.path, {
                folder: "hamd_sofas/categories",
                resource_type: 'image'
            });

            updateData.imageUrl = result.secure_url;
            updateData.publicId = result.public_id;
        }

        await Category.findByIdAndUpdate(id, updateData);
        res.redirect('/admin/category?success_msg=Category updated successfully');

    } catch (error) {
        console.error("Error editing category: ", error);
        res.redirect('/admin/category?error_msg=Error updating category');
    }
};

const toggleListStatus = async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).send("Category not found");

        category.isListed = !category.isListed;
        await category.save();

        res.redirect('/admin/category');

    } catch (error) {
        console.error("Error while toggling listing status:", error);
        res.status(500).send("Internal server error");
    }
};


module.exports = {
    categoryDetails,
    addCategory,
    editCategory,
    toggleListStatus,
    getEditCategory
}