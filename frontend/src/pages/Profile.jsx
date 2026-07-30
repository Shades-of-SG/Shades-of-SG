import { useEffect, useState } from 'react'
import MemoryEditModal from '../components/profile/MemoryEditModal'
import ProfileBadges from '../components/profile/ProfileBadges'
import ProfileHero from '../components/profile/ProfileHero'
import ProfileMemories from '../components/profile/ProfileMemories'
import ProfileMusicJourney from '../components/profile/ProfileMusicJourney'
import ProfileStats from '../components/profile/ProfileStats'
import { useAuth } from '../context/AuthContext'
import { deleteReflection, updateReflection } from '../services/reflectionService'

export default function Profile() {
  const { profileLoading, refreshProfile, token, userProfile } = useAuth()
  const [editingMemory, setEditingMemory] = useState(null)
  const [savingMemory, setSavingMemory] = useState(false)
  const [memoryError, setMemoryError] = useState('')
  const [feedback, setFeedback] = useState('')
  const [loadError, setLoadError] = useState('')

  useEffect(() => {
    if (Array.isArray(userProfile?.badges)) return
    refreshProfile().catch((error) => setLoadError(error.message))
  }, [refreshProfile, userProfile?.badges])

  async function reload() {
    setLoadError('')
    try { await refreshProfile() } catch (error) { setLoadError(error.message) }
  }

  async function saveMemory(content) {
    setSavingMemory(true)
    setMemoryError('')
    try {
      await updateReflection(editingMemory.id, { content, displayMode: editingMemory.displayMode, songId: editingMemory.songId, tags: editingMemory.tags || [] }, token)
      setEditingMemory(null)
      setFeedback('Memory updated successfully.')
      await reload()
    } catch (error) { setMemoryError(error.message) } finally { setSavingMemory(false) }
  }

  async function removeMemory(memory) {
    if (!window.confirm('Delete this memory permanently? This cannot be undone.')) return
    try {
      await deleteReflection(memory.id, token)
      setFeedback('Memory deleted.')
      await reload()
    } catch (error) { setFeedback(`Memory could not be deleted. ${error.message}`) }
  }

  if (profileLoading && !userProfile) return <div className="profile-page"><span className="profile-skeleton profile-skeleton--hero" role="status" /></div>
  if (!userProfile) return <div className="profile-page"><div className="profile-error" role="alert"><p>Your profile could not be loaded.</p><button onClick={reload} type="button">Retry</button></div></div>

  const { badges = [], profile, reflections = [], rhythm } = userProfile
  const memories = reflections.map((memory) => ({ ...memory, isOwner: true }))
  const themePreference = profile.theme?.toLowerCase()
  const theme = themePreference === 'dark' || themePreference === 'light'
    ? themePreference
    : (typeof window.matchMedia === 'function' && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
  const loading = { badges: profileLoading, memories: profileLoading, scores: profileLoading }

  return (
    <div className="profile-page" data-theme={theme}>
      <ProfileHero isCreator={userProfile.account?.isCreator} profile={profile} />
      <ProfileStats badges={badges.length} loading={loading} rhythm={rhythm} />
      <div aria-live="polite" className="profile-feedback" role="status">{feedback}</div>
      <ProfileMemories error={loadError} loading={profileLoading} memories={memories} onDelete={removeMemory} onEdit={(memory) => { setMemoryError(''); setEditingMemory(memory) }} onRetry={reload} />
      <ProfileBadges badges={badges} error={loadError} loading={profileLoading} onRetry={reload} />
      <ProfileMusicJourney error={loadError} loading={profileLoading} onRetry={reload} scores={rhythm?.recentScores || []} />
      {editingMemory ? <MemoryEditModal error={memoryError} memory={editingMemory} onClose={() => setEditingMemory(null)} onSave={saveMemory} saving={savingMemory} /> : null}
    </div>
  )
}
