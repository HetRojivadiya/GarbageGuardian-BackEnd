const express = require('express');
const router = express.Router();
const recyclingController = require('../controllers/recyclingController');
const authMiddleware = require('../middleware/authMiddleware');
const upload = require('../middleware/multer'); 

// Get all recycled products
router.route('/recycled-products').get(recyclingController.GetAllProducts);

// Create a new recycled product
router.route('/recycled-products').post(
    upload.array('images', 5), // Use multer to handle multiple image uploads
    recyclingController.CreateProduct
  );

// Get a specific recycled product by ID
router.route('/recycled-products/:id').get(authMiddleware, recyclingController.GetProduct);

// Update a specific recycled product by ID
router.route('/recycled-products/:id').put(
    authMiddleware,
    upload.array('images', 5), // Use multer to handle multiple image uploads
    recyclingController.UpdateProduct
  );


// Get all purchased products for a user
router.route('/getPurchasedProducts').get(authMiddleware, recyclingController.getPurchasedProducts);

// Delete a specific recycled product by ID
router.route('/recycled-products/:id').delete(authMiddleware, recyclingController.DeleteProduct);


// Get all purchased products for admin
router.route('/getAllPurchasedProducts').get(recyclingController.getAllPurchasedProducts);

// Update the status of an order
router.route('/updateOrderStatus/:id').put(recyclingController.updateOrderStatus);


module.exports = router;
