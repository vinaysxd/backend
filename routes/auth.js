const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const { randomUUID } = require("crypto");

const { User } = require('./../models/init'); 
const sendEmail = require('../utils/sendEmails');

// =======================
// Register
// =======================
router.post('/register', async (req, res) => {
  try {
    const { username, password, avatar, email } = req.body;

    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(409).json({ status: 409, code: 1001, message: "Username already taken" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      password: hashedPassword,
      email,
      avatar: avatar || null,
      confirmed: false
    });

    // Send confirmation email
    const confirmToken = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET, { expiresIn: "30d" });
    const confirmUrl = `${process.env.BASE_URL}/auth/confirm/${confirmToken}`;

    await sendEmail(
      newUser.email,
      "Confirm Your Email",
      `Please confirm your email before logging in: ${confirmUrl}`
    );

    return res.status(201).json({
      status: 201,
      code: 1000,
      message: "User registered. Confirmation email sent."
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 500, code: 1500, message: "Server error" });
  }
});

// =======================
// Login
// =======================
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ where: { username } });

    if (!user) {
      return res.status(401).json({ status: 401, code: 1001, message: "Invalid username or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ status: 401, code: 1001, message: "Invalid username or password" });
    }

    if (!user.confirmed) {
      const confirmToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1d" });
      const confirmUrl = `${process.env.BASE_URL}/auth/confirm/${confirmToken}`;

      await sendEmail(
        user.email,
        "Confirm Your Email",
        `Please confirm your email before logging in: ${confirmUrl}`
      );

      return res.status(403).json({ status: 403, code: 1002,
        
        message: "Email not confirmed. Confirmation email sent again." });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );
    const res_user = {
          id: user.id,
          username: user.username,
          email: user.email,
          avatar: user.avatar
        }
    console.log(res_user)
    res.status(200).json({ status: 200, code: 1000,userData: res_user, message: "Login successful", token });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 500, code: 1500, message: "Server error" });
  }
});

// =======================
// Confirm Email
// =======================
router.get("/confirm/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(400).json({ status: 400, code: 1003, message: "Invalid token" });
    }

    user.confirmed = true;
    await user.save();

    res.status(200).json({ status: 200, code: 1000, message: "Email confirmed. You can now login." });
  } catch (err) {
    console.error(err);
    res.status(400).json({ status: 400, code: 1004, message: "Invalid or expired token" });
  }
});

// =======================
// Forgot Password
// =======================
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(404).json({ status: 404, code: 1005, message: "No account with that email" });
    }

    const resetToken = randomUUID();
    const crypticResetToken = jwt.sign({ resetToken, id: user.id }, process.env.JWT_SECRET, { expiresIn: '10m' });

    await User.update({ resetToken: crypticResetToken }, { where: { id: user.id } });

    const resetUrl = `${process.env.BASE_URL}/auth/reset-password-form/${crypticResetToken}`;

    await sendEmail(
      user.email,
      "Password Reset Request",
      `Click here to reset your password: ${resetUrl}`
    );

    res.status(200).json({ status: 200, code: 1000, message: "Password reset email sent" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 500, code: 1500, message: "Server error" });
  }
});

// =======================
// Reset Password
// =======================
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id);

    if (!user || user.resetToken !== token) {
      return res.status(400).json({ status: 400, code: 1006, message: "Invalid token" });
    }

    user.password = await bcrypt.hash(password, 10);
    user.resetToken = null;
    await user.save();

    res.status(200).json({ status: 200, code: 1000, message: "Password reset successful" });
  } catch (err) {
    console.error(err);
    res.status(400).json({ status: 400, code: 1004, message: "Invalid or expired token" });
  }
});

module.exports = router;
