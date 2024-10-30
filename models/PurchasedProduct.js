const mongoose = require('mongoose');

const PurchasedProductSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true
    },
    totalPrice: {
        type: Number,
        required: true
    },
    purchasedAt: {
        type: Date,
        default: Date.now
    },
    status: {
        type: String,
        enum: ['Order Confirmed', 'Order Shipped', 'Order Delivered'],
        default: 'Order Confirmed'
    }
});

module.exports = mongoose.model('PurchasedProduct', PurchasedProductSchema);