const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });
const { transcribeMediaBuffer } = require('../services/transcriptionService');
const mockDataPath = path.resolve(__dirname, 'mockJobData.json');

const mockData = JSON.parse(fs.readFileSync(mockDataPath, 'utf8'));

// We will cycle through the existing images to keep the mock visual
const existingImages = mockData.song.sceneSegments.map(s => s.generatedFrames[0].imageUrl);

function groupSegments(segments, targetDuration = 5) {
  if (!segments || segments.length === 0) return []
  
  const grouped = []
  let currentGroup = null

  for (const seg of segments) {
    if (!currentGroup) {
      currentGroup = {
        startTime: seg.start,
        endTime: seg.end,
        lyrics: seg.text.trim(),
      }
    } else {
      const duration = currentGroup.endTime - currentGroup.startTime
      if (duration < targetDuration) {
        currentGroup.endTime = seg.end
        currentGroup.lyrics += ' ' + seg.text.trim()
      } else {
        grouped.push(currentGroup)
        currentGroup = {
          startTime: seg.start,
          endTime: seg.end,
          lyrics: seg.text.trim(),
        }
      }
    }
  }
  
  if (currentGroup) {
    grouped.push(currentGroup)
  }
  
  return grouped
}

async function run() {
  console.log('Fetching audio...');
  const audioUrl = mockData.song.audioUrl;
  const audioRes = await fetch(audioUrl);
  const arrayBuffer = await audioRes.arrayBuffer();
  const mediaBuffer = Buffer.from(arrayBuffer);

  console.log('Transcribing...');
  const transcription = await transcribeMediaBuffer({
    fileName: 'audio.mp4',
    mediaBuffer,
    mimeType: 'audio/mp4'
  });

  const grouped = groupSegments(transcription.segments, 5);
  
  console.log(`Generated ${grouped.length} segments.`);
  
  const newSegments = grouped.map((seg, i) => {
    return {
      id: `mock-seg-${i}`,
      songId: mockData.song.id,
      startTime: seg.startTime,
      endTime: seg.endTime,
      lyrics: seg.lyrics,
      emotion: null,
      visualPrompt: `Mock visual prompt for ${seg.lyrics}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      generatedFrames: [
        {
          id: `mock-frame-${i}`,
          sceneSegmentId: `mock-seg-${i}`,
          imageUrl: existingImages[i % existingImages.length],
          frameOrder: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        }
      ]
    };
  });
  
  mockData.song.sceneSegments = newSegments;
  
  fs.writeFileSync(mockDataPath, JSON.stringify(mockData, null, 2));
  console.log('mockJobData.json updated successfully.');
}

run().catch(console.error);
