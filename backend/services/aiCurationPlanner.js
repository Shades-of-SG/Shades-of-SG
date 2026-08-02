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

  const systemPrompt = `You are a cultural heritage, Singapore history, and music education expert.
Your task is to analyze the provided song details and generate a rich educational mini-article, trivia questions based on that mini-article, and matching heritage instruments.

<project_context>
Theme: ${song.theme || 'Singaporean Heritage'}
Target Audience: Music learners, students, and Singapore culture enthusiasts.
</project_context>

<available_instruments>
${JSON.stringify(availableInstrumentsInfo, null, 2)}
</available_instruments>

<output_format>
You must return ONLY a JSON object following this exact schema:
{
  "aiSummary": "<string, a rich, educational mini-article consisting of 3 to 4 detailed paragraphs separated by double line breaks (\\n\\n). It must cover the song's historical era, cultural significance, Singapore heritage context (e.g. independence era, National Day history, community traditions), and musical story>",
  "culturalSummary": "<string, a concise 2-sentence summary of the song's heritage background>",
  "trivia": [
    {
      "prompt": "<string, multiple choice trivia question strictly based on historical or cultural facts mentioned in your aiSummary mini-article>",
      "options": ["<string, Option A>", "<string, Option B>", "<string, Option C>", "<string, Option D>"],
      "correctAnswer": "<string, MUST be exactly identical to one of the 4 strings in options>"
    }
  ],
  "matchedInstrumentIds": ["<string, UUID of matched instrument from available_instruments list>"]
}

RULES:
1. "aiSummary" MUST be a detailed 3-4 paragraph educational mini-article. Separate paragraphs with double line breaks (\\n\\n).
2. "trivia" MUST contain exactly 5 multiple choice questions. Every question MUST be strictly factual and derived from the facts presented in your "aiSummary". Each MUST have 4 options and a correctAnswer matching one of the options.
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

  if (!cleanedText) {
    throw new Error('DeepSeek returned an empty curation response.');
  }

  let parsedData;
  try {
    parsedData = JSON.parse(cleanedText);
  } catch (parseError) {
    throw new Error(`Failed to parse AI Curation JSON response: ${parseError.message}`, { cause: parseError });
  }

  const { aiSummary, culturalSummary, trivia, matchedInstrumentIds } = parsedData;
  const finalArticle = (aiSummary || culturalSummary || '').trim();

  // 1. Update Song aiSummary (preserving description)
  if (finalArticle) {
    await song.update({ aiSummary: finalArticle });
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
    aiSummary: finalArticle,
    triviaCount: trivia ? trivia.length : 0,
    matchedInstrumentIds: matchedInstrumentIds || [],
  };
}

async function generateSongArticle(songId) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY is missing in process.env.');

  const openai = new OpenAI({
    baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
    apiKey,
  });

  const song = await Song.findByPk(songId);
  if (!song) throw new Error(`Song with ID ${songId} not found.`);

  const allInstruments = await Instrument.findAll();
  const availableInstrumentsInfo = allInstruments.map((inst) => ({
    id: inst.id,
    name: inst.name,
    origin: inst.origin || 'Singapore / Regional',
    description: inst.description || '',
  }));

  const systemPrompt = `You are a cultural heritage, Singapore history, and music education expert.
Your task is to analyze the provided song details and generate a rich educational mini-article and matching heritage instruments.

<project_context>
Theme: ${song.theme || 'Singaporean Heritage'}
Target Audience: Music learners, students, and Singapore culture enthusiasts.
</project_context>

<available_instruments>
${JSON.stringify(availableInstrumentsInfo, null, 2)}
</available_instruments>

<output_format>
You must return ONLY a JSON object following this exact schema:
{
  "aiSummary": "<string, a rich, educational mini-article consisting of 3 to 4 detailed paragraphs separated by double line breaks (\\n\\n). It must cover the song's historical era, cultural significance, Singapore heritage context, and musical story>",
  "matchedInstrumentIds": ["<string, UUID of matched instrument from available_instruments list>"]
}

RULES:
1. "aiSummary" MUST be a detailed 3-4 paragraph educational mini-article. Separate paragraphs with double line breaks (\\n\\n).
2. "matchedInstrumentIds" MUST contain 1 to 4 instrument UUIDs chosen ONLY from the provided <available_instruments> list that best match the song's style/heritage.
3. Return ONLY valid JSON with no markdown formatting.
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
    max_tokens: 2048,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
  });

  const responseText = (response.choices[0]?.message?.content || '').trim();
  let cleanedText = responseText.replace(/```json|```/g, '').trim();

  if (!cleanedText) throw new Error('DeepSeek returned an empty curation response.');

  let parsedData;
  try {
    parsedData = JSON.parse(cleanedText);
  } catch (parseError) {
    throw new Error(`Failed to parse AI Article JSON response: ${parseError.message}`, { cause: parseError });
  }

  const { aiSummary, matchedInstrumentIds } = parsedData;
  const finalArticle = (aiSummary || '').trim();

  if (finalArticle) {
    await song.update({ aiSummary: finalArticle });
  }

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
    aiSummary: finalArticle,
    matchedInstrumentIds: matchedInstrumentIds || [],
  };
}

async function generateSongTrivia(songId) {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) throw new Error('DEEPSEEK_API_KEY is missing in process.env.');

  const openai = new OpenAI({
    baseURL: process.env.DEEPSEEK_BASE_URL || 'https://api.deepseek.com',
    apiKey,
  });

  const song = await Song.findByPk(songId);
  if (!song) throw new Error(`Song with ID ${songId} not found.`);

  const systemPrompt = `You are a cultural heritage and music education expert.
Your task is to generate interactive trivia questions strictly based on the provided educational mini-article about the song.

<project_context>
Theme: ${song.theme || 'Singaporean Heritage'}
</project_context>

<output_format>
You must return ONLY a JSON object following this exact schema:
{
  "trivia": [
    {
      "prompt": "<string, multiple choice trivia question strictly based on historical or cultural facts mentioned in the provided article>",
      "options": ["<string, Option A>", "<string, Option B>", "<string, Option C>", "<string, Option D>"],
      "correctAnswer": "<string, MUST be exactly identical to one of the 4 strings in options>"
    }
  ]
}

RULES:
1. "trivia" MUST contain exactly 5 multiple choice questions.
2. Every question MUST be strictly factual and derived from the facts presented in the provided "Article" below.
3. Each MUST have 4 options and a correctAnswer matching one of the options.
4. Return ONLY valid JSON with no markdown formatting.
</output_format>`;

  const userMessage = `Song Title: ${song.title}
Artist: ${song.artist || 'Unknown'}
Theme: ${song.theme || 'Singaporean Heritage'}
Article:
${song.aiSummary || song.description || 'No article provided.'}`;

  const response = await openai.chat.completions.create({
    model: process.env.DEEPSEEK_MODEL || 'deepseek-chat',
    response_format: { type: 'json_object' },
    temperature: 0.7,
    max_tokens: 2048,
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
  });

  const responseText = (response.choices[0]?.message?.content || '').trim();
  let cleanedText = responseText.replace(/```json|```/g, '').trim();

  if (!cleanedText) throw new Error('DeepSeek returned an empty trivia response.');

  let parsedData;
  try {
    parsedData = JSON.parse(cleanedText);
  } catch (parseError) {
    throw new Error(`Failed to parse AI Trivia JSON response: ${parseError.message}`, { cause: parseError });
  }

  const { trivia } = parsedData;

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

  return {
    triviaCount: trivia ? trivia.length : 0,
    trivia: trivia || []
  };
}

module.exports = { generateSongCurationDetails, generateSongArticle, generateSongTrivia };
