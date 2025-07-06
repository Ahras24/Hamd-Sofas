const Orders = require('../../models/ordersModel');
const Product = require('../../models/productModel');
const Category = require('../../models/categoryModel');


const getDashboard = async (req,res)=>{
    try {

    const successMessage = req.session.successMessage;
    req.session.successMessage = null;

    const currentYear = new Date().getFullYear();

    const monthlySales = await Orders.aggregate([
        {$match: {createdAt: {$gte: new Date(`${currentYear}-01-01`)}, status: "delivered"}},
        {$group: {_id:{$month: "$createdAt" },total:{$sum: "$grandTotal"}}},
        {$sort: {"_id":1 }}
    ]);

    // top 10 Best selling Products
    const topProducts = await Orders.aggregate([
        {$unwind: "$items"},
        {$match: {status:"delivered"}},
        {$group: {_id: "$items.product", totalSold: {$sum: "$items.quantity"}}},
        {$lookup: {
            from: "products",
            localField: "_id",
            foreignField: "_id",
            as: "product"
        }},
        {$unwind: "$product"},
        {$sort: {totalSold: -1}},
        {$limit: 10}
    ]);

    // Best selling category
    const topCategories = await Orders.aggregate([
        {$unwind: "$items"},
        {$match: {status:"delivered"}},
        {$lookup: {
            from: "products",
            localField: "items.product",
            foreignField: "_id",
            as: "productInfo"
        }},
        {$unwind: "$productInfo"},
        {$group: {_id:"$productInfo.category",totalSold: {$sum: "$items.quantity"}}},
        {$lookup: {
            from: "categories",
            localField: "_id",
            foreignField: "_id",
            as: "category"
        }},
        {$unwind: "$category"},
        {$sort: {totalSold: -1}},
        {$limit: 5}
    ]);
    

    res.render('admin/dashboard',{
        successMessage,
        monthlySales,
        topProducts,
        topCategories
    });
        
} catch (error) {
        console.error(`Error while loading Dashboard, ${error}`);
        return res.status(500).json("Internal server error");
    }
}

const getFilteredSalesData = async (req,res) => {
    try {

        const {filter} = req.body;
        let groupBy;
        let dateFrom = new Date(2000,0,1);

        const now = new Date();

        if(filter === 'yearly') {
            groupBy = {$year: "$createdAt"};
            
        }else if (filter === 'monthly') {
            groupBy = {$month: "$createdAt"};
            dateFrom = new Date(now.getFullYear(),0,1);

        } else if (filter === 'weekly') {
            groupBy = {$dayOfWeek: "$createdAt"};
            dateFrom = new Date();
            dateFrom.setDate(now.getDate() - 6 );
        }

        const salesData = await Orders.aggregate([
            {$match: {createdAt: {$gte: dateFrom },status: "delivered"}},
            {$group: {_id: groupBy, total: {$sum: "$grandTotal"}}},
            {$sort: {_id: 1}}
        ]);

        let labels = [];
         if (filter === "yearly") {
           labels = salesData.map(item => item._id.toString()); // "2023", "2024"
        } else if (filter === "monthly") {
          const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
          labels = salesData.map(item => monthNames[item._id - 1]);
        } else if (filter === "weekly") {
          const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
          labels = salesData.map(item => dayNames[item._id - 1]);
        }

        const values = salesData.map(item => item.total);

        res.json({ success: true, labels, values });
        
    } catch (error) {
        console.error(`Error while filtering chart, ${error}`);
        return res.status(500).json("Internal server error");
    }
}




module.exports = {
    getDashboard,
    getFilteredSalesData
}