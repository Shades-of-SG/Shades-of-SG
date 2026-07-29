import { useCallback, useEffect, useState } from 'react'
import PageHeader from '../components/PageHeader'
import SectionCard from '../components/SectionCard'
import { useAuth } from '../context/AuthContext'
import { createPlatformFolder, getAdminFolders, updateAdminFolder } from '../services/adminService'

export default function AdminFolders() {
  const { token } = useAuth()
  const [folders, setFolders] = useState([])
  const [form, setForm] = useState({ description: '', name: '' })
  const [message, setMessage] = useState('')
  const refresh = useCallback(() => getAdminFolders(token).then(setFolders).catch((error) => setMessage(error.message)), [token])
  useEffect(() => { refresh() }, [refresh])
  const create = async (event) => { event.preventDefault(); try { await createPlatformFolder(form, token); setForm({ description: '', name: '' }); refresh() } catch (error) { setMessage(error.message) } }
  const review = async (id, status) => { try { await updateAdminFolder(id, { status }, token); refresh() } catch (error) { setMessage(error.message) } }
  return <div className="creator-page"><PageHeader eyebrow="Admin" title="Platform collections" description="Create platform folders and decide creator proposals." />{message ? <p role="status">{message}</p> : null}<SectionCard title="Create platform folder"><form className="settings-form" onSubmit={create}><label>Name<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} /></label><label>Description<textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} /></label><button className="studio-button studio-button--primary" type="submit">Create collection</button></form></SectionCard><SectionCard title="Folders and proposals">{folders.map((folder) => <article className="dashboard-job-item" key={folder.id}><strong>{folder.name}</strong><span>{folder.origin.replaceAll('_', ' ')} · {folder.status}</span>{folder.proposer ? <small>Proposed by {folder.proposer.name}</small> : null}{folder.status === 'PENDING' ? <div className="creator-song-actions"><button className="studio-button studio-button--primary" onClick={() => review(folder.id, 'APPROVED')} type="button">Approve</button><button className="studio-button studio-button--secondary" onClick={() => review(folder.id, 'REJECTED')} type="button">Reject</button></div> : null}</article>)}</SectionCard></div>
}
