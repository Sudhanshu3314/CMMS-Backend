const mongoose = require("mongoose");

const dinnerSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    name: { type: String, required: true },
    email: { type: String, required: true },
    date: { type: String, required: true }, // YYYY-MM-DD
    status: {
        type: String,
        enum: ["yes", "no","no response"],
        required: true
    }
}, { timestamps: true });

module.exports = mongoose.model("Dinner", dinnerSchema);