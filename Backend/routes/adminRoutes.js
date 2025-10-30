const express = require("express");
const router = express.Router();
const User = require("../models/userModel");
const { getDinnerReport } = require("../Controllers/DinnerReportController");
const { getLunchReport } = require("../Controllers/LunchReportController")

// Get all users (for Admin Dashboard)
router.get("/users", async (req, res) => {
    try {
        const users = await User.find({}, "name email membershipActive profilePhoto");
        res.status(200).json({ success: true, users });
    } catch (err) {
        console.error("Error fetching users:", err);
        res.status(500).json({ success: false, message: "Failed to fetch users" });
    }
});

// 🍽️ Dinner report (only for admins, after 4:05 PM)
router.get("/dinner-report", getDinnerReport);
router.get("/lunch-report", getLunchReport);

module.exports = router;
