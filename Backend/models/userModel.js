// models/userModel.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema(
    {
        name: { type: String, required: true, trim: true },
        email: { type: String, required: true, unique: true, lowercase: true, trim: true },
        password: { type: String, required: true, minlength: 8 },
        isVerified: { type: Boolean, default: false },
        verificationToken: String,
        resetToken: String,
        resetTokenExpiry: Date,

        // profile photo url
        profilePhoto: { type: String, default: "" },

        // cloudinary public_id for easier deletion/updating
        profilePhotoId: { type: String, default: "" },

        membershipActive: {
            type: String,
            enum: ["Active", "Inactive"],
            default: "Inactive",
            required: true,
        },
    },
    { timestamps: true }
);

module.exports = mongoose.model("User", UserSchema);
