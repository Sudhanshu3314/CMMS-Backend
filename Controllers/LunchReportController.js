const User = require("../models/userModel");
const Lunch = require("../models/lunchModel");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

// 🕒 IST time helper
const istTime = () =>
    new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour12: false,
    });

exports.getLunchReport = async (req, res) => {
    console.log(`[${istTime()}] ➡️ GET LUNCH REPORT`);

    try {
        // ⏰ Use Asia/Kolkata timezone explicitly
        const now = dayjs().tz("Asia/Kolkata");
        const hours = now.hour();
        const minutes = now.minute();
        const today = now.format("YYYY-MM-DD");

        console.log(
            `[${istTime()}] 🕒 Server Time (IST): ${now.format("HH:mm:ss")}`
        );
        console.log(
            `[${istTime()}] 📅 Report Date: ${today}`
        );

        // 🕘 Lunch report available after 7:00 AM (IST)
        const after905AM = hours > 7 || (hours === 7 && minutes >= 0);
        const after6AM = hours >= 6;

        console.log(
            `[${istTime()}] ⏱️ Time check → after 7:00 AM: ${after905AM}, after 6:00 AM: ${after6AM}`
        );

        // 🔒 Before 7:00 AM, show message
        if (!after905AM) {
            console.warn(
                `[${istTime()}] 🔒 Lunch report access blocked (before 7:00 AM)`
            );

            return res.status(400).json({
                success: false,
                message: "Lunch report available after 7:00 AM (IST).",
                currentServerTime: now.format("HH:mm"),
            });
        }

        // 🟢 Step 1: Fetch all Active users
        console.log(`[${istTime()}] 👥 Fetching active users`);
        const activeUsers = await User.find({ membershipActive: "Active" }).select(
            "name email profilePhoto _id"
        );

        console.log(
            `[${istTime()}] ✅ Active users fetched: ${activeUsers.length}`
        );

        // 🟢 Step 2: Fetch Lunch data for today
        console.log(`[${istTime()}] 🍱 Fetching lunch data for today`);
        const lunchData = await Lunch.find({ date: today });

        console.log(
            `[${istTime()}] ✅ Lunch records fetched: ${lunchData.length}`
        );

        // 🟢 Step 3: Combine logic
        console.log(`[${istTime()}] 🔄 Generating lunch report`);
        const report = activeUsers.map((user, index) => {
            const lunch = lunchData.find(
                (l) => l.userId.toString() === user._id.toString()
            );

            let status = "Yes";

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

        console.log(
            `[${istTime()}] ✅ Lunch report generated successfully`
        );

        // 🟢 Step 4: Send final response
        return res.status(200).json({
            success: true,
            report,
        });
    } catch (error) {
        console.error(
            `[${istTime()}] ❌ Error generating lunch report:`,
            error
        );
        res.status(500).json({ success: false, message: "Server error." });
    }
};
