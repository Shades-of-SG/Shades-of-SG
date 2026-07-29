const { OpenAI } = require('openai');
const { Song, Instrument, TriviaQuestion, SongInstrument } = require('../models');

async function generateSongCurationDetails(songId) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    throw new Error('DEEPSEEK_API_KEY is missing in process.env.');
  }

  const openai = new OpenAI({
    baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
    apiKey,
  });

  const song = await Song.findByPk(songId);
  if (!song) {
    throw new Error(`Song with ID ${songId} not found.`);
  }

  const allInstruments = await Instrument.findAll();
  const availableInstrumentsInfo = allInstruments.map((inst) => ({
    id: inst.id,
    name: inst.name,
    origin: inst.origin || 'Singapore / Regional',
    description: inst.description || '',
  }));

  const systemPrompt = `You are a cultural heritage and music education expert specializing in Singaporean music, culture, and musical instruments.
Your task is to analyze the provided song details and generate rich educational and curation metadata.

<project_context>
Theme: ${song.theme || 'Singaporean Heritage'}
Target Audience: Music learners, students, and culture enthusiasts.
</project_context>

<available_instruments>
${JSON.stringify(availableInstrumentsInfo, null, 2)}
</available_instruments>

<output_format>
You must return ONLY a JSON object following this exact schema:
{
  "culturalSummary": "<string, 2-3 sentence cultural and educational summary explaining the song's meaning and Singaporean heritage connection>",
  "trivia": [
    {
      "prompt": "<string, engaging multiple choice trivia question about the song, lyrics, or cultural theme>",
      "options": ["<string, Option A>", "<string, Option B>", "<string, Option C>", "<string, Option D>"],
      "correctAnswer": "<string, MUST be exactly identical to one of the 4 strings in options>"
    }
  ],
  "matchedInstrumentIds": ["<string, UUID of matched instrument from available_instruments list>"]
}

RULES:
1. "culturalSummary" MUST be 2-3 informative sentences.
2. "trivia" MUST contain exactly 5 multiple choice questions. Each MUST have 4 options and a correctAnswer matching one of the options.
3. "matchedInstrumentIds" MUST contain 1 to 4 instrument UUIDs chosen ONLY from the provided <available_instruments> list that best match the song's style/heritage.
4. Return ONLY valid JSON with no markdown formatting.
</output_format>`;

  const userMessage = `Song Title: ${song.title}
Artist: ${song.artist || 'Unknown'}
Theme: ${song.theme || 'Singaporean Heritage'}
Lyrics / Raw Lyrics:
${song.rawLyrics || 'No lyrics provided.'}`;

  const response = await openai.chat.completions.create({
    model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 4096,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
  });

  const responseText = (response.choices[0]?.message?.content || '').trim();
  let cleanedText = responseText.replace(/```json|```/g, '').trim();
  cleanedText = cleanedText.replace(/[\r\n\t]+/g, ' ');

  if (!cleanedText) {
    throw new Error('DeepSeek returned an empty curation response.');
  }

  let parsedData;
  try {
    parsedData = JSON.parse(cleanedText);
  } catch (parseError) {
    throw new Error(`Failed to parse AI Curation JSON response: ${parseError.message}`, { cause: parseError });
  }

  const { culturalSummary, trivia, matchedInstrumentIds } = parsedData;

  // 1. Update Song description with cultural summary
  if (culturalSummary && typeof culturalSummary === 'string') {
    await song.update({ description: culturalSummary.trim() });
  }

  // 2. Seed trivia questions
  if (Array.isArray(trivia) && trivia.length > 0) {
    await TriviaQuestion.destroy({ where: { songId } });
    const triviaRecords = trivia.map((t) => ({
      songId,
      prompt: t.prompt,
      type: 'MULTIPLE_CHOICE',
      options: Array.isArray(t.options) ? t.options : [],
      correctAnswer: t.correctAnswer,
    }));
    await TriviaQuestion.bulkCreate(triviaRecords);
  }

  // 3. Associate matched instruments
  if (Array.isArray(matchedInstrumentIds) && matchedInstrumentIds.length > 0) {
    const validInstrumentIds = matchedInstrumentIds.filter((id) =>
      allInstruments.some((inst) => inst.id === id)
    );
    await SongInstrument.destroy({ where: { songId } });
    if (validInstrumentIds.length > 0) {
      const songInstrumentRecords = validInstrumentIds.map((instrumentId) => ({
        songId,
        instrumentId,
      }));
      await SongInstrument.bulkCreate(songInstrumentRecords);
    }
  }

  return {
    culturalSummary,
    triviaCount: trivia ? trivia.length : 0,
    matchedInstrumentIds: matchedInstrumentIds || [],
  };
}

module.exports = { generateSongCurationDetails };
