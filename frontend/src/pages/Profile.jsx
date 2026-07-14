import { useCallback, useEffect, useMemo, useState } from 'react'
import CreatorProfile from '../components/profile/CreatorProfile'
import MemoryEditModal from '../components/profile/MemoryEditModal'
import ProfileBadges from '../components/profile/ProfileBadges'
import ProfileHero from '../components/profile/ProfileHero'
import ProfileMemories from '../components/profile/ProfileMemories'
import ProfileMusicJourney from '../components/profile/ProfileMusicJourney'
import ProfileSkeleton from '../components/profile/ProfileSkeleton'
import ProfileStats from '../components/profile/ProfileStats'
import { useAuth } from '../context/AuthContext'
import { getUserBadges } from '../services/badgeService'
import { deleteReflection, getMyReflections, updateReflection } from '../services/reflectionService'
import { getMyScores } from '../services/scoreService'

export default function Profile() {
  const { user } = useAuth()

  if (user.role === 'CREATOR') return <CreatorProfile />

  return <RegisteredProfile />
}

function RegisteredProfile() {
  const { token, user } = useAuth()
  const [badges, setBadges] = useState([])
  const [memories, setMemories] = useState([])
  const [scores, setScores] = useState([])
  const [loading, setLoading] = useState({ badges: true, memories: true, scores: true })
  const [errors, setErrors] = useState({ badges: '', memories: '', scores: '' })
  const [editing, setEditing] = useState(null)
  const [saving, setSaving] = useState(false)
  const [feedback, setFeedback] = useState('')

  const loadSection = useCallback(async (section) => {
    setLoading((current) => ({ ...current, [section]: true }))
    setErrors((current) => ({ ...current, [section]: '' }))
    try {
      if (section === 'badges') setBadges(await getUserBadges(user.id, token))
      if (section === 'memories') setMemories(await getMyReflections(token))
      if (section === 'scores') setScores(await getMyScores(token))
    } catch (error) {
      setErrors((current) => ({ ...current, [section]: error.message }))
    } finally {
      setLoading((current) => ({ ...current, [section]: false }))
    }
  }, [token, user?.id])

  useEffect(() => {
    let active = true
    const requests = [
      getMyReflections(token).then((value) => active && setMemories(value)).catch((error) => active && setErrors((current) => ({ ...current, memories: error.message }))).finally(() => active && setLoading((current) => ({ ...current, memories: false }))),
      getUserBadges(user.id, token).then((value) => active && setBadges(value)).catch((error) => active && setErrors((current) => ({ ...current, badges: error.message }))).finally(() => active && setLoading((current) => ({ ...current, badges: false }))),
      getMyScores(token).then((value) => active && setScores(value)).catch((error) => active && setErrors((current) => ({ ...current, scores: error.message }))).finally(() => active && setLoading((current) => ({ ...current, scores: false }))),
    ]
    Promise.allSettled(requests)
    return () => { active = false }
  }, [token, user.id])

  const uniqueSongsPlayed = useMemo(() => new Set(scores.map((score) => score.songId)).size, [scores])

  async function saveMemory(content) {
    setSaving(true); setFeedback('')
    try {
      await updateReflection(editing.id, {
        content,
        displayMode: editing.displayMode,
        songId: editing.songId,
        tags: editing.tags || [],
      }, token)
      setEditing(null); setFeedback('Memory updated successfully.'); await loadSection('memories')
    } catch (error) { setFeedback(error.message) } finally { setSaving(false) }
  }

  async function removeMemory(memory) {
    if (!window.confirm('Delete this memory permanently?')) return
    setFeedback('')
    try { await deleteReflection(memory.id, token); setFeedback('Memory deleted.'); await loadSection('memories') }
    catch (error) { setFeedback(error.message) }
  }

  if (Object.values(loading).every(Boolean)) return <ProfileSkeleton />

  return <div className="profile-page">
    <ProfileHero user={user} />
    <ProfileStats badges={badges.length} loading={Object.values(loading).every(Boolean)} memories={memories.length} scores={uniqueSongsPlayed} />
    <div aria-live="polite" className="profile-feedback">{feedback}</div>
    <ProfileMemories error={errors.memories} loading={loading.memories} memories={memories} onDelete={removeMemory} onEdit={setEditing} onRetry={() => loadSection('memories')} />
    <div className="profile-lower-grid">
      <ProfileBadges badges={badges} error={errors.badges} loading={loading.badges} onRetry={() => loadSection('badges')} />
      <ProfileMusicJourney error={errors.scores} loading={loading.scores} onRetry={() => loadSection('scores')} scores={scores} />
    </div>
    {editing ? <MemoryEditModal memory={editing} onClose={() => setEditing(null)} onSave={saveMemory} saving={saving} /> : null}
  </div>
}
