const { User, Song, GenerationJob, SceneSegment, GeneratedFrame } = require('../models');
const sequelize = require('../config/database');

const MOCK_IMAGES = [
  'https://images.unsplash.com/photo-1542361345-89e58247f2d5?q=80&w=1024&h=1024&fit=crop',
  'https://images.unsplash.com/photo-1494548162494-384bba4ab999?q=80&w=1024&h=1024&fit=crop',
  'https://images.unsplash.com/photo-1472214103451-9374bd1c798e?q=80&w=1024&h=1024&fit=crop',
  'https://images.unsplash.com/photo-1518791841217-8f162f1e1131?q=80&w=1024&h=1024&fit=crop',
  'https://images.unsplash.com/photo-1521747116042-5a810fda9664?q=80&w=1024&h=1024&fit=crop',
  'https://images.unsplash.com/photo-1497366216548-37526070297c?q=80&w=1024&h=1024&fit=crop'
];

async function seed() {
  try {
    // 1. Create or Find User
    const [user] = await User.findOrCreate({
      where: { email: 'dev@shadesofsg.local' },
      defaults: {
        name: 'Violet',
        passwordHash: 'dummyhash',
        role: 'CREATOR'
      }
    });

    // 2. Create Dummy Song
    const song = await Song.create({
      creatorId: user.id,
      title: 'Mock Editor Test',
      artist: 'Dev Band',
      theme: 'Standard',
      moodTags: ['cinematic', 'epic'],
      lyrics: 'This is a test lyric',
      audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
      status: 'DRAFT'
    });

    // 3. Create Generation Job
    const job = await GenerationJob.create({
      songId: song.id,
      status: 'COMPLETED'
    });

    // 4. Create Scene Segments & Generated Frames
    const numSegments = 6;
    for (let i = 0; i < numSegments; i++) {
      const segment = await SceneSegment.create({
        songId: song.id,
        startTime: i * 5.0,
        endTime: (i + 1) * 5.0,
        lyrics: `Mock lyric segment ${i + 1}: The cinematic view unfolds across the skyline.`,
        visualPrompt: `A cinematic view of Singapore scene ${i + 1}, extremely detailed, 4k resolution, epic lighting.`,
      });

      // The frontend pulls images via the generatedFrames relation
      await GeneratedFrame.create({
        sceneSegmentId: segment.id,
        imageUrl: MOCK_IMAGES[i % MOCK_IMAGES.length],
        frameOrder: 1
      });
    }

    console.log('\n✅ Mock Job successfully seeded!');
    console.log(`➡️  Generation Job ID: ${job.id}`);
    console.log('You can now use this ID in the frontend URL to test the Editor UI.');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
}

seed();
