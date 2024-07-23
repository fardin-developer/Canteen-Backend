// models/Meal.js: Defines the schema for the 'Meal' document in MongoDB using Mongoose.

const { required } = require("joi");
const mongoose = require("mongoose");

const MealSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true, // Trims whitespace from the name
      required: [true, "Please provide meal name"], // Makes the name field required
      maxLength: [100, "Name cannot be more than 100 characters"], // Limits the name length
    },
    cost: {
      type: Number,
      required: [true, "Please provide cost of food"], // Makes the price field required
      default: 0, // Sets a default price value
    },
    price: {
      type: Number,
      required: [true, "Please provide selling price"], // Makes the price field required
      default: 0, // Sets a default price value
    },
    description: {
      type: String,
      required: [true, "Please provide meal description"], // Makes the description field required
      maxLength: [1000, "Description cannot be more than 1000 characters"], // Limits the description length
    },
    image: {
      type: String,
    },
    category: {
      type: String,
      required: [true, "Please provide meal category"], // Category is required
      enum: ["breakfast", "lunch", "snacks","juice","others"], // Enumerates the possible values for category
    },
    stock:{
      type:String,
      required:[true,"Please enter availability of stock"],
      enum:["available","unavailable"]
    },
    featured: {
      type: Boolean,
      default: false, // Specifies whether the meal is featured or not
    },
    averageRating: {
      type: Number,
      default: 0, // Default average rating before any reviews
    },
    numOfReviews: {
      type: Number,
      default: 0, // Tracks the number of reviews a meal has received
    },
    // user: {
    //   type: mongoose.Types.ObjectId, // References the User model for meal ownership
    //   ref: "User",
    //   required: true,
    // },
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } } // Enable timestamps and virtuals
);

// Define a virtual property 'reviews' that provides a linkage to the 'Review' model
MealSchema.virtual("reviews", {
  ref: "Review", // The model to use
  localField: "_id", // Field in Meal that matches the 'foreignField' in Review
  foreignField: "meal", // Field in Review that matches the 'localField' in Meal
  justOne: false, // Indicates that multiple reviews can be linked to a meal
});

// Middleware to delete all related reviews when a meal is removed
MealSchema.pre("remove", async function (next) {
  await this.model("Review").deleteMany({ meal: this._id });
});

module.exports = mongoose.model("Meal", MealSchema); // Export the model for use in the application
