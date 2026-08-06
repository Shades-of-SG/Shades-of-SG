const { Op } = require('sequelize');
const { Instrument } = require('../models');

// Public, unauthenticated: the Instrument Discovery Lab's static instrument
// definitions (name, notes, facts, ...) live in the frontend; this just hands
// back whichever notes have a real recorded sample so the frontend can merge
// them in and fall back to synthesis for anything not covered.
async function getLabSamples(req, res, next) {
    try {
        const instruments = await Instrument.findAll({
            where: { slug: { [Op.ne]: null } },
            attributes: ['slug', 'samples', 'sampleFormat', 'sampleLicense', 'sampleAttribution'],
        });

        return res.json({
            instruments: instruments.map((instrument) => ({
                attribution: instrument.sampleAttribution,
                format: instrument.sampleFormat,
                license: instrument.sampleLicense,
                samples: instrument.samples || {},
                slug: instrument.slug,
            })),
        });
    } catch (error) { return next(error); }
}

module.exports = { getLabSamples };
