const Song = require("../models/Song");

async function getAllSongs() {
  return await Song.findAll({
    attributes: [
      "id",
      "title",
      "artist",
      "theme",
      "language",
      "moodTags",
      "description",
      "audioUrl",
      "videoUrl",
    ],
  });
}

async function getSongById(id) {
  return await Song.findByPk(id, {
    attributes: [
      "id",
      "title",
      "artist",
      "theme",
      "language",
      "moodTags",
      "description",
      "audioUrl",
      "videoUrl",
    ],
  });
}

module.exports = { getAllSongs, getSongById };
