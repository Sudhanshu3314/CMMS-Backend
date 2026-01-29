const UserModel = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { v4: uuidv4 } = require("uuid");
const { sendVerificationEmail } = require("../Utils/emailService");

const signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ message: "All fields are required", success: false });
        }

        const existingUser = await UserModel.findOne({ email });
        if (existingUser) {
            return res.status(409).json({ message: "User already exists, please login", success: false });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        const verificationToken = uuidv4();
        const newUser = new UserModel({ name, email, password: hashedPassword, verificationToken });
        await newUser.save();

        await sendVerificationEmail(email, name,verificationToken);

        return res.status(201).json({ message: "Signup successful. Verification email sent.", success: true });
    } catch (err) {
        console.error("Signup error:", err);
        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
};

const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: "Email and password are required", success: false });
        }

        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(401).json({ message: "Invalid email or password", success: false });
        }

        if (!user.isVerified) {
            return res.status(403).json({ message: "Please verify your email before logging in.", success: false });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ message: "Invalid email or password", success: false });
        }

        const jwtToken = jwt.sign(
            { id: user._id, email: user.email, name: user.name },
            process.env.JWT_SECRET,
            { expiresIn: process.env.JWT_EXPIRES_IN || "1h" }
        );

        console.log("User logged in successfully:", {
            id: user._id,
            name: user.name,
            email: user.email
        });

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
        console.error("Login error:", err);
        return res.status(500).json({ message: "Internal Server Error", success: false });
    }
};

const verifyEmail = async (req, res) => {
    const { token } = req.params;

    try {
        const user = await UserModel.findOne({ verificationToken: token });
        if (!user) return res.status(400).json({ success: false, message: "Invalid or expired token." });

        user.isVerified = true;
        user.verificationToken = undefined;
        await user.save();

        return res.json({ success: true, message: "Email verified successfully." });
    } catch (err) {
        console.error("Verification error:", err);
        return res.status(500).json({ success: false, message: "Verification failed." });
    }
};

module.exports = {
    signup,
    login,
    verifyEmail
};
