const { DataTypes } = require('sequelize')
const sequelize = require('../config/database')

const RhythmBeatmap = sequelize.define('RhythmBeatmap', {
  id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true, field: 'beatmap_id' },
  songId: { type: DataTypes.UUID, allowNull: false, field: 'song_id' },
  difficulty: { type: DataTypes.ENUM('EASY', 'MEDIUM', 'HARD'), allowNull: false },
  version: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  bpm: { type: DataTypes.DECIMAL(7, 2), allowNull: true },
  offsetMs: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0, field: 'offset_ms' },
  durationMs: { type: DataTypes.INTEGER, allowNull: false, field: 'duration_ms' },
  notes: { type: sequelize.getDialect() === 'postgres' ? DataTypes.JSONB : DataTypes.JSON, allowNull: false },
  generationSource: { type: DataTypes.ENUM('AI', 'FALLBACK', 'MANUAL'), allowNull: false, field: 'generation_source' },
  status: { type: DataTypes.ENUM('DRAFT', 'PUBLISHED', 'FAILED'), allowNull: false, defaultValue: 'DRAFT' },
  errorMessage: { type: DataTypes.TEXT, allowNull: true, field: 'error_message' },
  generatedAt: { type: DataTypes.DATE, allowNull: true, field: 'generated_at' },
  publishedAt: { type: DataTypes.DATE, allowNull: true, field: 'published_at' },
}, { tableName: 'rhythm_beatmaps', underscored: true, indexes: [
  { unique: true, fields: ['song_id', 'difficulty', 'version'] },
  { name: 'rhythm_beatmaps_one_draft', unique: true, fields: ['song_id', 'difficulty'], where: { status: 'DRAFT' } },
  { name: 'rhythm_beatmaps_one_published', unique: true, fields: ['song_id', 'difficulty'], where: { status: 'PUBLISHED' } },
] })

module.exports = RhythmBeatmap
