// authController.js: Handles authentication processes including registration, login, and logout.

const User = require("../models/User"); // Importing the User model for database operations
const { StatusCodes } = require("http-status-codes"); // Importing HTTP status codes for response status
const CustomError = require("../errors"); // Custom error handling utilities
const { attachCookiesToResponse, tokenParams } = require("../utils");
const { isTokenValid } = require('../utils/jwt')

/**
 * Registers a new user with the provided email, name, and password. Automatically assigns
 * the role of 'admin' to the first registered user and 'user' to others. Responds with the
 * newly created user object.
 */
const register = async (req, res) => {
  const { email, name, password, dept, rollno } = req.body;
  const studentID = req.file ? req.file.path : null;
  // console.log(req.file);

  const emailAlreadyExists = await User.findOne({ email });
  if (emailAlreadyExists) {
    throw new CustomError.BadRequestError("Email already exists");
  }

  const isFirstAccount = (await User.countDocuments({})) === 0;
  const role = isFirstAccount ? "admin" : "user";

  const user = await User.create({ name, email, password, role, dept, rollno, studentID });
  const tokenUserDetails = tokenParams(user);
  attachCookiesToResponse({ res, user: tokenUserDetails });
  res.status(StatusCodes.CREATED).json({ user });
};


/**
 * Logs in a user by validating the provided email and password. If successful, responds
 * with the logged-in user object.
 */
const login = async (req, res) => {
  const { email, password } = req.body; // Extracting credentials from request body
  console.log('printttt hitttt');
  console.log(email, password);

  try {
    // Validate input
    if (!email || !password) {
      return res.status(StatusCodes.BAD_REQUEST).json({ error: "Please provide email and password" });
    }

    // Attempt to find the user by email
    const user = await User.findOne({ email });
    console.log(user && !user.verified)
    if (user && !user.verified) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ error: "user not verified by admin", status: 'not verified' });
    }
    if (!user) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ error: "Invalid Credentials" });
    }

    // Validate password
    const isPasswordCorrect = await user.comparePassword(password);
    if (!isPasswordCorrect) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ error: "Invalid Credentials" });
    }

    const tokenUser = tokenParams(user); // Create a token user object for cookie
    const data = attachCookiesToResponse({ res, user: tokenUser }); // Attach token to response as a cookie
    res.status(StatusCodes.OK).json({ user: user, cookies: data });

  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "An error occurred. Please try again later." });
  }
};


/**
 * Logs out the current user by clearing the authentication cookie.
 */
const logout = async (req, res) => {
  res.cookie("token", "logout", {
    httpOnly: true, // Enhances security by restricting client-side script access to the cookie
    expires: new Date(Date.now()), // Set expiration to immediately expire the cookie
  });
  res.status(StatusCodes.OK).json({ msg: "user logged out" });
};

const jwtVerify = (req, res) => {
  // console.log('jwtVerify');
  const token = req.query.token;
  console.log('tokk ' + token);
  const { name, userId, role } = isTokenValid({ token });
  res.status(StatusCodes.OK).json({
    user: {
      name,
      userId,
      role
    }
  })
}

const bcrypt = require('bcryptjs');

const updateProfile = async (req, res) => {
  const { name, token, password } = req.query;
  const { userId, role } = isTokenValid({ token });

  try {
    const user = await User.findById({ _id: userId });
    console.log(user);

    if (token && name) {
      user.name = name;
      await user.save();
      res.status(StatusCodes.OK).json({ user: user });
    } else if (token && password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await password
      await user.save();
      res.status(StatusCodes.OK).json({ user: user });
    } else {
      res.status(StatusCodes.BAD_REQUEST).json({ error: "Invalid request" });
    }
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({ error: "An error occurred. Please try again later." });
  }
};



// Exporting the controller functions to be used in routes
module.exports = {
  register,
  login,
  logout,
  jwtVerify,
  updateProfile
};
