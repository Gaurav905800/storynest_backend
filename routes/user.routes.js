const express = require("express");
const {
  signupValidation,
  loginValidation,
} = require("../middleware/authValidation");
const router = express.Router();
const userController = require("../controllers/user.controller");
const { verifyToken } = require("../middleware/auth");

router.post("/signup", signupValidation, userController.signUp);

router.post("/login", loginValidation, userController.login);

router.get("/me", verifyToken, userController.me);

module.exports = router;
