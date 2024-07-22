const express = require("express");
const router = express.Router(); // Create a new Express router to handle authentication routes
const multer = require('multer');
const {  register, login, logout, jwtVerify } = require("../controllers/authController");
const path = require('path');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/'); 
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname); 
    const uniqueName = Date.now() + '-' + Math.round(Math.random() * 1E9); 
    cb(null, uniqueName + ext); 
  }
});

const upload = multer({ storage: storage });

router.post("/register", upload.single('idProof'), register);


router.post("/login", login);

router.get("/logout", logout);

router.get("/jwt-verify", jwtVerify);
router.get("/docs", (req, res) => {

  res.sendFile(__dirname + "/docs.html");
});

module.exports = router; 
