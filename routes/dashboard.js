const express = require('express')
const router = express.Router();
const {dashboardData,analytics,findBestSellingProducts,managerReport}= require('../controllers/dashboardController')

router.route('/')
.get(dashboardData)
router.route('/manager-report')
.get(managerReport)
router.route('/best-selling-product')
.get(findBestSellingProducts)
// .post()

router.route('/analytics')
.get(analytics)



module.exports = router