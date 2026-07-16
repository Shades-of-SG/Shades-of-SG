const fs = require('fs')
const path = require('path')
process.env.DATABASE_URL = ''
const databasePath = path.join(__dirname, 'beatmaps.test.sqlite')
process.env.DB_STORAGE = databasePath

const request = require('supertest')
const app = require('../server')
const { sequelize, RhythmBeatmap, Song, User } = require('../models')
const beatmapGenerator = require('../services/beatmapGenerator')
const { createToken, hashPassword } = require('../services/authService')

let creator
let player
let song
const auth = (user) => ({ Authorization: `Bearer ${createToken(user)}` })
const notes = [{ id: 'tap-1', lane: 0, startMs: 1000, type: 'tap' }, { id: 'hold-1', lane: 2, startMs: 3000, endMs: 4500, durationMs: 1500, type: 'hold' }]

beforeAll(async () => {
  await sequelize.sync({ force: true })
  creator = await User.create({ email: 'beatmap-creator@example.com', name: 'Creator', passwordHash: hashPassword('password123'), role: 'CREATOR' })
  player = await User.create({ email: 'beatmap-player@example.com', name: 'Player', passwordHash: hashPassword('password123'), role: 'REGISTERED' })
  song = await Song.create({ creatorId: creator.id, durationSecs: 30, status: 'PUBLISHED', title: 'Beatmap Song' })
})

beforeEach(async () => { jest.restoreAllMocks(); await RhythmBeatmap.destroy({ where: {} }) })
afterAll(async () => { await sequelize.close(); if (fs.existsSync(databasePath)) fs.unlinkSync(databasePath) })

async function generate(difficulty = 'MEDIUM', mode = 'AI') {
  return request(app).post(`/api/songs/${song.id}/beatmaps/generate`).set(auth(creator)).send({ difficulty, mode })
}

async function publish(difficulty = 'MEDIUM') {
  return request(app).put(`/api/songs/${song.id}/beatmaps/${difficulty}/publish`).set(auth(creator))
}

async function generateAll(mode = 'BASIC') {
  return request(app).post(`/api/songs/${song.id}/beatmaps/generate-all`).set(auth(creator)).send({ mode })
}

test('creator-only generation creates a DRAFT beatmap', async () => {
  expect((await request(app).post(`/api/songs/${song.id}/beatmaps/generate`).send({ difficulty: 'MEDIUM' })).status).toBe(401)
  expect((await request(app).post(`/api/songs/${song.id}/beatmaps/generate`).set(auth(player)).send({ difficulty: 'MEDIUM' })).status).toBe(403)
  const response = await generate()
  expect(response.status).toBe(201)
  expect(response.body.beatmap).toMatchObject({ difficulty: 'MEDIUM', generationSource: 'FALLBACK', status: 'DRAFT', version: 1 })
})

test('public cannot access DRAFT while its creator can preview it', async () => {
  await generate()
  expect((await request(app).get(`/api/songs/${song.id}/beatmaps/medium`)).status).toBe(404)
  expect((await request(app).get(`/api/songs/${song.id}/beatmaps/medium/preview`).set(auth(player))).status).toBe(403)
  const preview = await request(app).get(`/api/songs/${song.id}/beatmaps/medium/preview`).set(auth(creator))
  expect(preview.status).toBe(200)
  expect(preview.body.beatmap.status).toBe('DRAFT')
})

test('only the creator can edit a DRAFT offset within -500ms to +500ms', async () => {
  await generate()
  expect((await request(app).put(`/api/songs/${song.id}/beatmaps/medium/settings`).set(auth(player)).send({ offsetMs: 125 })).status).toBe(403)
  expect((await request(app).put(`/api/songs/${song.id}/beatmaps/medium/settings`).set(auth(creator)).send({ offsetMs: 501 })).status).toBe(400)
  const response = await request(app).put(`/api/songs/${song.id}/beatmaps/medium/settings`).set(auth(creator)).send({ offsetMs: -125 })
  expect(response.status).toBe(200)
  expect(response.body.beatmap.offsetMs).toBe(-125)
})

test('publishing exposes the selected DRAFT to public gameplay', async () => {
  await generate()
  const published = await publish()
  expect(published.status).toBe(200)
  expect(published.body.beatmap.status).toBe('PUBLISHED')
  const publicResponse = await request(app).get(`/api/songs/${song.id}/beatmaps/medium`)
  expect(publicResponse.status).toBe(200)
  expect(publicResponse.body.beatmap).toMatchObject({ status: 'PUBLISHED', songId: song.id })
})

test('a published beatmap stays private until its parent song is published', async () => {
  const privateSong = await Song.create({ creatorId: creator.id, durationSecs: 30, status: 'READY', title: 'Private Parent Song' })
  await RhythmBeatmap.create({
    difficulty: 'EASY', durationMs: 30000, generationSource: 'FALLBACK', notes,
    publishedAt: new Date(), songId: privateSong.id, status: 'PUBLISHED', version: 1,
  })

  expect((await request(app).get(`/api/songs/${privateSong.id}/beatmaps`)).status).toBe(404)
  expect((await request(app).get(`/api/songs/${privateSong.id}/beatmaps/easy`)).status).toBe(404)
  const creatorSummary = await request(app).get(`/api/songs/${privateSong.id}/beatmaps`).set(auth(creator))
  expect(creatorSummary.status).toBe(200)
  expect(creatorSummary.body.beatmaps.find((row) => row.difficulty === 'EASY').status).toBe('PUBLISHED')

  await RhythmBeatmap.destroy({ where: { songId: privateSong.id } })
  await privateSong.destroy()
})

test('unpublishing removes public availability but keeps creator draft access', async () => {
  await generate(); await publish()
  const response = await request(app).put(`/api/songs/${song.id}/beatmaps/medium/unpublish`).set(auth(creator))
  expect(response.status).toBe(200)
  expect(response.body.beatmap.status).toBe('DRAFT')
  expect((await request(app).get(`/api/songs/${song.id}/beatmaps/medium`)).status).toBe(404)
  expect((await request(app).get(`/api/songs/${song.id}/beatmaps/medium/preview`).set(auth(creator))).status).toBe(200)
})

test('regeneration creates a new DRAFT while the PUBLISHED version remains live', async () => {
  await generate(); await publish()
  const liveBefore = (await request(app).get(`/api/songs/${song.id}/beatmaps/medium`)).body.beatmap
  jest.spyOn(beatmapGenerator, 'generateBeatmap').mockResolvedValueOnce({ beatmap: { bpm: 120, offsetMs: 10, notes }, source: 'AI', aiError: null })
  const regenerated = await generate()
  expect(regenerated.body.beatmap).toMatchObject({ status: 'DRAFT', version: 2 })
  const liveAfter = (await request(app).get(`/api/songs/${song.id}/beatmaps/medium`)).body.beatmap
  expect(liveAfter.id).toBe(liveBefore.id)
  expect(await RhythmBeatmap.count({ where: { songId: song.id, difficulty: 'MEDIUM' } })).toBe(2)
})

test('failed regeneration does not alter the PUBLISHED version', async () => {
  await generate(); await publish()
  const live = await RhythmBeatmap.findOne({ where: { songId: song.id, difficulty: 'MEDIUM', status: 'PUBLISHED' } })
  jest.spyOn(beatmapGenerator, 'generateBeatmap').mockRejectedValueOnce(new Error('provider failure'))
  expect((await generate()).status).toBe(502)
  await live.reload()
  expect(live.status).toBe('PUBLISHED')
  expect((await request(app).get(`/api/songs/${song.id}/beatmaps/medium`)).status).toBe(200)
  const summary = await request(app).get(`/api/songs/${song.id}/beatmaps`).set(auth(creator))
  expect(summary.body.beatmaps.find((row) => row.difficulty === 'MEDIUM')).toMatchObject({ status: 'FAILED', published: { id: live.id }, failed: { status: 'FAILED' } })
})

test('partial uniqueness permits one DRAFT and one PUBLISHED version, but not duplicate drafts', async () => {
  await RhythmBeatmap.create({ songId: song.id, difficulty: 'EASY', version: 1, durationMs: 30000, notes, generationSource: 'MANUAL', status: 'PUBLISHED' })
  await RhythmBeatmap.create({ songId: song.id, difficulty: 'EASY', version: 2, durationMs: 30000, notes, generationSource: 'MANUAL', status: 'DRAFT' })
  await expect(RhythmBeatmap.create({ songId: song.id, difficulty: 'EASY', version: 3, durationMs: 30000, notes, generationSource: 'MANUAL', status: 'DRAFT' })).rejects.toMatchObject({ name: 'SequelizeUniqueConstraintError' })
})

test('basic generation creates a deterministic FALLBACK draft', async () => {
  const response = await generate('HARD', 'BASIC')
  expect(response.status).toBe(201)
  expect(response.body.beatmap).toMatchObject({ generationSource: 'FALLBACK', status: 'DRAFT' })
})

test('generate all creates distinct EASY, MEDIUM, and HARD drafts sequentially', async () => {
  const response = await generateAll()
  expect(response.status).toBe(201)
  expect(response.body.failed).toEqual([])
  expect(response.body.beatmaps.map((beatmap) => beatmap.difficulty)).toEqual(['EASY', 'MEDIUM', 'HARD'])
  const noteCounts = Object.fromEntries(response.body.beatmaps.map((beatmap) => [beatmap.difficulty, beatmap.notes.length]))
  expect(noteCounts.MEDIUM).toBeGreaterThan(noteCounts.EASY)
  expect(noteCounts.HARD).toBeGreaterThan(noteCounts.MEDIUM)
  expect(await RhythmBeatmap.count({ where: { songId: song.id, status: 'DRAFT' } })).toBe(3)
})

test('summary is public-safe and a song remains usable without any rhythm game', async () => {
  const summary = await request(app).get(`/api/songs/${song.id}/beatmaps`)
  expect(summary.status).toBe(200)
  expect(summary.body.beatmaps.every((row) => row.status === 'NOT_CREATED')).toBe(true)
  expect((await request(app).get(`/api/songs/${song.id}`)).status).toBe(200)
})
