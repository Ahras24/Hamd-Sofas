const Address = require("../../models/addressModel");
const User = require("../../models/usersModel");
const product = require("../../models/productModel");


const editAddress = async (req, res, next) => {
  try {
    const userId = req.session.user._id;
    const addressId = req.params.id;
    const { fullName, phone, street, city, state, pincode, country } = req.body;

    const updatedAddressDoc = await Address.findOneAndUpdate(
      {
        userId: userId,
        "addresses._id": addressId,
      },
      {
        $set: {
          "addresses.$.fullName": fullName,
          "addresses.$.phone": phone,
          "addresses.$.street": street,
          "addresses.$.city": city,
          "addresses.$.state": state,
          "addresses.$.pincode": pincode,
          "addresses.$.country": country,
        },
      },
      { new: true }
    );

    if (!updatedAddressDoc) {
      const error = new Error("Address not found");
      error.statusCode = 404;
      next(error);
    }

    return res.json({ success: true, message: "Address updated successfully" });

  } catch (error) {
    console.error(`Error while editing address : ${error}`);
    error.statusCode = 500;
    next(error);
  }
};

const addAddress = async (req, res) => {
  try {
    const { fullName, phone, street, city, state, pincode, country } = req.body;
    const userId = req.session.user._id;

    const addressDoc = await Address.findOne({ userId });

    const newAddress = {
      fullName,
      phone,
      street,
      city,
      state,
      pincode,
      country,
      isDefault: !addressDoc || addressDoc.addresses.length === 0,
    };

    if (addressDoc) {
      addressDoc.addresses.push(newAddress);
      await addressDoc.save();
    } else {
      await Address.create({ userId, addresses: [newAddress] });
    }

    return res
      .status(200)
      .json({ success: true, message: "Address added successfully!" });

  } catch (error) {
    console.error(`Error while adding address : ${error}`);
    return res.status(500).json({ success: false, message: "Error while adding Address" });
  }
};

const deleteAddress = async (req, res,next) => {
  try {
    const userId = req.session.user._id;
    const index = req.params.index;

    const addressDoc = await Address.findOne({ userId });

    if (!addressDoc) return res.redirect("/user/user-account");

    addressDoc.addresses.splice(index, 1);

    if (
      !addressDoc.addresses.some((addr) => addr.isDefault) &&
      addressDoc.addresses.length > 0
    ) {
      addressDoc.addresses[0].isDefault = true;
    }

    await addressDoc.save();
    res.redirect("/user/user-account");

  } catch (error) {
    console.error(`Error deleting address : ${error}`);
    error.statusCode = 500;
    next(error);
  }
};

const setDefaultAddress = async (req, res) => {
  try {
    const userId = req.user._id;
    const addressId = req.params.id;

    const userAddressDoc = await Address.findOne({ userId });

    if (!userAddressDoc) {
      return res.status(404).json({ success: false, message: "Address document not found." });
    }

    userAddressDoc.addresses.forEach((addr) => {
      addr.isDefault = false;
    });

    const selectedAddress = userAddressDoc.addresses.id(addressId);

    if (!selectedAddress) { 
      return res.status(404).json({ success: false, message: "Address not found inside addresses array." });
    }

    selectedAddress.isDefault = true;

    await userAddressDoc.save();
    return res.json({ success: true });

  } catch (error) {
    console.error(`Error setting default address : ${error}`);
    res.status(500).json({ success: false, message: "Internal server error" });
  }
};


module.exports = {
  editAddress,
  addAddress,
  deleteAddress,
  setDefaultAddress,
};
