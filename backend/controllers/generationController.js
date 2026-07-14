const fs = require('fs').promises
const path = require('path')
const { GenerationJob, Song, SceneSegment, GeneratedFrame } = require('../models')
const { generateScenePlan } = require('../services/aiScenePlanner')
const { generateFrames } = require('../services/frameGenerator')
const { assembleVideo } = require('../services/videoAssembler')
const { OpenAI } = require('openai')
const cloudinary = require('../config/cloudinary')
const aiStorageService = require('../services/aiStorageService')
const { extractAudioFromYouTube, downloadMediaFromUrl } = require('../services/audioExtractionService')
const { transcribeMediaBuffer } = require('../services/transcriptionService')

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

    const song = await Song.findByPk(songId)
    if (!song) {
      const error = new Error('Song not found.')
      error.statusCode = 404
      throw error
    }

    // 1. Create the tracking ticket
    const job = await GenerationJob.create({
      songId,
      status: 'IN_PROGRESS',
    })

    // 2. Fire the background worker WITHOUT awaiting it
    runGenerationPipeline(job.id).catch(console.error)

    // 3. Immediately return the ticket ID to the frontend
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

    const job = await GenerationJob.findByPk(id, {
      include: [
        { 
          model: Song, 
          as: 'song', 
          include: [
            {
              model: SceneSegment,
              as: 'sceneSegments',
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
      include: [{ model: Song, as: 'song', attributes: ['title', 'artist'] }],
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

  try {
    const job = await GenerationJob.findByPk(jobId)
    if (!job) throw new Error(`Job ${jobId} not found in database.`)

    const song = await Song.findByPk(job.songId)
    if (!song) throw new Error(`Song ${job.songId} not found.`)

    console.log(`[Phase 1] Audio Extraction & Whisper Transcription...`)
    if (!song.transcriptionSegments || song.transcriptionSegments.length === 0) {
      const targetUrl = song.videoUrl || song.audioUrl || 'https://youtu.be/hYIOC3y0tmg'
      
      let extractedInfo;
      if (/(youtube\.com|youtu\.be)/i.test(targetUrl)) {
        console.log(`[Phase 1] Extracting YouTube audio from ${targetUrl}...`)
        extractedInfo = await extractAudioFromYouTube(targetUrl)
      } else {
        console.log(`[Phase 1] Downloading direct media from ${targetUrl}...`)
        extractedInfo = await downloadMediaFromUrl(targetUrl, jobId)
      }
      
      try {
        const mediaBuffer = await fs.readFile(extractedInfo.filePath)
        console.log(`[Phase 1] Transcribing audio via Whisper API...`)
        const transcription = await transcribeMediaBuffer({
          fileName: extractedInfo.fileName,
          mediaBuffer,
          mimeType: extractedInfo.mimeType
        })
        
        await song.update({ transcriptionSegments: transcription.segments })
        console.log(`[Phase 1] Saved ${transcription.segments.length} segments to database.`)
      } finally {
        await extractedInfo.cleanup()
      }
    } else {
      console.log(`[Phase 1] Skipped. transcriptionSegments already exist.`)
    }

    console.log(`[Phase 2] Generating Scene Plan...`)
    await generateScenePlan(jobId, job.songId)

    console.log(`[Phase 3] Generating Image Frames...`)
    await generateFrames(jobId, job.songId)

    console.log(`[Phase 4] Assembling Video with FFmpeg...`)
    await assembleVideo(jobId, job.songId)

    // Update DB on Success
    await job.update({
      status: 'COMPLETED',
      errorMessage: null,
    })

    // Run Cleanup on successful completion
    await cleanupJobFiles(jobId)
    console.log(`[Background Worker] Pipeline COMPLETED successfully for Job ID: ${jobId}`)
  } catch (error) {
    console.error(`[Generation Pipeline Error] Job ${jobId}:`, error)

    // ERROR BOUNDARY
    try {
      if (jobId) {
        await GenerationJob.update(
          {
            status: 'FAILED',
            errorMessage: error.message || 'An unknown error occurred during generation.',
          },
          { where: { id: jobId } }
        )
        await cleanupJobFiles(jobId) // Wipe broken files so they don't clog the server
      }
    } catch (fallbackError) {
      console.error(`[Fallback Failure] Job ${jobId}:`, fallbackError)
    }
  }
}

const exportVideo = async (req, res, next) => {
  try {
    const { jobId } = req.params;
    const { burnCaptions = true } = req.body || {};
    const job = await GenerationJob.findByPk(jobId);
    if (!job) {
      return res.status(404).json({ success: false, message: 'Job not found' });
    }

    // Set job back to in progress so the frontend sees it compiling
    await job.update({ status: 'IN_PROGRESS' });

    // Wait for the video compilation to finish
    const assembleResult = await assembleVideo(jobId, job.songId, burnCaptions);
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

module.exports = {
  startGeneration,
  getGenerationStatus,
  getAllJobs,
  exportVideo,
  regenerateFrame
}