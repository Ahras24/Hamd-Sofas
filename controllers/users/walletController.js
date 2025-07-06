const Wallet = require('../../models/walletModel');


const getWalletPage = async (req,res) => {
    try {

        const userId = req.session.user._id;
        const page = parseInt(req.query.page) || 1;
        const limit = 5;
        const skip = (page-1) * limit;

        let wallet = await Wallet.findOne({ user: userId });

        const transactions = wallet ? wallet.transactions : [];
        const balance = wallet ? wallet.balance : 0;

        const totalTransactions = transactions.length;
        const totalPages = Math.ceil(totalTransactions / limit);

        const paginatedTransactions = transactions
          .slice()
          .reverse()
          .slice(skip, skip + limit);

        if(req.xhr) { 
         return  res.render('user/wallet',{
            balance,
            transactions: paginatedTransactions,
            currentPage: page,
            totalPages,
            layout: false,
            isAjax: true
        });
    }

    res.render('user/wallet', {
        balance,
        transactions: paginatedTransactions,
        currentPage: page,
        totalPages,
        isAjax: false
    })
        
    } catch (error) {
        console.error(`error while loading wallet page: ${error}`);
        return res.status(500).json("Internal server error");
    }
}


module.exports = {
    getWalletPage
}