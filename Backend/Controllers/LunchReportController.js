const User = require("../models/userModel");
const Lunch = require("../models/lunchModel");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

exports.getLunchReport = async (req, res) => {
    try {
        // ⏰ Use Asia/Kolkata timezone explicitly
        const now = dayjs().tz("Asia/Kolkata");
        const hours = now.hour();
        const minutes = now.minute();

        // 🔒 Allow only after 9:05 AM (IST)
        if (hours < 9 || (hours === 9 && minutes < 5)) {
            return res.status(400).json({
                success: false,
                message: "Lunch report available after 9:05 AM (IST).",
                currentServerTime: now.format("HH:mm"),
            });
        }

        const today = now.format("YYYY-MM-DD");

        // 🟢 Step 1: Fetch all Active users
        const activeUsers = await User.find({ membershipActive: "Active" }).select(
            "name email profilePhoto _id"
        );

        // 🟢 Step 2: Fetch Lunch data for today
        const lunchData = await Lunch.find({ date: today });

        // 🟢 Step 3: Combine logic (default "Yes" if not responded)
        const report = activeUsers.map((user, index) => {
            const lunch = lunchData.find(
                (l) => l.userId.toString() === user._id.toString()
            );

            let status = "Yes"; // default Yes (for users with no record)

            if (lunch) {
                if (lunch.status?.toLowerCase() === "no") status = "No";
                else if (lunch.status?.toLowerCase() === "yes") status = "Yes";
            }

            return {
                srNo: index + 1,
                name: user.name,
                email: user.email,
                profilePhoto: user.profilePhoto,
                status,
            };
        });

        // 🟢 Step 4: Send final response
        return res.status(200).json({
            success: true,
            report,
        });
    } catch (error) {
        console.error("Error generating lunch report:", error);
        res.status(500).json({ success: false, message: "Server error." });
    }
};
