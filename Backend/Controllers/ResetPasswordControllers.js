// Controllers/ResetPasswordControllers.js
const crypto = require("crypto");
const bcrypt = require("bcryptjs");
const User = require("../models/userModel");
const nodemailer = require("nodemailer");

exports.requestReset = async (req, res) => {
    try {
        const { email } = req.body;

        // 1. Check if user exists
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // 2. Generate reset token + expiry
        const token = crypto.randomBytes(32).toString("hex");
        user.verificationToken = token;
        user.resetTokenExpiry = Date.now() + 5 * 60 * 1000; // 5 minutes expiry
        await user.save();

        // 3. Reset link
        const resetLink = `${process.env.FRONTEND_URL}reset-password/${token}`;

        // 4. Configure transporter
        const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS,
            },
        });

        const mailOptions = {
            from: `Chai GPT <${process.env.EMAIL_USER}>`,
            to: email,
            subject: "🔑 Password Reset Request",
            html: `
        <div style="font-family: Arial, sans-serif; background-color: #f9f9f9; padding: 30px; color: #333;">
            <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; padding: 30px; box-shadow: 0px 4px 12px rgba(0,0,0,0.1);">
                
                <div style="text-align: center; margin-bottom: 20px;">
                    <h2 style="color: #4CAF50; margin: 0;">Chai GPT</h2>
                    <p style="color: #666; font-size: 14px; margin: 5px 0 0;">Canteen Meal Management System</p>
                </div>
                
                <h3 style="color: #333;">Namaste🙏 ${user.name},</h3>
                <p style="font-size: 15px; line-height: 1.6;">
                    We received a request to reset your password. Click the button below to create a new one.
                </p>

                <div style="text-align: center; margin: 30px 0;">
                    <a href="${resetLink}" 
                        style="background-color: #4CAF50; color: #ffffff; text-decoration: none; padding: 12px 24px; border-radius: 6px; font-size: 16px; font-weight: bold; display: inline-block;">
                        Reset Password
                    </a>
                </div>

                <p style="font-size: 14px; color: #666;">
                    ⚠️ This link will expire in <b>5 minutes</b>. If you didn’t request a password reset, please ignore this email.
                </p>

                <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
                
                <p style="font-size: 12px; color: #999; text-align: center;">
                    &copy; ${new Date().getFullYear()} Chai GPT · All rights reserved
                </p>
            </div>
        </div>
    `,
        };


        // 5. Send email
        const info = await transporter.sendMail(mailOptions);
        console.log("✅ Reset email sent:", info.response);

        res.status(200).json({
            success: true,
            message: "Password reset link sent to your email",
        });
    } catch (error) {
        console.error("❌ Error in requestReset:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};

exports.resetPassword = async (req, res) => {
    try {
        const { token } = req.params;
        const { newPassword } = req.body;

        // 1. Find user with token
        const user = await User.findOne({ verificationToken: token });
        if (!user || !user.resetTokenExpiry || user.resetTokenExpiry < Date.now()) {
            return res.status(400).json({ success: false, message: "Invalid or expired token" });
        }

        if (!newPassword) {
            return res.status(400).json({ success: false, message: "Password is required" });
        }

        // 2. Hash new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);
        user.password = hashedPassword;
        user.verificationToken = null; // clear token
        user.resetTokenExpiry = null;  // clear expiry
        await user.save();

        console.log(`✅ Password reset successful for user: ${user.email}`);

        res.status(200).json({
            success: true,
            message: "Password reset successful. You can now log in with your new password.",
        });
    } catch (error) {
        console.error("❌ Error in resetPassword:", error);
        res.status(500).json({ success: false, message: "Server error" });
    }
};
