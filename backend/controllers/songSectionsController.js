const { Song } = require('../models')
const { formatSongSectionsLyrics, recommendSongSections, validateSongSections } = require('../services/songSectionService')

async function findOwnedSong(req, res) {
  const song = await Song.findOne({ where: { id: req.params.id, creatorId: req.authUserRecord.id } })
  if (!song) res.status(404).json({ message: 'Song not found.' })
  return song
}

async function recommendSections(req, res, next) {
  try {
    const song = await findOwnedSong(req, res)
    if (!song) return undefined
    if (!Array.isArray(song.transcriptionSegments) || !song.transcriptionSegments.length) {
      return res.status(400).json({ message: 'Extract timestamped lyrics before requesting song-section recommendations.' })
    }

    const replaceConfirmed = req.body?.replaceConfirmed === true
    if (song.sectionRecommendationsConfirmedAt && !replaceConfirmed) {
      return res.status(409).json({ message: 'These song sections were confirmed by the creator. Confirm replacement explicitly before regenerating them.' })
    }
    const sections = await recommendSongSections({
      durationSecs: song.durationSecs,
      segments: song.transcriptionSegments,
    })
    const lyrics = formatSongSectionsLyrics(sections)
    await song.update({ rawLyrics: lyrics, sectionRecommendations: sections, sectionRecommendationsConfirmedAt: null })
    return res.json({ confirmedAt: null, lyrics, sections })
  } catch (error) {
    return next(error)
  }
}

async function saveSections(req, res, next) {
  try {
    const song = await findOwnedSong(req, res)
    if (!song) return undefined
    const sections = validateSongSections(req.body?.sections, {
      durationSecs: song.durationSecs,
      enforceTranscriptLyrics: false,
      transcriptSegments: song.transcriptionSegments || [],
    })
    const confirmedAt = req.body?.confirmed === false ? null : new Date()
    const lyrics = formatSongSectionsLyrics(sections)
    await song.update({ rawLyrics: lyrics, sectionRecommendations: sections, sectionRecommendationsConfirmedAt: confirmedAt })
    return res.json({ confirmedAt, lyrics, sections })
  } catch (error) {
    if (error.name === 'SongSectionValidationError') return res.status(400).json({ message: error.message })
    return next(error)
  }
}

module.exports = { recommendSections, saveSections }
