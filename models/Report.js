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
      'Dry Waste',
      'Organic Waste',
      'Packaging Waste',
      'Post-Consumer Waste',
      'Radioactive Waste',
      'Recyclable Waste',
      'Residual Waste'
    ],
    required: true
  },
  description: {
    type: String,
    required: true
  },
  harmfulLevel: {
    type: String,
    enum: ['High', 'Moderate', 'Less'],
    required: true
  },
  images: [{
    url: String,
    public_id: String
  }],
  
  locationLink: {  
    type: String,
    required: true 
  },

  rating : {
    type : Number,
    default: 0,

  },

  description : {
    type : String,
  },
  completedDate : {
    type: Date,
  }
  
}, { timestamps: true });

module.exports = mongoose.model('Report', ReportSchema);
