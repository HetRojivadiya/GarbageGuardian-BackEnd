// routes/emailRoutes.js
const express = require('express');
const nodemailer = require('nodemailer');
const router = express.Router();

// POST route to send the email
router.post('/send-email', async (req, res) => {
  const { name, email, message } = req.body;

  // Set up Nodemailer transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,  // Your Gmail address
      pass: process.env.EMAIL_PASS,  // Your Gmail app-specific password
    },
  });



  // Email options
  const mailOptions = {
   
    from: email,  // Sender's email
    to: 'hetrojivadiya999@gmail.com',  // Your email
    subject: `Contact Us Form: ${name}`,  // Subject line
    text: `You have received a message from ${name} (${email}).\n\nMessage:\n${message}`,  // Email body
  };

  // Send email
  try {
    await transporter.sendMail(mailOptions);
    return res.status(200).json({ message: 'Email sent successfully!' });
  } catch (error) {
    console.error('Error sending email:', error);
    return res.status(500).json({ error: 'Failed to send email. Please try again later.' });
  }
});

module.exports = router;
