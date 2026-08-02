import { useCallback, useEffect, useState } from 'react'
import CreatorPageShell from '../components/CreatorPageShell'
import SectionCard from '../components/SectionCard'
import { useAuth } from '../context/AuthContext'
import {
  getApprovedFolders, getMyFolderProposals, getMySongPlacementProposals,
  proposeFolder, proposeSongPlacement, updateSongPlacementProposal,
} from '../services/folderService'
import { getCreatorSongs } from '../services/songService'

export default function CreatorFolders() {
  const { token } = useAuth()
  const [folders, setFolders] = useState([])
  const [folderProposals, setFolderProposals] = useState([])
  const [placements, setPlacements] = useState([])
  const [songs, setSongs] = useState([])
  const [selection, setSelection] = useState({ creatorNote: '', folderId: '', songId: '' })
  const [proposal, setProposal] = useState({ description: '', name: '' })
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(() => Promise.all([
    getApprovedFolders(), getMyFolderProposals(token), getMySongPlacementProposals(token), getCreatorSongs(token),
  ]).then(([nextFolders, nextFolderProposals, nextPlacements, nextSongs]) => {
    setFolders(nextFolders); setFolderProposals(nextFolderProposals); setPlacements(nextPlacements); setSongs(nextSongs)
  }).catch((error) => setMessage(error.message)).finally(() => setLoading(false)), [token])

  useEffect(() => { refresh() }, [refresh])

  const submitFolder = async (event) => {
    event.preventDefault(); setBusy(true)
    try { await proposeFolder(proposal, token); setProposal({ description: '', name: '' }); setMessage('Folder proposal submitted.'); await refresh() } catch (error) { setMessage(error.message) } finally { setBusy(false) }
  }
  const submitPlacement = async (event) => {
    event.preventDefault(); setBusy(true)
    try { await proposeSongPlacement(selection, token); setSelection({ creatorNote: '', folderId: '', songId: '' }); setMessage('Song placement sent for admin approval.'); await refresh() } catch (error) { setMessage(error.message) } finally { setBusy(false) }
  }
  const withdrawPlacement = async (id) => {
    setBusy(true)
    try { await updateSongPlacementProposal(id, { withdraw: true }, token); await refresh(); setMessage('Placement proposal withdrawn.') } catch (error) { setMessage(error.message) } finally { setBusy(false) }
  }

  return <CreatorPageShell
    breadcrumbs={['Collections']}
    description="Creators propose folders and song placements; administrators control the platform catalogue."
    title="Song collections"
  >
    {message ? <p role="status">{message}</p> : null}{loading ? <p role="status">Loading collections...</p> : null}
    <SectionCard title="Propose a song placement"><form className="settings-form" onSubmit={submitPlacement}>
      <label>Song<select required value={selection.songId} onChange={(event) => setSelection({ ...selection, songId: event.target.value })}><option value="">Choose a song</option>{songs.map((song) => <option key={song.id} value={song.id}>{song.title}</option>)}</select></label>
      <label>Approved collection<select required value={selection.folderId} onChange={(event) => setSelection({ ...selection, folderId: event.target.value })}><option value="">Choose a collection</option>{folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select></label>
      <label>Note to administrators<textarea maxLength="2000" value={selection.creatorNote} onChange={(event) => setSelection({ ...selection, creatorNote: event.target.value })} /></label>
      <button className="studio-button studio-button--primary" disabled={busy} type="submit">Send placement proposal</button>
    </form></SectionCard>
    <SectionCard title="Placement proposals">{placements.length ? placements.map((item) => <article className="dashboard-job-item" key={item.id}><strong>{item.song?.title} - {item.folder?.name}</strong><span>{item.status.replaceAll('_', ' ')}</span>{item.reviewNote ? <p>{item.reviewNote}</p> : null}{['PENDING', 'CHANGES_REQUESTED'].includes(item.status) ? <button disabled={busy} onClick={() => withdrawPlacement(item.id)} type="button">Withdraw</button> : null}</article>) : <p>No placement proposals yet.</p>}</SectionCard>
    <SectionCard title="Propose a new folder"><form className="settings-form" onSubmit={submitFolder}><label>Name<input required value={proposal.name} onChange={(event) => setProposal({ ...proposal, name: event.target.value })} /></label><label>Description<textarea value={proposal.description} onChange={(event) => setProposal({ ...proposal, description: event.target.value })} /></label><button className="studio-button studio-button--secondary" disabled={busy} type="submit">Send folder proposal</button></form></SectionCard>
    <SectionCard title="My folder proposals">{folderProposals.length ? folderProposals.map((folder) => <article className="dashboard-job-item" key={folder.id}><strong>{folder.name}</strong><span>{folder.status.replaceAll('_', ' ')}</span>{folder.reviewNote ? <p>{folder.reviewNote}</p> : null}</article>) : <p>No folder proposals yet.</p>}</SectionCard>
  </CreatorPageShell>
}
