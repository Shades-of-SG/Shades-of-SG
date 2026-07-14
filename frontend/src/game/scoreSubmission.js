const submittedRuns = new Set()

export function canSubmitScore({ result, token, user }) {
  const completeRun = Number.isInteger(result?.totalNotes) && result.totalNotes > 0 && result.processedNotes === result.totalNotes
  const validCombo = Number.isInteger(result?.maxCombo) && result.maxCombo >= 0 && result.maxCombo <= result.totalNotes
  const validDifficulty = ['EASY', 'MEDIUM', 'HARD'].includes(result?.difficulty)
  return Boolean(!result?.preview && token && user?.role === 'REGISTERED' && completeRun && validCombo && validDifficulty && result?.songId && Number.isInteger(result.score) && result.score >= 0 && result.score <= result.totalNotes * 1500 && Number.isFinite(result.accuracy) && result.accuracy >= 0 && result.accuracy <= 100)
}

export function createSubmissionGuard() {
  return {
    begin(result) {
      const key = `${result.songId}:${result.playedAt}`
      if (submittedRuns.has(key)) return false
      submittedRuns.add(key)
      return true
    },
    retry(result) { submittedRuns.delete(`${result.songId}:${result.playedAt}`) },
  }
}
