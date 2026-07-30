import { FolderPlus, Pencil, Plus } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AdminPageHeader, AdminTabs, ConfirmationModal, DataTable, DetailDrawer, EmptyState, Feedback, FilterBar, LoadingRows, Panel, StatusBadge } from '../components/admin/AdminUI'
import ContextAuditHistory from '../components/admin/ContextAuditHistory'
import { useAuth } from '../context/AuthContext'
import { createPlatformFolder, getAdminFolders, getAdminSongs, getFolderSongProposals, reviewFolderSongProposal, unpublishAdminSong, updateAdminFolder } from '../services/adminService'
import { formatDate, labelFor, useTab } from './adminUtils'

export default function AdminContentPage() {
  const { token } = useAuth()
  const [params, setParams] = useSearchParams()
  const [tab, setTab] = useTab(params, setParams, ['songs', 'collections', 'placements'], 'songs')
  const [songs, setSongs] = useState([])
  const [folders, setFolders] = useState([])
  const [placements, setPlacements] = useState([])
  const [filters, setFilters] = useState({ search: '', status: '' })
  const [selected, setSelected] = useState(null)
  const [modal, setModal] = useState(null)
  const [feedback, setFeedback] = useState({ message: '', type: 'status' })
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)

  const refresh = useCallback(async () => {
    setLoading(true)
    try {
      if (tab === 'songs') {
        const data = await getAdminSongs(token, { limit: 100, search: filters.search, status: filters.status }); setSongs(data.songs || [])
      } else if (tab === 'collections') {
        const data = await getAdminFolders(token, { limit: 100, search: filters.search, status: filters.status }); setFolders(data.folders || [])
      } else {
        const data = await getFolderSongProposals(token, { limit: 100, status: filters.status }); setPlacements(data.proposals || [])
      }
    } catch (error) { setFeedback({ message: error.message, type: 'error' }) } finally { setLoading(false) }
  }, [filters.search, filters.status, tab, token])

  useEffect(() => { const timer = window.setTimeout(refresh, filters.search ? 220 : 0); return () => window.clearTimeout(timer) }, [filters.search, refresh])

  async function submitCollection() {
    setBusy(true)
    try {
      if (modal.id) await updateAdminFolder(modal.id, { description: modal.description, displayOrder: Number(modal.displayOrder || 0), name: modal.name }, token)
      else await createPlatformFolder({ description: modal.description, displayOrder: Number(modal.displayOrder || 0), name: modal.name }, token)
      setFeedback({ message: modal.id ? 'Collection updated.' : 'Collection created.', type: 'status' }); setModal(null); setSelected(null); await refresh()
    } catch (error) { setFeedback({ message: error.message, type: 'error' }) } finally { setBusy(false) }
  }

  async function reviewFolder(folder, status) {
    setModal({ entity: 'folder-review', folder, reviewNote: '', status })
  }

  async function submitFolderReview() {
    if (modal.status !== 'APPROVED' && !modal.reviewNote.trim()) { setFeedback({ message: 'A review note is required.', type: 'error' }); return }
    setBusy(true)
    try { await updateAdminFolder(modal.folder.id, { reviewNote: modal.reviewNote, status: modal.status }, token); setFeedback({ message: `Collection ${labelFor(modal.status).toLowerCase()}.`, type: 'status' }); setModal(null); await refresh() }
    catch (error) { setFeedback({ message: error.message, type: 'error' }) } finally { setBusy(false) }
  }

  async function submitPlacementReview() {
    if (modal.status !== 'APPROVED' && !modal.reviewNote.trim()) { setFeedback({ message: 'A review note is required.', type: 'error' }); return }
    setBusy(true)
    try { await reviewFolderSongProposal(modal.placement.id, { reviewNote: modal.reviewNote, songOrder: Number(modal.songOrder || 0), status: modal.status }, token); setFeedback({ message: `Placement request ${labelFor(modal.status).toLowerCase()}.`, type: 'status' }); setModal(null); setSelected(null); await refresh() }
    catch (error) { setFeedback({ message: error.message, type: 'error' }) } finally { setBusy(false) }
  }

  async function submitSongUnpublish() {
    if (!modal.reason.trim()) { setFeedback({ message: 'An unpublish reason is required.', type: 'error' }); return }
    setBusy(true)
    try { await unpublishAdminSong(modal.song.id, modal.reason, token); setFeedback({ message: 'Song unpublished. Its data and creator ownership were preserved.', type: 'status' }); setModal(null); setSelected(null); await refresh() }
    catch (error) { setFeedback({ message: error.message, type: 'error' }) } finally { setBusy(false) }
  }

  const statusOptions = tab === 'songs' ? ['DRAFT', 'GENERATING', 'READY', 'PUBLISHED', 'ARCHIVED'] : tab === 'collections' ? ['PENDING', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED', 'ARCHIVED'] : ['PENDING', 'CHANGES_REQUESTED', 'APPROVED', 'REJECTED', 'WITHDRAWN']

  return <div className="admin-page"><div className="admin-page__inner">
    <AdminPageHeader actions={tab === 'collections' ? <button className="admin-button admin-button--primary" onClick={() => setModal({ description: '', displayOrder: 0, entity: 'collection', name: '' })} type="button"><Plus />Create collection</button> : null} description="Oversee songs, collections, and creator placement proposals." title="Content" />
    <AdminTabs active={tab} items={[{ id: 'songs', label: 'Songs', count: songs.length }, { id: 'collections', label: 'Collections', count: folders.length }, { id: 'placements', label: 'Placement Requests', count: placements.filter((item) => item.status === 'PENDING').length }]} onChange={(next) => { setFilters({ search: '', status: '' }); setSelected(null); setTab(next) }} />
    <Feedback {...feedback} />
    <FilterBar onClear={() => setFilters({ search: '', status: '' })} showClear={Boolean(filters.search || filters.status)}>
      {tab !== 'placements' ? <label>Search<input aria-label="Search content" onChange={(event) => setFilters((value) => ({ ...value, search: event.target.value }))} placeholder={tab === 'songs' ? 'Song title or artist' : 'Collection name'} value={filters.search} /></label> : null}
      <label>Status<select onChange={(event) => setFilters((value) => ({ ...value, status: event.target.value }))} value={filters.status}><option value="">All statuses</option>{statusOptions.map((status) => <option key={status} value={status}>{labelFor(status)}</option>)}</select></label>
    </FilterBar>
    <Panel title={tab === 'songs' ? 'All creator songs' : tab === 'collections' ? 'Platform collections and proposals' : 'Song placement requests'}>
      {loading ? <LoadingRows /> : tab === 'songs' ? (songs.length ? <DataTable caption="All creator songs" columns={['Song', 'Creator', 'Status', 'Collections', 'Updated', 'Action']}>
        {songs.map((song) => <tr className={selected?.id === song.id ? 'is-selected' : ''} key={song.id}><td data-label="Song"><button className="admin-row-button" onClick={() => setSelected(song)} type="button"><strong>{song.title}</strong><small>{song.artist || 'Artist not set'}</small></button></td><td data-label="Creator"><strong>{song.creator?.name || '—'}</strong><small>{song.creator?.email}</small></td><td data-label="Status"><StatusBadge status={song.status} /></td><td data-label="Collections">{(song.folders || []).map((folder) => folder.name).join(', ') || '—'}</td><td data-label="Updated">{formatDate(song.updatedAt, false)}</td><td data-label="Action"><div className="admin-table__actions"><button className="admin-button admin-button--ghost" onClick={() => setSelected(song)} type="button">View details</button>{song.status === 'PUBLISHED' ? <button className="admin-button admin-button--danger" onClick={() => setModal({ entity: 'song-unpublish', reason: '', song })} type="button">Unpublish</button> : null}</div></td></tr>)}
      </DataTable> : <EmptyState description="Try changing or clearing the filters." title="No songs found" />) : tab === 'collections' ? (folders.length ? <DataTable caption="Collections" columns={['Collection', 'Origin', 'Songs', 'Visibility', 'Order', 'Status', 'Action']}>
        {folders.map((folder) => <tr className={selected?.id === folder.id ? 'is-selected' : ''} key={folder.id}><td data-label="Collection"><button className="admin-row-button" onClick={() => setSelected(folder)} type="button"><strong>{folder.name}</strong><small>{folder.description || (folder.proposer ? `Proposed by ${folder.proposer.name}` : 'No description')}</small></button></td><td data-label="Origin">{labelFor(folder.origin)}</td><td data-label="Songs">{folder.songs?.length || 0}</td><td data-label="Visibility">{folder.status === 'APPROVED' ? 'Public' : 'Not public'}</td><td data-label="Order">{folder.displayOrder}</td><td data-label="Status"><StatusBadge status={folder.status} /></td><td data-label="Action"><div className="admin-table__actions">{folder.origin === 'PLATFORM' ? <button aria-label={`Edit ${folder.name}`} className="admin-button admin-button--ghost" onClick={() => setModal({ ...folder, entity: 'collection' })} type="button"><Pencil />Edit</button> : ['PENDING', 'CHANGES_REQUESTED'].includes(folder.status) ? <button className="admin-button admin-button--ghost" onClick={() => setSelected(folder)} type="button">Review</button> : null}</div></td></tr>)}
      </DataTable> : <EmptyState action={<button className="admin-button admin-button--primary" onClick={() => setModal({ description: '', displayOrder: 0, entity: 'collection', name: '' })} type="button"><FolderPlus />Create collection</button>} description="Create the first curated collection for published songs." title="No collections found" />) : (placements.length ? <DataTable caption="Song placement requests" columns={['Song', 'Creator', 'Requested collection', 'Justification', 'Status', 'Date', 'Action']}>
        {placements.map((placement) => <tr className={selected?.id === placement.id ? 'is-selected' : ''} key={placement.id}><td data-label="Song"><button className="admin-row-button" onClick={() => setSelected(placement)} type="button"><strong>{placement.song?.title || 'Unknown song'}</strong></button></td><td data-label="Creator">{placement.proposer?.name || placement.song?.creator?.name || '—'}</td><td data-label="Requested collection">{placement.folder?.name}</td><td data-label="Justification">{placement.creatorNote || 'No justification provided'}</td><td data-label="Status"><StatusBadge status={placement.status} /></td><td data-label="Date">{formatDate(placement.createdAt, false)}</td><td data-label="Action"><div className="admin-table__actions">{['PENDING', 'CHANGES_REQUESTED'].includes(placement.status) ? <button className="admin-button admin-button--ghost" onClick={() => setSelected(placement)} type="button">Review</button> : <button className="admin-button admin-button--ghost" onClick={() => setSelected(placement)} type="button">View</button>}</div></td></tr>)}
      </DataTable> : <EmptyState description="Creator song placement proposals will appear here." title="No placement requests" />)}
    </Panel>
    <DetailDrawer onClose={() => setSelected(null)} open={Boolean(selected)} title={tab === 'songs' ? 'Song details' : tab === 'collections' ? 'Collection details' : 'Placement request'}>
      {selected ? <>{tab === 'songs' ? <><section className="admin-detail-drawer__section"><h3>Song</h3><p><strong>{selected.title}</strong><br />{selected.artist}</p><StatusBadge status={selected.status} /></section><section className="admin-detail-drawer__section"><h3>Creator</h3><p>{selected.creator?.name}<br />{selected.creator?.email}</p></section><section className="admin-detail-drawer__section"><h3>Collections</h3><p>{(selected.folders || []).map((folder) => folder.name).join(', ') || 'Not currently placed in a collection.'}</p></section></> : tab === 'collections' ? <><section className="admin-detail-drawer__section"><h3>Collection</h3><p><strong>{selected.name}</strong><br />{selected.description || 'No description'}</p><StatusBadge status={selected.status} /></section><section className="admin-detail-drawer__section"><h3>Contents</h3>{(selected.songs || []).map((song) => <p key={song.id}>{song.title} · {labelFor(song.status)}</p>)}{!selected.songs?.length ? <p>No songs assigned.</p> : null}</section>{selected.origin !== 'PLATFORM' && ['PENDING', 'CHANGES_REQUESTED'].includes(selected.status) ? <section className="admin-detail-drawer__section"><h3>Review proposal</h3><div className="admin-form__actions"><button className="admin-button admin-button--danger" onClick={() => reviewFolder(selected, 'REJECTED')} type="button">Reject</button><button className="admin-button admin-button--ghost" onClick={() => reviewFolder(selected, 'CHANGES_REQUESTED')} type="button">Request changes</button><button className="admin-button admin-button--primary" onClick={() => reviewFolder(selected, 'APPROVED')} type="button">Approve</button></div></section> : null}</> : <><section className="admin-detail-drawer__section"><h3>Request</h3><p><strong>{selected.song?.title}</strong> → {selected.folder?.name}</p><StatusBadge status={selected.status} /></section><section className="admin-detail-drawer__section"><h3>Creator note</h3><p>{selected.creatorNote || 'No creator note provided.'}</p></section>{['PENDING', 'CHANGES_REQUESTED'].includes(selected.status) ? <section className="admin-detail-drawer__section"><h3>Decision</h3><div className="admin-form__actions"><button className="admin-button admin-button--danger" onClick={() => setModal({ entity: 'placement-review', placement: selected, reviewNote: '', songOrder: 0, status: 'REJECTED' })} type="button">Reject</button><button className="admin-button admin-button--ghost" onClick={() => setModal({ entity: 'placement-review', placement: selected, reviewNote: '', songOrder: 0, status: 'CHANGES_REQUESTED' })} type="button">Request changes</button><button className="admin-button admin-button--primary" onClick={() => setModal({ entity: 'placement-review', placement: selected, reviewNote: '', songOrder: 0, status: 'APPROVED' })} type="button">Approve</button></div></section> : null}</>}<ContextAuditHistory entityId={selected.id} token={token} /></> : null}
    </DetailDrawer>
    {modal?.entity === 'collection' ? <ConfirmationModal busy={busy} confirmLabel={modal.id ? 'Save changes' : 'Create collection'} onCancel={() => setModal(null)} onConfirm={submitCollection} title={modal.id ? 'Edit collection' : 'Create collection'}><form className="admin-form" onSubmit={(event) => event.preventDefault()}><label>Name<input autoFocus onChange={(event) => setModal((value) => ({ ...value, name: event.target.value }))} required value={modal.name} /></label><label>Description<textarea onChange={(event) => setModal((value) => ({ ...value, description: event.target.value }))} value={modal.description || ''} /></label><label>Display order<input min="0" onChange={(event) => setModal((value) => ({ ...value, displayOrder: event.target.value }))} type="number" value={modal.displayOrder || 0} /></label></form></ConfirmationModal> : null}
    {modal?.entity === 'folder-review' ? <ConfirmationModal busy={busy} confirmLabel={labelFor(modal.status)} danger={modal.status === 'REJECTED'} onCancel={() => setModal(null)} onConfirm={submitFolderReview} title={`${labelFor(modal.status)} collection proposal`}><form className="admin-form"><label>Review note<textarea onChange={(event) => setModal((value) => ({ ...value, reviewNote: event.target.value }))} required={modal.status !== 'APPROVED'} value={modal.reviewNote} /></label></form></ConfirmationModal> : null}
    {modal?.entity === 'placement-review' ? <ConfirmationModal busy={busy} confirmLabel={labelFor(modal.status)} danger={modal.status === 'REJECTED'} onCancel={() => setModal(null)} onConfirm={submitPlacementReview} title={`${labelFor(modal.status)} placement`}><form className="admin-form"><label>Review note<textarea onChange={(event) => setModal((value) => ({ ...value, reviewNote: event.target.value }))} required={modal.status !== 'APPROVED'} value={modal.reviewNote} /></label>{modal.status === 'APPROVED' ? <label>Song order<input min="0" onChange={(event) => setModal((value) => ({ ...value, songOrder: event.target.value }))} type="number" value={modal.songOrder} /></label> : null}</form></ConfirmationModal> : null}
    {modal?.entity === 'song-unpublish' ? <ConfirmationModal busy={busy} confirmLabel="Unpublish song" danger onCancel={() => setModal(null)} onConfirm={submitSongUnpublish} title={`Unpublish ${modal.song.title}?`}><form className="admin-form" onSubmit={(event) => event.preventDefault()}><p>The song will leave the public library, but its data and creator ownership will be preserved.</p><label>Reason<textarea autoFocus maxLength="2000" onChange={(event) => setModal((value) => ({ ...value, reason: event.target.value }))} required value={modal.reason} /></label></form></ConfirmationModal> : null}
  </div></div>
}
