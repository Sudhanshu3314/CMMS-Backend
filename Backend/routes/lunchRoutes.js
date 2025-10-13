const express = require("express");
const router = express.Router();
const { verifyToken } = require("../Middlewares/AuthValidation");
const {
    checkBeforeCutoff,
    postLunchAttendance,
    getLunchAttendance
} = require("../Controllers/LunchController");

router.post("/", verifyToken, checkBeforeCutoff, postLunchAttendance);
router.get("/", verifyToken, getLunchAttendance);

module.exports = router;
