const express = require('express')
const router = express.Router();
const {dashboardData,analytics}= require('../controllers/dashboardController')

router.route('/')
.get(dashboardData)
// .post()

router.route('/analytics')
.get(analytics)
router.route('/analytics')
.get(analytics)


module.exports = router