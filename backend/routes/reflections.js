const express = require("express");
const { getAllReflections } = require("../services/reflectionService");

const router = express.Router();

router.get("/", async (req, res, next) => {
    try {
        const reflections = await getAllReflections();
        res.json(reflections);
    } catch (err) {
        next(err);
    }
});

module.exports = router;
