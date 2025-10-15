const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const cron = require("node-cron");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

dayjs.extend(utc);
dayjs.extend(timezone);

const Lunch = require("./models/lunchModel");
const User = require("./models/userModel");
const Dinner = require("./models/dinnerModel");

const lunchRouter = require("./routes/lunchRoutes");
const authRouter = require("./routes/authRoutes");
const dinnerRouter = require("./routes/dinnerRoutes");
const userRouter = require("./routes/userRoutes");

require("./models/dBase");

require("dotenv").config();
const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(bodyParser.json());
app.use(cors());

app.use("/auth", authRouter);
app.use("/lunch", lunchRouter);
app.use("/dinner", dinnerRouter);
app.use("/user", userRouter);

app.get("/", (req, res) => {
    res.send("Server is working!");
});

// CRON JOB — runs every day at 9:01 AM IST to mark "yes" for *today*
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
                    status: "yes"
                });
            }
        }
        console.log(`[CRON] yes entries added for ${today}`);
    } catch (err) {
        console.error("[CRON ERROR]", err);
    }
});

// CRON JOB — Dinner yes at 4:01 PM IST
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
                    status: "yes"
                });
            }
        }
        console.log(`[CRON] Dinner yes entries added for ${today}`);
    } catch (err) {
        console.error("[CRON ERROR - Dinner]", err);
    }
});

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
