const Order = require('../models/Order') // Importing the Order model.
const Meal = require('../models/Meal') // Importing the Meal model for order item references.
const User = require('../models/User')
const Payment = require('../models/Payment')
const Razorpay = require('razorpay');
const crypto = require('crypto');
const mongoose = require('mongoose');
const razorpay = new Razorpay({
  key_id: 'rzp_test_oicgEyGT9bn0Fi',
  key_secret: 'A7fOm4SVDoJVGCxZIiXmmSf0',
});
const moment = require('moment');


const { StatusCodes } = require('http-status-codes') 
const CustomError = require('../errors') 
const { checkPermissions } = require('../utils') 

const createOrder = async (req, res) => {
  const { items: cartItems } = req.body
  if (!cartItems || cartItems.length < 1) {
    throw new CustomError.BadRequestError('There are no items in the cart')
  }

  let orderItems = []
  let subtotal = 0;
  let totalcost = 0;
  for (const item of cartItems) {
    const dbMeal = await Meal.findOne({ _id: item.meal })
    if (!dbMeal) {
      throw new CustomError.NotFoundError(`No meal with id: ${item.meal}`)
    }
    // console.log(dbMeal)
    const { name,description, price,cost, image, _id } = dbMeal
    const singleOrderItem = {
      amount: item.amount,
      name,
      description,
      price,
      cost,
      image,
      product: _id
    }
    orderItems.push(singleOrderItem)
    subtotal += item.amount * price;
    totalcost += item.amount * cost
  }

  // Calculate the total cost and simulate payment intent.
  const total = subtotal


  // Create the order in the database.
  const order = await Order.create({
    orderItems,
    total,
    subtotal,
    totalcost,
    client: 'paymentIntent.client_secret',
    user: req.user.userId
  })

  const razorpayOrder = await razorpay.orders.create({
    amount: total * 100, 
    currency: 'INR',
    receipt: order._id,
    payment_capture: 1,
  });
  const payment = new Payment({
    id: new mongoose.Types.ObjectId().toString(),
    order_id: order._id.toString(),
    user_id: req.user.userId,
    amount: total,
    payment_method: 'razorpay',
    payment_status: 'pending',
    transaction_id: razorpayOrder.id,
    created_at: new Date(),
    updated_at: new Date(),
  });
  await payment.save()

  res
    .status(StatusCodes.CREATED)
    .json({
      order,
      razorpayOrderId: razorpayOrder.id,
    })
}











/**
 * Retrieves all orders from the database.
 */
const getAllOrders = async (req, res) => {
  const statusQuery = req.query.status
  if (statusQuery && (statusQuery === 'pending' || statusQuery === 'paid' ||
    statusQuery === 'delivered' || statusQuery === 'failed')) {
    const orders = await Order.find({ status: statusQuery })
    res.status(StatusCodes.OK).json({ orders, count: orders.length })

  } else {
    const orders = await Order.find({}).populate('user', 'name email')
    res.status(StatusCodes.OK).json({ orders, count: orders.length })
  }

}

/**
 * Retrieves a single order by its ID, provided in the request parameters.
 */
const getSingleOrder = async (req, res) => {
  const { id: orderId } = req.params
  const order = await Order.findOne({ _id: orderId })
  if (!order) {
    throw new CustomError.NotFoundError(`No order with id : ${orderId}`)
  }
  checkPermissions(req.user, order.user) // Check if the user has permission to view this order.
  res.status(StatusCodes.OK).json({ order })
}

/**
 * Retrieves all orders placed by the currently authenticated user.
 */
const getCurrentUserOrders = async (req, res) => {
  const { range, startDate, endDate } = req.query;
  let start;
  let end = new Date();
  console.log(startDate);

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

  const orders = await Order.find({
    user: req.user.userId,
    createdAt: {
      $gte: start,
      $lte: end
    }
  });

  res.status(StatusCodes.OK).json({ orders, count: orders.length });
};

/**
 * Updates the status of an order to 'paid' once the payment is completed.
 */
const updateOrder = async (req, res) => {
  const { id: orderId } = req.params
  const statusQuery = req.query.status
  console.log(statusQuery);

  // const { paymentIntentId } = req.body;
  console.log(orderId)

  const order = await Order.findOne({ _id: orderId })
  if (!order) {
    throw new CustomError.NotFoundError(`No order with id : ${orderId}`)
  }
  // checkPermissions(req.user, order.user); // Verify user permission to update the order.

  // Update the order status.
  // order.paymentIntentId = paymentIntentId;
  order.status = statusQuery
  await order.save()

  res.status(StatusCodes.OK).json({ order })
}

// Exporting controller functions to be used in route definitions.
module.exports = {
  getAllOrders,
  getSingleOrder,
  getCurrentUserOrders,
  createOrder,
  updateOrder
}
