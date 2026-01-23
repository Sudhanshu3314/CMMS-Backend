// Controllers/UserController.js
const User = require("../models/userModel");
const cloudinary = require("../Config/cloudinary");
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

// ✅ Cloudinary storage configuration for multer-storage-cloudinary
const storage = new CloudinaryStorage({
    cloudinary,
    params: {
        folder: "IGIDR-Profiles",
        allowed_formats: ["jpg", "png", "jpeg", "webp"],
        transformation: [{ width: 800, height: 800, crop: "limit" }],
    },
});

const upload = multer({
    storage,
    limits: { fileSize: 3 * 1024 * 1024 }, // 3MB
});

// 🔹 Toggle Membership
exports.toggleMembership = async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ success: false, message: "User not found" });

        user.membershipActive = user.membershipActive === "Active" ? "Inactive" : "Active";
        await user.save();

        return res.json({
            success: true,
            message: `Membership ${user.membershipActive === "Active" ? "Activated" : "Deactivated"} Successfully`,
            membershipActive: user.membershipActive,
        });
    } catch (error) {
        console.error("Membership toggle error:", error);
        res.status(500).json({ success: false, message: "Server error while toggling membership" });
    }
};

// 🔹 Upload Profile Photo (Cloudinary)
// Exports an array where first element is multer middleware and second is the handler
exports.uploadPhoto = [
    upload.single("photo"),
    async (req, res) => {
        try {
            // multer-storage-cloudinary attaches file information at req.file
            if (!req.file) {
                return res.status(400).json({ success: false, message: "No file uploaded" });
            }

            const user = await User.findById(req.user.id);
            if (!user) return res.status(404).json({ success: false, message: "User not found" });

            // Delete previous image from Cloudinary if exists
            if (user.profilePhotoId) {
                try {
                    await cloudinary.uploader.destroy(user.profilePhotoId, { invalidate: true });
                } catch (delErr) {
                    // log but don't block the upload
                    console.warn("Failed to delete previous Cloudinary image:", delErr.message || delErr);
                }
            }

            // Save new photo info from multer-storage-cloudinary (req.file)
            // multer-storage-cloudinary sets:
            //  - req.file.path   -> the uploaded file URL (secure_url)
            //  - req.file.filename -> the public_id
            user.profilePhoto = req.file.path || req.file.url || "";
            user.profilePhotoId = req.file.filename || req.file.public_id || "";

            await user.save();

            return res.json({
                success: true,
                message: "Profile photo updated successfully!",
                photoUrl: user.profilePhoto,
                photoId: user.profilePhotoId,
            });
        } catch (error) {
            console.error("Photo upload error:", error);
            res.status(500).json({ success: false, message: "Server error while uploading photo" });
        }
    },
];
