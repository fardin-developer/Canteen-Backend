const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const paymentSchema = new Schema({
    id:{
        type: String,
        require:true
    },
    order_id: {
      type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    user_id: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    payment_method: {
        type: String,
        required: true
    },
    payment_status: {
        type: String,
        required: true
    },
    transaction_id: {
        type: String,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    }
});

// Middleware to update the updated_at field before saving
paymentSchema.pre('save', function(next) {
    this.updated_at = Date.now();
    next();
});

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;
