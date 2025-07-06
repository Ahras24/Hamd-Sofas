const Category = require('../models/categoryModel');


const getCategoryData = async (searchQuery = "", page = 1, limit = 4) => {
  const query = searchQuery
    ? { name: { $regex: searchQuery, $options: 'i' } }
    : {};

  const totalCategories = await Category.countDocuments(query);
  const totalPages = Math.ceil(totalCategories / limit);

  const categories = await Category.find(query)
    .sort({ createdAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

  return {
    categories,
    searchQuery,
    currentPage: page,
    totalPages,
    limit,
    totalCategories
  };
};

module.exports = { getCategoryData };