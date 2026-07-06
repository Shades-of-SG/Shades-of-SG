import { useCallback, useEffect, useRef } from 'react'

/*
Swapping in real recordings later:

Give an instrument a `samples` map in its data (e.g. { C4: '/audio/angklung/c4.mp3' }).
playNote() below already checks for this first and will decode + play the real
recording through the same AudioContext instead of synthesizing a tone — no other
code needs to change. Until then, every note is generated with an OscillatorNode.
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

async function playSampledNote(context, url) {
  const buffer = await loadSample(context, url)
  const source = context.createBufferSource()
  source.buffer = buffer
  source.connect(context.destination)
  source.start()
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
    const sampleUrl = instrument.samples?.[note.label]

    if (sampleUrl) {
      playSampledNote(context, sampleUrl)
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

  return { playMelody, playNote }
}
