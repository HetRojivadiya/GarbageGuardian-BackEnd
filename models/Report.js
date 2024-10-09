const mongoose = require('mongoose');

const ReportSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['issued', 'accepted', 'completed'],
    default: 'issued'
  },
  address: {
    city: { type: String, required: true },
    state: { type: String, required: true },
    pincode: { type: String, required: true }
  },
  issuedDate: {
    type: Date,
    default: Date.now
  },
  wasteType: {
    type: String,
    enum: [
      'dry',
      'organic waste',
      'packaging waste',
      'post-consumer waste',
      'radioactive waste',
      'recyclable waste',
      'residual waste'
    ],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  harmfulLevel: {
    type: String,
    enum: ['high', 'moderate', 'less'],
    required: true
  },
  images: [{
    url: String,
    public_id: String
  }],
  // Future-proof for Google location data
  location: {
    type: {
      type: String, // 'Point'
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number],
      default: undefined
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Report', ReportSchema);
