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

        // 🧾 LOG: request received
        console.log(
            `[${now.format("YYYY-MM-DD HH:mm:ss")} ] 📥 GET /dinner/report request`
        );

        console.log(
            `[${now.format("YYYY-MM-DD HH:mm:ss")} ] ⏰ Server time → ${hours}:${minutes}`
        );

        // 🔒 Allow only after 7:00 AM (IST)
        const after435PM = hours > 7 || (hours === 7 && minutes >= 0);
        const after6AM = hours >= 6;

        console.log(
            `[${now.format("YYYY-MM-DD HH:mm:ss")} ] 🔎 after435PM=${after435PM}, after6AM=${after6AM}`
        );

        // 🚫 Before 7:00 AM
        if (!after435PM) {
            console.log(
                `[${now.format("YYYY-MM-DD HH:mm:ss")} ] ⛔ Dinner report blocked (before 7:00 AM)`
            );

            return res.status(400).json({
                success: false,
                message: "Dinner report available after 7:00 AM (IST).",
                currentServerTime: now.format("HH:mm"),
            });
        }

        // 🟢 Step 1: Fetch active users
        console.log(
            `[${now.format("YYYY-MM-DD HH:mm:ss")} ] 👥 Fetching active users`
        );

        const activeUsers = await User.find({ membershipActive: "Active" }).select(
            "name email profilePhoto _id"
        );

        console.log(
            `[${now.format("YYYY-MM-DD HH:mm:ss")} ] ✅ Active users count: ${activeUsers.length}`
        );

        // 🟢 Step 2: Fetch dinner data
        console.log(
            `[${now.format("YYYY-MM-DD HH:mm:ss")} ] 🍽️ Fetching dinner data for ${today}`
        );

        const dinnerData = await Dinner.find({ date: today });

        console.log(
            `[${now.format("YYYY-MM-DD HH:mm:ss")} ] 📊 Dinner records found: ${dinnerData.length}`
        );

        // 🟢 Step 3: Combine logic
        const report = activeUsers.map((user, index) => {
            const dinner = dinnerData.find(
                (d) => d.userId.toString() === user._id.toString()
            );

            let status = "Yes";

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

        console.log(
            `[${now.format("YYYY-MM-DD HH:mm:ss")} ] 📤 Dinner report generated successfully`
        );

        return res.status(200).json({
            success: true,
            report,
        });
    } catch (error) {
        console.error(
            `[${dayjs().tz("Asia/Kolkata").format("YYYY-MM-DD HH:mm:ss")} ] ❌ Error generating dinner report`,
            error
        );

        res.status(500).json({
            success: false,
            message: "Server error.",
        });
    }
};
