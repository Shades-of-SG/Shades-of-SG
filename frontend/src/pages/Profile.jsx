import { useCallback, useEffect, useMemo, useState } from 'react'
import CreatorProfile from '../components/profile/CreatorProfile'
import EditProfileModal from '../components/profile/EditProfileModal'
import MemoryEditModal from '../components/profile/MemoryEditModal'
import ProfileBadges from '../components/profile/ProfileBadges'
import ProfileHero from '../components/profile/ProfileHero'
import ProfileMemories from '../components/profile/ProfileMemories'
import ProfileMusicJourney from '../components/profile/ProfileMusicJourney'
import ProfileStats from '../components/profile/ProfileStats'
import { useAuth } from '../context/AuthContext'
import { updateProfile } from '../services/authApi'
import { getUserBadges } from '../services/badgeService'
import { deleteReflection, getMyReflections, updateReflection } from '../services/reflectionService'
import { getMyScores } from '../services/scoreService'

function getInitialTheme() {
  const stored = localStorage.getItem('shadesProfileTheme')
  if (stored === 'light' || stored === 'dark') return stored
  return typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

export default function Profile() {
  const { user } = useAuth()
  if (user?.role === 'CREATOR') return <CreatorProfile />
  return <RegisteredProfile />
}

function RegisteredProfile() {
  const { token, updateUser, user } = useAuth()
  const [badges, setBadges] = useState([])
  const [memories, setMemories] = useState([])
  const [scores, setScores] = useState([])
  const [loading, setLoading] = useState({ badges: true, memories: true, scores: true })
  const [errors, setErrors] = useState({ badges: '', memories: '', scores: '' })
  const [editingMemory, setEditingMemory] = useState(null)
  const [editingProfile, setEditingProfile] = useState(false)
  const [savingMemory, setSavingMemory] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [memoryError, setMemoryError] = useState('')
  const [profileError, setProfileError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [theme, setTheme] = useState(getInitialTheme)

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
  }, [token, user.id])

  useEffect(() => {
    let active = true
    const settle = (section, request, update) => request
      .then((value) => { if (active) update(value) })
      .catch((error) => { if (active) setErrors((current) => ({ ...current, [section]: error.message })) })
      .finally(() => { if (active) setLoading((current) => ({ ...current, [section]: false })) })

    Promise.allSettled([
      settle('memories', getMyReflections(token), setMemories),
      settle('badges', getUserBadges(user.id, token), setBadges),
      settle('scores', getMyScores(token), setScores),
    ])
    return () => { active = false }
  }, [token, user.id])

  useEffect(() => {
    localStorage.setItem('shadesProfileTheme', theme)
  }, [theme])

  const uniqueSongsPlayed = useMemo(() => new Set(scores.map((score) => score.songId).filter(Boolean)).size, [scores])

  async function saveMemory(content) {
    setSavingMemory(true)
    setMemoryError('')
    setFeedback('')
    try {
      await updateReflection(editingMemory.id, {
        content,
        displayMode: editingMemory.displayMode,
        songId: editingMemory.songId,
        tags: editingMemory.tags || [],
      }, token)
      setEditingMemory(null)
      setFeedback('Memory updated successfully.')
      await loadSection('memories')
    } catch (error) {
      setMemoryError(error.message)
    } finally {
      setSavingMemory(false)
    }
  }

  async function removeMemory(memory) {
    if (!window.confirm('Delete this memory permanently? This cannot be undone.')) return
    setFeedback('')
    try {
      await deleteReflection(memory.id, token)
      setFeedback('Memory deleted.')
      await loadSection('memories')
    } catch (error) {
      setFeedback(`Memory could not be deleted. ${error.message}`)
    }
  }

  async function saveProfile(values) {
    setSavingProfile(true)
    setProfileError('')
    setFeedback('')
    try {
      const nextUser = await updateProfile(values, token)
      updateUser({ ...user, ...nextUser })
      setEditingProfile(false)
      setFeedback('Profile updated successfully.')
    } catch (error) {
      setProfileError(error.message)
    } finally {
      setSavingProfile(false)
    }
  }

  return (
    <div className="profile-page" data-theme={theme}>
      <ProfileHero onEdit={() => { setProfileError(''); setEditingProfile(true) }} onToggleTheme={() => setTheme((current) => current === 'dark' ? 'light' : 'dark')} theme={theme} user={user} />
      <ProfileStats badges={badges.length} loading={loading} memories={memories.length} scores={uniqueSongsPlayed} />
      <div aria-live="polite" className="profile-feedback" role="status">{feedback}</div>
      <ProfileMemories error={errors.memories} loading={loading.memories} memories={memories} onDelete={removeMemory} onEdit={(memory) => { setMemoryError(''); setEditingMemory(memory) }} onRetry={() => loadSection('memories')} />
      <ProfileBadges badges={badges} error={errors.badges} loading={loading.badges} onRetry={() => loadSection('badges')} />
      <ProfileMusicJourney error={errors.scores} loading={loading.scores} onRetry={() => loadSection('scores')} scores={scores} />
      {editingMemory ? <MemoryEditModal error={memoryError} memory={editingMemory} onClose={() => setEditingMemory(null)} onSave={saveMemory} saving={savingMemory} /> : null}
      {editingProfile ? <EditProfileModal error={profileError} onClose={() => setEditingProfile(false)} onSave={saveProfile} saving={savingProfile} user={user} /> : null}
    </div>
  )
}
