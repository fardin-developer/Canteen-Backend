const Order = require('../models/Order')
const Payment = require('../models/Payment')
const Meal = require('../models/Meal')



const dashboardData = async (req, res) => {
    try {
        const orderAggregation = await Order.aggregate([
            {
                $group: {
                    _id: null,
                    totalPrice: { $sum: "$total" },
                    totalcost: { $sum: "$totalcost" }
                }
            }
        ]);
        const order = await Order.find();
        console.log(orderAggregation);
        const totalPrice = orderAggregation[0] ? orderAggregation[0].totalPrice : 0;
        const totalcost = orderAggregation[0] ? orderAggregation[0].totalcost : 0;

        //   console.log(order);
        res.json({
            order,
            totalPrice,
            totalcost,
            totalOrder: order.length
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
          createdAt: { $gte: sevenDaysAgo }
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