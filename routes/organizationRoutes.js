const express = require('express');
const router = express.Router();
const { getOrganizations, verifyOrganization, unverifyOrganization } = require('../controllers/organizationController');

// Get all organizations
router.get('/', getOrganizations);

// Verify organization
router.patch('/:id/verify', verifyOrganization);

// Unverify organization
router.patch('/:id/unverify', unverifyOrganization); 

module.exports = router;
