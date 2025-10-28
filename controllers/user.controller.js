const User = require("../models/user.model");
const bcrypt = require("bcrypt");

const jwt = require("jsonwebtoken");

exports.signUp = async (req, res) => {
  try {
    const { username, email, password } = req.body;
    const existingUser = await User.findOne({ email });

    if (
      [!username, !email, !password].some((field) => {
        return field.trim() === "";
      })
    ) {
      return res.json({ message: "All fileds are r" });
    }

    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 8);

    const newUser = new User({
      username,
      email,
      password: hashedPassword,
    });

    await newUser.save();

    res.status(201).json({
      message: "Signup successful",
      user: {
        id: newUser._id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role,
      },
    });
  } catch (err) {
    console.error("Signup error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ email });
    const errorMsg = "Auth failed: email or password is wrong";
    if (!existingUser) {
      return res.status(403).json({ message: errorMsg });
    }

    const passwordCheck = await bcrypt.compare(password, existingUser.password);

    if (!passwordCheck) {
      return res.status(401).json({ message: errorMsg });
    }

    const jwtTokken = jwt.sign(
      {
        id: existingUser._id,
        email: existingUser.email,
        role: existingUser.role,
      },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.status(200).json({
      message: "Login successful",
      token: jwtTokken,
      user: {
        id: existingUser._id,
        username: existingUser.username,
        email: existingUser.email,
        role: existingUser.role,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ message: "Internal server error" });
  }
};

exports.me = async (req, res) => {
  res.json({ message: "Welcome!", user: req.user });
};
