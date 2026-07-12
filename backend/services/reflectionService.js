const { Reflection, Song, User } = require("../models");

async function getAllReflections() {
    return await Reflection.findAll({
        attributes: ["id", "songId", "displayName", "content", "userId", "status"],
        include: [
            { model: Song, attributes: ["title"], as: "song" },
            { model: User, attributes: ["name"], as: "user" },
        ],
        where: { status: "APPROVED" }, // ✅ exclude pending
        //limit: 5,
        order: [["id", "DESC"]],
    });
}


module.exports = { getAllReflections };
