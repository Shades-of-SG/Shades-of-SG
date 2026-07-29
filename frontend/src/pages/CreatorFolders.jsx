import { useCallback, useEffect, useState } from 'react'
import PageHeader from '../components/PageHeader'
import SectionCard from '../components/SectionCard'
import { useAuth } from '../context/AuthContext'
import { attachSongFolder, getApprovedFolders, getMyFolderProposals, proposeFolder } from '../services/folderService'
import { getCreatorSongs } from '../services/songService'

export default function CreatorFolders() {
  const { token } = useAuth()
  const [folders, setFolders] = useState([])
  const [proposals, setProposals] = useState([])
  const [songs, setSongs] = useState([])
  const [selection, setSelection] = useState({ folderId: '', songId: '' })
  const [proposal, setProposal] = useState({ description: '', name: '' })
  const [message, setMessage] = useState('')

  const refresh = useCallback(() => Promise.all([getApprovedFolders(), getMyFolderProposals(token), getCreatorSongs(token)])
    .then(([nextFolders, nextProposals, nextSongs]) => { setFolders(nextFolders); setProposals(nextProposals); setSongs(nextSongs) })
    .catch((error) => setMessage(error.message)), [token])

  useEffect(() => { refresh() }, [refresh])

  const submitProposal = async (event) => {
    event.preventDefault()
    try { await proposeFolder(proposal, token); setProposal({ description: '', name: '' }); setMessage('Folder proposal submitted.'); refresh() } catch (error) { setMessage(error.message) }
  }
  const attach = async (event) => {
    event.preventDefault()
    try { await attachSongFolder(selection.songId, selection.folderId, token); setMessage('Song added to the collection.') } catch (error) { setMessage(error.message) }
  }

  return <div className="creator-page">
    <PageHeader eyebrow="Collections" title="Song folders" description="Use approved platform collections, or propose a new folder for admin review." />
    {message ? <p role="status">{message}</p> : null}
    <SectionCard title="Add a song to a collection">
      <form className="settings-form" onSubmit={attach}>
        <label>Song<select required value={selection.songId} onChange={(event) => setSelection({ ...selection, songId: event.target.value })}><option value="">Choose a song</option>{songs.map((song) => <option key={song.id} value={song.id}>{song.title}</option>)}</select></label>
        <label>Approved collection<select required value={selection.folderId} onChange={(event) => setSelection({ ...selection, folderId: event.target.value })}><option value="">Choose a collection</option>{folders.map((folder) => <option key={folder.id} value={folder.id}>{folder.name}</option>)}</select></label>
        <button className="studio-button studio-button--primary" type="submit">Add to collection</button>
      </form>
    </SectionCard>
    <SectionCard title="Propose a folder">
      <form className="settings-form" onSubmit={submitProposal}><label>Name<input required value={proposal.name} onChange={(event) => setProposal({ ...proposal, name: event.target.value })} /></label><label>Description<textarea value={proposal.description} onChange={(event) => setProposal({ ...proposal, description: event.target.value })} /></label><button className="studio-button studio-button--secondary" type="submit">Send proposal</button></form>
    </SectionCard>
    <SectionCard title="My proposals">{proposals.length ? proposals.map((folder) => <article className="dashboard-job-item" key={folder.id}><strong>{folder.name}</strong><span>{folder.status}</span>{folder.reviewNote ? <p>{folder.reviewNote}</p> : null}</article>) : <p>No proposals yet.</p>}</SectionCard>
  </div>
}
