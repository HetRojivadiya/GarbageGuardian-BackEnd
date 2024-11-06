// payment.js
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
const redirectUrl = "http://localhost:3001/payment/status";
const successUrl = "http://localhost:3000/#/payment-successful";
const failureUrl = "http://localhost:3000/#/payment-failed";

// Route to create an order
router.post('/create-order',async (req, res) => {
  try {
    const { productId, quantity, amount ,userId} = req.body;
    



    if (!userId || !productId || !quantity || !amount) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const orderId = uuidv4();
    const paymentPayload = {
      merchantId: MERCHANT_ID,
      merchantUserId: userId,
      mobileNumber: 9,
      amount: amount * 100,
      merchantTransactionId: orderId,
      redirectUrl: `${redirectUrl}?orderId=${orderId}&userId=${userId}&productId=${productId}&quantity=${quantity}&amount=${amount}`,
      redirectMode: 'POST',
      paymentInstrument: { type: 'PAY_PAGE' }
    };

    const payload = Buffer.from(JSON.stringify(paymentPayload)).toString('base64');
    const keyIndex = 1;
    const string = payload + '/pg/v1/pay' + MERCHANT_KEY;
    const sha256 = crypto.createHash('sha256').update(string).digest('hex');
    const checksum = sha256 + '###' + keyIndex;

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

    const response = await axios.request(option);
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
    const { orderId, userId, productId, quantity, amount } = req.query;

    if (!orderId || !userId || !productId || !quantity || !amount) {
      return res.status(400).json({ error: "Missing required fields." });
    }

    const keyIndex = 1;
    const string = `/pg/v1/status/${MERCHANT_ID}/${orderId}` + MERCHANT_KEY;
    const sha256 = crypto.createHash('sha256').update(string).digest('hex');
    const checksum = sha256 + '###' + keyIndex;

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

    const response = await axios.request(option);
    if (response.data.success === true) {
      await PurchasedProduct.create({
        userId,
        productId,
        quantity,
        totalPrice: amount
      });

      const product = await Product.findById(productId);

      product.quantity -= quantity;
      await product.save();

    

      return res.redirect(successUrl);
    } else {
      return res.redirect(failureUrl);
    }
  } catch (error) {
    console.error('Error checking payment status:', error);
    res.status(500).json({ error: 'Failed to check payment status' });
  }
});

module.exports = router;
