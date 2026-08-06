// Temporary Song Experience fallback recovered from commit 44ee64d.
// Keep this separate from API song data so it can be removed once every
// published song has linked instruments. These objects are never persisted.
//
// The instrument definitions themselves now live in data/instruments.js (the
// single source of truth shared with the Instrument Discovery Lab) — this
// file just re-exports them under their historical name so callers here
// don't need to change.
import { INSTRUMENTS } from './instruments'

export const TEMPORARY_SONG_INSTRUMENT_FALLBACKS = INSTRUMENTS

export function getSongInstruments(song) {
  return Array.isArray(song?.instruments) && song.instruments.length > 0
    ? song.instruments
    : TEMPORARY_SONG_INSTRUMENT_FALLBACKS
}

export function enrichInstrumentForPlayback(instrument) {
  const fallback = TEMPORARY_SONG_INSTRUMENT_FALLBACKS.find((candidate) => (
    candidate.id === instrument?.id
    || candidate.name.toLowerCase() === String(instrument?.name || '').toLowerCase()
  ))
  return { ...fallback, ...instrument }
}
