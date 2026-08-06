// Uploads Instrument Discovery Lab sample audio (see ../audio-sources/README.md)
// to Cloudinary and records the resulting URLs on the matching Instrument row's
// `samples` column, keyed by note label. Idempotent — safe to re-run after
// adding more notes/instruments to the manifest.
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const { Instrument, sequelize } = require('../models');
const { uploadAudioStream } = require('../services/aiStorageService');

const AUDIO_SOURCES_DIR = path.join(__dirname, '..', 'audio-sources');
const MANIFEST_PATH = path.join(AUDIO_SOURCES_DIR, 'manifest.json');

async function seedInstrument({ slug, name, license = null, attribution = null, notes = {}, derivedNotes = {} }) {
  const samples = {};
  let uploadedCount = 0;

  for (const [label, relativePath] of Object.entries(notes)) {
    const filePath = path.join(AUDIO_SOURCES_DIR, relativePath);

    if (!fs.existsSync(filePath)) {
      console.warn(`[seedLabInstruments] ${slug}: no file for "${label}" yet (${relativePath}) — skipping.`);
      continue;
    }

    const buffer = fs.readFileSync(filePath);
    const { audioUrl } = await uploadAudioStream(buffer, {
      folder: `shades-of-sg/audio/instruments/${slug}`,
      publicId: label,
    });
    samples[label] = audioUrl;
    uploadedCount += 1;
  }

  for (const [label, derived] of Object.entries(derivedNotes)) {
    const sourceUrl = samples[derived.from];

    if (!sourceUrl) {
      console.warn(`[seedLabInstruments] ${slug}: derived note "${label}" needs source "${derived.from}", which wasn't uploaded — skipping.`);
      continue;
    }

    samples[label] = { url: sourceUrl, playbackRate: 2 ** (derived.semitones / 12) };
  }

  if (uploadedCount === 0) {
    console.log(`[seedLabInstruments] ${slug}: no source files found yet — leaving synthetic for now.`);
    return;
  }

  const [instrument] = await Instrument.findOrCreate({ defaults: { name, slug }, where: { slug } });
  await instrument.update({
    sampleAttribution: attribution,
    sampleFormat: 'mp3',
    sampleLicense: license,
    samples,
  });
  console.log(`[seedLabInstruments] ${slug}: seeded ${Object.keys(samples).length} note(s) (${uploadedCount} uploaded).`);
}

async function seed() {
  const manifest = JSON.parse(fs.readFileSync(MANIFEST_PATH, 'utf8'));

  for (const entry of manifest) {
    await seedInstrument(entry);
  }
}

seed()
  .then(() => sequelize.close())
  .catch((error) => {
    console.error('[seedLabInstruments] failed:', error);
    process.exit(1);
  });
