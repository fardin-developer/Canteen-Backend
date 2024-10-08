const express = require("express");
const router = express.Router();
const {
  authenticateUser,
  authorizePermissions,
} = require("../middleware/authentication");
const {
  getAllUsers,
  getSingleUser,
  showCurrentUser,
  updateUser,
  updateUserPassword,
  verifyUser,
  rolesUpdate
} = require("../controllers/userController");

router
  .route("/")
  // .get(authenticateUser, authorizePermissions("admin"), getAllUsers);
   .get(getAllUsers);

router.route("/showMe").get(authenticateUser, showCurrentUser);
router.route("/updateUser").patch(authenticateUser, updateUser);
router.route("/updateUserPassword").patch(authenticateUser, updateUserPassword);
router.route("/verify-user").get(verifyUser);
router.route("/roles-update").patch(rolesUpdate);

router.route("/:id").get(authenticateUser, getSingleUser);

module.exports = router;
