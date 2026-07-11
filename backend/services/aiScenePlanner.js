const { OpenAI } = require('openai')
const { Song, GenerationJob, SceneSegment } = require('../models')

// Initialize the OpenAI SDK.
// It will automatically use the process.env.OPENAI_API_KEY if not explicitly passed,
// but passing it explicitly is good practice for visibility.
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

/**
 * Phase 2 Pipeline: Analyzes song lyrics and generates a chronological scene plan.
 * * @param {number|string} jobId - The primary key of the GenerationJob
 * @param {number|string} songId - The primary key of the Song
 * @returns {Promise<Array>} The array of generated scenes
 */
async function generateScenePlan(jobId, songId) {
  try {
    // 1. Database Fetching & State Validation
    const job = await GenerationJob.findByPk(jobId)
    if (!job) {
      throw new Error(`GenerationJob with ID ${jobId} not found.`)
    }
    if (job.status !== 'PROCESSING') {
      throw new Error(`GenerationJob is in state '${job.status}', expected 'PROCESSING'.`)
    }

    const song = await Song.findByPk(songId)
    if (!song) {
      throw new Error(`Song with ID ${songId} not found.`)
    }

    // 2. The System Prompt (Music Video Director)
    const systemPrompt = `You are an expert cinematic music video director and visual storyteller. 
Your task is to analyze the provided song's lyrics, theme, title, and artist, and break the song down into a chronological sequence of highly visual scenes.

This project, "Shades of SG", is focused on Singapore's rich heritage and community history. Please keep local context in mind if the theme calls for it.

For each scene, you must generate a rich, highly detailed imagePrompt optimized for DALL-E 3. 
Each imagePrompt must specify:
- Subject matter and key elements.
- Lighting, atmosphere, and mood.
- Camera angle or cinematic style.
- Integration of the song's theme: ${song.theme || 'Singaporean Heritage'}.

You must return ONLY a JSON object. Do NOT return an array as the root element.
The root of the JSON object must have a single property "scenes" which is an array of objects.

The JSON schema must strictly follow this structure:
{
  "scenes": [
    {
      "startTime": <number, starting second of the scene>,
      "endTime": <number, ending second of the scene>,
      "lyrics": "<string, the exact lyrics spoken/sung during this scene, or '[Instrumental]' if none>",
      "visualPrompt": "<string, detailed DALL-E 3 image generation prompt>"
    }
  ]
}

Ensure the generated scenes logically cover the progression of the song.`

    const userMessage = `Title: ${song.title}
Artist: ${song.artist}
Theme: ${song.theme || 'N/A'}
Lyrics:
${song.rawLyrics || 'No lyrics provided.'}`

    // 3. OpenAI API Call with Strict JSON Enforcement
    const response = await openai.chat.completions.create({
      model: 'gpt-4o', // using the flagship model for better prompt adherence
      response_format: { type: 'json_object' },
      temperature: 0.7, // 0.7 provides a good balance of creativity and structure
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    })

    // 4. Safely Parse the Returned JSON
    const responseText = response.choices[0].message.content
    let parsedData

    try {
      parsedData = JSON.parse(responseText)
    } catch (parseError) {
      throw new Error(
        `Failed to parse OpenAI JSON response: ${parseError.message}\nRaw Output: ${responseText}`,
        { cause: parseError }
      )
    }

    // Validate that the root object contains the expected "scenes" array
    if (!parsedData.scenes || !Array.isArray(parsedData.scenes)) {
      throw new Error(
        'OpenAI response did not contain a valid "scenes" array at the root object level.'
      )
    }

    // 5. Database Saving (The DB Handoff via bulkCreate)
    // Map the scenes to match your Sequelize schema, injecting foreign keys for relations.
    const sceneRecords = parsedData.scenes.map((scene) => ({
      jobId: jobId,
      songId: songId,
      startTime: scene.startTime,
      endTime: scene.endTime,
      lyrics: scene.lyrics,
      visualPrompt: scene.visualPrompt,
    }))

    await SceneSegment.bulkCreate(sceneRecords)

    return parsedData.scenes
  } catch (error) {
    // 7. Error Boundaries & Failsafes
    console.error(
      `[aiScenePlanner] Critical error during scene generation for Job ${jobId}:`,
      error
    )

    try {
      // Attempt to fetch the job again to ensure we have the latest instance before updating to FAILED
      const failedJob = await GenerationJob.findByPk(jobId)
      if (failedJob) {
        failedJob.status = 'FAILED'
        // Substring the error message just in case it exceeds string column limits in Postgres
        failedJob.errorMessage = error.message.substring(0, 1000)
        await failedJob.save()
      }
    } catch (dbFailsafeError) {
      console.error(
        `[aiScenePlanner] Failsafe: Could not update job ${jobId} to FAILED status.`,
        dbFailsafeError
      )
    }

    // Throw the error upstream so the orchestrator/caller is aware of the failure
    throw error
  }
}

module.exports = { generateScenePlan }
