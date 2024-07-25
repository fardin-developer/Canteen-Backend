// controllers/mealController.js: Handles all meal-related operations such as creation, retrieval, updating, and deletion.

const Meal = require("../models/Meal"); // Import the Meal model for database interactions.
const { StatusCodes } = require("http-status-codes"); // HTTP status codes for response status.
const CustomError = require("../errors"); // Custom error classes for error handling.
const path = require("path"); // Node.js path module for file path operations.
const fs = require('fs');
/**
 * Creates a new meal document in the database with the provided details in the request body.
 */
const createMeal = async (req, res) => {
  try {
    console.log(req.file);
    console.log(req.body);

    // // Generate image URL
    const imageUrl = `${req.protocol}://${req.get('host')}/uploads/Products/${req.file?.filename}`;
    req.body.image = imageUrl; // Add image URL to req.body
    console.log(req.body.image);

    // // Assign the meal to the logged-in user (assuming user ID is stored in req.user)
    // req.body.user = req.user.id;

    // Create the meal document
    const meal = await Meal.create(req.body);

    // Respond with the created meal
    res.status(StatusCodes.CREATED).json({ meal });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'Something went wrong' });
  }
};


/**
 * Retrieves all meal documents from the database.
 */
const getAllMeals = async (req, res) => {
  const meals = await Meal.find({stock:'available'}); // Find all meals.
  res.status(StatusCodes.OK).json({ meals, count: meals.length }); // Respond with all meals and their count.
};
const upDateByCategory = async (req, res) => {
  const { category, availability } = req.query;
  console.log('hittttt');
  console.log('Availability:', availability);
  console.log('Category:', category);

  try {
    const result = await Meal.updateMany(
      { category: category },
      { $set: { stock: availability } }
    );
    // console.log('Update Result:', result);
    res.status(200).json({ message: 'Availability updated successfully', result });
  } catch (error) {
    console.error('Update Error:', error);
    res.status(500).json({ message: 'An error occurred', error });
  }
};



/**
 * Retrieves a single meal document based on the provided ID in the request parameters.
 */
const getSingleMeal = async (req, res) => {
  const { id: mealId } = req.params; // Extract meal ID from request parameters.

  try {
    const meal = await Meal.findOne({ _id: mealId }).populate("reviews");

    if (!meal) {
      throw new CustomError.NotFoundError(`No meal with id: ${mealId}`);
    }

    res.status(StatusCodes.OK).json({ meal });
  } catch (error) {
    // Handle errors, possibly log them, and send an appropriate response
    console.error(error); // Log the error for debugging purposes

    if (error instanceof CustomError.NotFoundError) {
      res.status(StatusCodes.NOT_FOUND).json({ error: error.message });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'An unexpected error occurred.' });
    }
  }
};


/**
 * Updates a meal document based on the provided ID in the request parameters with the details in the request body.
 */
const updateMeal = async (req, res) => {
  try {
    const { id: mealId } = req.params; // Extract meal ID from request parameters.

    // Find the existing meal document
    const existingMeal = await Meal.findById(mealId);
    if (!existingMeal) {
      return res.status(StatusCodes.NOT_FOUND).json({ error: `No meal with id: ${mealId}` });
    }

    // Handle file upload if a new image is uploaded
    if (req.file) {
      // Generate new image URL
      const imageUrl = `${req.protocol}://${req.get('host')}/uploads/Products/${req.file.filename}`;
      req.body.image = imageUrl; // Add new image URL to req.body

      // Remove existing image file from the server
      const existingImagePath = path.join(__dirname, '../uploads/Products', path.basename(existingMeal.image));
      fs.unlink(existingImagePath, (err) => {
        if (err) {
          console.error(`Failed to delete old image: ${err}`);
        }
      });
    }

    // Update the meal document with new data
    const updatedMeal = await Meal.findOneAndUpdate({ _id: mealId }, req.body, {
      new: true, // Return the updated document.
      runValidators: true, // Run model validators on update.
    });

    res.status(StatusCodes.OK).json({ meal: updatedMeal }); // Respond with the updated meal.
  } catch (error) {
    console.error(error); // Log the error for debugging purposes.
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: 'An error occurred while updating the meal.' }); // Respond with a generic error message.
  }
};


/**
 * Deletes a meal document based on the provided ID in the request parameters.
 */
const deleteMeal = async (req, res) => {
  const { id: mealId } = req.params; // Extract meal ID from request parameters.

  try {
    const meal = await Meal.findOne({ _id: mealId }); // Find the meal.

    if (!meal) {
      return res.status(404).json({
        success: false,
        message: `No meal found with id: ${mealId}`
      });
    }

    await meal.remove(); // Remove the meal document.

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Success! The meal has been removed." // Respond with success message.
    });
  } catch (error) {
    console.error('Error deleting meal:', error); // Log the error for debugging

    res.status(500).json({
      success: false,
      message: 'Server error while deleting meal'
    });
  }
};

/**
 * Handles the upload of a meal image, validating the file type and size before saving.
 */
const uploadImage = async (req, res) => {
  if (!req.files) {
    throw new CustomError.BadRequestError("No file uploaded"); // Handle no file uploaded.
  }
  const mealImage = req.files.image; // Access the uploaded file.

  // Validate file type is an image.
  if (!mealImage.mimetype.startsWith("image")) {
    throw new CustomError.BadRequestError("Please upload image");
  }

  // Validate file size.
  const maxSize = 1024 * 1024; // 1MB
  if (mealImage.size > maxSize) {
    throw new CustomError.BadRequestError(
      "Please upload image smaller than 1MB"
    );
  }

  // Define the path for the image file.
  const imagePath = path.join(
    __dirname,
    "../public/uploads/" + `${mealImage.name}`
  );
  await mealImage.mv(imagePath); // Move the file to the designated path.

  // Respond with the path of the uploaded image.
  res.status(StatusCodes.OK).json({ image: `/uploads/${mealImage.name}` });
};

// Exporting all controller functions to be used in routes.
module.exports = {
  createMeal,
  getAllMeals,
  getSingleMeal,
  updateMeal,
  deleteMeal,
  uploadImage,
  upDateByCategory
};
