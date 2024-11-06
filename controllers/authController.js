const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Signup
exports.signup = async (req, res) => {
  const { name, email, password, typeOfUser } = req.body; 
  try {
    const user = new User({ 
      name, 
      email, 
      password, 
      typeOfUser, 
      status: 'Pending' 
    });
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(password, salt);
    await user.save();
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ message: error });
  }
};

// Login
exports.login = async (req, res) => {

  
  const { email, password } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid Credentials' });

   

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid Credentials' });

 

    const token = jwt.sign({ userId: user._id , userName : user.name, typeOfUser:user.typeOfUser,   status : user.status}, process.env.JWT_SECRET);
    res.json({ token });
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
};

// Forgot Password
exports.forgotPassword = (req, res) => {
  // Implement password recovery logic here
  res.send('Forgot password functionality goes here');
};
