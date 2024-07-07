const express = require("express");
const router = express.Router();
const {
  authenticateUser,
  authorizePermissions,
} = require("../middleware/authentication");

const {
  createMeal,
  getAllMeals,
  getSingleMeal,
  updateMeal,
  deleteMeal,
  uploadImage,
} = require("../controllers/mealController");

const { getSingleMealReviews } = require("../controllers/reviewController");

router
  .route("/")
  .post( createMeal)
  .get([authenticateUser],getAllMeals);

  

router
  .route("/uploadImage")
  .post([authenticateUser], uploadImage);

router
  .route("/:id")
  .get(getSingleMeal)
  // .patch([authenticateUser, authorizePermissions("admin")], updateMeal)
  .patch( updateMeal)
  .delete([authenticateUser, authorizePermissions("admin")], deleteMeal);

router.route("/:id/reviews").get(getSingleMealReviews);

module.exports = router;
