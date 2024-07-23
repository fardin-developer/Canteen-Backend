const express = require("express");
const router = express.Router();
const {    authenticateUser,    authorizePermissions,  } = require("../middleware/authentication");
const { paymentSave, getCurrentUserTransactions } = require('../controllers/paymentController')



router
    .route("/")
    .post(paymentSave)
//   .get();
router.route('/showAllMyTransactions').get(authenticateUser, getCurrentUserTransactions);


module.exports = router;
