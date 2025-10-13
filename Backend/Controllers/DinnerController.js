const Dinner = require("../models/dinnerModel");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

const TIMEZONE = "Asia/Kolkata";
const CUTOFF_HOUR = 16; // 4:00 PM cutoff

// Middleware to check cutoff
const checkBeforeCutoff = (req, res, next) => {
    const { date } = req.body;
    if (!date) {
        return res.status(400).json({ message: "Date is required" });
    }

    const now = dayjs().tz(TIMEZONE);
    const targetDate = dayjs(date).tz(TIMEZONE);

    // If date is in the future → allow
    if (targetDate.isAfter(now, "day")) return next();

    // If today → check time
    if (now.hour() > CUTOFF_HOUR || (now.hour() === CUTOFF_HOUR && now.minute() >= 0)) {
        return res.status(403).json({
            message: "Dinner attendance closed for today. Must be submitted before 4:00 PM.",
            success: false
        });
    }

    next();
};

// POST attendance
const postDinnerAttendance = async (req, res) => {
    try {
        const { status, date } = req.body;

        if (!["yes", "no"].includes(status)) {
            return res.status(400).json({ message: "Status must be 'yes' or 'no'" });
        }
        if (!date) {
            return res.status(400).json({ message: "Date is required" });
        }

        const existing = await Dinner.findOne({ userId: req.user.id, date });
        if (existing) {
            return res.status(400).json({ message: "You already submitted dinner attendance for this date." });
        }

        await Dinner.create({
            userId: req.user.id,
            name: req.user.name,
            email: req.user.email,
            date,
            status
        });

        return res.status(201).json({
            message: "Dinner attendance recorded successfully",
            success: true
        });
    } catch (err) {
        console.error("POST /dinner error:", err);
        return res.status(500).json({ message: "Server error", error: err.message });
    }
};

// GET attendance
const getDinnerAttendance = async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) {
            return res.status(400).json({ message: "Date query parameter is required" });
        }

        const dinner = await Dinner.findOne({ userId: req.user.id, date }).lean();
        if (!dinner) return res.json({ date, status: "no response" });
        return res.json(dinner);
    } catch (err) {
        console.error("GET /dinner error:", err);
        return res.status(500).json({ message: "Server error", error: err.message });
    }
};

module.exports = {
    checkBeforeCutoff,
    postDinnerAttendance,
    getDinnerAttendance
};
