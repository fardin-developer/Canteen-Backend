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
        $match: { status: "paid" }
      },
      {
        $group: {
          _id: null,
          totalPrice: { $sum: "$total" },
          totalcost: { $sum: "$totalcost" }
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
            category: product.category, // Use the actual category from the product
            sales: item.price * item.amount,
            items: item.amount
          });
        }
      }
    }

    const totalPrice = orderAggregation[0] ? orderAggregation[0].totalPrice : 0;
    const totalcost = orderAggregation[0] ? orderAggregation[0].totalcost : 0;

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



const analytics = async (req, res) => {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const dailySales = await Order.aggregate([
      {
        $match: {
          createdAt: { $gte: sevenDaysAgo },
          status: "paid"
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






module.exports = { dashboardData, analytics }