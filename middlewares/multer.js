const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../config/cloudinary'); 


// Storage for category Images
const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'hamd_sofas/categories',
    allowed_formats: ['jpg', 'jpeg', 'png'],
  },
});

const userStorage = new CloudinaryStorage({
  cloudinary,
  params:{
    folder: 'hamd_sofas/users',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    public_id: (req, file) => `profile_${Date.now()}`,

  }
})

const upload = multer({ storage: storage });
const uploadUserImage = multer({storage: userStorage});


module.exports = {
  upload,
  uploadUserImage
}