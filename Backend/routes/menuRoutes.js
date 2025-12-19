const express = require("express");
const router = express.Router();
const Menu = require("../models/menuModel");

// SAVE / UPDATE MENU BY DAY
router.post("/:day", async (req, res) => {
    try {
        const { day } = req.params;

        const menu = await Menu.findOneAndUpdate(
            { day },
            req.body,
            { upsert: true, new: true }
        );

        res.json(menu);
    } catch (err) {
        res.status(500).json({ message: "Failed to save menu" });
    }
});

// GET MENU BY DAY
router.get("/:day", async (req, res) => {
    try {
        const menu = await Menu.findOne({ day: req.params.day });

        res.json(menu || {
            day: req.params.day,
            breakfastItems: [],
            snacksItems: [],
            lunch: [],
            dinner: [],
            specialItems: { lunch: [], dinner: [] }
        });
    } catch (err) {
        res.status(500).json({ message: "Failed to fetch menu" });
    }
});


module.exports = router;
