const { signup, login, verifyEmail } = require("../Controllers/AuthController");
const { signupValidation, loginValidation, verifyToken } = require("../Middlewares/AuthValidation");
const { requestReset, resetPassword } = require("../Controllers/ResetPasswordControllers");

const router = require("express").Router();

router.post("/signup", signupValidation, signup);
router.post("/login", loginValidation, login);
router.get("/verify-email/:token", verifyEmail);

// 🔹 Reset password routes
router.post("/request-reset", requestReset);
router.post("/reset-password/:token", resetPassword);

const User = require("../models/userModel");

router.get("/profile", verifyToken, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select("name email membershipActive profilePhoto");
        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        res.status(200).json({
            success: true,
            profile: {
                name: user.name,
                email: user.email,
                membershipActive: user.membershipActive,
                profilePhoto: user.profilePhoto || "",
            },
        });
    } catch (error) {
        console.error("Profile fetch error:", error);
        res.status(500).json({ success: false, message: "Server error while fetching profile" });
    }
});


module.exports = router;