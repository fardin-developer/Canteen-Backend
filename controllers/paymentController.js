const Payment = require('../models/Payment')
const moment = require('moment');
const { StatusCodes } = require('http-status-codes');

const {
    authenticateUser,
    authorizePermissions,
} = require("../middleware/authentication");

const paymentSave = async (req, res) => {
    const { payment } = req.body;
    console.log(payment);
}

const getCurrentUserTransactions = async (req, res) => {
    console.log('hitt');
    const { range, startDate, endDate } = req.query;
    let start;
    let end = new Date();

    switch (range) {
        case 'lastWeek':
            start = moment().subtract(7, 'days').toDate();
            break;
        case 'lastMonth':
            start = moment().subtract(1, 'months').toDate();
            break;
        case 'lastYear':
            start = moment().subtract(1, 'years').toDate();
            break;
        case 'custom':
            if (startDate && endDate) {
                start = new Date(startDate);
                end = new Date(endDate);
            } else {
                return res.status(StatusCodes.BAD_REQUEST).json({ msg: 'Invalid custom date range' });
            }
            break;
        default:
            start = new Date(0);
    }

    const transactions = await Payment.find({
        user_id: req.user.userId,
        created_at: {
            $gte: start,
            $lte: end
        }
    });
    // console.log(transactions);

    res.status(StatusCodes.OK).json({ transactions, count: transactions.length });
};

module.exports = { paymentSave, getCurrentUserTransactions }