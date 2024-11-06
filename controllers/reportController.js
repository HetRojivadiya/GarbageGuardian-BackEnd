const cloudinary = require('../config/cloudinary');
const Report = require('../models/Report');
const ErrorResponse = require('../utils/errorResponse');
const asyncHandler = require('../utils/asyncHandler');
const AcceptedReport = require('../models/AcceptedReport');
const User = require('../models/User'); 






//------------------------------------------------------------------------------------------//

// Issue a new report
exports.issueReport = asyncHandler(async (req, res, next) => {

  const { city, state, pincode, wasteType, description, harmfulLevel,locationLink} = req.body;
  const userId = req.user;

  

  // Check for required fields
  if (!city || !state || !pincode || !wasteType || !description || !harmfulLevel )  {
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
    locationLink,
  });

  res.status(201).json({
    success: true,
    data: report
  });

  next();
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

  // Fetch issued reports by the user
exports.fetchIssuedReportsById = asyncHandler(async (req, res, next) => {
  const userId = req.user; // Assuming req.user contains the logged-in user's ID

  try {
    // Find all reports issued by the current user
    const issuedReports = await Report.find({ user: userId, status: "issued" });
    
    res.status(200).json({
      success: true,
      issuedReports
    });
  } catch (error) {
    return next(new ErrorResponse('Error fetching issued reports', 500));
  }
});



// Cancel an issued report (delete from DB and Cloudinary)
exports.cancelIssuedReport = asyncHandler(async (req, res, next) => {
  const reportId = req.params.id;
  const userId = req.user;

  // Find the report by ID and ensure the user is the one who created it
  const report = await Report.findOne({ _id: reportId, user: userId });
  if (!report) {
    return next(new ErrorResponse('Report not found or you are not authorized to cancel this report', 403));
  }

  // Delete images from Cloudinary
  if (report.images && report.images.length > 0) {
    for (const image of report.images) {
      await cloudinary.uploader.destroy(image.public_id);
    }
  }

  // Delete the report from MongoDB using deleteOne
  await Report.deleteOne({ _id: reportId, user: userId });

  res.status(200).json({ success: true, message: 'Report canceled successfully' });
});



//---------------------------------------------------------------------------------------------//

// Accept a report (only for verified 'Foundation & Organisation' or 'Municipal Corporation' users)
exports.acceptReport = asyncHandler(async (req, res, next) => {
  const userId = req.user;
  const reportId = req.params.id;

  const user = await User.findById(userId);
  if (!user || !['Foundation & Organisation', 'Municipal Corporation'].includes(user.typeOfUser) || user.status !== 'Verified') {
    return next(new ErrorResponse('You are not authorized to accept this report', 403));
  }

  // Find the report and update status to 'accepted'
  const report = await Report.findById(reportId);
  if (!report || report.status !== 'issued') {
    return next(new ErrorResponse('Report not found or already accepted/completed', 404));
  }

  report.status = 'accepted';
  await report.save();

  // Create an entry in the AcceptedReport collection
  await AcceptedReport.create({ report: reportId, user: userId });

  res.status(200).json({ success: true, message: 'Report accepted successfully' });
});

//-------------------------------------------------------------------------------------------------

// Fetch accepted reports
exports.fetchAcceptedReports = asyncHandler(async (req, res, next) => {
  const userId = req.user;

  // Find reports accepted by the current user and populate the report details while keeping the report ID
  const acceptedByUser = await AcceptedReport.find({ user: userId , status:"accepted"})
    .populate({
      path: 'report', 
      model: 'Report', 
      select: '_id user status address wasteType description harmfulLevel images locationLink rating issuedDate'
    });

  // Check if any reports issued by the current user exist
  const issuedByUser = await Report.find({ user: userId,status:"accepted" });

  res.status(200).json({
    success: true,
    acceptedReports: { acceptedByUser, issuedByUser }
  });
});

//-------------------------------------------------------------------------------------------------------




// Cancel an accepted report (only by the user who accepted it)
exports.cancelAcceptReport = asyncHandler(async (req, res, next) => {
  const reportId = req.params.id;
  const userId = req.user;

  const acceptedReport = await AcceptedReport.findOne({ _id: reportId, user: userId });
  if (!acceptedReport) {
    return next(new ErrorResponse('You are not authorized to cancel this report', 403));
  }

  // Delete the accepted report record
  await AcceptedReport.deleteOne({ _id: acceptedReport._id }); // Use deleteOne method

  // Update the original report status back to 'issued'
  const report = await Report.findById(acceptedReport.report);
  report.status = 'issued';
  await report.save();

  res.status(200).json({ success: true, message: 'Accepted report canceled and status updated to issued' });
});




//------------------------------------------------------------------------------------------//

// Mark a report as completed (only by the user who accepted the report)
exports.completeIssue = asyncHandler(async (req, res, next) => {
  const reportId = req.params.id;
  const userId = req.user;


  const acceptedReport = await AcceptedReport.findOne({ _id: reportId, user: userId });
  if (!acceptedReport) {
    return next(new ErrorResponse('You are not authorized to complete this report', 403));
  }

  // Update both the accepted report and the original report status to 'completed'
  acceptedReport.status = 'completed';

  await acceptedReport.save();

  const report = await Report.findById(acceptedReport.report);
  report.status = 'completed';
  report.completedDate = new Date();
  await report.save();

  res.status(200).json({ success: true, message: 'Report marked as completed' });
});

//-----------------------------------------------------------------------------------------//

// Fetch completed reports for the user
exports.fetchCompletedIssues = asyncHandler(async (req, res, next) => {
  const userId = req.user;
  
  // Find reports with status 'completed' where the user is either the issuer or the one who accepted it
  const completedReports = await Report.find({
    $or: [
      { user: userId }, // Issued by the user
      { _id: { $in: await AcceptedReport.find({ user: userId }).distinct('report') } }  // Accepted by the user
    ],
    status: 'completed'
  }).exec();

  res.status(200).json({ success: true, completedReports });
});

//------------------------------------------------------------------------------------------//


//Rating 
exports.rateOrganization = asyncHandler(async (req, res, next) => {
  const { reportId, rating } = req.body;

  try {
    // Find the accepted report to get the userId
    const acceptedReport = await AcceptedReport.findOne({ report: reportId, status: 'completed' });

    if (!acceptedReport) {
      return res.status(404).json({ message: 'Accepted report not found.' });
    }

    const organizationId = acceptedReport.user; // Assuming the user is the organization
    const organization = await User.findById(organizationId);

    // Check if the organization exists
    if (!organization) {
      return res.status(404).json({ message: 'Organization not found.' });
    }

    // If it's the first rating, initialize the total ratings and count
    if (!organization.totalRatings) {
      organization.totalRatings = 0;
      organization.ratingCount = 0;
    }

    // Update the total ratings and count
    organization.totalRatings += rating; // Add the new rating to the total
    organization.ratingCount += 1; // Increment the rating count

    // Calculate the new average rating
    organization.averageRating = organization.totalRatings / organization.ratingCount;

    // Save the updated organization data
    await organization.save();

    res.status(200).json({
      message: 'Rating submitted successfully!',
      averageRating: organization.averageRating,
    });
  } catch (error) {
    console.error('Error submitting rating:', error);
    res.status(500).json({ message: 'Server error' });
  }
});




