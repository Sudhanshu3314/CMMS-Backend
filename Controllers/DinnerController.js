const Dinner = require("../models/dinnerModel");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

const TIMEZONE = "Asia/Kolkata";
const CUTOFF_HOUR = 16; // 4:00 PM cutoff
const CUTOFF_MINUTE = 30; // 30 minutes

// Middleware to check cutoff
const checkBeforeCutoff = (req, res, next) => {
    const logTime = dayjs().tz(TIMEZONE).format("YYYY-MM-DD HH:mm:ss");

    console.log(`[${logTime} ] 🔍 Dinner cutoff check started`);

    const { date } = req.body;
    if (!date) {
        console.log(`[${logTime} ] ❌ Date missing in request body`);
        return res.status(400).json({ message: "Date is required" });
    }

    const now = dayjs().tz(TIMEZONE);
    const targetDate = dayjs(date).tz(TIMEZONE);

    console.log(
        `[${logTime} ] ⏰ Current time: ${now.format("HH:mm")} | Target date: ${targetDate.format("YYYY-MM-DD")}`
    );

    // If date is in the future → allow
    if (targetDate.isAfter(now, "day")) {
        console.log(`[${logTime} ] ✅ Future date detected, submission allowed`);
        return next();
    }

    // If today → check time
    if (
        now.hour() > CUTOFF_HOUR ||
        (now.hour() === CUTOFF_HOUR && now.minute() >= CUTOFF_MINUTE)
    ) {
        console.log(
            `[${logTime} ] ⛔ Dinner attendance blocked (after 4:30 PM)`
        );

        return res.status(403).json({
            message: "Dinner attendance closed for today. Must be submitted before 4:30 PM.",
            success: false
        });
    }

    console.log(`[${logTime} ] ✅ Dinner attendance allowed (before cutoff)`);
    next();
};

// POST attendance
const postDinnerAttendance = async (req, res) => {
    const logTime = dayjs().tz(TIMEZONE).format("YYYY-MM-DD HH:mm:ss");

    try {
        console.log(`[${logTime} ] 📥 POST /dinner attendance request`);

        const { status, date } = req.body;

        if (!["yes", "no"].includes(status)) {
            console.log(`[${logTime} ] ❌ Invalid status received: ${status}`);
            return res.status(400).json({ message: "Status must be 'yes' or 'no'" });
        }

        if (!date) {
            console.log(`[${logTime} ] ❌ Date missing in request`);
            return res.status(400).json({ message: "Date is required" });
        }

        console.log(
            `[${logTime} ] 🔍 Checking existing dinner attendance for user ${req.user.id} on ${date}`
        );

        const existing = await Dinner.findOne({ userId: req.user.id, date });
        if (existing) {
            console.log(
                `[${logTime} ] ♻️ Existing dinner record found, submission blocked`
            );

            return res.status(400).json({
                message: "You already submitted dinner attendance for this date."
            });
        }

        await Dinner.create({
            userId: req.user.id,
            name: req.user.name,
            email: req.user.email,
            date,
            status
        });

        console.log(
            `[${logTime} ] ✅ Dinner attendance recorded successfully`
        );

        return res.status(201).json({
            message: "Dinner attendance recorded successfully",
            success: true
        });
    } catch (err) {
        console.error(
            `[${dayjs().tz(TIMEZONE).format("YYYY-MM-DD HH:mm:ss")} ] ❌ POST /dinner error`,
            err
        );

        return res.status(500).json({
            message: "Server error",
            error: err.message
        });
    }
};

// GET attendance
const getDinnerAttendance = async (req, res) => {
    const logTime = dayjs().tz(TIMEZONE).format("YYYY-MM-DD HH:mm:ss");

    try {
        console.log(`[${logTime} ] 📥 GET /dinner attendance request`);

        const { date } = req.query;
        if (!date) {
            console.log(`[${logTime} ] ❌ Date query parameter missing`);
            return res.status(400).json({ message: "Date query parameter is required" });
        }

        console.log(
            `[${logTime} ] 🔍 Fetching dinner attendance for user ${req.user.id} on ${date}`
        );

        const dinner = await Dinner.findOne({ userId: req.user.id, date }).lean();

        if (!dinner) {
            console.log(
                `[${logTime} ] ⚠️ No dinner attendance found (no response)`
            );
            return res.json({ date, status: "no response" });
        }

        console.log(
            `[${logTime} ] ✅ Dinner attendance fetched successfully`
        );

        return res.json(dinner);
    } catch (err) {
        console.error(
            `[${dayjs().tz(TIMEZONE).format("YYYY-MM-DD HH:mm:ss")} ] ❌ GET /dinner error`,
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
    postDinnerAttendance,
    getDinnerAttendance
};
