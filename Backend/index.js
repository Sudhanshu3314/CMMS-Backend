// index.js
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const cron = require("node-cron");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");
require("dotenv").config(); // ensure env is loaded
require("./models/dBase");    // your mongoose connection file
const cloudinary = require("./Config/cloudinary"); // ensure config is initialized

dayjs.extend(utc);
dayjs.extend(timezone);

const Lunch = require("./models/lunchModel");
const Dinner = require("./models/dinnerModel");
const User = require("./models/userModel");

const lunchRouter = require("./routes/lunchRoutes");
const authRouter = require("./routes/authRoutes");
const dinnerRouter = require("./routes/dinnerRoutes");
const userRouter = require("./routes/userRoutes");

//Admin
const adminRouter = require("./routes/adminRoutes");


const PORT = process.env.PORT || 8080;

app.use(express.json());
app.use(bodyParser.json());
app.use(cors({
    origin: 'http://localhost:1234', // Replace with your client's origin
    credentials: true // Crucial: This tells the client that credentials can be sent.
}));

app.use("/auth", authRouter);
app.use("/lunch", lunchRouter);
app.use("/dinner", dinnerRouter);
app.use("/user", userRouter);

//For Admin
app.use("/admin", adminRouter);

app.get("/", (req, res) => {
    res.send("Server is working!");
});

// CRON JOBS (unchanged)
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
        console.log(`[CRON] Lunch 'yes' entries added for ${today}`);
    } catch (err) {
        console.error("[CRON ERROR - Lunch]", err);
    }
});

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
        console.log(`[CRON] Dinner 'yes' entries added for ${today}`);
    } catch (err) {
        console.error("[CRON ERROR - Dinner]", err);
    }
});

app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
