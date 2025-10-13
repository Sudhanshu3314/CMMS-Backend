const Lunch = require("../models/lunchModel");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

const TIMEZONE = "Asia/Kolkata";
const CUTOFF_HOUR = 9; // 9:00 AM cutoff

// Middleware to check cutoff time for a given date
const checkBeforeCutoff = (req, res, next) => {
    const { date } = req.body;
    if (!date) {
        return res.status(400).json({ message: "Date is required" });
    }

    const now = dayjs().tz(TIMEZONE);
    const targetDate = dayjs(date).tz(TIMEZONE);

    // If the target date is after today, allow submission anytime
    if (targetDate.isAfter(now, "day")) return next();

    // If today, check cutoff time
    if (now.hour() > CUTOFF_HOUR || (now.hour() === CUTOFF_HOUR && now.minute() >= 0)) {
        return res.status(403).json({
            message: "Lunch attendance closed for today. Must be submitted before 9:00 AM.",
            success: false
        });
    }

    next();
};

// POST lunch attendance
const postLunchAttendance = async (req, res) => {
    try {
        const { status, date } = req.body;

        if (!["yes", "no"].includes(status)) {
            return res.status(400).json({ message: "Status must be 'yes' or 'no'" });
        }
        if (!date) {
            return res.status(400).json({ message: "Date is required" });
        }

        const existing = await Lunch.findOne({ userId: req.user.id, date });
        if (existing) {
            return res.status(400).json({ message: "You already submitted lunch attendance for this date." });
        }

        await Lunch.create({
            userId: req.user.id,
            name: req.user.name,
            email: req.user.email,
            date,
            status
        });

        return res.status(201).json({
            message: "Lunch attendance recorded successfully",
            success: true
        });
    } catch (err) {
        console.error("POST /lunch error:", err);
        return res.status(500).json({ message: "Server error", error: err.message });
    }
};

// GET lunch attendance for a given date
const getLunchAttendance = async (req, res) => {
    try {
        const { date } = req.query;
        if (!date) {
            return res.status(400).json({ message: "Date query parameter is required" });
        }

        const lunch = await Lunch.findOne({ userId: req.user.id, date }).lean();
        if (!lunch) return res.json({ date, status: "no response" });
        return res.json(lunch);
    } catch (err) {
        console.error("GET /lunch error:", err);
        return res.status(500).json({ message: "Server error", error: err.message });
    }
};

module.exports = {
    checkBeforeCutoff,
    postLunchAttendance,
    getLunchAttendance
};
