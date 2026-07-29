import { useCallback, useEffect, useState } from 'react'
import PageHeader from '../components/PageHeader'
import SectionCard from '../components/SectionCard'
import { useAuth } from '../context/AuthContext'
import { getAdminCreators, updateCreatorStatus } from '../services/adminService'

export default function AdminCreators() {
  const { token } = useAuth()
  const [creators, setCreators] = useState([])
  const [message, setMessage] = useState('')
  const refresh = useCallback(() => getAdminCreators(token).then((data) => setCreators(data.creators)).catch((error) => setMessage(error.message)), [token])
  useEffect(() => { refresh() }, [refresh])
  const toggle = async (creator) => { try { await updateCreatorStatus(creator.id, creator.accountStatus === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE', token); refresh() } catch (error) { setMessage(error.message) } }
  return <div className="creator-page"><PageHeader eyebrow="Admin" title="Creator management" description="Review creator activity and suspend or reactivate creator access." />{message ? <p role="status">{message}</p> : null}<SectionCard title="Approved creators">{creators.map((creator) => <article className="dashboard-song-item" key={creator.id}><div className="dashboard-song-copy"><strong>{creator.name}</strong><span>{creator.email}</span><small>{creator.songCount} songs · {creator.publishedSongCount} published · {creator.accountStatus}</small></div><button className="studio-button studio-button--secondary" onClick={() => toggle(creator)} type="button">{creator.accountStatus === 'ACTIVE' ? 'Suspend' : 'Reactivate'}</button></article>)}</SectionCard></div>
}
