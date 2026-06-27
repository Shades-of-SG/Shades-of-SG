const { GoogleGenerativeAI } = require('@google/generative-ai')
const { Song, SceneSegment } = require('../models')

async function generateScenePlan(songId) {
  // 1. Fetch the song and validate required data
  const song = await Song.findByPk(songId)

  if (!song) {
    throw new Error('Song not found in the database.')
  }
  if (!song.lyrics || !song.durationSecs) {
    throw new Error('Song is missing lyrics or duration required for scene planning.')
  }

  // 2. Initialize Gemini API
  // Ensure GEMINI_API_KEY is present in your backend/.env
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY)
  const model = genAI.getGenerativeModel({
    model: 'gemini-1.5-flash',
    generationConfig: {
      // CRITICAL: Forces Gemini to return strict JSON
      responseMimeType: 'application/json',
    },
  })

  // 3. Construct the director prompt
  const prompt = `
        You are an expert music video director and visual prompt engineer. 
        Your task is to break down the following song into a chronological sequence of video scenes.
        
        Song Theme: ${song.theme || 'General'}
        Total Duration: ${song.durationSecs} seconds
        Lyrics:
        ${song.lyrics}

        Requirements:
        1. Break the lyrics into chronological segments that cover the entire ${song.durationSecs} seconds.
        2. Output a JSON array of objects.
        3. Each object must contain EXACTLY these keys:
           - "startTime" (Float): Start time in seconds.
           - "endTime" (Float): End time in seconds.
           - "lyrics" (String): The lyrics for this segment.
           - "emotion" (String): The core emotion of this segment.
           - "visualPrompt" (String): A highly descriptive prompt for a Text-to-Image AI to generate this scene.

        CRITICAL CHORUS INSTRUCTION: If a stanza or chorus repeats in the song, you MUST output the exact same lyrics, emotion, and visualPrompt strings for those repeated segments. Do not vary the text for repeated sections. This is mandatory for our downstream hashing/caching engine.
    `

  // 4. Hit the LLM and parse the response
  const result = await model.generateContent(prompt)
  const sceneData = JSON.parse(result.response.text())

  // 5. Map the returned array to our database schema
  const scenesToCreate = sceneData.map((scene) => ({
    songId: song.id,
    startTime: scene.startTime,
    endTime: scene.endTime,
    lyrics: scene.lyrics,
    emotion: scene.emotion,
    visualPrompt: scene.visualPrompt,
  }))

  // 6. Bulk insert into PostgreSQL
  await SceneSegment.bulkCreate(scenesToCreate)
}

module.exports = {
  generateScenePlan,
}
