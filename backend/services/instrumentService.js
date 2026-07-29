const { Instrument } = require('../models');
const { Op } = require('sequelize');

const LEARNING_HUB_INSTRUMENTS = [
  {
    name: 'Piano',
    origin: 'Western / Global',
    description:
      'A versatile keyboard instrument capable of playing full harmonies and melodies — a familiar starting point for musical exploration.',
  },
  {
    name: 'Angklung',
    origin: 'Malay heritage, Southeast Asia',
    description:
      'A bamboo instrument shaken to produce a note, traditionally played together in ensembles where each person holds just one pitch.',
  },
  {
    name: 'Kompang',
    origin: 'Malay heritage, Southeast Asia',
    description: 'A handheld frame drum played in lively ensembles at Malay weddings and festive processions.',
  },
  {
    name: 'Erhu',
    origin: 'Chinese heritage',
    description: 'A two-stringed bowed instrument known for its expressive, voice-like tone in Chinese music.',
  },
  {
    name: 'Tabla',
    origin: 'Indian heritage, South Asia',
    description:
      'A pair of hand drums central to Indian classical and devotional music, played with intricate finger and palm strokes.',
  },
];

/**
 * Seeds and syncs the database instruments catalog to match Learning Hub instruments.
 */
async function seedDefaultInstruments() {
  try {
    const validNames = LEARNING_HUB_INSTRUMENTS.map((i) => i.name);

    // Remove any legacy instruments not present in Learning Hub
    await Instrument.destroy({
      where: {
        name: {
          [Op.notIn]: validNames,
        },
      },
    });

    let seededCount = 0;
    for (const instData of LEARNING_HUB_INSTRUMENTS) {
      const [inst, created] = await Instrument.findOrCreate({
        where: { name: instData.name },
        defaults: instData,
      });
      if (created) seededCount++;
    }
    if (seededCount > 0) {
      console.log(`[Seed] Synced ${seededCount} Learning Hub instruments into catalog.`);
    }
  } catch (error) {
    console.error('[Seed Error] Failed to sync Learning Hub instruments:', error);
  }
}

module.exports = {
  seedDefaultInstruments,
  DEFAULT_INSTRUMENTS: LEARNING_HUB_INSTRUMENTS,
};
