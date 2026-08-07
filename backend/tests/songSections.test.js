const fs = require('fs')
const path = require('path')

process.env.DATABASE_URL = ''
const databasePath = path.join(__dirname, 'song-sections.test.sqlite')
process.env.DB_STORAGE = databasePath

const recommendation = {
  type: 'verse', label: 'Verse 1', startTime: 0, endTime: 10,
  lyrics: 'Opening line', confidence: 0.8, reason: 'Opening narrative',
}

jest.mock('../services/songSectionService', () => {
  const actual = jest.requireActual('../services/songSectionService')
  const mockedRecommendation = {
    type: 'verse', label: 'Verse 1', startTime: 0, endTime: 10,
    lyrics: 'Opening line', confidence: 0.8, reason: 'Opening narrative',
  }
  return {
    ...actual,
    recommendSongSections: jest.fn(async () => [mockedRecommendation]),
  }
})

jest.mock('../services/transcriptionService', () => ({
  getTranscriptionConfigStatus: jest.fn(() => ({ configured: true, model: 'whisper-1' })),
  transcribeMedia: jest.fn(async () => ({
    lyrics: 'Opening line', rawLyrics: 'Opening line', model: 'whisper-1',
    segments: [{ start: 0, end: 10, text: 'Opening line' }],
  })),
  transcribeMediaBuffer: jest.fn(),
}))

const request = require('supertest')
const app = require('../server')
const { sequelize, Song, User } = require('../models')
const { createToken, hashPassword } = require('../services/authService')

let creator
let song
const auth = () => ({ Authorization: `Bearer ${createToken(creator)}` })

beforeAll(async () => {
  await sequelize.sync({ force: true })
  creator = await User.create({ email: 'section-creator@example.com', name: 'Section Creator', passwordHash: hashPassword('password123'), role: 'CREATOR' })
  song = await Song.create({
    creatorId: creator.id, durationSecs: 30, rawLyrics: 'Opening line', status: 'DRAFT', title: 'Section Song',
    transcriptionSegments: [{ start: 0, end: 10, text: 'Opening line' }],
  })
})

afterAll(async () => {
  await sequelize.close()
  if (fs.existsSync(databasePath)) fs.unlinkSync(databasePath)
})

test('creator can save and confirm edited song sections', async () => {
  const response = await request(app).put(`/api/songs/${song.id}/sections`).set(auth()).send({ sections: [recommendation] })
  expect(response.status).toBe(200)
  expect(response.body.sections).toEqual([recommendation])
  expect(response.body.confirmedAt).toBeTruthy()
  expect(response.body.lyrics).toBe('[Verse 1]\nOpening line')
  await song.reload()
  expect(song.sectionRecommendationsConfirmedAt).toBeTruthy()
  expect(song.rawLyrics).toBe('[Verse 1]\nOpening line')
})

test('Creator Studio transcription chains Whisper output into DeepSeek recommendations', async () => {
  await song.update({ sectionRecommendations: null, sectionRecommendationsConfirmedAt: null })
  const response = await request(app).post('/api/transcriptions/lyrics').set(auth()).send({
    fileName: 'song.mp3', includeSectionRecommendations: true, mediaBase64: 'dGVzdA==',
    mimeType: 'audio/mpeg', songId: song.id,
  })

  expect(response.status).toBe(200)
  expect(response.body.model).toBe('whisper-1')
  expect(response.body.sectionRecommendations).toEqual([recommendation])
  expect(response.body.lyrics).toBe('[Verse 1]\nOpening line')
  await song.reload()
  expect(song.transcriptionSegments).toEqual([{ start: 0, end: 10, text: 'Opening line' }])
  expect(song.sectionRecommendations).toEqual([recommendation])
  expect(song.rawLyrics).toBe('[Verse 1]\nOpening line')
})

test('regeneration cannot overwrite confirmed sections without explicit confirmation', async () => {
  await song.update({ sectionRecommendations: [recommendation], sectionRecommendationsConfirmedAt: new Date() })
  const refused = await request(app).post(`/api/songs/${song.id}/sections/recommend`).set(auth()).send({})
  expect(refused.status).toBe(409)

  const replaced = await request(app).post(`/api/songs/${song.id}/sections/recommend`).set(auth()).send({ replaceConfirmed: true })
  expect(replaced.status).toBe(200)
  expect(replaced.body.confirmedAt).toBeNull()
})

test('section routes remain creator-authenticated', async () => {
  expect((await request(app).post(`/api/songs/${song.id}/sections/recommend`).send({})).status).toBe(401)
  expect((await request(app).put(`/api/songs/${song.id}/sections`).send({ sections: [recommendation] })).status).toBe(401)
})

test('existing section records expose labelled lyrics in every creator song detail response', async () => {
  await song.update({ rawLyrics: 'Opening line', sectionRecommendations: [recommendation] })

  const detail = await request(app).get(`/api/songs/creator/${song.id}`).set(auth())
  expect(detail.status).toBe(200)
  expect(detail.body.song.rawLyrics).toBe('[Verse 1]\nOpening line')

  const listing = await request(app).get('/api/songs/creator').set(auth())
  expect(listing.status).toBe(200)
  expect(listing.body.songs.find((item) => item.id === song.id).rawLyrics).toBe('[Verse 1]\nOpening line')
})
