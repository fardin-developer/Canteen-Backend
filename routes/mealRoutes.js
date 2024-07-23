const express = require("express");
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { authenticateUser, authorizePermissions } = require("../middleware/authentication");
const { createMeal, getAllMeals, getSingleMeal, updateMeal, deleteMeal, uploadImage } = require("../controllers/mealController");
const { getSingleMealReviews } = require("../controllers/reviewController");

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/Products');
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueName + ext);
  }
});

const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only images are allowed'), false);
    }
    cb(null, true);
  }
});

router
  .route("/")
  .post(upload.single('productImg'), createMeal)
  .get(getAllMeals);

router
  .route("/:id")
  .get(getSingleMeal)
  .patch(updateMeal)
  .delete([authenticateUser, authorizePermissions("admin")], deleteMeal);

router.route("/:id/reviews").get(getSingleMealReviews);

module.exports = router;
