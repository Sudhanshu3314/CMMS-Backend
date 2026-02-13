const UserModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { sendVerificationEmail } = require("../Utils/emailService");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

const TIMEZONE = "Asia/Kolkata";

// 🔐 SIGNUP
const signup = async (req, res) => {
    const logTime = dayjs().tz(TIMEZONE).format("YYYY-MM-DD HH:mm:ss");

    try {
        console.log(`[${logTime} ] 📝 Signup request received`);

        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            console.log(`[${logTime} ] ❌ Signup failed: Missing fields`);
            return res.status(400).json({ message: "All fields are required", success: false });
        }

        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            console.log(`[${logTime} ] ⚠️ Signup blocked: User already exists (${email})`);
            return res.status(409).json({ message: "User already exists, please login", success: false });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = uuidv4();

        const newUser = new UserModel({
            name,
            email,
            password: hashedPassword,
            verificationToken
        });

        await newUser.save();

        console.log(
            `[${logTime} ] ✅ User created successfully (unverified): ${email}`
        );

        await sendVerificationEmail(email, name, verificationToken);

        console.log(
            `[${logTime} ] 📧 Verification email sent to ${email}`
        );

        return res.status(201).json({
            message: "Signup successful. Verification email sent.",
            success: true
        });
    } catch (err) {
        console.error(
            `[${dayjs().tz(TIMEZONE).format("YYYY-MM-DD HH:mm:ss")} ] ❌ Signup error`,
            err
        );

        return res.status(500).json({
            message: "Internal Server Error",
            success: false
        });
    }
};

// 🔑 LOGIN
const login = async (req, res) => {
    const logTime = dayjs().tz(TIMEZONE).format("YYYY-MM-DD HH:mm:ss");

    try {
        console.log(`[${logTime} ] 🔐 Login request received`);

        const { email, password } = req.body;

        if (!email || !password) {
            console.log(`[${logTime} ] ❌ Login failed: Missing credentials`);
            return res.status(400).json({
                message: "Email and password are required",
                success: false
            });
        }

        const user = await UserModel.findOne({ email });
        if (!user) {
            console.log(`[${logTime} ] ❌ Login failed: User not found (${email})`);
            return res.status(401).json({
                message: "Invalid email or password",
                success: false
            });
        }

        if (!user.isVerified) {
            console.log(`[${logTime} ] ⛔ Login blocked: Email not verified (${email})`);
            return res.status(403).json({
                message: "Please verify your email before logging in.",
                success: false
            });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            console.log(`[${logTime} ] ❌ Login failed: Incorrect password (${email})`);
            return res.status(401).json({
                message: "Invalid email or password",
                success: false
            });
        }

        const jwtToken = jwt.sign(
            { id: user._id, email: user.email, name: user.name },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
        );

        console.log(
            `[${logTime} ] ✅ Login successful: ${email}`
        );

        return res.status(200).json({
            message: "Login successful",
            success: true,
            user: {
                id: user._id,
                name: user.name,
                token: jwtToken,
                email: user.email
            }
        });
    } catch (err) {
        console.error(
            `[${dayjs().tz(TIMEZONE).format("YYYY-MM-DD HH:mm:ss")} ] ❌ Login error`,
            err
        );

        return res.status(500).json({
            message: "Internal Server Error",
            success: false
        });
    }
};

// 📧 VERIFY EMAIL
const verifyEmail = async (req, res) => {
    const logTime = dayjs().tz(TIMEZONE).format("YYYY-MM-DD HH:mm:ss");
    const { token } = req.params;

    try {
        console.log(`[${logTime} ] 🔎 Email verification attempt`);

        const user = await UserModel.findOne({ verificationToken: token });
        if (!user) {
            console.log(`[${logTime} ] ❌ Verification failed: Invalid token`);
            return res.status(400).json({
                success: false,
                message: "Invalid or expired token."
            });
        }

        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();

        console.log(
            `[${logTime} ] ✅ Email verified successfully: ${user.email}`
        );

        return res.json({
            success: true,
            message: "Email verified successfully."
        });
    } catch (err) {
        console.error(
            `[${dayjs().tz(TIMEZONE).format("YYYY-MM-DD HH:mm:ss")} ] ❌ Verification error`,
            err
        );

        return res.status(500).json({
            success: false,
            message: "Verification failed."
        });
    }
};

module.exports = {
    signup,
    login,
    verifyEmail
};
