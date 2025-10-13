const express = require("express");
const router = express.Router();
const { verifyToken } = require("../Middlewares/AuthValidation");
const { toggleMembership } = require("../Controllers/UserController")

// Protected route for toggling membership
router.post("/togglemembership", verifyToken, toggleMembership);

module.exports = router;
