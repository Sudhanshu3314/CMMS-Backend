const User = require("../models/userModel");
const Dinner = require("../models/dinnerModel");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

exports.getDinnerReport = async (req, res) => {
    try {
        // ⏰ Use Asia/Kolkata timezone
        const now = dayjs().tz("Asia/Kolkata");
        const hours = now.hour();
        const minutes = now.minute();
        const today = now.format("YYYY-MM-DD");

        // 🔒 Allow only after 4:35 PM (IST)
        // But after 6:00 AM next morning, lock again (reset daily)
        const after435PM = hours > 16 || (hours === 16 && minutes >= 35);
        const after6AM = hours >= 6;

        // 🧠 Logic:
        // - From 00:00 → 5:59 AM = show "not available"
        // - From 6:00 AM → 4:34 PM = show "not available"
        // - From 4:35 PM → 11:59 PM = show report
        if (!after435PM) {
            return res.status(400).json({
                success: false,
                message: "Dinner report available after 4:35 PM (IST).",
                currentServerTime: now.format("HH:mm"),
            });
        }

        // 🟢 Step 1: Fetch all Active users
        const activeUsers = await User.find({ membershipActive: "Active" }).select(
            "name email profilePhoto _id"
        );

        // 🟢 Step 2: Fetch Dinner data for today
        const dinnerData = await Dinner.find({ date: today });

        // 🟢 Step 3: Combine logic
        const report = activeUsers.map((user, index) => {
            const dinner = dinnerData.find(
                (d) => d.userId.toString() === user._id.toString()
            );

            let status = "Yes"; // default Yes (for users with no record)

            if (dinner) {
                if (dinner.status?.toLowerCase() === "no") status = "No";
                else if (dinner.status?.toLowerCase() === "yes") status = "Yes";
            }

            return {
                srNo: index + 1,
                name: user.name,
                email: user.email,
                profilePhoto: user.profilePhoto,
                status,
            };
        });

        return res.status(200).json({
            success: true,
            report,
        });
    } catch (error) {
        console.error("Error generating dinner report:", error);
        res.status(500).json({ success: false, message: "Server error." });
    }
};
