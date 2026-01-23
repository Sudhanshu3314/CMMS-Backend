// Controllers/ResetPasswordControllers.js
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const nodemailer = require("nodemailer");
const User = require("../models/userModel");

exports.requestReset = async (req, res) => {
    try {
        const { email } = req.body;

        if (!email) {
            return res.status(400).json({ success: false, message: "Email is required" });
        }

        // 1️⃣ Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "No account found with this email." });
        }

        // 2️⃣ Generate secure reset token + expiry (10 min)
        const token = crypto.randomBytes(32).toString("hex");
        user.verificationToken = token;
        user.resetTokenExpiry = Date.now() + 10 * 60 * 1000; // 10 mins validity
        await user.save();

        // 3️⃣ Validate essential environment variables
        if (!process.env.FRONTEND_URL || !process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error("❌ Missing required environment variables. Check .env file!");
            return res.status(500).json({
                success: false,
                message: "Server misconfiguration. Please contact admin.",
            });
        }

        // 4️⃣ Reset password link
        const resetLink = `${process.env.FRONTEND_URL.replace(/\/$/, "")}/reset-password/${token}`;

        // 5️⃣ Configure mail transporter (Gmail)
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // ✅ Verify transporter before sending
        await transporter.verify();

        // 6️⃣ Email content
        const mailOptions = {
            from: `"Chai GPT" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "🔑 Password Reset Request",
            html: `
  <div style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f6f8; padding: 30px; margin: 0;">
    <div style="
        max-width: 600px; 
        margin: auto; 
        background: #ffffff; 
        border-radius: 14px; 
        padding: 40px 30px; 
        box-shadow: 0 6px 18px rgba(0,0,0,0.08);
    ">
      <!-- Header -->
      <h2 style="
          color: #2f855a; 
          text-align: center; 
          font-size: 26px; 
          font-weight: 700; 
          letter-spacing: 0.5px; 
          margin-bottom: 20px;
      ">
        🔐 Chai GPT Password Reset
      </h2>

      <!-- Greeting -->
      <p style="font-size: 16px; color: #333; line-height: 1.6; margin-bottom: 10px;">
        Hi <strong>${user.name}</strong>,
      </p>

      <!-- Message -->
      <p style="font-size: 15px; color: #444; line-height: 1.6; margin-bottom: 25px;">
        We received a request to reset your password. Click the button below to securely create a new one.
      </p>

      <!-- Reset Button -->
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" 
          style="
            background: linear-gradient(135deg, #4CAF50, #2F855A); 
            color: #ffffff; 
            text-decoration: none; 
            padding: 14px 30px; 
            border-radius: 8px; 
            font-size: 16px; 
            font-weight: 600; 
            display: inline-block;
            transition: all 0.3s ease;
          "
        >
          Reset Password
        </a>
      </div>

      <!-- Expiry Notice -->
      <p style="font-size: 14px; color: #666; line-height: 1.6; margin-bottom: 25px;">
        ⚠️ This link will expire in <b>10 minutes</b>. If you didn’t request a password reset, please ignore this email.
      </p>

      <!-- Divider -->
      <hr style="border: none; border-top: 1px solid #eee; margin: 25px 0;">

      <!-- Footer -->
      <p style="font-size: 13px; color: #888; text-align: center; margin: 0;">
        &copy; ${new Date().getFullYear()} <strong>Chai GPT</strong> · All rights reserved
      </p>
    </div>
  </div>
`,

        };

        // 7️⃣ Send email
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Reset email sent successfully to ${email}: ${info.response}`);

        return res.status(200).json({
            success: true,
            message: "Password reset link has been sent to your email.",
        });

    } catch (error) {
        console.error("❌ requestReset error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to send reset email. Please try again.",
        });
    }
};

// ✅ Reset Password API
exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { newPassword } = req.body;

        if (!token) {
            return res.status(400).json({ success: false, message: "Missing token." });
        }

        if (!newPassword) {
            return res.status(400).json({ success: false, message: "New password is required." });
        }

        // 1️⃣ Find user with valid token (not expired)
        const user = await User.findOne({
            verificationToken: token,
            resetTokenExpiry: { $gt: Date.now() },
        });

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid or expired reset link." });
        }

        // 2️⃣ Hash and update password securely
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.verificationToken = null;
        user.resetTokenExpiry = null;
        await user.save();

        console.log(` Password reset successful for ${user.email}`);

        return res.status(200).json({
            success: true,
            message: "Password reset successful. You can now log in with your new password.",
        });

    } catch (error) {
        console.error("❌ resetPassword error:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Internal server error during password reset.",
        });
    }
};
