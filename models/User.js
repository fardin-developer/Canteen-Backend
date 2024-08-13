const mongoose = require("mongoose");
const validator = require("validator");
const bcrypt = require("bcryptjs");
const { verify } = require("jsonwebtoken");

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please provide name"],
    minlength: 3,
    maxlength: 30,
  },
  email: {
    type: String,
    unique: true,
    required: [true, "Please provide email"],
    validate: {
      validator: validator.isEmail,
      message: "Please provide valid email",
    },
  },
  phone: {
    type: String,
    unique: true,
    required: [true, "Please provide phone number"]
  },
  verified: {
    type: Boolean,
    default: false
  },
  password: {
    type: String,
    required: [true, "Please provide password"],
    minlength: 6,
  },
  dept: {
    type: String,
    required: [true, "Please provide dept."],
  },
  rollno: {
    type: String,
    required: [true, "Please provide roll number"],
  },
  studentID: {
    type: String,
    required: [false, "Please provide an Id"],
  },
  role: {
    type: String,
    enum: ["admin", "user","manager"],
    default: "user",
  },
});

/// using save triggers the hook
/// so it needs to be updated to only be triggered when the
/// password is updated
UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.comparePassword = async function (candidatePassword) {
  const isMatch = await bcrypt.compare(candidatePassword, this.password);
  return isMatch;
};

module.exports = mongoose.model("User", UserSchema);
