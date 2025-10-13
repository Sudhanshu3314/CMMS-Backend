const express = require("express");
const router = express.Router();
const { verifyToken } = require("../Middlewares/AuthValidation");
const {
    checkBeforeCutoff,
    postDinnerAttendance,
    getDinnerAttendance
} = require("../Controllers/DinnerController");

router.post("/", verifyToken, checkBeforeCutoff, postDinnerAttendance);

router.get("/", verifyToken, getDinnerAttendance);
module.exports = router;