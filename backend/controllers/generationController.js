const fs = require('fs').promises
const path = require('path')
const { GenerationJob, Song, SceneSegment, GeneratedFrame } = require('../models')
const { generateScenePlan } = require('../services/aiScenePlanner')
const { generateSongCurationDetails } = require('../services/aiCurationPlanner')
const { generateFrames } = require('../services/frameGenerator')
const { assembleVideo } = require('../services/videoAssembler')
const { OpenAI } = require('openai')
const cloudinary = require('../config/cloudinary')
const aiStorageService = require('../services/aiStorageService')
const { extractAudioFromYouTube, downloadMediaFromUrl } = require('../services/audioExtractionService')
const { transcribeMediaBuffer } = require('../services/transcriptionService')

const activePipelineJobs = new Map()

const completeGeneration = async (jobId) => {
  const job = await GenerationJob.findByPk(jobId)
  if (!job) throw new Error(`Job ${jobId} not found in database.`)
  const song = await Song.findByPk(job.songId)
  if (!song) throw new Error(`Song ${job.songId} not found in database.`)
  if (job.status !== 'PROCESSING' || song.status !== 'GENERATING') {
    throw new Error('Generation was stopped because the creator selected a finished uploaded video.')
  }
  if (!song.videoUrl) throw new Error('Generation cannot complete without a video URL.')

  // Cover Image Fallback: If coverImageUrl is empty, pick the image from the first SceneSegment
  let coverImageUrl = song.coverImageUrl
  if (!coverImageUrl) {
    const firstSegment = await SceneSegment.findOne({
      where: { songId: song.id },
      order: [['startTime', 'ASC']],
    })
    if (firstSegment && firstSegment.imageUrl) {
      coverImageUrl = firstSegment.imageUrl
    }
  }

  await job.update({ status: 'COMPLETED', errorMessage: null, completedAt: new Date() })
  await song.update({ status: 'READY', ...(coverImageUrl ? { coverImageUrl } : {}) })
  return { job, song }
}

const assertGenerationIsActive = async (jobId) => {
  const job = await GenerationJob.findByPk(jobId)
  const song = job ? await Song.findByPk(job.songId) : null
  if (!job || !song || job.status !== 'PROCESSING' || song.status !== 'GENERATING') {
    throw new Error('Generation was stopped because the creator selected a finished uploaded video.')
  }
}

const failGeneration = async (jobId, error) => {
  const job = await GenerationJob.findByPk(jobId)
  if (!job) return null
  await job.update({ status: 'FAILED', errorMessage: error?.message || String(error || 'Generation failed.') })
  const song = await Song.findByPk(job.songId)
  if (song?.status === 'GENERATING') await song.update({ status: song.videoUrl ? 'READY' : 'DRAFT' })
  return { job, song }
}

const usePlaceholderVideo = async (songId) => {
  const placeholderVideoUrl = process.env.PLACEHOLDER_VIDEO_URL?.trim()
  if (!placeholderVideoUrl) return false
  const song = await Song.findByPk(songId)
  if (!song) throw new Error(`Song ${songId} not found in database.`)
  await song.update({ videoUrl: placeholderVideoUrl, videoPublicId: null })
  return true
}

// ==========================================
// Phase 5: The Cleanup Utility
// ==========================================
const cleanupJobFiles = async (jobId) => {
  const tempDir = path.join(__dirname, '../storage/temp')
  const filesToDelete = [`${jobId}_audio.mp3`, `${jobId}_subs.srt`, `${jobId}_final.mp4`]

  console.log(`[Cleanup] Sweeping temp files for Job ${jobId}...`)

  // Try deleting the main files
  await Promise.allSettled(
    filesToDelete.map(async (fileName) => {
      try {
        await fs.unlink(path.join(tempDir, fileName))
        console.log(`[Cleanup] Deleted: ${fileName}`)
      } catch (err) {
        if (err.code !== 'ENOENT')
          console.error(`[Cleanup] Failed to delete ${fileName}:`, err.message)
      }
    })
  )

  // Wipe out any generated frame images (e.g., 123_frame_0.jpg)
  try {
    const allFiles = await fs.readdir(tempDir)
    const frameFiles = allFiles.filter(
      (file) => file.startsWith(`${jobId}_frame_`) && file.endsWith('.jpg')
    )

    await Promise.allSettled(frameFiles.map((file) => fs.unlink(path.join(tempDir, file))))
  } catch (err) {
    if (err.code !== 'ENOENT') console.error('[Cleanup] Could not read temp directory:', err)
  }
}

// ==========================================
// The Express Controllers
// ==========================================

const startGeneration = async (req, res, next) => {
  try {
    const { songId } = req.body

    if (!songId) {
      const error = new Error('Song ID is required.')
      error.statusCode = 400
      throw error
    }

    const song = await Song.findOne({ where: { id: songId, creatorId: req.authUserRecord.id } })
    if (!song) {
      const error = new Error('Song not found.')
      error.statusCode = 404
      throw error
    }

    if (!['DRAFT', 'READY'].includes(song.status)) {
      const error = new Error('Only DRAFT or READY songs can start generation.')
      error.statusCode = 409
      throw error
    }

    const missing = []
    if (!song.audioUrl && !song.sourceYoutubeUrl && !song.videoUrl) missing.push('audioUrl')
    if (!song.rawLyrics?.trim()) missing.push('rawLyrics')
    if (missing.length) {
      const error = new Error(`Song is missing generation requirements: ${missing.join(', ')}.`)
      error.statusCode = 400
      throw error
    }

    const activeJob = await GenerationJob.findOne({
      where: { songId, status: ['QUEUED', 'PROCESSING', 'AWAITING_REVIEW'] },
    })
    if (activeJob) {
      const error = new Error('This song already has an active generation job.')
      error.statusCode = 409
      throw error
    }

    let job
    try {
      job = await GenerationJob.create({ songId, status: 'QUEUED' })
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        error.statusCode = 409
        error.message = 'This song already has an active generation job.'
      }
      throw error
    }

    await song.update({ status: 'GENERATING' })
    if (process.env.NODE_ENV !== 'test') runGenerationPipeline(job.id).catch(console.error)

    return res.status(202).json({
      success: true,
      data: job,
    })
  } catch (error) {
    next(error)
  }
}

const getGenerationStatus = async (req, res, next) => {
  try {
    // Route param is :id (see aiGeneration.js), not :jobId
    const { id } = req.params

    const job = await GenerationJob.findOne({
      where: { id },
      include: [
        {
          model: Song,
          as: 'song',
          where: { creatorId: req.authUserRecord.id },
          include: [
            {
              model: SceneSegment,
              as: 'sceneSegments',
              separate: true,
              order: [['startTime', 'ASC']],
              include: [
                {
                  model: GeneratedFrame,
                  as: 'generatedFrames'
                }
              ]
            }
          ]
        }
      ],
    })

    if (!job) {
      const error = new Error('Generation job not found.')
      error.statusCode = 404
      throw error
    }

    return res.json({
      success: true,
      data: job,
    })
  } catch (error) {
    next(error)
  }
}

const getAllJobs = async (req, res, next) => {
  try {
    const jobs = await GenerationJob.findAll({
      include: [{
        model: Song,
        as: 'song',
        attributes: ['id', 'title', 'artist', 'creatorId'],
        where: { creatorId: req.authUserRecord.id },
      }],
      order: [['createdAt', 'DESC']],
    })

    return res.json({
      success: true,
      data: jobs,
    })
  } catch (error) {
    next(error)
  }
}

// ==========================================
// The Background Pipeline
// ==========================================

const runGenerationPipeline = async (jobId) => {
  console.log(`[Background Worker] Starting generation pipeline for Job ID: ${jobId}...`)

  if (activePipelineJobs.has(jobId)) {
    console.log(`[Background Worker] Job ${jobId} is already active in pipeline. Skipping duplicate invocation.`)
    return
  }
  activePipelineJobs.set(jobId, true)

  try {
    const job = await GenerationJob.findByPk(jobId)
    if (!job) throw new Error(`Job ${jobId} not found in database.`)

    const song = await Song.findByPk(job.songId)
    if (!song) throw new Error(`Song ${job.songId} not found.`)

    // Only set to PROCESSING if not already (retry case already sets it)
    if (job.status !== 'PROCESSING') {
      await job.update({ status: 'PROCESSING', startedAt: new Date(), errorMessage: null })
    }

    // ─── Phase 1: Audio & Lyric Extraction (skip if already done) ───
    const hasTranscription = song.transcriptionSegments && song.transcriptionSegments.length > 0
    const hasAudio = Boolean(song.audioUrl)

    if (hasTranscription && hasAudio) {
      console.log(`[Phase 1: Initialization] Skipped. Audio and transcriptionSegments already exist.`)
    } else if (hasTranscription && !hasAudio) {
      // Transcription exists but audio URL is missing — re-extract audio only (skip Whisper)
      console.log(`[Phase 1: Initialization] Re-extracting audio to recover missing audioUrl...`)
      const targetUrl = song.videoUrl || song.sourceYoutubeUrl || 'https://youtu.be/hYIOC3y0tmg'

      let extractedInfo;
      if (/(youtube\.com|youtu\.be)/i.test(targetUrl)) {
        extractedInfo = await extractAudioFromYouTube(targetUrl)
      } else {
        extractedInfo = await downloadMediaFromUrl(targetUrl, jobId)
      }

      try {
        const mediaBuffer = await fs.readFile(extractedInfo.filePath)
        console.log(`[Phase 1: Initialization] Uploading recovered audio to cloud storage...`)
        const uploaded = await aiStorageService.uploadAudioStream(mediaBuffer)
        await song.update({ audioUrl: uploaded.audioUrl, audioPublicId: uploaded.audioPublicId })
        console.log(`[Phase 1: Initialization] Recovered audioUrl: ${uploaded.audioUrl}`)
      } finally {
        await extractedInfo.cleanup()
      }
    } else {
      console.log(`[Phase 1: Initialization] Audio & Lyric Extraction...`)
      const targetUrl = song.videoUrl || song.audioUrl || song.sourceYoutubeUrl || 'https://youtu.be/hYIOC3y0tmg'

      let extractedInfo;
      if (/(youtube\.com|youtu\.be)/i.test(targetUrl)) {
        console.log(`[Phase 1: Initialization] Extracting YouTube audio from ${targetUrl}...`)
        extractedInfo = await extractAudioFromYouTube(targetUrl)
      } else {
        console.log(`[Phase 1: Initialization] Downloading direct media from ${targetUrl}...`)
        extractedInfo = await downloadMediaFromUrl(targetUrl, jobId)
      }

      try {
        const mediaBuffer = await fs.readFile(extractedInfo.filePath)

        // Upload audio to cloud storage FIRST so audioUrl is always persisted
        console.log(`[Phase 1: Initialization] Uploading audio to cloud storage...`)
        const uploaded = await aiStorageService.uploadAudioStream(mediaBuffer)
        await song.update({ audioUrl: uploaded.audioUrl, audioPublicId: uploaded.audioPublicId })
        console.log(`[Phase 1: Initialization] Saved audioUrl: ${uploaded.audioUrl}`)

        console.log(`[Phase 1: Initialization] Transcribing audio via Whisper API...`)
        const transcription = await transcribeMediaBuffer({
          fileName: extractedInfo.fileName,
          mediaBuffer,
          mimeType: extractedInfo.mimeType
        })

        await song.update({ transcriptionSegments: transcription.segments })
        console.log(`[Phase 1: Initialization] Saved ${transcription.segments.length} segments to database.`)
      } finally {
        await extractedInfo.cleanup()
      }
    }
    await assertGenerationIsActive(jobId)

    // ─── Phase 2: Scene Planning (skip if valid 6-9s scenes exist) ───
    const existingSegments = await SceneSegment.findAll({ where: { songId: job.songId } })
    const hasMicroScenes = existingSegments.length > 0 && existingSegments.slice(0, -1).some(s => (s.endTime - s.startTime) < 5.0)
    if (existingSegments.length > 0 && !hasMicroScenes) {
      console.log(`[Phase 2] Skipped. ${existingSegments.length} valid SceneSegments already exist.`)
    } else {
      if (hasMicroScenes) {
        console.log(`[Phase 2] Found ${existingSegments.length} outdated micro-scenes (<5.0s). Regenerating scene plan...`)
      } else {
        console.log(`[Phase 2] Generating Scene Plan...`)
      }
      await generateScenePlan(jobId, job.songId)
    }
    await assertGenerationIsActive(jobId)

    // ─── Pipeline Pause: Await Creator Review ───
    console.log(`[Phase 2 → Pause] Scene plan ready. Setting status to AWAITING_REVIEW for Job ${jobId}.`)
    await job.update({ status: 'AWAITING_REVIEW' })
    activePipelineJobs.delete(jobId)
    return

  } catch (error) {
    console.error(`[Generation Pipeline Error] Job ${jobId}:`, error)
    activePipelineJobs.delete(jobId)

    // ERROR BOUNDARY
    try {
      if (jobId) {
        await failGeneration(jobId, error)
        await cleanupJobFiles(jobId)
      }
    } catch (fallbackError) {
      console.error(`[Fallback Failure] Job ${jobId}:`, fallbackError)
    }
  }
}

// ==========================================
// Phases 3-5: Resumed after scene confirmation
// ==========================================

const resumeFromPhase3 = async (jobId) => {
  console.log(`[Background Worker] Resuming pipeline from Phase 3 for Job ID: ${jobId}...`)

  if (activePipelineJobs.has(jobId)) {
    console.log(`[Background Worker] Job ${jobId} is already active in pipeline. Skipping duplicate invocation.`)
    return
  }
  activePipelineJobs.set(jobId, true)

  try {
    const job = await GenerationJob.findByPk(jobId)
    if (!job) throw new Error(`Job ${jobId} not found in database.`)

    // ─── Phase 3: Frame Generation (skip if all segments have frames) ───
    const allSegments = await SceneSegment.findAll({
      where: { songId: job.songId },
      include: [{ model: GeneratedFrame, as: 'generatedFrames' }],
    })
    const allSegmentsHaveFrames = allSegments.length > 0 && allSegments.every(
      (seg) => seg.imageUrl || (seg.generatedFrames && seg.generatedFrames.length > 0)
    )
    if (allSegmentsHaveFrames) {
      console.log(`[Phase 3] Skipped. All ${allSegments.length} segments already have frames/images.`)
    } else {
      console.log(`[Phase 3] Generating Image Frames...`)
      await generateFrames(jobId, job.songId)
    }
    await assertGenerationIsActive(jobId)

    // ─── Phase 4: Video Assembly ───
    const placeholderApplied = await usePlaceholderVideo(job.songId)
    if (placeholderApplied) {
      console.warn(`[Temporary Video] Job ${jobId} is using configured PLACEHOLDER_VIDEO_URL.`)
    } else {
      console.log(`[Phase 4] Assembling Video with FFmpeg...`)
      await assembleVideo(jobId, job.songId)
    }
    await assertGenerationIsActive(jobId)

    // ─── Phase 5: Cultural Summary, Trivia, & Instruments ───
    console.log(`[Phase 5] Generating Cultural Summary, Trivia, & Instrument Matches...`)
    try {
      await generateSongCurationDetails(job.songId)
      console.log(`[Phase 5] Curation details generated successfully for Song ID: ${job.songId}`)
    } catch (curationError) {
      console.error(`[Phase 5 Warning] Failed to generate curation details for Song ID ${job.songId}:`, curationError.message)
    }
    await assertGenerationIsActive(jobId)

    await completeGeneration(job.id)

    // Run Cleanup on successful completion
    await cleanupJobFiles(jobId)
    console.log(`[Background Worker] Pipeline COMPLETED successfully for Job ID: ${jobId}`)
  } catch (error) {
    console.error(`[Resume Pipeline Error] Job ${jobId}:`, error)

    try {
      if (jobId) {
        await failGeneration(jobId, error)
        await cleanupJobFiles(jobId)
      }
    } catch (fallbackError) {
      console.error(`[Fallback Failure] Job ${jobId}:`, fallbackError)
    }
  } finally {
    activePipelineJobs.delete(jobId)
  }
}

const retryGeneration = async (req, res, next) => {
  try {
    const { jobId } = req.params

    const job = await GenerationJob.findOne({
      where: { id: jobId },
      include: [{
        model: Song,
        as: 'song',
        attributes: ['id', 'creatorId', 'status'],
        where: { creatorId: req.authUserRecord.id },
      }],
    })

    if (!job) {
      const error = new Error('Generation job not found.')
      error.statusCode = 404
      throw error
    }

    if (job.status !== 'FAILED') {
      const error = new Error('Only FAILED jobs can be retried.')
      error.statusCode = 409
      throw error
    }

    // Reset job for retry
    await job.update({ status: 'PROCESSING', errorMessage: null, startedAt: new Date() })

    // Ensure song is in GENERATING state
    const song = await Song.findByPk(job.songId)
    if (song && !['GENERATING'].includes(song.status)) {
      await song.update({ status: 'GENERATING' })
    }

    // Fire pipeline in background
    if (process.env.NODE_ENV !== 'test') runGenerationPipeline(job.id).catch(console.error)

    return res.json({
      success: true,
      message: 'Pipeline resumed.',
      data: job,
    })
  } catch (error) {
    next(error)
  }
}

const exportVideo = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const { burnCaptions = true } = req.body || {};
    const job = await GenerationJob.findOne({
      where: { id: jobId },
      include: [{
        model: Song,
        as: 'song',
        attributes: ['id', 'creatorId'],
        where: { creatorId: req.authUserRecord.id },
      }],
    });
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    // Set job back to in progress so the frontend sees it compiling
    await job.update({ status: 'PROCESSING', errorMessage: null, startedAt: new Date() });

    // Wait for the video compilation to finish
    let assembleResult;
    try {
      assembleResult = await assembleVideo(jobId, job.songId, burnCaptions);
    } catch (err) {
      // Safely revert the job status so it doesn't get stuck in PROCESSING
      await job.update({ status: 'COMPLETED' });
      throw err;
    }
    await job.update({ status: 'COMPLETED', completedAt: new Date() });
    await job.reload();

    return res.status(200).json({
      success: true,
      message: 'Export completed',
      data: job,
      videoUrl: assembleResult.videoUrl
    });
  } catch (error) {
    next(error);
  }
}

const deleteJob = async (req, res, next) => {
  try {
    const { id } = req.params

    const job = await GenerationJob.findOne({
      where: { id },
      include: [{
        model: Song,
        as: 'song',
        attributes: ['id', 'creatorId'],
        where: { creatorId: req.authUserRecord.id },
      }],
    })

    if (!job) {
      const error = new Error('Generation job not found.')
      error.statusCode = 404
      throw error
    }

    if (job.status === 'PROCESSING') {
      const error = new Error('Cannot delete a job that is currently processing.')
      error.statusCode = 409
      throw error
    }

    // Cascade: delete generated frames, then scene segments, then the job itself, then the song
    const segments = await SceneSegment.findAll({ where: { songId: job.songId } })
    const segmentIds = segments.map((s) => s.id)

    if (segmentIds.length > 0) {
      await GeneratedFrame.destroy({ where: { sceneSegmentId: segmentIds } })
    }
    await SceneSegment.destroy({ where: { songId: job.songId } })
    
    // Save songId before destroying the job
    const songIdToDelete = job.songId
    await job.destroy()
    
    // Finally, delete the orphaned song record
    if (songIdToDelete) {
      await Song.destroy({ where: { id: songIdToDelete } })
    }

    // Clean up any leftover temp files
    await cleanupJobFiles(id)

    return res.json({ success: true, message: 'Job deleted.' })
  } catch (error) {
    next(error)
  }
}

const regenerateFrame = async (req, res, next) => {
  try {
    const { frameId } = req.params;
    const { userFeedback } = req.body;

    const frame = await GeneratedFrame.findByPk(frameId, {
      include: [{ model: SceneSegment, as: 'sceneSegment' }]
    });

    if (!frame) return res.status(404).json({ success: false, message: 'Frame not found' });

    const segment = frame.sceneSegment;
    if (!segment) return res.status(404).json({ success: false, message: 'SceneSegment not found' });

    let prompt = segment.visualPrompt || "Cinematic scene";
    if (userFeedback && userFeedback.trim()) {
      prompt = `${prompt}. User instructions to modify this scene: ${userFeedback}`;
    }

    const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

    console.log(`[Regenerate] Calling GPT Image 2 for frame ${frameId}...`);
    const response = await openai.images.generate({
      model: 'gpt-image-2',
      prompt: prompt.substring(0, 4000),
      size: '1792x1024',
      n: 1,
    });

    let openAiImageUrl;
    if (response.data?.[0]?.b64_json) {
      openAiImageUrl = 'data:image/png;base64,' + response.data[0].b64_json;
    } else {
      openAiImageUrl = response.data?.[0]?.url || response.data?.[0]?.image_url || response.data?.[0]?.asset_url || response.data?.[0]?.link;
      if (!openAiImageUrl && typeof response.data?.[0] === 'string') openAiImageUrl = response.data[0];
    }

    if (!openAiImageUrl) throw new Error('Missing image URL from OpenAI');

    let finalImageUrl;
    if (openAiImageUrl.startsWith('data:image/')) {
      const uploadResult = await new Promise((resolve, reject) => {
         cloudinary.uploader.upload(openAiImageUrl, {
           folder: 'shades-of-sg/frames',
           resource_type: 'image'
         }, (error, result) => {
           if (error) reject(new Error(`Cloudinary Data URI Upload Error: ${error.message}`));
           else resolve(result);
         });
      });
      finalImageUrl = uploadResult.secure_url;
    } else {
      finalImageUrl = await aiStorageService.uploadImageFromUrl(openAiImageUrl);
    }

    frame.imageUrl = finalImageUrl;
    await frame.save();

    segment.imageUrl = finalImageUrl;
    await segment.save();

    return res.json({ success: true, data: frame });
  } catch (error) {
    console.error(`[Regenerate Error]:`, error);
    next(error);
  }
}

// ==========================================
// Scene Approval Endpoints
// ==========================================

const generatePromptForScene = async (song, lyrics) => {
  const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY
  if (!apiKey) {
    const theme = song.theme || 'Singaporean Heritage'
    const lyricSnippet = lyrics?.trim() ? ` depicting: "${lyrics.trim()}"` : ''
    return `Cinematic music video scene${lyricSnippet}. Theme: ${theme}, vibrant cultural atmosphere, dramatic lighting, shot on 35mm lens, 8k resolution.`
  }

  try {
    const baseURL = process.env.DEEPSEEK_API_KEY
      ? (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com')
      : undefined
    const model = process.env.DEEPSEEK_API_KEY
      ? (process.env.DEEPSEEK_MODEL || 'deepseek-chat')
      : 'gpt-4o-mini'

    const openai = new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) })

    const systemPrompt = `You are an expert cinematic music video director.
Given the song's metadata and lyrics, generate a single detailed visual prompt suitable for image generation.
Return ONLY a JSON object: { "visualPrompt": "..." }`

    const userMessage = `Song Title: ${song.title}
Artist: ${song.artist || 'Unknown'}
Theme: ${song.theme || 'Singaporean Heritage'}
Lyrics to visualize:
${(lyrics || '').trim() || 'Instrumental segment'}`

    const response = await openai.chat.completions.create({
      model,
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 1024,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    })

    const responseText = (response.choices[0]?.message?.content || '').trim()
    let cleanedText = responseText.replace(/```json|```/g, '').trim()
    cleanedText = cleanedText.replace(/[\r\n\t]+/g, ' ')

    const parsed = JSON.parse(cleanedText)
    const prompt = parsed.visualPrompt || parsed.visual_prompt || cleanedText
    if (prompt && typeof prompt === 'string' && prompt.trim()) {
      return prompt.trim()
    }
  } catch (err) {
    console.warn(`[confirmScenes] Auto-generating missing scene prompt fallback:`, err.message)
  }

  const theme = song.theme || 'Singaporean Heritage'
  const lyricSnippet = lyrics?.trim() ? ` depicting: "${lyrics.trim()}"` : ''
  return `Cinematic music video scene${lyricSnippet}. Theme: ${theme}, vibrant cultural atmosphere, dramatic lighting, shot on 35mm lens, 8k resolution.`
}

const confirmScenes = async (req, res, next) => {
  try {
    const { id } = req.params
    const { scenes, transcriptionSegments } = req.body

    if (!scenes || !Array.isArray(scenes) || scenes.length === 0) {
      const error = new Error('scenes array is required and must not be empty.')
      error.statusCode = 400
      throw error
    }

    // Fetch job and validate ownership
    const job = await GenerationJob.findOne({
      where: { id },
      include: [{
        model: Song,
        as: 'song',
        where: { creatorId: req.authUserRecord.id },
      }],
    })

    if (!job) {
      const error = new Error('Generation job not found.')
      error.statusCode = 404
      throw error
    }

    if (job.status !== 'AWAITING_REVIEW') {
      const error = new Error('This job is not awaiting scene review.')
      error.statusCode = 409
      throw error
    }

    const song = job.song

    // Schema Alignment: Map camelCase/snake_case fields and auto-fill missing prompts
    const mappedScenes = await Promise.all(
      scenes.map(async (s, index) => {
        let visualPrompt = s.visualPrompt || s.visual_prompt
        if (!visualPrompt || !visualPrompt.trim()) {
          console.log(`[confirmScenes] Found scene with missing visual prompt. Auto-generating prompt on the fly...`)
          visualPrompt = await generatePromptForScene(song, s.lyrics)
        }
        return {
          songId: job.songId,
          sceneOrder: index + 1,
          startTime: parseFloat(s.startTime || s.start_time || 0),
          endTime: parseFloat(s.endTime || s.end_time || 0),
          lyrics: s.lyrics || '',
          visualPrompt: visualPrompt || '',
        }
      })
    )

    // Overwrite existing SceneSegment records with the user-approved scenes
    await SceneSegment.destroy({ where: { songId: job.songId } })
    await SceneSegment.bulkCreate(mappedScenes)

    // Update transcription segments if the creator edited them
    if (transcriptionSegments && Array.isArray(transcriptionSegments)) {
      await song.update({ transcriptionSegments })
    }

    // CLEAR MEMORY LOCK: Delete the job lock before calling background pipeline
    activePipelineJobs.delete(job.id)

    // Resume pipeline
    await job.update({ status: 'PROCESSING' })

    // Fire Phases 3-5 asynchronously
    if (process.env.NODE_ENV !== 'test') resumeFromPhase3(job.id).catch(console.error)

    return res.json({
      success: true,
      message: 'Scenes confirmed. Image generation has resumed.',
      data: { jobId: job.id, status: 'PROCESSING', scenesConfirmed: mappedScenes.length },
    })
  } catch (error) {
    next(error)
  }
}

const regenerateSingleScenePrompt = async (req, res, next) => {
  try {
    const { songId, lyrics } = req.body

    if (!songId || !lyrics?.trim()) {
      const error = new Error('songId and lyrics are required.')
      error.statusCode = 400
      throw error
    }

    const song = await Song.findOne({ where: { id: songId, creatorId: req.authUserRecord.id } })
    if (!song) {
      const error = new Error('Song not found.')
      error.statusCode = 404
      throw error
    }

    const apiKey = process.env.DEEPSEEK_API_KEY || process.env.OPENAI_API_KEY
    const baseURL = process.env.DEEPSEEK_API_KEY
      ? (process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com')
      : undefined
    const model = process.env.DEEPSEEK_API_KEY
      ? (process.env.DEEPSEEK_MODEL || 'deepseek-chat')
      : 'gpt-4o-mini'

    const openai = new OpenAI({ apiKey, ...(baseURL ? { baseURL } : {}) })

    const systemPrompt = `You are an expert cinematic music video director.
Given the song's metadata and a specific set of lyrics, generate a single detailed visual prompt suitable for DALL-E image generation.
The prompt should vividly describe the subject, lighting, atmosphere, camera angle, and how it ties into the song's theme.
Return ONLY a JSON object: { "visualPrompt": "..." }`

    const userMessage = `Song Title: ${song.title}
Artist: ${song.artist || 'Unknown'}
Theme: ${song.theme || 'Singaporean Heritage'}
Lyrics to visualize:
${lyrics.trim()}`

    const response = await openai.chat.completions.create({
      model,
      response_format: { type: 'json_object' },
      temperature: 0.7,
      max_tokens: 1024,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userMessage },
      ],
    })

    const responseText = (response.choices[0]?.message?.content || '').trim()
    let cleanedText = responseText.replace(/```json|```/g, '').trim()
    cleanedText = cleanedText.replace(/[\r\n\t]+/g, ' ')

    const parsed = JSON.parse(cleanedText)

    return res.json({
      success: true,
      visualPrompt: parsed.visualPrompt || parsed.visual_prompt || cleanedText,
    })
  } catch (error) {
    console.error('[regenerateSingleScenePrompt Error]:', error)
    next(error)
  }
}

module.exports = {
  startGeneration,
  getGenerationStatus,
  getAllJobs,
  deleteJob,
  exportVideo,
  regenerateFrame,
  retryGeneration,
  confirmScenes,
  regenerateSingleScenePrompt,
  runGenerationPipeline,
  resumeFromPhase3,
  completeGeneration,
  failGeneration,
  usePlaceholderVideo,
}
