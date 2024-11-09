const cloudinary = require('../config/cloudinary');
const Product = require('../models/Product');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const PurchasedProduct = require('../models/PurchasedProduct');

exports.CreateProduct = asyncHandler(async (req, res, next) => {
  const { name, description, price, quantity } = req.body;

  // Check for required fields
  if (!name || !description || !price || quantity === undefined) {
    return next(new ErrorResponse("Please provide all required fields", 400));
  }

  // Image Upload to Cloudinary
  let imageUploads = [];
  if (req.files && req.files.length > 0) {
    try {
      imageUploads = await Promise.all(
        req.files.map((file) =>
          new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
              { folder: 'products' },
              (err, result) => {
                if (err) return reject(new ErrorResponse("Image upload failed", 500));
                resolve({ url: result.secure_url, public_id: result.public_id });
              }
            ).end(file.buffer);
          })
        )
      );
    } catch (err) {
      return next(new ErrorResponse("Image upload failed", 500));
    }
  }

  // Create the product
  const product = await Product.create({
    name,
    description,
    price,
    quantity,
    images: imageUploads,
  });

  res.status(201).json({
    success: true,
    data: product,
  });

  next();
});

// Update Product
exports.UpdateProduct = asyncHandler(async (req, res, next) => {
    const { name, description, price, quantity } = req.body;
  
    let product = await Product.findById(req.params.id);
  
    if (!product) {
      return next(new ErrorResponse("No product found with this ID", 404));
    }
  
    // Handle image uploads to Cloudinary
    let imageUploads = product.images;
    if (req.files && req.files.length > 0) {
      try {
        imageUploads = await Promise.all(
          req.files.map(async (file) => {
            const result = await cloudinary.uploader.upload(file.path, {
              folder: "products",
            });
            return { url: result.secure_url, alt: file.originalname };
          })
        );
      } catch (err) {
        return next(new ErrorResponse("Image upload failed", 500));
      }
    }
  
    // Update product fields
    product = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name: name || product.name,
        description: description || product.description,
        price: price || product.price,
        quantity: quantity !== undefined ? quantity : product.quantity,
        images: imageUploads,
      },
      { new: true, runValidators: true }
    );
  
    res.status(200).json({
      success: true,
      data: product,
    });
  });
  

  

// Get All products 
exports.GetAllProducts = asyncHandler(async (req, res, next) => {
    try {
        const products = await Product.find();

    if (!products || products.length === 0) {
        return next(new ErrorResponse('No products found', 404));
    }
    res.status(200).json({
        success: true,
        count: products.length,
        data: products
    });
    } catch (error) {
        return next(new ErrorResponse("Somthing Broke",500));
    }
});


// Get perticular product with given id
exports.GetProduct = asyncHandler(async (req, res, next) => {
    try {
      const product = await Product.findById(req.params.id);
  
      if (!product) {
        return next(new ErrorResponse("No Product found with this ID", 404));
      }
  
      res.status(200).json({
        status: 'success',
        data: {
          product: product 
        }
      });
    } catch (error) {
      return next(new ErrorResponse("Error fetching product", 500));
    }
  });
  

//   Delete product 
exports.DeleteProduct = async (req, res, next) => {
    try {
      const product = await Product.findByIdAndDelete(req.params.id);
  
      if (!product) {
        return next(new ErrorResponse("No Product found with this ID", 404));
      }
  
      res.status(204).json({
        status: 'success',
        data: null
      });
    } catch (error) {
      return next(new ErrorResponse("Error deleting product", 500));
    }
  };
  

//   // Purchase a product
// exports.purchaseProduct = asyncHandler(async (req, res, next) => {
//   const { productId, quantity, totalPrice } = req.body;
//   const userId = req.user; // Get user ID from auth middleware

//   if (!productId || !quantity || !totalPrice) {
//       return next(new ErrorResponse("Please provide all required fields", 400));
//   }

//   const purchasedProduct = await PurchasedProduct.create({
//       userId,
//       productId,
//       quantity,
//       totalPrice
//   });

//   res.status(201).json({
//       success: true,
//       data: purchasedProduct
//   });
// });


// Get all purchased products for a user
exports.getPurchasedProducts = asyncHandler(async (req, res, next) => {
  const userId = req.user; // Get user ID from auth middleware


  const purchasedProducts = await PurchasedProduct.find({ userId }).populate('productId');

  res.status(200).json({
      success: true,
      data: purchasedProducts
  });
});




// Get all purchased products for admin
exports.getAllPurchasedProducts = asyncHandler(async (req, res, next) => {


  const purchasedProducts = await PurchasedProduct.find().populate('productId'); // populate for product details

  res.status(200).json({
      success: true,
      data: purchasedProducts
  });
});

// Update the status of an order
exports.updateOrderStatus = asyncHandler(async (req, res, next) => {
  const { status } = req.body; // Expecting the new status in the request body
  const { id } = req.params;

  const PurchasedProductDetails = await PurchasedProduct.findById(id);

  if(PurchasedProductDetails.status==='Cancelled')
  {
    const product = await Product.findById(PurchasedProductDetails.productId);
    product.quantity -= PurchasedProductDetails.quantity;
    await product.save();
  }

  const updatedOrder = await PurchasedProduct.findByIdAndUpdate(id, { status }, { new: true, runValidators: true });

  if (!updatedOrder) {
      return next(new ErrorResponse("No order found with this ID", 404));
  }

  res.status(200).json({
      success: true,
      data: updatedOrder
  });
});


// Cancel an order
exports.cancelOrder = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  const cancelledOrder = await PurchasedProduct.findByIdAndUpdate(
    id,
    { status: "Cancelled" },
    { new: true, runValidators: true }
  );

  if (!cancelledOrder) {
    return next(new ErrorResponse("No order found with this ID", 404));
  }

  const product = await Product.findById(cancelledOrder.productId);

  product.quantity += cancelledOrder.quantity;
  await product.save();

  res.status(200).json({
    success: true,
    data: cancelledOrder
  });
});
