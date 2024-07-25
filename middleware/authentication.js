// authentication.js: Middleware for handling authentication and authorization of users.
const { StatusCodes } = require('http-status-codes');

const CustomError = require("../errors"); // Import custom error classes for error handling
const { isTokenValid } = require("../utils"); // Utility function to validate JWT tokens

/**
 * Middleware to authenticate a user by verifying the JWT token.
 * It checks for the presence of a token in signed cookies, validates it,
 * and attaches the user's details to the request object.
 * @param req - The request object.
 * @param res - The response object.
 * @param next - The next middleware function in the stack.
 */
const authenticateUser = async (req, res, next) => {
  try {
    // Extract token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Authentication Invalid" });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Authentication Invalid" });
    }

    const { name, userId, role } = isTokenValid({ token });
    req.user = { name, userId, role };
    next();
  } catch (error) {
    return res.status(StatusCodes.UNAUTHORIZED).json({ msg: "Authentication Invalid" });
  }
};


/**
 * Middleware to authorize user actions based on their roles.
 * It accepts an array of roles and checks if the request user's role matches any of them.
 * If not, it throws an unauthorized error.
 * @param {...String} roles - Allowed roles.
 */
const authorizePermissions = (...roles) => {
  return (req, res, next) => {
    // Check if the user's role is included in the allowed roles
    console.log(roles);
    if (!roles.includes(req.user.role)) {
      console.log(req.user)
      
      throw new CustomError.UnauthorizedError(
        "Unauthorized to access this route"
      );
    }
    next(); // Proceed to the next middleware
  };
};

module.exports = {
  authenticateUser,
  authorizePermissions,
};
