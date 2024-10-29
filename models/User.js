const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  typeOfUser: {
    type: String,
    enum: ['People', 'Service Provider', 'Foundation & Organisation', 'Municipal Corporation'],
    required: true
  },
  status: {
    type: String,
    enum: ['Verified', 'Pending'],
    default: 'Pending'
  }, 
  averageRating: {
    type: Number,
    default: 0,
  },
  totalRatings: { type: Number, default: 0 }, // New field to track total rating points
  ratingCount: { type: Number, default: 0 },
}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
