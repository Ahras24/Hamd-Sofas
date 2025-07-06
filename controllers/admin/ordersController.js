const Orders = require('../../models/ordersModel');
const Wallet = require('../../models/walletModel');
const Product = require('../../models/productModel');




const getAllOrders = async (req,res)=>{
    try {

        const { search,status,sort,page =1 } = req.query;
        const query = {};

        if(search){
            query.$or = [
                { customId: {$regex: search, $options: 'i' }},
            ];
        }

        if( status && status !== 'All'){
            query.status = status;
        } else {
            query.status = {$ne: 'failed'}
        }

        const pageSize = 5;
        const skip = (page -1)* pageSize;

        const orders = await Orders.find(query)
        .populate('userId')
        .sort({createdAt: sort === 'oldest' ? 1 : -1 })
        .skip(skip)
        .limit(pageSize);

        const totalOrders = await Orders.countDocuments(query);
        const totalPages = Math.ceil(totalOrders / pageSize);

        res.render('admin/orders',{
            orders,
            currentPage: parseInt(page),
            totalPages,
            search,
            statusFilter: status || 'All',
            sortOrder: sort || 'newest'
        })
        
    } catch (error) {
        console.error(`Error fetching orders : ${error}`);
        return res.status(500).json("Internal server error");
    }
}

const getOrderDetails = async (req,res)=>{
    try {
        
        const order = await Orders.findOne({customId: req.params.customId})
        .populate('userId')
        .populate('items.product');

        
        if (!order) {
            return res.status(404).send("Order not found");
        }
        res.render('admin/order-details',{
            order
        })

    } catch (error) {
        console.error(`Error Fetching Order Details: ${error}`);
        return res.status(500).json("Internal server error");
        
    }
}

const updateOrderStatus = async (req,res)=>{
    try {

        const {customId} = req.params;
        const  {status} = req.body

        const allowedStatuses = ['pending','shipped','out-for-delivery','return-requested','returned','delivered','cancelled'];
        if(!allowedStatuses.includes(status)){
            return res.status(400).json("Invalid Status");
        }

        
        const order = await Orders.findOne({ customId });

        if(!order) return res.status(404).json("Order not found");

        order.status = status;

        order.items.forEach(item => {
            if(item.status !== 'cancelled'){
               item.status = status; 
            }
        });
       
        await order.save();
        res.redirect(`/admin/orders/${customId}`);
        
    } catch (error) {
        console.error(`Error updating order status : ${error}`);
        return res.status(500).json("Internal server error");
    }
}

const approveReturn  = async (req,res)=>{
    try {
        
        const { customId,productId } = req.params;
        
       const order = await Orders.findOne({customId})
            .populate('items.product');
            
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        // Find the specific item
        const item = order.items.find(item => item.product._id.toString() === productId);
        if (!item) {
            return res.status(404).json({ error: 'Product not found in order' });
        }

        item.returnStatus = 'return-approved';
        item.returnApprovedAt = new Date();
        item.status = 'returned';

        order.status = 'returned';

        const product = await Product.findById(productId);
        if(product){
            product.stock += item.quantity;
            await product.save();
        }

        await order.save();

        // amount adding to wallet
        const userId = order.userId;
        const tax = item.price * 0.10;
        const couponDiscount = order.discount || 0;
        const subtotal = order.subtotal || 1;

        const discountAmount = Math.floor((item.price / subtotal) * couponDiscount);
        const refundAmount = Math.round((item.price + tax - discountAmount) * item.quantity);
 
        let wallet = await Wallet.findOne({ user: userId });
        if(!wallet){
            wallet = new Wallet({
                user: userId,
                balance:0,
                transactions: []
            });
        }

        wallet.balance += refundAmount;
        wallet.transactions.push({
            type: 'credit',
            amount: refundAmount,
            reason: 'Refund for returned item',
            orderId: customId
        });
 
        await wallet.save();

        res.redirect(`/admin/orders/${customId}`);

    } catch (error) {
        console.error('Error approving return:', error);
        res.status(500).json({ error: 'Internal server error' });
        
    }
}

const denyReturn = async (req, res) => {
    try {
        const { customId, productId } = req.params;
        const { denyReason } = req.body;
        
        const order = await Orders.findOne({customId})
            .populate('items.product');
            
        if (!order) {
            return res.status(404).json({ error: 'Order not found' });
        }
        
        const item = order.items.find(item => item.product._id.toString() === productId);
        if (!item) {
            return res.status(404).json({ error: 'Product not found in order' });
        }
        
        // Update return status
        item.returnStatus = 'return-denied';
        item.returnDeniedAt = new Date();

        item.status = 'return-denied';
        if (denyReason && denyReason.trim()) {
            item.returnDenyReason = denyReason.trim();
        }
        
        await order.save();
        
        res.redirect(`/admin/orders/${customId}`);
        
    } catch (error) {
        console.error('Error denying return:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};




module.exports = {
    getAllOrders,
    getOrderDetails,
    updateOrderStatus,
    approveReturn,
    denyReturn
}   