const Order = require('../models/ordersModel');


const getFilterSalesReport = async (reportType, startDate, endDate) =>{
    try {
        
        let fromDate, toDate = new Date();

        const today = new Date();
        toDate.setHours(23,59,59,999);

        if(reportType === 'daily') {
            fromDate = new Date(today.setHours(0,0,0,0));
        } else if(reportType === 'weekly') {
            fromDate = new Date(today.setDate(today.getDate() - 7));
        } else if(reportType === 'monthly') {
            fromDate = new Date(today.setMonth(today.getMonth() - 1));
        } else if(reportType === 'custom') {
            fromDate = new Date(startDate);
            toDate = new Date(endDate);
            toDate.setHours(23,59,59,999);
        } else {
            fromDate = new Date(0);
        }

        return await Order.find({
            status: 'delivered',
            createdAt: {$gte: fromDate, $lte: toDate },
        })
        .populate('userId')
        .sort({createdAt:-1});

    } catch (error) {
        console.error(`error while filtering sales report, ${error}`);
    }
}



module.exports =  {getFilterSalesReport};
