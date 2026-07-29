import { useEffect, useState } from 'react'
import PageHeader from '../components/PageHeader'
import SectionCard from '../components/SectionCard'
import { useAuth } from '../context/AuthContext'
import { getAdminAnalytics } from '../services/adminService'

export default function AdminAnalytics() {
  const { token } = useAuth()
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  useEffect(() => { getAdminAnalytics(token).then(setData).catch((value) => setError(value.message)) }, [token])
  return <div className="creator-page"><PageHeader eyebrow="Administration" title="Platform analytics" description="Platform-wide reporting is available only to administrators." />{error ? <p role="alert">{error}</p> : null}{data ? <div className="dashboard-grid"><SectionCard title="Users"><strong>{data.users.total}</strong><p>{data.users.creators} creators · {data.users.registered} registered</p></SectionCard><SectionCard title="Songs"><strong>{data.songs.total}</strong><p>{data.songs.published} published</p></SectionCard><SectionCard title="Reflections"><strong>{data.reflections}</strong></SectionCard><SectionCard title="Generation jobs"><strong>{data.generationJobs}</strong></SectionCard></div> : <p role="status">Loading platform analytics…</p>}</div>
}

