const express = require("express");
const router = express.Router();
const { createCategory, getCategory, updateCategory, deleteCategory } = require('../controllers/categoryConroller')

// Define the routes with their respective methods
router.route('/')
    .post(createCategory) // POST method for creating a category
    .get(getCategory);    // GET method for retrieving all categories

router.route('/:id')
    .put(updateCategory)  // PUT method for updating a category by ID
    .delete(deleteCategory); // DELETE method for deleting a category by ID

module.exports = router;
