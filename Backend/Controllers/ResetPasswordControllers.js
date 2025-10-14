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
            return res.status(404).json({ success: false, message: "No account found with this email" });
        }

        // 2️⃣ Generate secure reset token + expiry (10 min)
        const token = crypto.randomBytes(32).toString("hex");
        user.verificationToken = token;
        user.resetTokenExpiry = Date.now() + 10 * 60 * 1000; // 10 mins
        await user.save();

        // 3️⃣ Reset link (ensure trailing slash handled)
        const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;

        // 4️⃣ Setup nodemailer transporter
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        // 5️⃣ Email template
        const mailOptions = {
            from: `"Chai GPT" <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "🔑 Password Reset Request",
            html: `
                <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 30px;">
                    <div style="max-width: 600px; margin: auto; background: #fff; border-radius: 12px; padding: 25px; box-shadow: 0px 4px 12px rgba(0,0,0,0.1);">
                        <h2 style="color: #4CAF50; text-align: center;">Chai GPT</h2>
                        <p style="font-size: 16px; color: #333;">Hi ${user.name},</p>
                        <p style="font-size: 15px; color: #444;">
                            We received a request to reset your password. Click the button below to create a new one:
                        </p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetLink}" 
                                style="background-color: #4CAF50; color: white; text-decoration: none; padding: 12px 24px; border-radius: 8px; font-size: 16px;">
                                Reset Password
                            </a>
                        </div>
                        <p style="font-size: 14px; color: #666;">
                            ⚠️ This link will expire in <b>10 minutes</b>. If you didn’t request a password reset, please ignore this email.
                        </p>
                        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                        <p style="font-size: 12px; color: #aaa; text-align: center;">
                            &copy; ${new Date().getFullYear()} Chai GPT · All rights reserved
                        </p>
                    </div>
                </div>
            `,
        };

        // 6️⃣ Send the email
        const info = await transporter.sendMail(mailOptions);
        console.log(`✅ Reset email sent to ${email}: ${info.response}`);

        return res.status(200).json({
            success: true,
            message: "Password reset link has been sent to your email.",
        });

    } catch (error) {
        console.error("❌ requestReset error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};


// ✅ Reset Password API
exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { newPassword } = req.body;

        if (!token) {
            return res.status(400).json({ success: false, message: "Missing token" });
        }
        if (!newPassword) {
            return res.status(400).json({ success: false, message: "Password is required" });
        }

        // 1️⃣ Find user with valid token
        const user = await User.findOne({
            verificationToken: token,
            resetTokenExpiry: { $gt: Date.now() }, // token still valid
        });

        if (!user) {
            return res.status(400).json({ success: false, message: "Invalid or expired reset link" });
        }

        // 2️⃣ Hash and update password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.verificationToken = null;
        user.resetTokenExpiry = null;
        await user.save();

        console.log(`✅ Password reset successful for ${user.email}`);

        return res.status(200).json({
            success: true,
            message: "Password reset successful. You can now log in with your new password.",
        });

    } catch (error) {
        console.error("❌ resetPassword error:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
    }
};
