const fs = require('fs').promises
const path = require('path')

/**
 * Safely targets and deletes leftover temporary files for a specific job.
 * Fault-tolerant: Uses Promise.allSettled to ensure missing files don't break the process.
 * @param {string|number} jobId - The ID of the generation job.
 */
const cleanupJobFiles = async (jobId) => {
  // Define the target temp directory based on the standard file structure
  const tempDir = path.join(__dirname, '..', 'storage', 'temp')

  try {
    // Check if directory exists before trying to read it
    await fs.access(tempDir)

    // Read all files currently in the temp directory
    const allFiles = await fs.readdir(tempDir)

    // Filter for files explicitly associated with this jobId and specific extensions
    const filesToDelete = allFiles.filter((file) => {
      return (
        file === `${jobId}_audio.mp3` ||
        file === `${jobId}_subs.srt` ||
        file === `${jobId}_final.mp4` ||
        (file.startsWith(`${jobId}_frame_`) && file.endsWith('.jpg'))
      )
    })

    if (filesToDelete.length === 0) return // Nothing to clean up

    // Create an array of fs.promises.unlink calls
    const unlinkPromises = filesToDelete.map((file) => fs.unlink(path.join(tempDir, file)))

    // Fault Tolerance: Execute all deletions simultaneously.
    const results = await Promise.allSettled(unlinkPromises)

    // Optional: Log any failed deletions for backend observability
    results.forEach((result, index) => {
      if (result.status === 'rejected') {
        console.warn(
          `[Cleanup Warning] Could not delete ${filesToDelete[index]}: ${result.reason.message}`
        )
      }
    })
  } catch (error) {
    console.error(
      `[Cleanup Error] Failed to access temp directory for Job ${jobId}:`,
      error.message
    )
  }
}

module.exports = { cleanupJobFiles }
