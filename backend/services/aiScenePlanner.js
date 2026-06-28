const { GoogleGenerativeAI } = require('@google/generative-ai')
const { Song, SceneSegment } = require('../models')

/**
 * Calls Gemini AI to generate a timestamped scene plan for a given song,
 * and saves the generated segments to the database.
 * * @param {string} songId - The UUID of the song.
 */
const generateScenePlan = async (songId) => {
  // 1. Fetch the Song and validate required fields
  const song = await Song.findByPk(songId)

  if (!song) {
    throw new Error(`Song with ID ${songId} not found.`)
  }

  if (!song.lyrics || !song.durationSecs) {
    throw new Error('Song is missing lyrics or durationSecs required for scene planning.')
  }

  // 2. Initialize Gemini API Client
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)

  // We enforce a strict JSON output by setting the responseMimeType
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      responseMimeType: 'application/json',
    },
  })

  // 3. Construct the System/Instruction Prompt
  const prompt = `
        Act as a music video director for a project called "Shades of SG".
        Analyze the following song and create a timestamped video scene plan covering the entire duration of ${song.durationSecs} seconds.
        
        Song Theme: ${song.theme || 'Singapore Heritage'}
        
        Lyrics:
        ${song.lyrics}

        Break the lyrics into chronological segments. 
        Output a pure JSON array of objects with the following exact keys:
        - "startTime": (float) Starting timestamp in seconds.
        - "endTime": (float) Ending timestamp in seconds.
        - "lyrics": (string) The specific lyrics for this segment.
        - "emotion": (string) The emotional tone of the segment.
        - "visualPrompt": (string) A highly descriptive prompt for a Text-to-Image AI to generate a scene matching the lyrics and theme.

        CRITICAL CHORUS INSTRUCTION: If a stanza or chorus repeats in the song, you MUST output the exact same lyrics, emotion, and visualPrompt strings for those repeated segments. Do not vary the text for repeated sections. This is mandatory for our downstream hashing/caching engine.
    `

  // 4. Execute the AI Call
  const result = await model.generateContent(prompt)
  const responseText = result.response.text()

  // Because we set responseMimeType, we can safely parse this directly
  const sceneSegmentsData = JSON.parse(responseText)

  // 5. Map data to the DB Schema and Bulk Insert
  const segmentsToCreate = sceneSegmentsData.map((segment) => ({
    songId: song.id,
    startTime: segment.startTime,
    endTime: segment.endTime,
    lyrics: segment.lyrics,
    emotion: segment.emotion,
    visualPrompt: segment.visualPrompt,
  }))

  await SceneSegment.bulkCreate(segmentsToCreate)
}

module.exports = {
  generateScenePlan,
}
