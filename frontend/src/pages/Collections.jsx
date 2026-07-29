import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import PageHeader from '../components/PageHeader'
import SectionCard from '../components/SectionCard'
import { useAuth } from '../context/AuthContext'
import { getApprovedFolders, getPublicFolder } from '../services/folderService'
import { trackAnalyticsEvent } from '../services/analyticsService'

export default function Collections() {
  const { slug } = useParams()
  const { token } = useAuth()
  const [folders, setFolders] = useState([])
  const [folder, setFolder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  useEffect(() => {
    let active = true
    const request = slug ? getPublicFolder(slug) : getApprovedFolders()
    request.then((data) => {
      if (!active) return
      if (slug) {
        setFolder(data)
        trackAnalyticsEvent('FOLDER_VIEWED', { folderId: data.id }, token).catch(() => {})
      } else setFolders(data)
    }).catch((nextError) => active && setError(nextError.message)).finally(() => active && setLoading(false))
    return () => { active = false }
  }, [slug, token])
  if (loading) return <div className="page-stack"><p role="status">Loading collections...</p></div>
  if (error) return <div className="page-stack"><div className="state-box" role="alert">{error}</div></div>
  if (slug) return <div className="page-stack"><PageHeader eyebrow="Collection" title={folder.name} description={folder.description || 'A curated collection of Singapore National Day songs.'} /><SectionCard title="Published songs">{folder.songs.length ? folder.songs.map((song) => <article className="dashboard-song-item" key={song.id}><div className="dashboard-song-copy"><strong><Link to={`/songs/${song.id}`}>{song.title}</Link></strong><span>{song.artist || 'Artist not listed'}</span><small>{song.description}</small></div></article>) : <p>No published songs in this collection.</p>}</SectionCard><Link to="/collections">All collections</Link></div>
  return <div className="page-stack"><PageHeader eyebrow="Explore" title="Song collections" description="Browse administrator-approved collections containing published National Day songs." /><section className="three-column">{folders.length ? folders.map((item) => <SectionCard key={item.id} title={item.name}><p>{item.description || 'Curated National Day songs.'}</p><p>{item.songs.length} published songs</p><Link to={`/collections/${item.slug}`}>Open collection</Link></SectionCard>) : <p>No public collections are available yet.</p>}</section></div>
}
