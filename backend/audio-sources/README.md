# Instrument Lab audio sources

Raw sample audio for the Instrument Discovery Lab lives here as plain files
(gitignored — only this README and `manifest.json` are committed). Drop files
at the paths `manifest.json` expects, then run:

```
npm run seed:lab-instruments
```

This uploads each referenced file to Cloudinary and writes the resulting URLs
onto the matching `Instrument` row's `samples` column (looked up by `slug`).
It's safe to re-run any time — already-uploaded notes are just re-uploaded,
and any manifest entry whose file isn't present yet is skipped with a warning
(that instrument/note simply stays on its synthesized fallback until you add
the file).

## Current status

- **`piano/`** — populated. Salamander Grand Piano V3 note samples (CC BY 3.0,
  attribution already set in `manifest.json`).
- **`tabla/`**, **`kompang/`**, **`angklung/`** — populated from
  [Sample Focus](https://samplefocus.com) (Standard License — royalty-free, no
  attribution required). See each manifest entry's `_source` field for which
  page each file came from.
- **Erhu** has no manifest entry yet — nothing found on Sample Focus reads as
  a clean isolated note (existing "erhu" results there are full melodic
  clips). It stays fully synthetic until a better source turns up.

## Adding a new instrument later

1. Add a folder here for it and drop the recorded note file(s) in.
2. Add a manifest entry: `slug`, `license`, `attribution` (or `null`), a
   `notes` map (note label → relative file path), and optionally
   `derivedNotes` for notes you want to approximate by pitch-shifting one
   recording instead of sourcing a separate file per note (see the Tabla/
   Angklung entries for the shape — `semitones` is the interval from the
   `from` note to the target note).
3. Run `npm run seed:lab-instruments`.

No other code changes are needed — the frontend already merges whatever
`samples` map comes back from `GET /api/instruments/lab-samples` onto its
static instrument definitions and falls back to synthesis for anything not
covered.
