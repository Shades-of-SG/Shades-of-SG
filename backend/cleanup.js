const { GenerationJob, GeneratedFrame, SceneSegment } = require('./models')

async function cleanup() {
  console.log('🧹 Wiping GeneratedFrames...')
  await GeneratedFrame.destroy({ where: {} })

  console.log('🧽 Clearing SceneSegment image URLs...')
  await SceneSegment.update({ imageUrl: null }, { where: {} })

  console.log('🔥 Obliterating all past GenerationJobs...')
  // Changed from update() to destroy() to delete them forever
  await GenerationJob.destroy({ where: {} })

  console.log('✨ Cleanup complete! The slate is totally clean.')
  process.exit()
}

cleanup()
