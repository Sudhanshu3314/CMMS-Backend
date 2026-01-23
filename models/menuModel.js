const mongoose = require("mongoose");

const ImageItemSchema = new mongoose.Schema({
    name: String,
    img: String
});

const MenuSchema = new mongoose.Schema({
    day: {
        type: String,
        enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
        unique: true,
        required: true
    },
    breakfastItems: [ImageItemSchema],
    snacksItems: [ImageItemSchema],
    lunch: [String],
    dinner: [String],
    specialItems: {
        lunch: [String],
        dinner: [String]
    }
}, { timestamps: true });

module.exports = mongoose.model("Menu", MenuSchema);
