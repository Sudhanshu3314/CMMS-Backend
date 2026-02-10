const nodemailer = require("nodemailer");
require("dotenv").config();
const User = require("../models/userModel");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

const sendVerificationEmail = async (to, name, token) => {
    const link = `${process.env.FRONTEND_URL}/verify-email/${token}`;
    const mailOptions = {
        from: `IGIDR Canteen Portal <${process.env.EMAIL_USER}>`,
        to,
        subject: "Verify Your Email - IGIDR Canteen Portal",
        html: `
        <div style="font-family: Arial, sans-serif; background-color: #f9fafb; padding: 30px; color: #333;">
            <div style="max-width: 600px; margin: auto; background: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0px 4px 15px rgba(0,0,0,0.1);">
                
                <!-- Header / Branding -->
                <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="margin: 0; font-size: 24px; color: #4CAF50;">IGIDR Canteen Portal ☕</h1>
                    <p style="margin: 5px 0 0; font-size: 14px; color: #666;">Canteen Meal Management System</p>
                </div>

                <!-- Welcome message -->
                <h2 style="color: #333; margin-top: 20px;">
                    Namaste🙏 ${name},
                </h2>
                <p style="font-size: 15px; color: #555; line-height: 1.6;">
                    Thanks for signing up! To complete your registration and start using our services, please verify your email address.
                </p>

                <!-- CTA button -->
                <div style="text-align: center; margin: 30px 0;">
                    <a href="${link}" target="_blank" 
                        style="background: linear-gradient(90deg, #4CAF50, #45a049); color: #fff; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-size: 16px; font-weight: bold; display: inline-block;">
                        Verify Email
                    </a>
                </div>

                <!-- Alternate link -->
                <p style="font-size: 14px; color: #666;">
                    If the button doesn’t work, please copy and paste this link into your browser:
                </p>
                <p style="word-break: break-all; font-size: 14px; color: #1a73e8; margin: 10px 0;">
                    <a href="${link}" target="_blank" style="color: #1a73e8;">${link}</a>
                </p>

                <!-- Divider -->
                <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />

                <!-- Footer -->
                <p style="font-size: 12px; color: #999; text-align: center; line-height: 1.5;">
                    You’re receiving this email because you signed up at 
                    <a href="${process.env.FRONTEND_URL}" target="_blank" style="color: #4CAF50; text-decoration: none;">${process.env.FRONTEND_URL}</a>. <br />
                    If you didn’t sign up, you can safely ignore this email.
                </p>
                <p style="font-size: 12px; color: #bbb; text-align: center; margin-top: 20px;">
                    &copy; ${new Date().getFullYear()} IGIDR Canteen Portal · All rights reserved
                </p>
            </div>
        </div>
    `
    };

    return transporter.sendMail(mailOptions);
};

module.exports = { sendVerificationEmail };
