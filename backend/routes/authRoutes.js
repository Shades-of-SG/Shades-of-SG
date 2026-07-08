const express = require("express");
//otp.start
const nodemailer = require("nodemailer")
//otp.end
const router = express.Router();
const User = require("../models/User");
const { hashPassword, verifyPassword, createToken, serializeUser } = require("../services/authService");


//including a middleware for my settings <3
const authMiddleware = require("../middleware/authMiddleware");
//end


// POST /auth/register
router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    // Check if name already exist
    const existingName = await User.findOne({ where: { name } });
    if (existingName) {
      return res.status(400).json({
        message: "Name already taken. Please choose a different one."
      });
    }

    // Check if email already exist
    const existing = await User.findOne({ where: { email } });
    if (existing) {
      return res.status(400).json({ "message": "Name already taken. Please choose a different one." });
    }

    const passwordHash = hashPassword(password);
    const user = await User.create({ name, email, passwordHash, role: "REGISTERED" });

    const token = createToken(user);
    res.json({ user: serializeUser(user), token });
  } catch (err) {
    res.status(500).json({ message: "Registration failed", details: err.message });
  }
});

// POST /auth/login
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const valid = verifyPassword(password, user.passwordHash);
    if (!valid) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const token = createToken(user);
    res.json({ user: serializeUser(user), token });
  } catch (err) {
    res.status(500).json({ message: "Login failed", details: err.message });
  }
});



//otp.start
// Temporary OTP store (replace with DB/Redis in production)
const otpStore = {};


router.post("/send-email-otp", async (req, res) => {
  const { email } = req.body;
  if (!email) return res.json({ success: false, message: "Email required" });

  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  const expiry = Date.now() + 5 * 60 * 1000; // 5 minutes

  otpStore[email] = { otp, expiry: Date.now() + 5 * 60 * 1000 }


  try {
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_PASS, // App password
      },
    });

    await transporter.sendMail({
      from: `"Shades of SG" <${process.env.GMAIL_USER}>`,
      to: email,
      subject: "Your OTP Code",
      text: `Your OTP code is ${otp}. It expires in 5 minutes.`,
    });

    res.json({ success: true, message: "OTP sent" });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Failed to send OTP" });
  }
});

router.post("/verify-email-otp", (req, res) => {
  const { email, otp_code } = req.body;
  const record = otpStore[email];

  if (!record) return res.json({ success: false, message: "No OTP found" });
  if (Date.now() > record.expiry) {
    delete otpStore[email];
    return res.json({ success: false, message: "OTP expired" });
  }
  if (record.otp !== otp_code) {
    return res.json({ success: false, message: "Invalid OTP" });
  }

  delete otpStore[email];
  res.json({ success: true, message: "OTP verified" });
});
//otp.end

// Check name for real-time availability
router.get("/check-name/:name", async (req, res) => {
  const { name } = req.params;
  try {
    const existingName = await User.findOne({ where: { name } });
    if (existingName) {
      return res.json({ available: false, message: "Name already taken." });
    }
    res.json({ available: true });
  } catch (err) {
    res.status(500).json({ available: false, message: "Error checking name." });
  }
});

//Check email for real-time availability
router.get("/check-email/:email", async (req, res) => {
  const { email } = req.params;
  try {
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail) {
      return res.json({ available: false, message: "Email already registered." });
    }
    res.json({ available: true });
  } catch (err) {
    res.status(500).json({ available: false, message: "Error checking email." });
  }
});

// For login: Check if the email has been registered --> If it has not, flag error
router.get("/check-email-exists/:email", async (req, res) => {
  const { email } = req.params;
  try {
    const user = await User.findOne({ where: { email } });
    if (user) {
      return res.json({ exists: true });
    }
    res.json({ exists: false });
  } catch (err) {
    res.status(500).json({ exists: false, message: "Error checking email." });
  }
});

// Forget password.start
router.post("/reset-password", async (req, res) => {
  const { email, newPassword } = req.body;
  if (!email || !newPassword) {
    return res.json({ success: false, message: "Email and new password required" });
  }

  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.json({ success: false, message: "Account not registered" });
    }

    // ✅ Use your custom hash function, not bcrypt
    const passwordHash = hashPassword(newPassword);
    user.passwordHash = passwordHash;
    await user.save();

    res.json({ success: true, message: "Password reset successful" });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Failed to reset password", details: err.message });
  }
});

//end




//Settings type shift (3)

// Update that profile
// PUT /auth/update-profile
router.put("/update-profile", async (req, res) => {
  const { name, email } = req.body;
  const userId = req.user?.id; // assuming you attach user to req via middleware

  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    // Check if name already exists (excluding current user)
    const existingName = await User.findOne({ where: { name } });
    if (existingName && existingName.id !== userId) {
      return res.json({ success: false, message: "Name already taken" });
    }

    // Check if email already exists (excluding current user)
    const existingEmail = await User.findOne({ where: { email } });
    if (existingEmail && existingEmail.id !== userId) {
      return res.json({ success: false, message: "Email already in use" });
    }

    const user = await User.findByPk(userId);
    user.name = name;
    user.email = email;
    await user.save();

    const token = createToken(user);
    res.json({ success: true, user: serializeUser(user), token });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to update profile", details: err.message });
  }
});


//Change password
// POST /auth/change-password
router.post("/change-password", async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const userId = req.user?.id;

  if (!userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const user = await User.findByPk(userId);
    if (!verifyPassword(oldPassword, user.passwordHash)) {
      return res.json({ success: false, message: "Old password is incorrect" });
    }

    const newHash = hashPassword(newPassword);
    user.passwordHash = newHash;
    await user.save();

    res.json({ success: true, message: "Password changed successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to change password", details: err.message });
  }
});


//Delete account
// DELETE /auth/delete-account/:id
router.delete("/delete-account/:id", async (req, res) => {
  const { id } = req.params;
  const userId = req.user?.id;

  if (!userId || parseInt(id) !== userId) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

  try {
    const user = await User.findByPk(userId);
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    await user.destroy();
    res.json({ success: true, message: "Account deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: "Failed to delete account", details: err.message });
  }
});

//end


module.exports = router;
