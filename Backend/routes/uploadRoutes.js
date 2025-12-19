const express = require("express");
const router = express.Router();
const multer = require("multer");
const cloudinary = require("../Config/cloudinary");
const streamifier = require("streamifier");

// memory storage (best for cloudinary)
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", upload.single("image"), async (req, res) => {
    console.log("FILE:", req.file);
    try {
        if (!req.file) {
            return res.status(400).json({ message: "No file uploaded" });
        }

        const streamUpload = () =>
            new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                    { folder: "canteen-menu" },
                    (error, result) => {
                        if (result) resolve(result);
                        else reject(error);
                    }
                );

                streamifier.createReadStream(req.file.buffer).pipe(stream);
            });

        const result = await streamUpload();

        res.status(200).json({
            url: result.secure_url,
            public_id: result.public_id
        });

    } catch (error) {
        console.error("UPLOAD ERROR:", error);
        res.status(500).json({ message: "Image upload failed" });
    }
});

router.delete("/", async (req, res) => {
    try {
        const { public_id } = req.body;

        if (!public_id) {
            return res.status(400).json({ message: "Public ID required" });
        }

        const result = await cloudinary.uploader.destroy(public_id);

        res.status(200).json({
            message: "Image deleted successfully",
            result
        });
    } catch (error) {
        console.error("DELETE ERROR:", error);
        res.status(500).json({ message: "Failed to delete image" });
    }
});



module.exports = router;
