require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors'); // Import cors
const authRoutes = require('./routes/authRoutes');
const reportRoutes = require('./routes/reportRoutes');
// const recyclingRoutes = require('./routes/recyclingRoutes');
// const serviceRoutes = require('./routes/serviceRoutes');

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors()); // Enable CORS for all routes
app.use(express.json());  // To parse JSON bodies

// Database Connection
const connectDB = require('./config/db');
connectDB();

// Routes
app.use('/auth', authRoutes);
app.use('/report', reportRoutes);
// app.use('/sellRecyclingProducts', recyclingRoutes);
// app.use('/serviceRequest', serviceRoutes);

// Error handling Middleware (optional)
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start the server
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
