// routes/userRoutes.js
const express = require("express");
const router = express.Router();
const { verifyToken } = require("../Middlewares/AuthValidation");
const { toggleMembership, uploadPhoto } = require("../Controllers/UserController");

// Protected route for toggling membership
router.post("/togglemembership", verifyToken, toggleMembership);

// Protected route for photo upload
router.post("/uploadphoto", verifyToken, uploadPhoto);

module.exports = router;
