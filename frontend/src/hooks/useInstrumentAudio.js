import { useCallback, useEffect, useRef } from 'react'

/*
Real recordings:

An instrument's `samples` map (hydrated at runtime by hooks/useLabInstruments.js
from GET /api/instruments/lab-samples — see backend/audio-sources/) maps a note
label to either a URL string or { url, playbackRate } for a pitch-shifted
recording borrowed from another note. playNote() below checks this first and
decodes + plays the real recording through the same AudioContext instead of
synthesizing a tone. Any note without an entry (or any instrument whose
`samples` map hasn't loaded yet/at all) just falls back to an OscillatorNode —
no special-casing needed anywhere else. preloadInstrument() lets callers warm
the shared cache ahead of interaction (idle, on hover, on selection).
*/

const audioBufferCache = new Map()

function getAudioContext(contextRef) {
  if (!contextRef.current) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    contextRef.current = new AudioContextClass()
  }

  if (contextRef.current.state === 'suspended') {
    contextRef.current.resume()
  }

  return contextRef.current
}

async function loadSample(context, url) {
  if (audioBufferCache.has(url)) {
    return audioBufferCache.get(url)
  }

  const response = await fetch(url)
  const arrayBuffer = await response.arrayBuffer()
  const audioBuffer = await context.decodeAudioData(arrayBuffer)
  audioBufferCache.set(url, audioBuffer)
  return audioBuffer
}

function playSynthesizedNote(context, note, { envelope = 'sustained', waveform = 'sine' } = {}) {
  const oscillator = context.createOscillator()
  const gain = context.createGain()

  oscillator.type = waveform
  oscillator.frequency.setValueAtTime(note.frequency, context.currentTime)

  const now = context.currentTime
  const isPercussive = envelope === 'percussive'
  const attack = isPercussive ? 0.005 : 0.02
  const duration = isPercussive ? 0.35 : 0.9
  const peakGain = 0.28

  gain.gain.setValueAtTime(0, now)
  gain.gain.linearRampToValueAtTime(peakGain, now + attack)
  gain.gain.exponentialRampToValueAtTime(0.0001, now + duration)

  oscillator.connect(gain)
  gain.connect(context.destination)

  oscillator.start(now)
  oscillator.stop(now + duration + 0.05)
}

async function playSampledNote(context, url, playbackRate = 1) {
  const buffer = await loadSample(context, url)
  const source = context.createBufferSource()
  source.buffer = buffer
  source.playbackRate.value = playbackRate
  source.connect(context.destination)
  source.start()
}

// A sample map entry is either a plain URL (played at its recorded pitch) or
// { url, playbackRate } — a recording borrowed from another note and
// pitch-shifted, so one recorded one-shot can stand in for several notes
// (see backend/audio-sources/manifest.json's derivedNotes). Resolved here so
// both playNote and preloadInstrument handle both shapes the same way.
function resolveSample(entry) {
  if (!entry) return null
  return typeof entry === 'string'
    ? { playbackRate: 1, url: entry }
    : { playbackRate: entry.playbackRate ?? 1, url: entry.url }
}

// A separate, decode-only AudioContext for preloading. Decoding a fetched
// buffer via decodeAudioData doesn't require a resumed/gesture-unlocked
// context — only actually starting playback does — so this can run ahead of
// any user interaction without trying to force an unrequested audio-hardware
// handshake before a gesture. The decoded AudioBuffer isn't tied to the
// context that decoded it, so it plays back fine later through whichever
// AudioContext a playNote() call ends up using.
let decodeContext = null
function getDecodeContext() {
  if (!decodeContext) {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    decodeContext = new AudioContextClass()
  }
  return decodeContext
}

// Warms the shared audioBufferCache for an instrument ahead of interaction —
// call on idle (gallery mount), on hover, or on selection. Tolerant of
// missing samples and of individual fetch/decode failures: anything that
// doesn't resolve just leaves that note to fall back to synthesis later,
// exactly like an uncached playNote() would. Not a hook — importable
// directly so it can run without mounting a component's own AudioContext.
export function preloadInstrument(instrument, { noteLabels } = {}) {
  if (!instrument?.samples) return Promise.resolve()

  const context = getDecodeContext()
  const labels = noteLabels || Object.keys(instrument.samples)
  const urls = labels
    .map((label) => resolveSample(instrument.samples[label])?.url)
    .filter(Boolean)

  return Promise.allSettled(urls.map((url) => loadSample(context, url)))
}

export default function useInstrumentAudio() {
  const contextRef = useRef(null)

  useEffect(() => {
    return () => {
      // Intentionally reads the live ref at unmount time to close whichever
      // AudioContext ended up being created, not a stale snapshot.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      contextRef.current?.close()
    }
  }, [])

  const playNote = useCallback((instrument, note) => {
    const context = getAudioContext(contextRef)
    const sample = resolveSample(instrument.samples?.[note.label])

    if (sample) {
      playSampledNote(context, sample.url, sample.playbackRate)
      return
    }

    playSynthesizedNote(context, note, {
      envelope: instrument.envelope,
      waveform: instrument.waveform,
    })
  }, [])

  const playMelody = useCallback(
    (instrument, sequence) => {
      sequence.forEach((noteLabel, index) => {
        const note = instrument.notes.find((candidate) => candidate.label === noteLabel)

        if (!note) {
          return
        }

        setTimeout(() => playNote(instrument, note), index * 260)
      })
    },
    [playNote]
  )

  const playChord = useCallback(
    (instrument, noteLabels) => {
      noteLabels.forEach((noteLabel) => {
        const note = instrument.notes.find((candidate) => candidate.label === noteLabel)

        if (note) {
          playNote(instrument, note)
        }
      })
    },
    [playNote]
  )

  return { playChord, playMelody, playNote }
}
