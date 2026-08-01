import { useEffect, useState } from 'react'
import CreatorPageShell from '../components/CreatorPageShell'
import SectionCard from '../components/SectionCard'
import { useAuth } from '../context/AuthContext'
import { getCreatorAnalytics } from '../services/analyticsService'

export default function CreatorAnalytics() {
  const { token } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => { getCreatorAnalytics(token).then(setData).catch((value) => setError(value.message)) }, [token])
  return <CreatorPageShell
    breadcrumbs={['Analytics']}
    description="Every total below is calculated only from songs owned by your creator account."
    title="My song analytics"
  >
    {error ? <p role="alert">{error}</p> : null}
    {data ? <div className="dashboard-grid"><SectionCard title="Songs"><strong>{data.songs.total}</strong><p>{data.songs.PUBLISHED || 0} published</p></SectionCard><SectionCard title="Song page views"><strong>{data.events?.SONG_PAGE_VIEWED || 0}</strong></SectionCard><SectionCard title="Playback starts"><strong>{data.events?.SONG_PLAYBACK_STARTED || 0}</strong></SectionCard><SectionCard title="Rhythm completions"><strong>{data.events?.RHYTHM_GAME_COMPLETED || 0}</strong></SectionCard><SectionCard title="Rhythm scores"><strong>{data.rhythmScores}</strong></SectionCard><SectionCard title="Approved reflections"><strong>{data.reflections.APPROVED || 0}</strong></SectionCard><SectionCard title="Completed generations"><strong>{data.generationJobs.COMPLETED || 0}</strong></SectionCard></div> : <p role="status">Loading analytics...</p>}
  </CreatorPageShell>
}
