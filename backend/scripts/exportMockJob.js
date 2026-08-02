const fs = require('fs');
const path = require('path');
const { GenerationJob, Song, SceneSegment, GeneratedFrame } = require('../models');

async function exportJob() {
  const jobId = process.argv[2];
  if (!jobId) {
    console.error('Please provide a jobId. Usage: node exportMockJob.js <jobId>');
    process.exit(1);
  }

  try {
    const job = await GenerationJob.findByPk(jobId);
    if (!job) {
      console.error(`Job ${jobId} not found.`);
      process.exit(1);
    }

    const song = await Song.findByPk(job.songId);
    const segments = await SceneSegment.findAll({ 
      where: { songId: song.id },
      order: [['startTime', 'ASC']]
    });
    
    const segmentsWithFrames = [];
    for (const seg of segments) {
      const frames = await GeneratedFrame.findAll({ 
        where: { sceneSegmentId: seg.id },
        order: [['frameOrder', 'ASC']]
      });
      const segObj = seg.toJSON();
      segObj.generatedFrames = frames.map(f => f.toJSON());
      segmentsWithFrames.push(segObj);
    }

    const jobObj = job.toJSON();
    const songObj = song.toJSON();
    songObj.sceneSegments = segmentsWithFrames;
    jobObj.song = songObj;

    const exportPath = path.join(__dirname, 'mockJobData.json');
    fs.writeFileSync(exportPath, JSON.stringify(jobObj, null, 2));
    console.log(`✅ Job ${jobId} exported successfully to ${exportPath}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  }
}

exportJob();
