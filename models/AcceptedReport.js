const mongoose = require('mongoose');

const AcceptedReportSchema = new mongoose.Schema({
  report: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Report',
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['accepted', 'completed'],
    default: 'accepted'
  },
}, { timestamps: true });

module.exports = mongoose.model('AcceptedReport', AcceptedReportSchema);
