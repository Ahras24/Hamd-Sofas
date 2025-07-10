const Order = require('../../models/ordersModel');
const Wallet = require('../../models/walletModel');
const ejs = require('ejs');
const puppeteer = require('puppeteer');
const path = require('path');
const { findOneAndUpdate } = require('../../models/categoryModel');


const getOrdersList = async (req,res)=>{
    try {

        const userId = req.session.user._id;
        const search = req.query.search || '';
        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const skip = (page -1) * limit;

        let orders = await Order.find({ userId })
           .sort({ createdAt: -1})
           .populate('items.product')
           .exec();
           
           if (search.trim()) {
            const searchLower = search.toLowerCase();

            orders = orders.filter(order => {
                const matchOrderId = order.customId?.toLowerCase().includes(searchLower);

                const matchProduct = order.items.some(item =>
                    item.product?.productName?.toLowerCase().includes(searchLower)
                );
                return matchOrderId || matchProduct;
            });
        }

        const totalOrders = orders.length;
        const totalPages = Math.ceil(totalOrders/limit);
        const paginatedOrders = orders.slice(skip, skip + limit);
           
        res.render('user/orders',{
            orders: paginatedOrders,  
            search,
            currentPage: page,
            totalPages,
            RAZORPAY_KEY_ID: process.env.RAZORPAY_KEY_ID,
            grandTotal: req.session.lastOrderAmount,
           selectedAddressId: req.session.selectedAddressId,
        });

    } catch (error) {
        console.error(`Error while listing orders : ${error}`);
        return res.status(500).json("Internal server error");
    }
}

const orderDetails = async (req,res)=>{
    try {

        const customId = req.params.id

        const order = await Order.findOne({ customId })
          .populate('items.product')
          .populate('userId');

          if(!order){
            return res.status(404).send("order not found")
          }
        
        res.render('user/order-details',{
            order
        });

    } catch (error) {
        console.error(`Error while showing order details page: ${error}`);
        return res.status(500).json("Internal server error");
    }
}

const cancelFullOrder = async (req,res)=>{
    try {

        const {customId} = req.params;
        const {cancelReason} = req.body;

        const order = await Order.findOne({customId}).populate('items.product');

        if (!order || order.status === 'Cancelled') {
         return res.status(404).json({success: false,message: "Order not found or already cancelled"});
       }

    for(let item of order.items){
       const product = item.product;

    if (item.status === 'cancelled') continue;
    
      if (product && product.stock !== undefined) {
        product.stock += item.quantity;
        await product.save();
      }
    
      item.status = 'cancelled';
      item.cancelReason = cancelReason || 'No reason provided';
      item.cancelledAt = new Date();
      }
    
     order.status = "cancelled";
     order.cancelReason = cancelReason || "No reason provided";
     order.cancelledAt = new Date();

     await order.save();

     let message = "Order cancelled successfully.";
     if( order.paymentMethod === 'razorpay' ) { 
        // Refund to wallet
     const userId = order.userId;
     let refundAmount = order.grandTotal;

     let wallet = await Wallet.findOne({ user: userId });
     if(!wallet){
        wallet = new Wallet({
            user: userId,
            balance: 0,
            transactions: []
        });
     }

     wallet.balance += refundAmount;
     wallet.transactions.push({
        amount: refundAmount,
        date: Date.now(),
        orderId: customId,
        reason: "Refund of order cancellation",
        type: "credit",
     });

     await wallet.save();

     message = "Order cancelled and amount refunded to Wallet.";
    }
        return res.json({
        success: true,
        message
     });

} catch (error) {
    console.error(`Error while cancelling the order: ${error}`);
    return res.status(500).json({success: false, message: "Internal server error"});
    }
}

const cancelOneItem = async (req,res)=>{
    
    try {

        const {customId,productId} = req.params;
        const {cancelReason} = req.body;

        const order = await Order.findOne({customId}).populate('items.product');

        if (!order) return res.status(404).json({ success: false, message: "Order not found" });

        if (!order.items || order.items.length === 0) {
            return res.status(404).json({success: false,message: "No items in order"});
        }

        const itemIndex = order.items.findIndex((item) => {
        const itemProductId = item.product._id ? item.product._id.toString() : item.product.toString();
        return itemProductId === productId;
        });
       if (itemIndex === -1) return res.status(404).json({ success: false, message: "Item not found in order" });

       const item = order.items[itemIndex];

       item.product.stock += item.quantity;
       await item.product.save();

       order.items[itemIndex].status = 'cancelled';
       order.items[itemIndex].cancelReason = cancelReason || 'No reason';
       order.items[itemIndex].cancelledAt = new Date();

      const allCancelled = order.items.every(item => item.status === 'cancelled');
      if (allCancelled) {
      order.status = 'cancelled';
      order.cancelledAt = new Date();
    }

     await order.save();

    let message = "Item cancelled successfully.";
    // Refund to wallet
    if( order.paymentMethod === 'razorpay' ){ 
     const userId = order.userId;
     const tax = item.price * 0.10;
     const shippingCharge = order.shippingCharge || 0;
     const couponDiscount = order.discount || 0;
     const refundAmount = (item.price + tax + shippingCharge - couponDiscount) * item.quantity;

     let wallet = await Wallet.findOne({ user: userId });
     
     if(!wallet){
        wallet = new Wallet({
            user: userId,
            balance: 0,
            transactions: []
        });
     }

     wallet.balance += refundAmount;
     wallet.transactions.push({
        type: "credit",
        amount: refundAmount,
        reason: "Refund of cancelled Item",
        date: Date.now(),
        orderId: customId
     });
    
     await wallet.save();
    
    message = "Item cancelled and amount refunded to Wallet.";
    }

     return res.json({
        success: true,
        message
     });
    
    } catch (error) {
        console.error(`Error while cancelling the product : ${error}`);
        return res.json({ success: false, message: "Something went wrong" });
    }
}

const returnOrderItem = async (req,res)=>{
    try {
        
       const { customId, productId } = req.params;
        const { returnReason } = req.body;

        if (!returnReason || returnReason.trim() === '') {
        return res.status(400).json({ error: 'Return reason is required' });
        }

        const order = await Order.findOne({ customId });

        if(!order){
            return res.status(404).json("Order not found");
        }

        const item = order.items.find(i => i.product.toString() === productId);
        if(!item){
            return res.status(404).send("Product not found in order");
        }

        if(item.returnStatus === 'return-requested' || item.returnStatus === 'returned'){
            return res.status(400).json("Already requested or returned")
        }

        item.returnStatus = "return-requested";
        item.returnReason = returnReason.trim();
        item.returnRequestedAt = new Date();

        order.status = 'return-requested';
        item.status = 'return-requested'

        await order.save();
        res.redirect(`/user/order-details/${customId}`)

    } catch (error) {
        console.error(`error while returning order : ${error}`);
        return res.status(500).json("Internal server error");
    }
}

const downloadInvoice = async(req,res)=>{
    try {
        
        const order = await Order.findOne({ customId: req.params.customId })
         .populate('userId')
         .populate('items.product');

          if (!order) return res.status(404).send('Order not found');

    const filePath = path.join(__dirname, '../../views/user/invoice.ejs');

    const html = await ejs.renderFile(filePath, { order });

    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
    });
    const page = await browser.newPage();

    await page.setContent(html, { waitUntil: 'networkidle0' });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
    });

    await browser.close();

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=invoice-${order.customId}.pdf`
    );
    res.send(pdfBuffer);

    } catch (error) {
        console.error("Error generating invoice:", error);
        return res.status(500).json("Internal Server Error");
    }
}


module.exports = {
    getOrdersList,
    orderDetails,
    cancelFullOrder,
    cancelOneItem,
    returnOrderItem,
    downloadInvoice
}