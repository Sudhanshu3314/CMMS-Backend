const User = require("../models/userModel")

exports.toggleMembership = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        // Toggle between Active/Inactive
        user.membershipActive = user.membershipActive === "Active" ? "Inactive" : "Active";
        await user.save();

        return res.json({
            success: true,
            message: `Membership ${user.membershipActive === "Active" ? "Activated" : "Deactivated"} Successfully`,
            membershipActive: user.membershipActive,
        });
    } catch (error) {
        console.error("Membership toggle error:", error);
        res.status(500).json({
            success: false,
            message: "Server error while toggling membership",
        });
    }
};
