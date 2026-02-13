// index.js
const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const cron = require("node-cron");
const dayjs = require("dayjs");
const utc = require("dayjs/plugin/utc");
const timezone = require("dayjs/plugin/timezone");

require("dotenv").config();
require("./models/dBase"); // MongoDB connection
require("./Config/cloudinary"); // Cloudinary config

dayjs.extend(utc);
dayjs.extend(timezone);

// Models
const Lunch = require("./models/lunchModel");
const Dinner = require("./models/dinnerModel");
const User = require("./models/userModel");

// Routes
const lunchRouter = require("./routes/lunchRoutes");
const authRouter = require("./routes/authRoutes");
const dinnerRouter = require("./routes/dinnerRoutes");
const userRouter = require("./routes/userRoutes");
const adminRouter = require("./routes/adminRoutes");
const uploadRouter = require("./routes/uploadRoutes");
const menuRouter = require("./routes/menuRoutes");

/* ===============================
   ✅ GLOBAL CORS – ALLOW ALL
   =============================== */
app.use(
    cors({
        origin: true,              // ✅ allow ALL origins
        credentials: true,          // ✅ allow cookies / auth headers
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
        allowedHeaders: [
            "Content-Type",
            "Authorization"
        ]
    })
);


// ✅ IMPORTANT: handle preflight explicitly
// ✅ IMPORTANT: use regex, NOT "*"
app.options(/.*/, cors());

/* ===============================
   MIDDLEWARES
   =============================== */
app.use(express.json());
app.use(bodyParser.json());

/* ===============================
   ROUTES
   =============================== */
app.use("/upload", uploadRouter);
app.use("/menu", menuRouter);

app.use("/auth", authRouter);
app.use("/lunch", lunchRouter);
app.use("/dinner", dinnerRouter);
app.use("/user", userRouter);
app.use("/admin", adminRouter);

/* ===============================
   HEALTH CHECK
   =============================== */
app.get("/", (req, res) => {
    res.send("🚀 Server is working!");
});

/* ===============================
   SERVER
   =============================== */
const PORT = process.env.PORT || 8080;

app.listen(PORT, () => {
    console.log(`🚀 Server running on http://localhost:${PORT}`);
});
