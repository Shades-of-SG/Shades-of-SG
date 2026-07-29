import { useCallback, useEffect, useState } from 'react'
import PageHeader from '../components/PageHeader'
import SectionCard from '../components/SectionCard'
import { useAuth } from '../context/AuthContext'
import {
  createPlatformFolder, getAdminFolders, getFolderSongProposals,
  reviewFolderSongProposal, updateAdminFolder,
} from '../services/adminService'

export default function AdminFolders() {
  const { token } = useAuth()
  const [folders, setFolders] = useState([])
  const [placements, setPlacements] = useState([])
  const [form, setForm] = useState({ description: '', name: '' })
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const refresh = useCallback(() => Promise.all([
    getAdminFolders(token), getFolderSongProposals(token, { status: 'PENDING' }),
  ]).then(([folderData, placementData]) => {
    setFolders(folderData.folders); setPlacements(placementData.proposals)
  }).catch((error) => setMessage(error.message)).finally(() => setLoading(false)), [token])
  useEffect(() => { refresh() }, [refresh])
  const create = async (event) => { event.preventDefault(); try { await createPlatformFolder(form, token); setForm({ description: '', name: '' }); await refresh() } catch (error) { setMessage(error.message) } }
  const review = async (id, status) => {
    const reviewNote = status === 'APPROVED' ? '' : window.prompt('Review note for the creator:') || ''
    if (status !== 'APPROVED' && !reviewNote) return
    try { await updateAdminFolder(id, { reviewNote, status }, token); await refresh() } catch (error) { setMessage(error.message) }
  }
  const reviewPlacement = async (id, status) => {
    const reviewNote = status === 'APPROVED' ? '' : window.prompt('Review note for the creator:') || ''
    if (status !== 'APPROVED' && !reviewNote) return
    try { await reviewFolderSongProposal(id, { reviewNote, status }, token); await refresh() } catch (error) { setMessage(error.message) }
  }
  return <div className="creator-page">
    <PageHeader eyebrow="Admin" title="Platform collections" description="Create and order platform folders, and decide creator folder and placement proposals." />
    {message ? <p role="status">{message}</p> : null}{loading ? <p role="status">Loading collections...</p> : null}
    <SectionCard title="Create platform folder"><form className="settings-form" onSubmit={create}><label>Name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label><button className="studio-button studio-button--primary" type="submit">Create collection</button></form></SectionCard>
    <SectionCard title="Folders and proposals">{folders.length ? folders.map((folder) => <article className="dashboard-job-item" key={folder.id}><strong>{folder.name}</strong><span>{folder.origin.replaceAll('_', ' ')} - {folder.status}</span>{folder.proposer ? <small>Proposed by {folder.proposer.name}</small> : null}{['PENDING', 'CHANGES_REQUESTED'].includes(folder.status) ? <div className="creator-song-actions"><button onClick={() => review(folder.id, 'APPROVED')} type="button">Approve</button><button onClick={() => review(folder.id, 'CHANGES_REQUESTED')} type="button">Request changes</button><button onClick={() => review(folder.id, 'REJECTED')} type="button">Reject</button></div> : null}</article>) : <p>No folders found.</p>}</SectionCard>
    <SectionCard title="Pending song placements">{placements.length ? placements.map((item) => <article className="dashboard-job-item" key={item.id}><strong>{item.song?.title} - {item.folder?.name}</strong><span>Proposed by {item.proposer?.name}</span><p>{item.creatorNote || 'No creator note.'}</p><div className="creator-song-actions"><button onClick={() => reviewPlacement(item.id, 'APPROVED')} type="button">Approve</button><button onClick={() => reviewPlacement(item.id, 'CHANGES_REQUESTED')} type="button">Request changes</button><button onClick={() => reviewPlacement(item.id, 'REJECTED')} type="button">Reject</button></div></article>) : <p>No pending placement proposals.</p>}</SectionCard>
  </div>
}
