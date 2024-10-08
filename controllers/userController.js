// userController.js: Handles user-related operations such as retrieval and update of user information.

const User = require("../models/User"); // Importing the User model for database operations.
const { StatusCodes } = require("http-status-codes"); // HTTP status codes for response statuses.
const CustomError = require("../errors"); // Custom error handling utilities.
const {
  createTokenUser, // Utility to create a user object suitable for generating tokens.
  attachCookiesToResponse, // Utility to attach tokens as cookies in the response.
  checkPermissions, // Utility for permission checks between users.
} = require("../utils");

/**
 * Retrieves all users with the role of 'user' from the database, excluding their passwords from the response.
 */
const getAllUsers = async (req, res) => {
  const { page = 1, limit = 50 } = req.query; // Default to page 1 and limit 50 if not provided

  try {
    // Calculate the number of documents to skip
    const skip = (page - 1) * limit;

    // Find users with pagination, excluding the password field
    const users = await User.find({ role: "user" })
      .select("-password")
      .limit(parseInt(limit))
      .skip(skip);

    // Get the total count of users to send along with the response
    const totalUsers = await User.countDocuments({ role: "user" });

    res.status(StatusCodes.OK).json({
      users,
      totalUsers,
      totalPages: Math.ceil(totalUsers / limit),
      currentPage: parseInt(page),
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      message: "An error occurred",
      error,
    });
  }
};


/**
 * Retrieves a single user by their ID, excluding the password from the response. Checks permissions to ensure
 * the requesting user has the right to access the requested user's information.
 */
const getSingleUser = async (req, res) => {
  const user = await User.findOne({ _id: req.params.id }).select("-password");
  if (!user) {
    throw new CustomError.NotFoundError(`No user with id : ${req.params.id}`);
  }
  checkPermissions(req.user, user._id); // Permission check to ensure user can only access their own information unless they're admin.
  res.status(StatusCodes.OK).json({ user });
};

/**
 * Shows the currently authenticated user's information.
 */
const showCurrentUser = async (req, res) => {
  res.status(StatusCodes.OK).json({ user: req.user });
};

/**
 * Updates the current user's name and email. Requires the user to be authenticated.
 */
const updateUser = async (req, res) => {
  const { email, name } = req.body;
  if (!email || !name) {
    throw new CustomError.BadRequestError("Please provide all values");
  }
  const user = await User.findOne({ _id: req.user.userId });

  user.email = email;
  user.name = name;

  await user.save(); // Saves the updated user information to the database.

  const tokenUser = createTokenUser(user); // Creates a new token user object.
  attachCookiesToResponse({ res, user: tokenUser }); // Attaches the updated token to the response.
  res.status(StatusCodes.OK).json({ user: tokenUser });
};

/**
 * Allows the user to update their password. Validates the old password before updating to the new password.
 */
const updateUserPassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    throw new CustomError.BadRequestError("Please provide both values");
  }
  const user = await User.findOne({ _id: req.user.userId });

  const isPasswordCorrect = await user.comparePassword(oldPassword);
  if (!isPasswordCorrect) {
    throw new CustomError.UnauthenticatedError("Invalid Credentials");
  }

  user.password = newPassword; // Updates the user's password.
  await user.save(); // Hashes the new password before saving due to the pre-save middleware in the User model.
  res.status(StatusCodes.OK).json({ msg: "Success! Password updated." });
};

const verifyUser = async (req, res) => {
  try {
    const { id, status } = req.query;
    console.log(status);
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    if (status === 'accept') {
      user.verified = true;
    } else {
      user.verified = false;
    }

    await user.save();

    res.json({
      success: true, data: user,
    });
  } catch (error) {
    // Handle errors
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};
const rolesUpdate = async (req, res) => {
  try {
    let { email, role } = req.query;
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }
    user.role = role;
    await user.save();

    res.json({
      success: true, data: user,
    });
  } catch (error) {
    // Handle errors
    console.error(error);
    res.status(500).json({
      success: false,
      message: 'Server error',
    });
  }
};


// Exporting controller functions to be used in user routes.
module.exports = {
  getAllUsers,
  getSingleUser,
  showCurrentUser,
  updateUser,
  updateUserPassword,
  verifyUser,
  rolesUpdate
};
