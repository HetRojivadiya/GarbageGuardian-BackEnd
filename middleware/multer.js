const multer = require('multer');

// Define Multer storage (in-memory since we upload to Cloudinary)
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit per file
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png/;
    const extname = filetypes.test(file.mimetype);

    if (extname) {
      return cb(null, true);
    } else {
      cb(new Error('Images only!'));
    }
  }
});

module.exports = upload;
