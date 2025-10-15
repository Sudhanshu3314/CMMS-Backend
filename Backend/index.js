const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const cron = require("node-cron");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
const dotenv = require("dotenv");
const mongoose = require("mongoose");

// Load environment variables
dotenv.config();

// Day.js timezone setup
dayjs.extend(utc);
dayjs.extend(timezone);

// Import Models
const Lunch = require("./models/lunchModel");
const Dinner = require("./models/dinnerModel");
const User = require("./models/userModel");

// Import Routes
const lunchRouter = require("./routes/lunchRoutes");
const dinnerRouter = require("./routes/dinnerRoutes");
const authRouter = require("./routes/authRoutes");
const userRouter = require("./routes/userRoutes");

// Middleware
app.use(cors());
app.use(express.json());
app.use(bodyParser.json());

// Routes
app.use("/auth", authRouter);
app.use("/lunch", lunchRouter);
app.use("/dinner", dinnerRouter);
app.use("/user", userRouter);

app.get("/", (req, res) => {
    res.send("🚀 IGIDR Backend Server is Running Successfully!");
});

// ===============================
// 🔗 MongoDB Connection
// ===============================
const MONGO_CONN = process.env.MONGO_CONN;
mongoose
    .connect(MONGO_CONN, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then(() => console.log("✅ MongoDB Connected Successfully"))
    .catch((err) => console.error("❌ MongoDB Connection Error:", err));

// ===============================
// 🕒 CRON JOBS
// ===============================

// 9:01 AM IST — Auto-mark lunch as "yes"
cron.schedule("1 9 * * *", async () => {
    try {
        const today = dayjs().tz("Asia/Kolkata").format("YYYY-MM-DD");
        const users = await User.find({}, "_id name email");

        for (const user of users) {
            const existing = await Lunch.findOne({ userId: user._id, date: today });
            if (!existing) {
                await Lunch.create({
                    userId: user._id,
                    name: user.name,
                    email: user.email,
                    date: today,
                    status: "yes",
                });
            }
        }
        console.log(`[CRON] ✅ Lunch "yes" entries added for ${today}`);
    } catch (err) {
        console.error("[CRON ERROR - Lunch]", err);
    }
});

// 4:01 PM IST — Auto-mark dinner as "yes"
cron.schedule("1 16 * * *", async () => {
    try {
        const today = dayjs().tz("Asia/Kolkata").format("YYYY-MM-DD");
        const users = await User.find({}, "_id name email");

        for (const user of users) {
            const existing = await Dinner.findOne({ userId: user._id, date: today });
            if (!existing) {
                await Dinner.create({
                    userId: user._id,
                    name: user.name,
                    email: user.email,
                    date: today,
                    status: "yes",
                });
            }
        }
        console.log(`[CRON] ✅ Dinner "yes" entries added for ${today}`);
    } catch (err) {
        console.error("[CRON ERROR - Dinner]", err);
    }
});

// ===============================
// 🚀 Start Server
// ===============================
const PORT = process.env.PORT || 8080;
app.listen(PORT, () => {
    console.log(`🌐 Server running on port ${PORT}`);
});
