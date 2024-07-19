const express = require("express");
const router = express.Router();
const { paymentSave } = require('../controllers/paymentController')



router
    .route("/")
    .post(paymentSave)
//   .get();


module.exports = router;
