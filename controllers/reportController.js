const cloudinary = require('../config/cloudinary');
const Report = require('../models/Report');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');

// Issue a new report
exports.issueReport = asyncHandler(async (req, res, next) => {
  const { city, state, pincode, wasteType, description, harmfulLevel } = req.body;
  const userId = req.user;

  // Check for required fields
  if (!city || !state || !pincode || !wasteType || !description || !harmfulLevel) {
    return next(new ErrorResponse('Please provide all required fields', 400));
  }


  // Handle image uploads to Cloudinary
let imageUploads = [];
if (req.files && req.files.length > 0) {
  imageUploads = await Promise.all(
    req.files.map((file) =>
      new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream({ folder: 'garbage_reports' }, (err, result) => {
          if (err) return reject(new ErrorResponse('Image upload failed', 500));
          resolve({ url: result.secure_url, public_id: result.public_id });
        }).end(file.buffer); // Ensure you send the file buffer to Cloudinary
      })
    )
  );
}


  // Create the report
  const report = await Report.create({
    user: userId,
    status: 'issued',
    address: {
      city,
      state,
      pincode
    },
    wasteType,
    description,
    harmfulLevel,
    images: imageUploads,
  });

  res.status(201).json({
    success: true,
    data: report
  });
});


exports.getIssuedReports = asyncHandler(async (req, res, next) => {
    try {
      // Fetch all reports with status "issued"
      const reports = await Report.find({ status: 'issued' }).populate('user', 'name email'); // Populate user details if needed
  
      res.status(200).json({
        success: true,
        count: reports.length,
        data: reports,
      });
    } catch (err) {
      return next(new ErrorResponse('Server error', 500));
    }
  });
