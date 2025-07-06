const User = require('../../models/usersModel');


const customerDetails = async (req,res)=>{
    try {
        let search = req.query.search || "";
        let query = {};
        let page = parseInt(req.query.page) || 1;
        const limit =5;

        query = {
            $or:[
                {username:{$regex:".*" + search + ".*", $options:"i"}},
                {email:{$regex:".*" + search + ".*", $options:"i"}},
                {phone:{$regex:".*" + search + ".*", $options: "i"}}
            ]
        };

        const userData = await User.find(query)
        .sort({createdAt:-1})
        .limit(limit)
        .skip((page-1)*limit)
        .exec()

        const count = await User.countDocuments(query);

        res.render('admin/customers',{
            data:userData,
            totalPages:Math.ceil(count/limit),
            currentPage:page,
            search: req.query.search || "",
        })

    } catch (error) {
        console.error("Error fetching customer Information",error)
        res.status(500).send("Internal server error")
        
    }
}

const userBlocked = async (req, res) => {
    try {
      let id = req.query.id;
      const user = await User.findById(id);
      await User.updateOne({ _id: id }, { $set: { isBlocked: true } });
      res.json({ success: true });

    } catch (error) {
      console.error(`Error while blocking customer ${error}`);
      res.status(500).json({ success: false });
    }
  };
  
const userUnBlocked = async (req, res) => {
    try {
      let id = req.query.id;
      await User.updateOne({ _id: id }, { $set: { isBlocked: false } });
      res.json({ success: true });

    } catch (error) {
      console.error(`Error while unblocking customer ${error}`);
      res.status(500).json({ success: false });
    }
  };




module.exports = {
    customerDetails,
    userBlocked,
    userUnBlocked
}

