const express = require('express');
const { issueReport } = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/multer');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.post('/issue', authMiddleware, upload.array('images', 5), issueReport);

router.get('/issued', authMiddleware, reportController.getIssuedReports);

module.exports = router;
