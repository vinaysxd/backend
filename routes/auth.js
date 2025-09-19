const express = require('express');
const router = express.Router();
const db = require('../db'); 
const bcrypt = require('bcrypt');
const jwt = require("jsonwebtoken");
const { User }= require('./../models/init'); 
const { randomUUID } = require("crypto");

const sendEmail = require('../utils/sendEmails');
// Placeholder routes
router.post('/register',async (req, res) => {
   try {
    const { username, password, avatar, email } = req.body;
    console.log("EMAIL",email)
    // check if user exists
    const existingUser = await User.findOne({ where: { username } });
    if (existingUser) {
      return res.status(400).json({ error: "Username already taken" });
    }

    // hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // create user
    const newUser = await User.create({
      username,
      password: hashedPassword,
      email:email,
      avatar,
      confirmed: false, // set default confirmed true for now - CHANGE LATER AFTER SEND EMAIL IMPLEMENTED
    });
    const is_confirmed = newUser.confirmed;
    if(!is_confirmed){
      // TO_DO: Write code to send email later for confirmation.
      const confirmToken = jwt.sign({ id: newUser.id }, process.env.JWT_SECRET, { expiresIn: "1d" });
  const confirmUrl = `${process.env.BASE_URL}/auth/confirm/${confirmToken}`;

  await sendEmail(
    newUser.email,
    "Confirm Your Email",
    `Please confirm your email before logging in: ${confirmUrl}`
  );

  return res.status(400).json({ error: "Email not confirmed. Confirmation link sent again." });
       
    }
    res.status(201).json({ message: "Confirm email and login using the credentials" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});

router.post('/login', async (req, res) => {
try {
    const { username, password } = req.body;

    // find user
    const user = await User.findOne({ where: { username } }); 
    if (!user) {
      return res.status(400).json({ error: "Invalid username or password" });
    } 
    
    // compare password
    const isMatch = await bcrypt.compare(password, user.dataValues.password);
    if (!isMatch) {
      return res.status(400).json({ error: "Invalid username or password" });
    }
    const is_confirmed = user.dataValues.confirmed;
    
    if(!is_confirmed){
     const confirmToken = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "1d" });
  const confirmUrl = `${process.env.BASE_URL}/auth/confirm/${confirmToken}`;

  await sendEmail(
    user.email,
    "Confirm Your Email",
    `Please confirm your email before logging in: ${confirmUrl}`
  );

  return res.status(400).json({ error: "Email not confirmed. Confirmation link sent again." });
    }
    // generate JWT
    const token = jwt.sign(
      { id: user.id, username: user.username },
      process.env.JWT_SECRET,
      { expiresIn: "1h" }
    );

    res.json({ message: "Login successful", token });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Server error" });
  }
});


// Confirm user
router.get("/confirm/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findByPk(decoded.id);
    if (!user) {
      return res.status(400).json({ error: "Invalid token" });
    }

    user.confirmed = true;
    await user.save();

    res.json({ message: "Email confirmed. You can now login." });
  } catch (error) {
    console.error("Confirm Error:", error);
    res.status(400).json({ error: "Invalid or expired token" });
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
      return res.status(400).json({ error: "No account with that email" });
    }

    // 1. Generate reset token
    const resetToken = randomUUID();
    // const resetToken = jwt.sign(
    //   { id: user.id,
    //     randomString
    //    },
    //   process.env.JWT_SECRET,
    //   { expiresIn: "1h" }
    // );
    const crypticResetToken = jwt.sign(
      {
        resetToken: resetToken,
        id: user.id
      },
      process.env.JWT_SECRET,
      {expiresIn: '10m'}
    )
    await User.update(
  { resetToken: crypticResetToken },
  { where: { id: user.id } }
);
    const resetUrl = `${process.env.BASE_URL}/auth/reset-password-form/${crypticResetToken}`;

    // 2. Send reset email
    await sendEmail(
      user.email,
      "Password Reset Request",
      `Click here to reset your password: ${resetUrl}`
    );

    res.json({ message: "Password reset email sent" });
  } catch (error) {
    console.error("Forgot Password Error:", error);
    res.status(500).json({ error: "Server error" });
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
    if (!user || user.resetToken != token) {
      return res.status(400).json({ error: "Invalid token" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    user.password = hashedPassword;
    user.resetToken = null
    await user.save(); 
    res.json({ message: "Password reset successful" });
  } catch (error) {
    console.error("Reset Password Error:", error);
    res.status(400).json({ error: "Invalid or expired token" });
  }
});


// RESET PASSWORD HTML FORM
router.get("/reset-password-form/:token", (req, res) => {
  const { token } = req.params;

  try {
    // verify token before showing form
    jwt.verify(token, process.env.JWT_SECRET);

    // Serve a simple HTML form
    res.send(`
      <!DOCTYPE html>
<html>
  <head>
    <title>Reset Password</title>
    <style>
      body {
        font-family: Arial, sans-serif;
        background: #f4f6f8;
        display: flex;
        justify-content: center;
        align-items: center;
        height: 100vh;
      }
      .container {
        background: white;
        padding: 30px;
        border-radius: 8px;
        box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
        width: 400px;
      }
      h2 {
        margin-bottom: 20px;
        text-align: center;
      }
      label {
        font-weight: bold;
      }
      input {
        width: 100%;
        padding: 10px;
        margin: 8px 0 15px 0;
        border: 1px solid #ccc;
        border-radius: 5px;
      }
      button {
        width: 100%;
        padding: 10px;
        background: #007bff;
        color: white;
        font-size: 16px;
        border: none;
        border-radius: 5px;
        cursor: pointer;
      }
      button:hover {
        background: #0056b3;
      }
      .error {
        color: red;
        font-size: 14px;
      }
      .success {
        color: green;
        font-size: 14px;
      }
    </style>
  </head>
  <body>
    <div class="container">
      <h2>Reset Your Password</h2>
      <!-- token is injected by server when rendering -->
      <form id="resetForm" action="/auth/reset-password/${token}" method="POST">
        <label>New Password:</label><br />
        <input type="password" name="password" id="password" required />
        <br />

        <label>Confirm Password:</label><br />
        <input type="password" name="confirmPassword" id="confirmPassword" required />
        <br />

        <div id="message" class="error"></div>
        <br />

        <button type="submit">Reset Password</button>
      </form>
    </div>

    <script>
      const form = document.getElementById("resetForm");
      const password = document.getElementById("password");
      const confirmPassword = document.getElementById("confirmPassword");
      const message = document.getElementById("message");

      form.addEventListener("submit", async function (e) {
        e.preventDefault(); // stop normal form submit
        message.textContent = "";
        message.className = "error";

        const pwd = password.value.trim();
        const confirmPwd = confirmPassword.value.trim();

        // ✅ Validation rules
        const minLength = 8;
        const hasUpper = /[A-Z]/.test(pwd);
        const hasLower = /[a-z]/.test(pwd);
        const hasNumber = /[0-9]/.test(pwd);
        const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(pwd);

        if (pwd.length < minLength) {
          message.textContent = "Password must be at least 8 characters long.";
          return;
        } else if (!hasUpper || !hasLower || !hasNumber || !hasSpecial) {
          message.textContent =
            "Password must include uppercase, lowercase, number, and special character.";
          return;
        } else if (pwd !== confirmPwd) {
          message.textContent = "Passwords do not match.";
          return;
        }

        try {
          const endpoint = form.getAttribute("action");

          const res = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ password: pwd, confirmPassword: confirmPwd }),
          });

          if (res.ok) {
            const data = await res.json();
            message.className = "success";
            message.textContent = data.message || "Password reset successful!";
          } else {
            const error = await res.json();
            message.className = "error";
            message.textContent = error.message || "Something went wrong.";
          }
        } catch (err) {
          message.className = "error";
          message.textContent = "Network error. Try again.";
        }
      });
    </script>
  </body>
</html>

    `);
  } catch (err) {
    res.status(400).send("Invalid or expired reset link.");
  }
});
module.exports = router;
