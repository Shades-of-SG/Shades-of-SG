import { useEffect, useState } from 'react'
import { INSTRUMENTS } from '../data/instruments'
import { getInstrumentLabSamples } from '../services/instrumentSamplesService'

// Merges the static instrument definitions (data/instruments.js) with
// whichever real samples the backend has (GET /api/instruments/lab-samples).
// Before that fetch resolves — and for any instrument/note it doesn't cover —
// this returns exactly today's synth-only data, so there's no loading state
// to render and no all-or-nothing gate: Piano can be fully sampled while
// Erhu stays entirely synthesized, with zero special-casing anywhere else.
export default function useLabInstruments() {
  const [instruments, setInstruments] = useState(INSTRUMENTS)

  useEffect(() => {
    let active = true

    getInstrumentLabSamples().then((manifest) => {
      if (!active || manifest.length === 0) return

      const bySlug = new Map(manifest.map((entry) => [entry.slug, entry]))
      setInstruments(
        INSTRUMENTS.map((instrument) => {
          const entry = bySlug.get(instrument.id)
          if (!entry) return instrument
          return {
            ...instrument,
            sampleAttribution: entry.attribution,
            sampleLicense: entry.license,
            samples: entry.samples,
          }
        })
      )
    })

    return () => { active = false }
  }, [])

  return instruments
}
