const mongooose = require('mongoose');


const addressSchema = new mongooose.Schema({
    userId:{
        type:mongooose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
   
    addresses:[{
            fullName: { type: String, required: true },
            phone: { type: String, required: true },
            street: { type: String, required: true },
            city: { type: String, required: true },
            state: { type: String, required: true },
            pincode: { type: String, required: true },
            country: { type: String, required: true },
            isDefault: { type: Boolean, default: false }
        }]

})


const Address = mongooose.model("Address",addressSchema)
module.exports = Address