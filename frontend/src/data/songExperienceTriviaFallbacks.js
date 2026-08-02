// Temporary Song Experience quiz fallback recovered from commit 44ee64d.
// Keep this separate from fetched trivia so it can be removed once every
// published song has its own quiz. These questions are never persisted.
export const TEMPORARY_SONG_TRIVIA_FALLBACKS = [
  {
    question: "Which band performed the 2016 NDP theme song 'Tomorrow's Here Today'?",
    options: [
      { id: 'A', text: 'The Sam Willows' },
      { id: 'B', text: '53A' },
      { id: 'C', text: 'Electrico' },
      { id: 'D', text: 'ShiGGa Shay' },
    ],
    correctAnswerId: 'B',
  },
  {
    question: 'Who wrote and composed the song?',
    options: [
      { id: 'A', text: 'Dick Lee' },
      { id: 'B', text: 'Don Richmond' },
      { id: 'C', text: 'JJ Lin' },
      { id: 'D', text: 'Corrinne May' },
    ],
    correctAnswerId: 'B',
  },
  {
    question: 'What is the core message of the song?',
    options: [
      { id: 'A', text: 'Reflecting on past struggles' },
      { id: 'B', text: 'Looking forward to a bright future' },
      { id: 'C', text: 'A romantic love story' },
      { id: 'D', text: 'Celebrating traditional food' },
    ],
    correctAnswerId: 'B',
  },
  {
    question: 'Which music genre best describes the track?',
    options: [
      { id: 'A', text: 'Classical Orchestra' },
      { id: 'B', text: 'Indie Pop/Rock' },
      { id: 'C', text: 'Heavy Metal' },
      { id: 'D', text: 'Electronic Dance Music' },
    ],
    correctAnswerId: 'B',
  },
  {
    question: "What year was 'Tomorrow's Here Today' used for the National Day Parade?",
    options: [
      { id: 'A', text: '2014' },
      { id: 'B', text: '2015' },
      { id: 'C', text: '2016' },
      { id: 'D', text: '2017' },
    ],
    correctAnswerId: 'C',
  },
]

function normalizeFetchedQuestion(question) {
  const options = Array.isArray(question?.options)
    ? question.options.map((option, index) => ({
        id: typeof option === 'object' && option?.id
          ? String(option.id)
          : String.fromCharCode(65 + index),
        text: typeof option === 'object' && option?.text !== undefined
          ? String(option.text)
          : String(option),
      }))
    : []
  const correctAnswer = question?.correctAnswer
  const matchingOption = options.find((option) => (
    option.id === correctAnswer || option.text === correctAnswer
  ))

  return {
    ...question,
    question: question?.question || question?.prompt || '',
    options,
    correctAnswerId: question?.correctAnswerId || matchingOption?.id || '',
  }
}

export function getSongTrivia(song) {
  const fetchedTrivia = Array.isArray(song?.triviaQuestions) && song.triviaQuestions.length > 0
    ? song.triviaQuestions
    : Array.isArray(song?.trivia) && song.trivia.length > 0
      ? song.trivia
      : null

  return fetchedTrivia
    ? fetchedTrivia.map(normalizeFetchedQuestion)
    : TEMPORARY_SONG_TRIVIA_FALLBACKS
}
