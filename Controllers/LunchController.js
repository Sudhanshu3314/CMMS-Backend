const Lunch = require("../models/lunchModel");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

const TIMEZONE = "Asia/Kolkata";
const CUTOFF_HOUR = 9; // 9:00 AM cutoff

// 🕒 IST time helper
const istTime = () =>
    new Date().toLocaleString("en-IN", {
        timeZone: "Asia/Kolkata",
        hour12: false,
    });

// Middleware to check cutoff time for a given date
const checkBeforeCutoff = (req, res, next) => {
    console.log(`[${istTime()}] ⏱️ checkBeforeCutoff middleware triggered`);

    const { date } = req.body;
    if (!date) {
        console.warn(`[${istTime()}] ⚠️ Date missing in request body`);
        return res.status(400).json({ message: "Date is required" });
    }

    const now = dayjs().tz(TIMEZONE);
    const targetDate = dayjs(date).tz(TIMEZONE);

    console.log(
        `[${istTime()}] 🕒 Current IST Time: ${now.format("HH:mm:ss")}`
    );
    console.log(
        `[${istTime()}] 📅 Target Date: ${targetDate.format("YYYY-MM-DD")}`
    );

    // If the target date is after today, allow submission anytime
    if (targetDate.isAfter(now, "day")) {
        console.log(
            `[${istTime()}] ✅ Future date detected, bypassing cutoff`
        );
        return next();
    }

    // If today, check cutoff time
    if (now.hour() > CUTOFF_HOUR || (now.hour() === CUTOFF_HOUR && now.minute() >= 0)) {
        console.warn(
            `[${istTime()}] 🔒 Lunch cutoff crossed for today`
        );
        return res.status(403).json({
            message: "Lunch attendance closed for today. Must be submitted before 9:00 AM.",
            success: false
        });
    }

    console.log(
        `[${istTime()}] ✅ Before cutoff time, request allowed`
    );
    next();
};

// POST lunch attendance
const postLunchAttendance = async (req, res) => {
    console.log(`[${istTime()}] ➡️ POST /lunch`);
    console.log(`[${istTime()}] 👤 User: ${req.user?.email}`);
    console.log(`[${istTime()}] 📥 Request body:`, req.body);

    try {
        const { status, date } = req.body;

        if (!["yes", "no"].includes(status)) {
            console.warn(
                `[${istTime()}] ⚠️ Invalid status value: ${status}`
            );
            return res.status(400).json({ message: "Status must be 'yes' or 'no'" });
        }

        if (!date) {
            console.warn(`[${istTime()}] ⚠️ Date missing`);
            return res.status(400).json({ message: "Date is required" });
        }

        console.log(
            `[${istTime()}] 🔍 Checking existing lunch attendance`
        );
        const existing = await Lunch.findOne({ userId: req.user.id, date });

        if (existing) {
            console.warn(
                `[${istTime()}] ⚠️ Attendance already exists for this date`
            );
            return res.status(400).json({
                message: "You already submitted lunch attendance for this date."
            });
        }

        console.log(
            `[${istTime()}] 🆕 Creating lunch attendance entry`
        );
        await Lunch.create({
            userId: req.user.id,
            name: req.user.name,
            email: req.user.email,
            date,
            status
        });

        console.log(
            `[${istTime()}] ✅ Lunch attendance recorded successfully`
        );

        return res.status(201).json({
            message: "Lunch attendance recorded successfully",
            success: true
        });
    } catch (err) {
        console.error(
            `[${istTime()}] ❌ POST /lunch error:`,
            err
        );
        return res.status(500).json({
            message: "Server error",
            error: err.message
        });
    }
};

// GET lunch attendance for a given date
const getLunchAttendance = async (req, res) => {
    console.log(`[${istTime()}] ➡️ GET /lunch`);
    console.log(`[${istTime()}] 👤 User: ${req.user?.email}`);
    console.log(`[${istTime()}] 📅 Query:`, req.query);

    try {
        const { date } = req.query;
        if (!date) {
            console.warn(`[${istTime()}] ⚠️ Date query missing`);
            return res.status(400).json({ message: "Date query parameter is required" });
        }

        console.log(
            `[${istTime()}] 🔍 Fetching lunch attendance from DB`
        );
        const lunch = await Lunch.findOne({ userId: req.user.id, date }).lean();

        if (!lunch) {
            console.log(
                `[${istTime()}] ℹ️ No lunch record found`
            );
            return res.json({ date, status: "no response" });
        }

        console.log(
            `[${istTime()}] ✅ Lunch attendance found`
        );
        return res.json(lunch);
    } catch (err) {
        console.error(
            `[${istTime()}] ❌ GET /lunch error:`,
            err
        );
        return res.status(500).json({
            message: "Server error",
            error: err.message
        });
    }
};

module.exports = {
    checkBeforeCutoff,
    postLunchAttendance,
    getLunchAttendance
};
