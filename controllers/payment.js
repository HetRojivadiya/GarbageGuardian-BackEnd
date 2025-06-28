require('dotenv').config();
const express = require('express');
const axios = require('axios');
const crypto = require('crypto');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const authMiddleware = require('../middleware/authMiddleware');
const PurchasedProduct = require('../models/PurchasedProduct');
const Product = require('../models/Product');

const MERCHANT_KEY = "96434309-7796-489d-8924-ab56988a6076";
const MERCHANT_ID = "PGTESTPAYUAT86";
const MERCHANT_BASE_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay";
const MERCHANT_STATUS_URL = "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/status";
const redirectUrl = "https://garbageguardian-backend.onrender.com/payment/status";
const successUrl = "https://hetrojivadiya.github.io/GarbageGuardian-FrontEnd/#/payment-successful";
const failureUrl = "https://hetrojivadiya.github.io/GarbageGuardian-FrontEnd/#/payment-failed";

// Route to create an order
router.post('/create-order', async (req, res) => {
  try {
    const { productId, quantity, amount, userId, address } = req.body;

    // Validation
    if (!userId || !productId || !quantity || !amount || !address) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    // Create unique orderId using uuid
    const orderId = uuidv4();

    // Payment payload
    const paymentPayload = {
      merchantId: MERCHANT_ID,
      merchantUserId: userId,
      mobileNumber: 9, // Replace with actual user mobile number
      amount: amount * 100, // Convert to paise
      merchantTransactionId: orderId,
      redirectUrl: `${redirectUrl}?orderId=${orderId}&userId=${userId}&productId=${productId}&quantity=${quantity}&amount=${amount}&address=${JSON.stringify(address)}`,
      redirectMode: 'POST',
      paymentInstrument: { type: 'PAY_PAGE' }
    };

    // Encode the payload to base64
    const payload = Buffer.from(JSON.stringify(paymentPayload)).toString('base64');
    
    // Create checksum for security
    const keyIndex = 1;
    const string = payload + '/pg/v1/pay' + MERCHANT_KEY;
    const sha256 = crypto.createHash('sha256').update(string).digest('hex');
    const checksum = sha256 + '###' + keyIndex;

    // Configure request to the payment gateway
    const option = {
      method: 'POST',
      url: MERCHANT_BASE_URL,
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
        'X-VERIFY': checksum
      },
      data: {
        request: payload
      }
    };

    // Send request to the payment gateway
    const response = await axios.request(option);

    // Return the payment redirect URL
    res.status(200).json({
      msg: "OK",
      url: response.data.data.instrumentResponse.redirectInfo.url
    });
  } catch (error) {
    console.error("Error in payment", error);
    res.status(500).json({ error: 'Failed to initiate payment' });
  }
});

// Route to check payment status and save purchase if successful
router.post('/status', async (req, res) => {
  try {
    const { orderId, userId, productId, quantity, amount, address } = req.query;

    // Validation
    if (!orderId || !userId || !productId || !quantity || !amount || !address) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    // Create checksum for payment status verification
    const keyIndex = 1;
    const string = `/pg/v1/status/${MERCHANT_ID}/${orderId}` + MERCHANT_KEY;
    const sha256 = crypto.createHash('sha256').update(string).digest('hex');
    const checksum = sha256 + '###' + keyIndex;

    // Configure request to the payment gateway for checking status
    const option = {
      method: 'GET',
      url: `${MERCHANT_STATUS_URL}/${MERCHANT_ID}/${orderId}`,
      headers: {
        accept: 'application/json',
        'Content-Type': 'application/json',
        'X-VERIFY': checksum,
        'X-MERCHANT-ID': MERCHANT_ID
      },
    };

    // Send request to get payment status
    const response = await axios.request(option);

    // If payment is successful
    if (response.data.success === true) {
      // Save purchase details, including shipping address
      await PurchasedProduct.create({
        userId,
        productId,
        quantity,
        totalPrice: amount,
        address: JSON.parse(address) // Save address in the database
      });

      // Reduce product quantity in stock
      const product = await Product.findById(productId);
      product.quantity -= quantity;
      await product.save();

      // Redirect to success page
      return res.redirect(successUrl);
    } else {
      // Redirect to failure page
      return res.redirect(failureUrl);
    }
  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({ error: 'Failed to check payment status' });
  }
});

module.exports = router;
