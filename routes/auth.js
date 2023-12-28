const express = require("express");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const router = express.Router();
const User = require("../models/user");
const errorHandler = require("../middlewares/errorMiddleware");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.MAIL_SECRET_URL,
    pass: process.env.MAIL_SECRET,
  },
});

router.post("/sendOtp", async (req, res, next) => {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000);
  try {
    const mailOptions = {
      from: process.env.MAIL_SECRET_URL,
      to: email,
      subject: "OTP",
      text: `Your OTP is ${otp}`,
    };

    transporter.sendMail(mailOptions, async (err, info) => {
      if (err) {
        return res.status(500).json({
          message: err.message,
        });
      } else {
        return res.status(200).json({
          message: "OTP sent successfully",
        });
      }
    });
  } catch (err) {
    next(err);
  }
});

router.post("/register", async (req, res, next) => {
  try {
    const { name, email, password } = req.body;
    const existingUser = await User.findOne({ email: email });
    // console.log(existingUser);
    if (existingUser) {
      return res.status(400).json({ message: "email already exists" });
    }

    const newUser = new User({
      name: name,
      email: email,
      password: password,
    });
    const savedUser = await newUser.save();
    return res
      .status(201)
      .json({ message: "user created successfully", savedUser: savedUser });
  } catch (err) {
    return next(err);
    // return res.status(500).json({ message: err.message });
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email });
    if (!user) {
      return res.status(400).json({ message: "user not found" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "invalid credentials" });
    }

    const authToken = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "10m",
    });
    const refreshToken = jwt.sign(
      { userId: user._id },
      process.env.JWT_REFRESH_SECRET,
      { expiresIn: "40m" }
    );

    res.cookie("authToken", authToken, { httpOnly: true });
    res.cookie("refreshToken", refreshToken, { httpOnly: true });

    return res.status(200).json({ message: "login successful" });
  } catch (err) {
    next(err);
  }
});

router.use(errorHandler);

module.exports = router;
