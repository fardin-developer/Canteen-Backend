// authentication.js: Middleware for handling authentication and authorization of users.

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
  // Extract token from Authorization header
  const authHeader = req.headers.authorization;
  console.log(authHeader)
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new CustomError.UnauthenticatedError("Authentication Invalid");
  }

  const token = authHeader.split(' ')[1]; 
  // console.log('hhh', token);

  if (!token) {
    throw new CustomError.UnauthenticatedError("Authentication Invalid");
  }

  try {
    const { name, userId, role } = isTokenValid({ token });
    // console.log(name + " role");
    req.user = { name, userId, role };
    next();
  } catch (error) {
    throw new CustomError.UnauthenticatedError("Authentication Invalid");
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
    if (!roles.includes(req.user.role)) {
      console.log(req.user)
      // If not, throw an unauthorized error
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
