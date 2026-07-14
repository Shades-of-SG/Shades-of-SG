const { Op } = require('sequelize')
const { RhythmBeatmap, Song, sequelize } = require('../models')
const { DIFFICULTIES } = require('../config/rhythm')
const beatmapGenerator = require('../services/beatmapGenerator')
const { generateFallbackBeatmap } = require('../services/fallbackBeatmapGenerator')

const activeGenerations = new Set()

function difficultyFrom(value) {
  const difficulty = String(value || '').toUpperCase()
  return DIFFICULTIES.includes(difficulty) ? difficulty : null
}

function publicBeatmap(row) {
  return {
    id: row.id, songId: row.songId, difficulty: row.difficulty, version: row.version,
    bpm: row.bpm === null ? null : Number(row.bpm), offsetMs: row.offsetMs,
    durationMs: row.durationMs, notes: row.notes, generationSource: row.generationSource,
    status: row.status, generatedAt: row.generatedAt, publishedAt: row.publishedAt,
  }
}

function summaryRow(row, includeError = false) {
  if (!row) return null
  const notes = Array.isArray(row.notes) ? row.notes : []
  return {
    id: row.id, status: row.status, version: row.version,
    bpm: row.bpm === null ? null : Number(row.bpm), offsetMs: row.offsetMs,
    generationSource: row.generationSource, noteCount: notes.length,
    holdNoteCount: notes.filter((note) => note.type === 'hold').length,
    generatedAt: row.generatedAt, publishedAt: row.publishedAt,
    ...(includeError && row.status === 'FAILED' && row.errorMessage ? { errorMessage: row.errorMessage } : {}),
  }
}

function difficultySummary(difficulty, rows, isOwner) {
  const draft = rows.find((row) => row.status === 'DRAFT')
  const published = rows.find((row) => row.status === 'PUBLISHED')
  const failed = rows.find((row) => row.status === 'FAILED')
  if (!isOwner) return { difficulty, status: published ? 'PUBLISHED' : 'NOT_CREATED', published: summaryRow(published) }
  const current = draft || failed || published
  return {
    difficulty, status: current?.status || 'NOT_CREATED',
    draft: summaryRow(draft), published: summaryRow(published), failed: summaryRow(failed, true),
    ...(current ? summaryRow(current, true) : { bpm: null, generatedAt: null, generationSource: null, holdNoteCount: 0, noteCount: 0, offsetMs: 0, publishedAt: null, version: 0 }),
  }
}

async function findAccessibleSong(req, { ownerRequired = false } = {}) {
  const song = await Song.findByPk(req.params.songId)
  if (!song) return null
  const isOwner = Boolean(req.authUser?.id && song.creatorId === req.authUser.id)
  if (ownerRequired && !isOwner) return null
  if (!isOwner && song.status !== 'PUBLISHED') return null
  return { isOwner, song }
}

async function getBeatmap(req, res, next) {
  try {
    const difficulty = difficultyFrom(req.params.difficulty)
    if (!difficulty) return res.status(400).json({ message: 'difficulty must be EASY, MEDIUM, or HARD' })
    const access = await findAccessibleSong(req)
    if (!access || access.song.status !== 'PUBLISHED') return res.status(404).json({ message: 'Published song not found.' })
    const row = await RhythmBeatmap.findOne({ where: { songId: access.song.id, difficulty, status: 'PUBLISHED' } })
    if (!row) return res.status(404).json({ message: 'This rhythm game is not available yet.' })
    return res.json({ beatmap: publicBeatmap(row) })
  } catch (error) { return next(error) }
}

async function previewBeatmap(req, res, next) {
  try {
    const difficulty = difficultyFrom(req.params.difficulty)
    if (!difficulty) return res.status(400).json({ message: 'difficulty must be EASY, MEDIUM, or HARD' })
    const access = await findAccessibleSong(req, { ownerRequired: true })
    if (!access) return res.status(404).json({ message: 'Song not found.' })
    const row = await RhythmBeatmap.findOne({ where: { songId: access.song.id, difficulty, status: { [Op.in]: ['DRAFT', 'PUBLISHED'] } }, order: [['status', 'ASC']] })
    if (!row) return res.status(404).json({ message: 'No draft beatmap is available to preview.' })
    return res.json({ beatmap: publicBeatmap(row) })
  } catch (error) { return next(error) }
}

async function listBeatmaps(req, res, next) {
  try {
    const access = await findAccessibleSong(req)
    if (!access) return res.status(404).json({ message: 'Published song not found.' })
    const rows = await RhythmBeatmap.findAll({ where: { songId: access.song.id }, order: [['version', 'DESC']] })
    return res.json({ beatmaps: DIFFICULTIES.map((difficulty) => difficultySummary(difficulty, rows.filter((row) => row.difficulty === difficulty), access.isOwner)) })
  } catch (error) { return next(error) }
}

function safeGenerationError() {
  return 'Beatmap generation failed. Any published beatmap remains available. Please retry.'
}

async function generatedProposal(song, difficulty, mode) {
  const durationMs = Math.round(Number(song.durationSecs) * 1000)
  if (mode === 'BASIC') return { beatmap: generateFallbackBeatmap({ songId: song.id, difficulty, durationMs, bpm: song.bpm }), source: 'FALLBACK', aiError: null }
  return beatmapGenerator.generateBeatmap(song, difficulty)
}

async function generateForSong(song, difficulty, mode = 'AI') {
  const key = `${song.id}:${difficulty}`
  if (activeGenerations.has(key)) { const error = new Error(`${difficulty} beatmap generation is already in progress.`); error.status = 409; throw error }
  activeGenerations.add(key)
  try {
    const proposal = await generatedProposal(song, difficulty, mode)
    const maximumVersion = await RhythmBeatmap.max('version', { where: { songId: song.id, difficulty } })
    return sequelize.transaction(async (transaction) => {
      await RhythmBeatmap.destroy({ where: { songId: song.id, difficulty, status: { [Op.in]: ['DRAFT', 'FAILED'] } }, transaction })
      return RhythmBeatmap.create({
        songId: song.id, difficulty, version: Number(maximumVersion || 0) + 1,
        bpm: proposal.beatmap.bpm, offsetMs: proposal.beatmap.offsetMs,
        durationMs: Math.round(Number(song.durationSecs) * 1000), notes: proposal.beatmap.notes,
        generationSource: proposal.source, status: 'DRAFT', generatedAt: new Date(), errorMessage: proposal.aiError,
      }, { transaction })
    })
  } catch (error) {
    const maximumVersion = await RhythmBeatmap.max('version', { where: { songId: song.id, difficulty } }).catch(() => 0)
    await RhythmBeatmap.destroy({ where: { songId: song.id, difficulty, status: 'FAILED' } }).catch(() => {})
    await RhythmBeatmap.create({ songId: song.id, difficulty, version: Number(maximumVersion || 0) + 1, durationMs: Math.round(Number(song.durationSecs) * 1000), notes: [], generationSource: 'FALLBACK', status: 'FAILED', errorMessage: safeGenerationError() }).catch(() => {})
    throw error
  } finally { activeGenerations.delete(key) }
}

async function ownedPlayableSong(req, res) {
  const song = await Song.findOne({ where: { id: req.params.songId, creatorId: req.authUserRecord.id } })
  if (!song) { res.status(404).json({ message: 'Song not found.' }); return null }
  if (!Number.isFinite(Number(song.durationSecs)) || song.durationSecs < 5) { res.status(400).json({ message: 'Save audio with valid duration metadata before generating a beatmap.' }); return null }
  return song
}

async function generateStoredBeatmap(req, res, next) {
  try {
    const difficulty = difficultyFrom(req.body.difficulty)
    const mode = String(req.body.mode || 'AI').toUpperCase()
    if (!difficulty) return res.status(400).json({ message: 'difficulty must be EASY, MEDIUM, or HARD' })
    if (!['AI', 'BASIC'].includes(mode)) return res.status(400).json({ message: 'mode must be AI or BASIC' })
    const song = await ownedPlayableSong(req, res)
    if (!song) return undefined
    const row = await generateForSong(song, difficulty, mode)
    return res.status(201).json({ beatmap: publicBeatmap(row), fallbackUsed: row.generationSource === 'FALLBACK' })
  } catch (error) {
    if (error.status === 409) return res.status(409).json({ message: error.message })
    if (res.headersSent) return next(error)
    return res.status(502).json({ message: safeGenerationError() })
  }
}

async function generateAllBeatmaps(req, res, next) {
  try {
    const song = await ownedPlayableSong(req, res)
    if (!song) return undefined
    const mode = String(req.body?.mode || 'AI').toUpperCase()
    if (!['AI', 'BASIC'].includes(mode)) return res.status(400).json({ message: 'mode must be AI or BASIC' })

    // SQLite uses one write connection in local development. Running three
    // transactions concurrently makes them collide, so generate each distinct
    // difficulty in order while still collecting partial failures.
    const settled = []
    for (const difficulty of DIFFICULTIES) {
      try {
        settled.push({ status: 'fulfilled', value: await generateForSong(song, difficulty, mode) })
      } catch (error) {
        settled.push({ reason: error, status: 'rejected' })
      }
    }
    const beatmaps = settled.filter((result) => result.status === 'fulfilled').map((result) => publicBeatmap(result.value))
    const failed = settled.flatMap((result, index) => result.status === 'rejected' ? [DIFFICULTIES[index]] : [])
    return res.status(failed.length ? 207 : 201).json({ beatmaps, failed, message: failed.length ? `Generation failed for: ${failed.join(', ')}` : 'All beatmap drafts generated.' })
  } catch (error) { return next(error) }
}

async function updateDraftSettings(req, res, next) {
  try {
    const difficulty = difficultyFrom(req.params.difficulty)
    const offsetMs = Number(req.body.offsetMs)
    if (!difficulty) return res.status(400).json({ message: 'Invalid difficulty.' })
    if (!Number.isInteger(offsetMs) || offsetMs < -500 || offsetMs > 500) return res.status(400).json({ message: 'Timing offset must be an integer between -500 and 500ms.' })
    const song = await ownedPlayableSong(req, res)
    if (!song) return undefined
    const row = await RhythmBeatmap.findOne({ where: { songId: song.id, difficulty, status: 'DRAFT' } })
    if (!row) return res.status(404).json({ message: 'Draft beatmap not found.' })
    await row.update({ offsetMs })
    return res.json({ beatmap: publicBeatmap(row) })
  } catch (error) { return next(error) }
}

async function publishBeatmap(req, res, next) {
  try {
    const difficulty = difficultyFrom(req.params.difficulty)
    if (!difficulty) return res.status(400).json({ message: 'Invalid difficulty.' })
    const song = await ownedPlayableSong(req, res)
    if (!song) return undefined
    const row = await sequelize.transaction(async (transaction) => {
      const draft = await RhythmBeatmap.findOne({ where: { songId: song.id, difficulty, status: 'DRAFT' }, transaction })
      if (!draft) return null
      await RhythmBeatmap.destroy({ where: { songId: song.id, difficulty, status: 'PUBLISHED' }, transaction })
      return draft.update({ status: 'PUBLISHED', publishedAt: new Date() }, { transaction })
    })
    if (!row) return res.status(404).json({ message: 'Draft beatmap not found.' })
    return res.json({ beatmap: publicBeatmap(row) })
  } catch (error) { return next(error) }
}

async function unpublishBeatmap(req, res, next) {
  try {
    const difficulty = difficultyFrom(req.params.difficulty)
    if (!difficulty) return res.status(400).json({ message: 'Invalid difficulty.' })
    const song = await ownedPlayableSong(req, res)
    if (!song) return undefined
    const row = await sequelize.transaction(async (transaction) => {
      const published = await RhythmBeatmap.findOne({ where: { songId: song.id, difficulty, status: 'PUBLISHED' }, transaction })
      if (!published) return null
      const draft = await RhythmBeatmap.findOne({ where: { songId: song.id, difficulty, status: 'DRAFT' }, transaction })
      if (draft) { await published.destroy({ transaction }); return draft }
      return published.update({ status: 'DRAFT', publishedAt: null }, { transaction })
    })
    if (!row) return res.status(404).json({ message: 'Published beatmap not found.' })
    return res.json({ beatmap: publicBeatmap(row) })
  } catch (error) { return next(error) }
}

async function deleteDraftBeatmap(req, res, next) {
  try {
    const difficulty = difficultyFrom(req.params.difficulty)
    if (!difficulty) return res.status(400).json({ message: 'Invalid difficulty.' })
    const song = await ownedPlayableSong(req, res)
    if (!song) return undefined
    const deleted = await RhythmBeatmap.destroy({ where: { songId: song.id, difficulty, status: { [Op.in]: ['DRAFT', 'FAILED'] } } })
    if (!deleted) return res.status(404).json({ message: 'Draft beatmap not found.' })
    return res.status(204).end()
  } catch (error) { return next(error) }
}

module.exports = { deleteDraftBeatmap, generateAllBeatmaps, generateForSong, generateStoredBeatmap, getBeatmap, listBeatmaps, previewBeatmap, publishBeatmap, unpublishBeatmap, updateDraftSettings }
