const mongoose = require("mongoose");

const lunchSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    name: { type: String, required: true },
    email: { type: String, required: true },
    date: { type: String, required: true }, // YYYY-MM-DD format
    status: {
        type: String,
        enum: ["yes", "no","no response"],
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model("Lunch", lunchSchema);