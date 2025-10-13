const { required } = require("joi");
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
        profilePhoto: { type: String, default: "" },

        // Membership as string
        membershipActive: {
            type: String,
            enum: ["Active", "Inactive"],
            default: "Inactive",
            required: true,
        },
    },
    { timestamps: true }
);

const UserModel = mongoose.model("User", UserSchema);
module.exports = UserModel;
