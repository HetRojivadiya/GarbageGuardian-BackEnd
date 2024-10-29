const User = require('../models/User'); // Adjust path based on your structure

// Get all organizations
exports.getOrganizations = async (req, res) => {
  try {
    const organizations = await User.find({
      typeOfUser: { $in: ['Foundation & Organisation', 'Municipal Corporation', 'Service Provider'] },
    });
    const serviceProviders = await User.countDocuments({ typeOfUser: 'Service Provider' });
    const municipalCorporations = await User.countDocuments({ typeOfUser: 'Municipal Corporation' });
    const foundations = await User.countDocuments({ typeOfUser: 'Foundation & Organisation' });

    res.json({
      organizations,
      analysis: {
        serviceProviders,
        municipalCorporations,
        foundations
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Server error' });
  }
};

// Verify organization
exports.verifyOrganization = async (req, res) => {
    const { id } = req.params; // Get the organization ID from the request parameters
    const { status } = req.body; // Get the status from the request body (expected to be 'Verified')
  
    try {
      // Find the organization by ID and update its status
      const updatedOrganization = await User.findByIdAndUpdate(
        id,
        { status }, // Update the status to 'Verified'
        { new: true } // Return the updated document
      );
  
      // Check if the organization was found
      if (!updatedOrganization) {
        return res.status(404).json({ message: 'Organization not found' });
      }
  
      // Respond with success message and updated organization data
      res.status(200).json({
        message: 'Organization verified successfully',
        organization: updatedOrganization,
      });
    } catch (error) {
      console.error('Error verifying organization:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
};

// Unverify organization
exports.unverifyOrganization = async (req, res) => {
    const { id } = req.params; // Get the organization ID from the request parameters
  
    try {
      // Find the organization by ID and update its status to 'Pending'
      const updatedOrganization = await User.findByIdAndUpdate(
        id,
        { status: 'Pending' }, // Set status to 'Pending'
        { new: true } // Return the updated document
      );
  
      // Check if the organization was found
      if (!updatedOrganization) {
        return res.status(404).json({ message: 'Organization not found' });
      }
  
      // Respond with success message and updated organization data
      res.status(200).json({
        message: 'Organization status updated to Pending',
        organization: updatedOrganization,
      });
    } catch (error) {
      console.error('Error un-verifying organization:', error);
      res.status(500).json({ message: 'Server error', error: error.message });
    }
};

