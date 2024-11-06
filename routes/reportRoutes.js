const express = require('express');
const { issueReport, cancelIssuedReport, acceptReport, cancelAcceptReport, fetchIssuedReportsById , getIssuedReports ,fetchAcceptedReports,
    fetchCompletedIssues,rateOrganization,completeIssue} = require('../controllers/reportController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/multer');
const router = express.Router();

router.get('/fetchIssuedReports', authMiddleware, fetchIssuedReportsById);
router.get('/fetchAcceptedReports', authMiddleware, fetchAcceptedReports);
router.get('/fetchCompletedIssues', authMiddleware, fetchCompletedIssues);
router.delete('/cancelIssuedReport/:id', authMiddleware, cancelIssuedReport);
router.post('/acceptReport/:id', authMiddleware, acceptReport); 
router.delete('/cancelAcceptReport/:id', authMiddleware, cancelAcceptReport); 
router.post('/issue', authMiddleware, upload.array('images', 5), issueReport);
router.get('/issued', getIssuedReports);
router.post('/rate',authMiddleware,rateOrganization);
router.post('/completeIssue/:id',authMiddleware,completeIssue);



module.exports = router;
