const Order = require('../models/Order')
const Payment = require('../models/Payment')
const Product = require('../models/Meal')
const Meal = require('../models/Meal')



const dashboardData = async (req, res) => {
  try {
    // Get the start of the current day (12:00 AM)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    // Aggregate total price and total cost for paid orders
    const orderAggregation = await Order.aggregate([
      {
        $match: {
          status: { $in: ["paid", "delivered"] }
        }
      },
      {
        $group: {
          _id: null,
          totalPrice: { $sum: "$total" },
          totalCost: { $sum: "$totalcost" }
        }
      }
    ]);


    // Find all orders
    const allOrders = await Order.find();

    // Find today's paid orders
    const todaysOrders = await Order.find({
      updatedAt: { $gte: startOfToday }, status: { $in: ['paid', 'delivered'] }
    });

    // Initialize an empty array to hold daily sales data
    const dailySales = [];

    // Process each order to accumulate daily sales data
    for (const order of todaysOrders) {
      for (const item of order.orderItems) {

        const product = await Product.findById(item.product);
        const existingItem = dailySales.find(sale => sale.name === item.name);

        if (existingItem) {
          existingItem.sales += item.price * item.amount;
          existingItem.items += item.amount;
        } else {
          dailySales.push({
            id: item._id.toString(),
            name: item.name,
            category: product.category,
            sales: item.price * item.amount,
            items: item.amount
          });
        }
      }
    }

    const totalPrice = orderAggregation[0] ? orderAggregation[0].totalPrice : 0;
    const totalcost = orderAggregation[0] ? orderAggregation[0].totalCost : 0;
    console.log(orderAggregation);

    res.json({
      order: allOrders,
      totalPrice,
      totalcost,
      totalOrder: allOrders.length,
      todaysOrders: dailySales
    });
  } catch (error) {
    console.error("Error fetching dashboard data:", error);
    res.status(500).json({ message: "Server error" });
  }
};


const managerReport = async (req, res) => {
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  console.log(startOfToday);

  try {
    const orders = await Order.find({
      createdAt: {
        $gte: startOfToday,
        $lte: endOfToday
      }
    });
    // console.log(orders);

    let totalSales = 0;
    let pendingOrder = 0;
    let deliveredOrder = 0;
    let totalItems = 0;
    let paidOrder = 0;
    let pendingAmount = 0;
    let paidAmount =0;
    let deliveredAmount = 0

    orders.forEach(order => {
      console.log(order.total);
      if (order.status === 'paid') {
        totalSales += order.total;
        paidAmount+= order.total
        paidOrder++;
      }
      if (order.status === 'pending') {
        pendingAmount += order.total
        pendingOrder++;
      }
      if (order.status === 'delivered') {
        totalSales += order.total
        deliveredAmount += order.total
        deliveredOrder++;
      }
      order.orderItems.forEach(item => {
        totalItems += item.amount;
      });
    });
    console.log("totalSales " + totalSales);

    res.json({
      totalSales,
      pendingOrder,
      deliveredOrder,
      paidOrder,
      totalItems,
      pendingAmount,
      paidAmount,
      deliveredAmount
    });
  } catch (error) {
    console.error("Error fetching today's report:", error);
    res.status(500).json({ message: "Server error" });
  }
};



const findBestSellingProducts = async (req, res) => {
  try {
    // Aggregate to find best selling products
    const bestSellingProducts = await Order.aggregate([
      {
        $match: {
          status: { $in: ["paid", "delivered"] } // Match documents with status "paid" or "delivered"
        }
      },
      {
        $unwind: "$orderItems"
      },
      {
        $group: {
          _id: "$orderItems.product",
          totalAmount: { $sum: "$orderItems.amount" },
          totalSales: { $sum: { $multiply: ["$orderItems.price", "$orderItems.amount"] } }
        }
      },
      {
        $lookup: {
          from: "meals", // Ensure this matches your meals collection name
          localField: "_id",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      {
        $unwind: "$productDetails"
      },
      {
        $project: {
          _id: 0,
          productId: "$_id",
          name: "$productDetails.name",
          description: "$productDetails.description",
          image: "$productDetails.image",
          category: "$productDetails.category",
          totalAmount: 1,
          totalSales: 1
        }
      },
      {
        $sort: { totalAmount: -1 } // Sort by total amount sold in descending order
      },
      {
        $limit: 10 // Limit to top 10 best selling products
      }
    ]);

    res.json({ bestSellingProducts });
  } catch (error) {
    console.error("Error fetching best selling products:", error);
    res.status(500).json({ message: "Server error" });
  }
};

const analytics = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailySales = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          status: { $in: ['paid', 'delivered'] }
        }
      },
      {
        $group: {
          _id: { $dayOfYear: "$createdAt" },
          date: { $first: "$createdAt" },
          totalSales: { $sum: "$total" }
        }
      },
      {
        $project: {
          _id: 0,
          date: {
            $dateToString: { format: "%Y-%m-%d", date: "$date" }
          },
          totalSales: 1
        }
      },
      {
        $sort: { date: 1 } // Sort by date
      }
    ]);

    // Transform data to match the desired format
    const formattedData = dailySales.map(sale => ({
      x: sale.date,
      y: sale.totalSales
    }));

    res.json({ period: 'last 7 days', data: formattedData });
  } catch (error) {
    console.error("Error fetching analytics data:", error);
    res.status(500).json({ message: "Server error" });
  }
};








module.exports = { dashboardData, analytics, findBestSellingProducts, managerReport }