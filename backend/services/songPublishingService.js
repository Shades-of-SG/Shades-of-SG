const PUBLISH_FIELDS = [
    ['title', (song) => song.title?.trim()],
    ['artist', (song) => song.artist?.trim()],
    ['description', (song) => song.description?.trim()],
    ['theme', (song) => song.theme?.trim()],
    ['languages', (song) => Array.isArray(song.languages) && song.languages.length > 0],
    ['rawLyrics', (song) => song.rawLyrics?.trim()],
    ['coverImageUrl', (song) => song.coverImageUrl?.trim()],
    ['audioUrl', (song) => song.audioUrl?.trim()],
    ['videoUrl', (song) => song.videoUrl?.trim()],
];

function getSongPublishMissing(song) {
    return PUBLISH_FIELDS.filter(([, present]) => !present(song)).map(([field]) => field);
}

module.exports = { getSongPublishMissing };
