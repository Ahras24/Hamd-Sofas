

const getFaqsPage = async(req,res)=>{
    try {
        res.render('user/faqs');
        
    } catch (error) {
        console.error(`Error while loading FAQs Page`);
        res.status(500).json("Internal server error");
        
    }
}

module.exports = {getFaqsPage};